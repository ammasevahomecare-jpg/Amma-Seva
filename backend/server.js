import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'
import { db } from './db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

import { v2 as cloudinary } from 'cloudinary'

// Load environment variables
dotenv.config()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'kpqbe9f0',
  api_key: process.env.CLOUDINARY_API_KEY || '155635232837293',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'K3tj1620CF13M8bUZA09zzmc890'
})

// Cloudinary upload helper
const uploadToCloudinary = async (base64Str) => {
  if (!base64Str) return ''
  // If it's already a URL, return it as-is
  if (base64Str.startsWith('http://') || base64Str.startsWith('https://')) {
    return base64Str
  }
  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Str, {
      resource_type: 'auto', // Auto-detect image, pdf, raw, etc.
      folder: 'ammaseva_verification'
    })
    return uploadResponse.secure_url
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload document to cloud storage.')
  }
}

// Nodemailer config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || 'ammasevahomecare@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'fden ytee hbvl driu'
  }
})



const app = express()
const PORT = process.env.PORT || 5000

// Middleware Configuration
app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend Vite client during dev
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// HTTP request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// API Endpoints

// POST request admin OTP
app.post('/api/admin/send-otp', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email address is required.' })
  }

  const normalizedEmail = email.toLowerCase().trim()

  if (normalizedEmail !== 'ammasevahomecare@gmail.com') {
    return res.status(401).json({ success: false, error: 'Unauthorized email address.' })
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  // Expire in 5 minutes
  const expiresAt = Date.now() + 5 * 60 * 1000

  await db.saveOTP(normalizedEmail, otp, 'admin', expiresAt)

  // Send Email
  const mailOptions = {
    from: `"Amma Seva Admin" <${process.env.SMTP_EMAIL || 'ammasevahomecare@gmail.com'}>`,
    to: normalizedEmail,
    subject: 'Amma Seva - Admin Login Verification OTP Code',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Admin OTP Code</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 0;">Use the following One-Time Password to access your admin control center:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4f46e5; text-align: center; padding: 16px; margin: 24px 0; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
          ${otp}
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">This code is active for 5 minutes and can only be used once.</p>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`[OTP] Sent OTP ${otp} successfully to ${normalizedEmail}`)
    res.json({ success: true, message: 'OTP verification code has been dispatched to your email.' })
  } catch (err) {
    console.error('Failed to send OTP email:', err)
    res.status(500).json({ success: false, error: 'Could not deliver verification email. Please check server logs.' })
  }
})

// POST admin login (verifies OTP)
app.post('/api/admin/login', async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and OTP code are required.' })
  }

  const normalizedEmail = email.toLowerCase().trim()

  if (normalizedEmail !== 'ammasevahomecare@gmail.com') {
    return res.status(401).json({ success: false, error: 'Unauthorized access.' })
  }

  const storedData = await db.getOTP(normalizedEmail)

  if (!storedData) {
    return res.status(401).json({ success: false, error: 'No OTP requested for this email address.' })
  }

  if (Date.now() > Number(storedData.expiresAt)) {
    await db.deleteOTP(normalizedEmail)
    return res.status(401).json({ success: false, error: 'OTP verification code has expired.' })
  }

  if (storedData.otp !== otp.trim()) {
    return res.status(401).json({ success: false, error: 'Invalid verification OTP code.' })
  }

  // Clear OTP on success
  await db.deleteOTP(normalizedEmail)

  const token = jwt.sign({ role: 'admin', email: normalizedEmail }, JWT_SECRET, { expiresIn: '7d' })
  res.json({
    success: true,
    message: 'Login successful!',
    token
  })
})

