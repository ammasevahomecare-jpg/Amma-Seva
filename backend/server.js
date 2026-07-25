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

// POST admin login
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body

  if (email === 'ammasevahomecare@gmail.com' && password === 'Ammaseva@123') {
    res.json({
      success: true,
      message: 'Login successful!',
      token: 'mock-jwt-admin-token-ammaseva'
    })
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password.'
    })
  }
})

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

// GET all bookings (Admin Panel)
app.get('/api/bookings', async (req, res) => {
  try {
    const list = await db.getBookings()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve bookings list.' })
  }
})

// POST create booking
app.post('/api/booking', async (req, res) => {
  const { name, phone, service, date, time, duration, address, amount } = req.body

  if (!name || !phone || !service || !date || !time || !duration || !address) {
    return res.status(400).json({ error: 'Missing required booking details.' })
  }

  try {
    const newBooking = await db.addBooking({ name, phone, service, date, time, duration, address, amount })
    res.status(201).json({
      success: true,
      message: 'Booking successfully created!',
      data: newBooking
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking.' })
  }
})

// PUT update booking (Admin Panel: assign caregiver or change status)
app.put('/api/booking/:id', async (req, res) => {
  const { status, assignedStaff, paymentStatus } = req.body
  try {
    const updated = await db.updateBooking(req.params.id, status, assignedStaff, paymentStatus)
    if (updated) {
      res.json({ success: true, message: 'Booking successfully updated.' })
    } else {
      res.status(404).json({ error: 'Booking not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking.' })
  }
})

// GET all caregivers (Admin Panel)
app.get('/api/caregivers', async (req, res) => {
  try {
    const list = await db.getCaregivers()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve caregivers list.' })
  }
})

// POST register caregiver
app.post('/api/caregiver', async (req, res) => {
  const { name, phone, email, specialty, experience } = req.body
  if (!name || !phone || !specialty) {
    return res.status(400).json({ error: 'Name, phone, and specialty are required.' })
  }
  try {
    const newCaregiver = await db.addCaregiver({ name, phone, email, specialty, experience })
    res.status(201).json({
      success: true,
      message: 'Registration profile submitted!',
      data: newCaregiver
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit caregiver registration.' })
  }
})

// PUT update caregiver verification status (Admin Panel: approve or reject)
app.put('/api/caregiver/:id', async (req, res) => {
  const { status } = req.body
  if (!status) {
    return res.status(400).json({ error: 'Status is required.' })
  }
  try {
    const updated = await db.updateCaregiverStatus(req.params.id, status)
    if (updated) {
      res.json({ success: true, message: `Caregiver status updated to ${status}.` })
    } else {
      res.status(404).json({ error: 'Caregiver not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update caregiver profile.' })
  }
})

// Preserve old routes to avoid breaks
app.get('/api/services', (req, res) => {
  res.json([
    {
      id: 'elderly',
      title: 'Elderly Care at Home',
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
