import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// In-memory data store (acting as a mock database)
const volunteersList = []
const donationsList = []

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

// HTTP request logger placeholder
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// API Endpoints
app.get('/api/services', (req, res) => {
  res.json(servicesList)
})

app.post('/api/volunteer', (req, res) => {
  const { name, email } = req.body

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required fields.' })
  }

  const newVolunteer = {
    id: volunteersList.length + 1,
    name,
    email,
    registeredAt: new Date().toISOString()
  }

  volunteersList.push(newVolunteer)
  console.log(`✨ New volunteer registered:`, newVolunteer)

  res.status(201).json({
    success: true,
    message: 'Volunteer successfully registered!',
    data: newVolunteer
  })
})

app.post('/api/donate', (req, res) => {
  const { amount } = req.body

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'A valid donation amount greater than 0 is required.' })
  }

  const newDonation = {
    id: donationsList.length + 1,
    amount: Number(amount),
    donatedAt: new Date().toISOString()
  }

  donationsList.push(newDonation)
  console.log(`💖 New donation received: $${amount}`, newDonation)

  res.status(201).json({
    success: true,
    message: 'Donation successfully registered!',
    data: newDonation
  })
})

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Serve frontend static assets in production
const frontendDistPath = path.join(__dirname, 'dist')
app.use(express.static(frontendDistPath))

// Single Page Application (SPA) Routing Fallback
app.get('*', (req, res, next) => {
  // If request is for an API endpoint, let it pass to API handlers (will return 404 if not found)
  if (req.path.startsWith('/api')) {
    return next()
  }
  // Otherwise, serve the main index.html file
  res.sendFile(path.join(frontendDistPath, 'index.html'))
})

// Catch-all API route fallback
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Amma Seva Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
})