// POST unified send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email address is required.' })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Determine user role
  let role = null
  if (normalizedEmail === 'ammasevahomecare@gmail.com') {
    role = 'admin'
  } else {
    // Check in database for caregivers and users
    const caretaker = await db.getCaregiverByEmail(normalizedEmail)
    if (caretaker) {
      role = 'caretaker'
    } else {
      const user = await db.getUserByEmail(normalizedEmail)
      if (user) {
        role = 'customer'
      }
    }
  }

  if (!role) {
    return res.status(404).json({ success: false, error: 'This email address is not registered. Please register first.' })
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  // Expire in 5 minutes
  const expiresAt = Date.now() + 5 * 60 * 1000

  // Store in persistent database
  await db.saveOTP(normalizedEmail, otp, role, expiresAt)

  // Send Email
  const mailOptions = {
    from: `"Amma Seva Portal" <${process.env.SMTP_EMAIL || 'ammasevahomecare@gmail.com'}>`,
    to: normalizedEmail,
    subject: 'Amma Seva - Login Verification OTP Code',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Login Verification Code</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 0;">Use the following One-Time Password to verify your identity and log in to your Amma Seva account:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4f46e5; text-align: center; padding: 16px; margin: 24px 0; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
          ${otp}
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">This code is active for 5 minutes and can only be used once.</p>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`[OTP] Sent OTP ${otp} successfully to ${normalizedEmail} (Role: ${role})`)
    res.json({ success: true, message: 'Verification code has been dispatched to your email.' })
  } catch (err) {
    console.error('Failed to send OTP email:', err)
    res.status(500).json({ success: false, error: 'Could not deliver verification email. Please check server logs.' })
  }
})

// POST unified login verification
app.post('/api/auth/login', async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and OTP code are required.' })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const storedData = await db.getOTP(normalizedEmail)

  if (!storedData) {
    return res.status(401).json({ success: false, error: 'No OTP requested for this email address.' })
  }

  if (Date.now() > Number(storedData.expiresAt)) {
    await db.deleteOTP(normalizedEmail)
    return res.status(401).json({ success: false, error: 'OTP verification code has expired.' })
  }

  if (storedData.otp !== otp.trim()) {
    return res.status(401).json({ success: false, error: 'Invalid verification OTP code.' })
  }

  const role = storedData.role
  // Clear OTP on success
  await db.deleteOTP(normalizedEmail)

  if (role === 'admin') {
    const token = jwt.sign({ role: 'admin', email: normalizedEmail }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({
      success: true,
      role: 'admin',
      token
    })
  } else if (role === 'caretaker') {
    const caretaker = await db.getCaregiverByEmail(normalizedEmail)
    if (!caretaker) {
      return res.status(404).json({ success: false, error: 'Caretaker account record not found.' })
    }
    const token = jwt.sign({ id: caretaker.id, role: 'caretaker', email: caretaker.email }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({
      success: true,
      role: 'caretaker',
      token,
      caretaker: { 
        id: caretaker.id, 
        name: caretaker.name, 
        email: caretaker.email, 
        phone: caretaker.phone,
        status: caretaker.status,
        specialty: caretaker.specialty,
        experience: caretaker.experience,
        aadhaar: caretaker.aadhaar,
        pan: caretaker.pan,
        certificates: caretaker.certificates,
        profilePhoto: caretaker.profilePhoto,
        experienceDetails: caretaker.experienceDetails,
        workingLocations: caretaker.workingLocations,
        availableTimings: caretaker.availableTimings
      }
    })
  } else if (role === 'customer') {
    const user = await db.getUserByEmail(normalizedEmail)
    const token = jwt.sign({ id: user.id, role: 'user', email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({
      success: true,
      role: 'customer',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
    })
  }

  res.status(500).json({ success: false, error: 'Unknown role or authentication error.' })
})


// Load JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'amma_seva_super_secure_jwt_token_secret_key_2026'

// Authentication Middleware for Customer/Caretaker Roles
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token is missing or invalid.' })
  }
  const token = authHeader.split(' ')[1]

  // Legacy local fallback/mock bypass (for zero-downtime development transition)
  if (token.startsWith('mock-jwt-user-token-')) {
    req.userId = Number(token.replace('mock-jwt-user-token-', ''))
    req.role = 'user'
    return next()
  }
  if (token.startsWith('mock-jwt-caretaker-token-')) {
    req.userId = Number(token.replace('mock-jwt-caretaker-token-', ''))
    req.role = 'caretaker'
    return next()
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.id
    req.role = decoded.role
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Access denied. Invalid or expired token.' })
  }
}

// Authentication Middleware for Admin Role (Protects Administrative APIs)
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authorization token is missing or invalid.' })
  }
  const token = authHeader.split(' ')[1]

  // Allow static system mock admin token transition
  if (token === 'mock-jwt-admin-token-ammaseva' || token === 'mock-jwt-admin-token') {
    req.admin = true
    return next()
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden. Administrative privileges required.' })
    }
    req.admin = true
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Access denied. Invalid or expired token.' })
  }
}

