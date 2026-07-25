import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from './db.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Core Initiatives Data
const servicesList = [
  {
    id: 'elderly',
    title: 'Elderly Care & Companion',
    category: 'care',
    description: 'Assisting senior citizens with daily essentials, healthcare companionship, and emotional support.'
  },
  {
    id: 'food',
    title: 'Nutritious Meals (Anna Seva)',
    category: 'food',
    description: 'Preparing and distributing warm, healthy meals daily to impoverished families and individuals.'
  },
  {
    id: 'health',
    title: 'Medical Camps & Aid',
    category: 'health',
    description: 'Providing free health checkups, essential medicines, and vision correction camps in underserved rural regions.'
  },
  {
    id: 'education',
    title: 'Youth & Children Empowerment',
    category: 'education',
    description: 'Conducting after-school tutoring, computer literacy classes, and supplying learning kits to kids.'
  }
]

// Middleware Configuration
app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend Vite client during dev
  credentials: true
}))
app.use(express.json())

// HTTP request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// API Endpoints

// GET core services
app.get('/api/services', (req, res) => {
  res.json(servicesList)
})

// GET all volunteers (Admin Panel)
app.get('/api/volunteers', async (req, res) => {
  try {
    const list = await db.getVolunteers()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve volunteers list.' })
  }
})

// POST register volunteer
app.post('/api/volunteer', async (req, res) => {
  const { name, email } = req.body

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required fields.' })
  }

  try {
    const newVolunteer = await db.addVolunteer(name, email)
    res.status(201).json({
      success: true,
      message: 'Volunteer successfully registered!',
      data: newVolunteer
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to register volunteer.' })
  }
})

// DELETE volunteer (Admin Panel)
app.delete('/api/volunteer/:id', async (req, res) => {
  try {
    const deleted = await db.deleteVolunteer(req.params.id)
    if (deleted) {
      res.json({ success: true, message: 'Volunteer entry successfully deleted.' })
    } else {
      res.status(404).json({ error: 'Volunteer entry not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete volunteer.' })
  }
})

// GET all donations (Admin Panel)
app.get('/api/donations', async (req, res) => {
  try {
    const list = await db.getDonations()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve donations list.' })
  }
})

// POST record donation
app.post('/api/donate', async (req, res) => {
  const { amount } = req.body

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'A valid donation amount greater than 0 is required.' })
  }

  try {
    const newDonation = await db.addDonation(amount)
    res.status(201).json({
      success: true,
      message: 'Donation successfully registered!',
      data: newDonation
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to record donation.' })
  }
})

// DELETE donation (Admin Panel)
app.delete('/api/donate/:id', async (req, res) => {
  try {
    const deleted = await db.deleteDonation(req.params.id)
    if (deleted) {
      res.json({ success: true, message: 'Donation record successfully deleted.' })
    } else {
      res.status(404).json({ error: 'Donation record not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete donation record.' })
  }
})

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Serve frontend static assets in production
const frontendDistPath = path.join(__dirname, 'dist')
app.use(express.static(frontendDistPath))

// Single Page Application (SPA) Routing Fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next()
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'))
})

// Catch-all API route fallback
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' })
})

// Initialize DB and start server
const startServer = async () => {
  await db.init()
  app.listen(PORT, () => {
    console.log(`🚀 Amma Seva Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
  })
}

startServer()
