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

// GET all enquiries (Admin Panel)
app.get('/api/enquiries', async (req, res) => {
  try {
    const list = await db.getEnquiries()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve enquiries list.' })
  }
})

// POST register enquiry (contact / service details)
app.post('/api/enquiry', async (req, res) => {
  const { name, phone, email, service, city, message } = req.body

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required fields.' })
  }

  try {
    const newEnquiry = await db.addEnquiry({ name, phone, email, service, city, message })
    res.status(201).json({
      success: true,
      message: 'Enquiry successfully recorded!',
      data: newEnquiry
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to record enquiry.' })
  }
})

// DELETE enquiry (Admin Panel)
app.delete('/api/enquiry/:id', async (req, res) => {
  try {
    const deleted = await db.deleteEnquiry(req.params.id)
    if (deleted) {
      res.json({ success: true, message: 'Enquiry record successfully deleted.' })
    } else {
      res.status(404).json({ error: 'Enquiry record not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete enquiry record.' })
  }
})

// Preserve old routes to avoid breaks
app.get('/api/services', (req, res) => {
  res.json([
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
    }
  ])
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