// GET caretaker profile details
app.get('/api/caretaker/profile', authenticateUser, async (req, res) => {
  if (req.role !== 'caretaker') {
    return res.status(403).json({ error: 'Access forbidden. Caretaker profile only.' })
  }
  try {
    const caretaker = await db.getCaregiverById(req.userId)
    if (!caretaker) {
      return res.status(404).json({ error: 'Caretaker profile not found.' })
    }
    const { password, ...details } = caretaker
    res.json({ success: true, details })
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile details.' })
  }
})

// PUT update caretaker profile details (fill details)
app.put('/api/caretaker/profile', authenticateUser, async (req, res) => {
  if (req.role !== 'caretaker') {
    return res.status(403).json({ error: 'Access forbidden. Caretaker profile only.' })
  }
  try {
    const { 
      name, phone, specialty, experience, 
      aadhaar, pan, certificates, profilePhoto, 
      experienceDetails, workingLocations, availableTimings 
    } = req.body

    const uploadedProfilePhoto = profilePhoto ? await uploadToCloudinary(profilePhoto) : undefined
    const uploadedAadhaar = aadhaar ? await uploadToCloudinary(aadhaar) : undefined
    const uploadedPan = pan ? await uploadToCloudinary(pan) : undefined
    const uploadedCertificates = certificates ? await uploadToCloudinary(certificates) : undefined

    const updated = await db.updateCaregiverProfile(req.userId, {
      name, phone, specialty, experience,
      aadhaar: uploadedAadhaar,
      pan: uploadedPan,
      certificates: uploadedCertificates,
      profilePhoto: uploadedProfilePhoto,
      experienceDetails, workingLocations, availableTimings
    })
    if (updated) {
      const caretaker = await db.getCaregiverById(req.userId)
      const { password, ...details } = caretaker
      res.json({ success: true, message: 'Profile details successfully updated.', details })
    } else {
      res.status(404).json({ error: 'Caretaker profile not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile details.' })
  }
})

// POST register user
app.post('/api/user/register', async (req, res) => {
  const { name, email, phone, password } = req.body
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All registration fields are required.' })
  }
  try {
    const existingUser = await db.getUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' })
    }
    const newUser = await db.addUser({ name, email, phone, password })
    
    // Optional welcome email
    const mailOptions = {
      from: `"Amma Seva" <${process.env.SMTP_EMAIL || 'ammasevahomecare@gmail.com'}>`,
      to: email,
      subject: 'Welcome to Amma Seva!',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
          <h2 style="color: #0f172a; margin-bottom: 8px;">Account Created!</h2>
          <p style="color: #64748b; font-size: 14px;">Hi ${name},</p>
          <p style="color: #64748b; font-size: 14px;">Welcome to Amma Seva! Your user account has been registered with email: <strong>${email}</strong>.</p>
          <p style="color: #64748b; font-size: 14px;">You can now book homecare services, track status, and view invoices in your dashboard.</p>
        </div>
      `
    }
    try {
      await transporter.sendMail(mailOptions)
    } catch (e) {
      console.error('Welcome email failed:', e.message)
    }

    const token = jwt.sign({ id: newUser.id, role: 'user', email: newUser.email }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({
      success: true,
      message: 'Account successfully registered!',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone }
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to register account.' })
  }
})

// POST user login
app.post('/api/user/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }
  try {
    const user = await db.getUserByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // Verify hashed password
    let isValid = false
    try {
      isValid = await bcrypt.compare(password, user.password)
    } catch (e) {
      isValid = false
    }

    // Automatic migration for legacy plaintext passwords
    if (!isValid && user.password === password) {
      isValid = true
      const newHash = await bcrypt.hash(password, 10)
      await db.updateUserPassword(user.id, newHash)
      console.log(`[Security migration] Plaintext password for user ID ${user.id} has been securely hashed.`)
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = jwt.sign({ id: user.id, role: 'user', email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to authenticate user.' })
  }
})

// POST register caretaker
app.post('/api/caretaker/register', async (req, res) => {
  const { 
    name, phone, email, specialty, experience,
    aadhaar, pan, certificates, profilePhoto, 
    experienceDetails, workingLocations, availableTimings 
  } = req.body

  if (!name || !phone || !specialty) {
    return res.status(400).json({ error: 'Name, phone, and specialty are required.' })
  }

  try {
    if (email) {
      const existing = await db.getCaregiverByEmail(email)
      if (existing) {
        return res.status(409).json({ error: 'A caretaker profile with this email already exists.' })
      }
    }

    const uploadedProfilePhoto = await uploadToCloudinary(profilePhoto)
    const uploadedAadhaar = await uploadToCloudinary(aadhaar)
    const uploadedPan = await uploadToCloudinary(pan)
    const uploadedCertificates = await uploadToCloudinary(certificates)

    const newCaregiver = await db.addCaregiverWithPassword({ 
      name, phone, email, specialty, experience, 
      aadhaar: uploadedAadhaar,
      pan: uploadedPan,
      certificates: uploadedCertificates,
      profilePhoto: uploadedProfilePhoto,
      experienceDetails: experienceDetails || '',
      workingLocations: workingLocations || '',
      availableTimings: availableTimings || ''
    })

    const token = jwt.sign({ id: newCaregiver.id, role: 'caretaker', email: newCaregiver.email }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({
      success: true,
      message: 'Caregiver application submitted! Verification is pending.',
      token,
      caretaker: { id: newCaregiver.id, name: newCaregiver.name }
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit caretaker registration.' })
  }
})

// POST caretaker login
app.post('/api/caretaker/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }
  try {
    const caretaker = await db.getCaregiverByEmail(email)
    if (!caretaker) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // Verify hashed password
    let isValid = false
    try {
      isValid = await bcrypt.compare(password, caretaker.password)
    } catch (e) {
      isValid = false
    }

    // Automatic migration for legacy plaintext passwords
    if (!isValid && caretaker.password === password) {
      isValid = true
      const newHash = await bcrypt.hash(password, 10)
      await db.updateCaregiverPassword(caretaker.id, newHash)
      console.log(`[Security migration] Plaintext password for caretaker ID ${caretaker.id} has been securely hashed.`)
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = jwt.sign({ id: caretaker.id, role: 'caretaker', email: caretaker.email }, JWT_SECRET, { expiresIn: '7d' })
    res.json({
      success: true,
      token,
      caretaker: { 
        id: caretaker.id, 
        name: caretaker.name, 
        email: caretaker.email, 
        phone: caretaker.phone,
        status: caretaker.status,
        specialty: caretaker.specialty,
        experience: caretaker.experience,
        aadhaar: caretaker.aadhaar,
        pan: caretaker.pan,
        certificates: caretaker.certificates,
        profilePhoto: caretaker.profilePhoto,
        experienceDetails: caretaker.experienceDetails,
        workingLocations: caretaker.workingLocations,
        availableTimings: caretaker.availableTimings
      }
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to authenticate caretaker.' })
  }
})

// GET all bookings for current user
app.get('/api/user/bookings', authenticateUser, async (req, res) => {
  try {
    const list = await db.getBookingsByUserId(req.userId)
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve bookings list.' })
  }
})

// PUT reschedule a booking
app.put('/api/booking/:id/reschedule', authenticateUser, async (req, res) => {
  const { date, time } = req.body
  if (!date || !time) {
    return res.status(400).json({ error: 'Date and time are required.' })
  }
  try {
    const updated = await db.rescheduleBooking(req.params.id, date, time)
    if (updated) {
      res.json({ success: true, message: 'Booking successfully rescheduled.' })
    } else {
      res.status(404).json({ error: 'Booking not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to reschedule booking.' })
  }
})

// PUT cancel a booking
app.put('/api/booking/:id/cancel', authenticateUser, async (req, res) => {
  try {
    const updated = await db.cancelBooking(req.params.id)
    if (updated) {
      res.json({ success: true, message: 'Booking successfully cancelled.' })
    } else {
      res.status(404).json({ error: 'Booking not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking.' })
  }
})

// GET all enquiries (Admin Panel)
app.get('/api/enquiries', authenticateAdmin, async (req, res) => {
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
app.delete('/api/enquiry/:id', authenticateAdmin, async (req, res) => {
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
app.get('/api/bookings', authenticateAdmin, async (req, res) => {
  try {
    const list = await db.getBookings()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve bookings list.' })
  }
})

// POST create booking
app.post('/api/booking', async (req, res) => {
  const { name, phone, service, date, time, duration, address, amount, userId, patientName, patientAge, patientNeeds, paymentMethod, email } = req.body

  if (!name || !phone || !service || !date || !time || !duration || !address) {
    return res.status(400).json({ error: 'Missing required booking details.' })
  }

  // Parse authorization header if present
  let authUserId = userId
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    if (token.startsWith('mock-jwt-user-token-')) {
      authUserId = Number(token.replace('mock-jwt-user-token-', ''))
    }
  }

  try {
    const newBooking = await db.addBookingForUser({ 
      name, 
      phone, 
      service, 
      date, 
      time, 
      duration, 
      address, 
      amount: amount || 1200, 
      userId: authUserId 
    })

    // Prepare notification mock logs
    console.log(`[SMS/WhatsApp Notification] Booking confirmation alert sent to ${phone} for patient ${patientName || name}.`)

    // Send email confirmation using nodemailer if email is provided
    if (email) {
      const mailOptions = {
        from: `"Amma Seva Bookings" <${process.env.SMTP_EMAIL || 'ammasevahomecare@gmail.com'}>`,
        to: email,
        subject: 'Booking Confirmation - Amma Seva',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
            <h2 style="color: #10b981; margin-bottom: 8px;">Booking Confirmed!</h2>
            <p style="color: #64748b; font-size: 14px;">Hi ${name},</p>
            <p style="color: #64748b; font-size: 14px;">Your service booking has been successfully recorded. Here are the details:</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; margin-top: 16px;">
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold;">Service</td><td style="padding: 8px 0; text-align: right;">${service}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold;">Date &amp; Time</td><td style="padding: 8px 0; text-align: right;">${date} at ${time}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold;">Duration</td><td style="padding: 8px 0; text-align: right;">${duration}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold;">Patient</td><td style="padding: 8px 0; text-align: right;">${patientName || name} (Age: ${patientAge || 'N/A'})</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold;">Address</td><td style="padding: 8px 0; text-align: right;">${address}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold;">Amount</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #0f172a;">₹${amount || 1200} (${paymentMethod || 'Pay Later'})</td></tr>
            </table>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">We will assign a caregiver shortly. Thank you for choosing Amma Seva.</p>
          </div>
        `
      }
      try {
        await transporter.sendMail(mailOptions)
        console.log(`[Email Notification] Dispatch confirmed to ${email} for booking ID: ${newBooking.id}`)
      } catch (err) {
        console.error('Failed to send booking confirmation email:', err.message)
      }
    }

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
app.put('/api/booking/:id', authenticateAdmin, async (req, res) => {
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
app.get('/api/caregivers', authenticateAdmin, async (req, res) => {
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
app.put('/api/caregiver/:id', authenticateAdmin, async (req, res) => {
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

// GET all users (Admin Panel)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const list = await db.getUsers()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users list.' })
  }
})

// DELETE user (Admin Panel)
app.delete('/api/admin/user/:id', authenticateAdmin, async (req, res) => {
  try {
    const deleted = await db.deleteUser(req.params.id)
    if (deleted) {
      res.json({ success: true, message: 'User account successfully deleted.' })
    } else {
      res.status(404).json({ error: 'User account not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user account.' })
  }
})

// POST create booking directly as admin (Admin Panel)
app.post('/api/admin/booking', authenticateAdmin, async (req, res) => {
  const { name, phone, service, date, time, duration, address, amount, paymentStatus, paymentMethod, transactionId, paymentDate } = req.body
  if (!name || !phone || !service || !date || !time || !duration || !address) {
    return res.status(400).json({ error: 'Missing required booking details.' })
  }
  try {
    const newBooking = await db.addBooking({
      name,
      phone,
      service,
      date,
      time,
      duration,
      address,
      amount: Number(amount),
      paymentStatus: paymentStatus || 'Unpaid',
      paymentMethod: paymentMethod || '',
      transactionId: transactionId || '',
      paymentDate: paymentDate || ''
    })
    res.status(201).json({ success: true, message: 'Booking successfully created.', data: newBooking })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking.' })
  }
})

// PUT full update booking details (Admin Panel)
app.put('/api/admin/booking/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await db.adminUpdateBooking(req.params.id, req.body)
    if (updated) {
      res.json({ success: true, message: 'Booking details successfully updated.' })
    } else {
      res.status(404).json({ error: 'Booking not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking details.' })
  }
})

// DELETE booking (Admin Panel)
app.delete('/api/booking/:id', authenticateAdmin, async (req, res) => {
  try {
    const deleted = await db.deleteBooking(req.params.id)
    if (deleted) {
      res.json({ success: true, message: 'Booking record successfully deleted.' })
    } else {
      res.status(404).json({ error: 'Booking record not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete booking record.' })
  }
})

// PUT full update caregiver details (Admin Panel)
app.put('/api/admin/caregiver/:id', authenticateAdmin, async (req, res) => {
  try {
    const { 
      name, phone, email, specialty, experience, status, 
      aadhaar, pan, certificates, profilePhoto, 
      experienceDetails, workingLocations, availableTimings 
    } = req.body

    const uploadedProfilePhoto = profilePhoto ? await uploadToCloudinary(profilePhoto) : undefined
    const uploadedAadhaar = aadhaar ? await uploadToCloudinary(aadhaar) : undefined
    const uploadedPan = pan ? await uploadToCloudinary(pan) : undefined
    const uploadedCertificates = certificates ? await uploadToCloudinary(certificates) : undefined

    const updated = await db.adminUpdateCaregiver(req.params.id, {
      name, phone, email, specialty, experience, status,
      aadhaar: uploadedAadhaar,
      pan: uploadedPan,
      certificates: uploadedCertificates,
      profilePhoto: uploadedProfilePhoto,
      experienceDetails, workingLocations, availableTimings
    })
    if (updated) {
      res.json({ success: true, message: 'Caregiver details successfully updated.' })
    } else {
      res.status(404).json({ error: 'Caregiver not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update caregiver details.' })
  }
})

// DELETE caregiver (Admin Panel)
app.delete('/api/caregiver/:id', authenticateAdmin, async (req, res) => {
  try {
    const deleted = await db.deleteCaregiver(req.params.id)
    if (deleted) {
      res.json({ success: true, message: 'Caregiver record successfully deleted.' })
    } else {
      res.status(404).json({ error: 'Caregiver record not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete caregiver record.' })
  }
})

// GET all services (Dynamic)
app.get('/api/services', async (req, res) => {
  try {
    const list = await db.getServices()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve services list.' })
  }
})

// POST add service (Admin Panel)
app.post('/api/services', authenticateAdmin, async (req, res) => {
  const { title, slug, short, description, benefits, duration, price, category, comingSoon } = req.body
  if (!title || !price) {
    return res.status(400).json({ error: 'Title and price are required fields.' })
  }
  const slugVal = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  try {
    const newService = await db.addService({
      title,
      slug: slugVal,
      short: short || '',
      description: description || '',
      benefits: Array.isArray(benefits) ? benefits : [],
      duration: duration || 'Hourly',
      price,
      category: category || 'care',
      comingSoon: !!comingSoon
    })
    res.status(201).json({ success: true, message: 'Service successfully created.', data: newService })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service.' })
  }
})

// PUT update service (Admin Panel)
app.put('/api/services/:id', authenticateAdmin, async (req, res) => {
  const { title, slug, short, description, benefits, duration, price, category, comingSoon } = req.body
  if (!title || !price) {
    return res.status(400).json({ error: 'Title and price are required fields.' })
  }
  const slugVal = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  try {
    const updated = await db.updateService(req.params.id, {
      title,
      slug: slugVal,
      short: short || '',
      description: description || '',
      benefits: Array.isArray(benefits) ? benefits : [],
      duration: duration || 'Hourly',
      price,
      category: category || 'care',
      comingSoon: !!comingSoon
    })
    if (updated) {
      res.json({ success: true, message: 'Service successfully updated.' })
    } else {
      res.status(404).json({ error: 'Service not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service.' })
  }
})

// DELETE service (Admin Panel)
app.delete('/api/services/:id', authenticateAdmin, async (req, res) => {
  try {
    const deleted = await db.deleteService(req.params.id)
    if (deleted) {
      res.json({ success: true, message: 'Service successfully deleted.' })
    } else {
      res.status(404).json({ error: 'Service not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service.' })
  }
})

// GET notification logs (Admin Panel)
app.get('/api/notifications', authenticateAdmin, async (req, res) => {
  try {
    const list = await db.getNotifications()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve notifications log.' })
  }
})

// POST send notification (Admin Panel)
app.post('/api/notifications', authenticateAdmin, async (req, res) => {
  const { recipient, message, type } = req.body
  if (!recipient || !message || !type) {
    return res.status(400).json({ error: 'Recipient, message, and delivery method are required.' })
  }
  try {
    const log = await db.addNotification({ recipient, message, type })

    // If recipient has email formatting, attempt to send real email alert in background
    if (recipient.includes('@')) {
      const mailOptions = {
        from: `"Amma Seva Notifications" <${process.env.SMTP_EMAIL || 'ammasevahomecare@gmail.com'}>`,
        to: recipient.trim(),
        subject: 'Alert Notification from Amma Seva',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
            <h3 style="color: #4f46e5; margin-top: 0;">Care Notification Alert</h3>
            <p style="color: #334155; font-size: 14px; line-height: 1.5;">${message}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center;">This is a system alert message from Amma Seva. Please do not reply directly to this mail.</p>
          </div>
        `
      }
      transporter.sendMail(mailOptions).catch(e => console.error('Failed system broadcast:', e.message))
    }

    console.log(`[Notification Alert Logged] Type: ${type} to ${recipient}: ${message}`)
    res.status(201).json({ success: true, message: 'Notification successfully dispatched!', data: log })
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notification.' })
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
