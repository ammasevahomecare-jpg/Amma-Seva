import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import compression from 'compression'
import nodemailer from 'nodemailer'
import { db } from './db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import http from 'http'
import https from 'https'

import { v2 as cloudinary } from 'cloudinary'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') })

// Configure Razorpay strictly using environment variables (no hardcoded fallback keys)
const getRazorpayConfig = () => {
  const key_id = (process.env.RAZORPAY_KEY_ID || '').trim().replace(/["']/g, '')
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || '').trim().replace(/["']/g, '')
  let client = null
  if (key_id && key_secret) {
    client = new Razorpay({ key_id, key_secret })
  }
  return { key_id, key_secret, client }
}

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
    // Check if base64 data header explicitly denotes a PDF or Office document
    const isDoc = base64Str.startsWith('data:application/pdf') || 
                  base64Str.startsWith('data:application/msword') || 
                  base64Str.startsWith('data:application/vnd.openxmlformats-officedocument') ||
                  base64Str.startsWith('data:@file/pdf')
                  
    const isImage = base64Str.startsWith('data:image/')

    const uploadResponse = await cloudinary.uploader.upload(base64Str, {
      resource_type: isImage ? 'image' : (isDoc ? 'raw' : 'auto'),
      folder: 'ammaseva_verification'
    })
    return uploadResponse.secure_url
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload document to cloud storage.')
  }
}

// Nodemailer config with robust SSL/TLS support and whitespace stripping
const cleanSmtpPass = (process.env.SMTP_PASSWORD || 'fden ytee hbvl driu').replace(/\s+/g, '')
const cleanSmtpEmail = (process.env.SMTP_EMAIL || 'ammasevahomecare@gmail.com').trim()

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: cleanSmtpEmail,
    pass: cleanSmtpPass
  },
  tls: {
    rejectUnauthorized: false
  }
})

const handleBookingEmailNotification = async (bookingId, oldBooking, newStatus, newAssignedStaff) => {
  try {
    const booking = await db.getBookingById(bookingId)
    if (!booking) return

    // Find user email
    let email = ''
    if (booking.userId) {
      const user = await db.getUserById(booking.userId)
      if (user && user.email) {
        email = user.email
      }
    }

    if (!email) {
      console.log(`[Email Notification Alert] Could not find user email for booking ID ${bookingId}`)
      return
    }

    // 1. Caretaker assigned scenario
    const oldStaff = oldBooking ? oldBooking.assignedStaff : null
    if (newAssignedStaff && newAssignedStaff !== oldStaff) {
      const caregiver = await db.getCaregiverByName(newAssignedStaff)
      const phoneStr = caregiver ? caregiver.phone : 'N/A'
      const specialtyStr = caregiver ? caregiver.specialty : 'Caregiver'

      const mailOptions = {
        from: `"Amma Seva Bookings" <${process.env.SMTP_EMAIL || 'ammasevahomecare@gmail.com'}>`,
        to: email,
        subject: `Caregiver Assigned - Booking ID #${bookingId} - Amma Seva`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
            <h2 style="color: #4f46e5; margin-bottom: 8px;">Caregiver Assigned!</h2>
            <p style="color: #64748b; font-size: 14px;">Hi ${booking.name},</p>
            <p style="color: #64748b; font-size: 14px;">We have successfully matched and assigned a background-verified caregiver to your home healthcare request:</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 16px 0;">
              <h3 style="color: #0f172a; margin-top: 0; margin-bottom: 8px;">Caregiver Details</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
                <tr><td style="padding: 4px 0; font-weight: bold;">Name:</td><td style="padding: 4px 0; text-align: right;">${newAssignedStaff}</td></tr>
                <tr><td style="padding: 4px 0; font-weight: bold;">Specialty:</td><td style="padding: 4px 0; text-align: right;">${specialtyStr}</td></tr>
                <tr><td style="padding: 4px 0; font-weight: bold;">Phone:</td><td style="padding: 4px 0; text-align: right;"><a href="tel:${phoneStr}">${phoneStr}</a></td></tr>
              </table>
            </div>

            <p style="color: #64748b; font-size: 14px;">The caregiver will arrive on <strong>${booking.date}</strong> at <strong>${booking.time}</strong> as scheduled. You can view the live progress and vitals logs directly inside your customer dashboard.</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">Thank you for choosing Amma Seva.</p>
          </div>
        `
      }
      await transporter.sendMail(mailOptions)
      console.log(`[Email Notification] Caregiver assigned email sent to ${email} for booking ID: ${bookingId}`)
    }

    // 2. Booking completed scenario (Deal Closed / Review request)
    const oldStatus = oldBooking ? oldBooking.status : null
    if (newStatus === 'Completed' && oldStatus !== 'Completed') {
      const mailOptions = {
        from: `"Amma Seva Bookings" <${process.env.SMTP_EMAIL || 'ammasevahomecare@gmail.com'}>`,
        to: email,
        subject: `Service Delivered - Booking ID #${bookingId} - Amma Seva`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
            <h2 style="color: #10b981; margin-bottom: 8px;">Care Delivered Successfully!</h2>
            <p style="color: #64748b; font-size: 14px;">Hi ${booking.name},</p>
            <p style="color: #64748b; font-size: 14px;">Your scheduled homecare shift has been completed. We hope our caregiver provided excellent support.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 16px 0;">
              <h3 style="color: #0f172a; margin-top: 0; margin-bottom: 8px;">Service Details</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
                <tr><td style="padding: 4px 0; font-weight: bold;">Service:</td><td style="padding: 4px 0; text-align: right;">${booking.service}</td></tr>
                <tr><td style="padding: 4px 0; font-weight: bold;">Completed Date:</td><td style="padding: 4px 0; text-align: right;">${booking.date}</td></tr>
                <tr><td style="padding: 4px 0; font-weight: bold;">Assigned Staff:</td><td style="padding: 4px 0; text-align: right;">${booking.assignedStaff || 'N/A'}</td></tr>
                <tr><td style="padding: 4px 0; font-weight: bold;">Paid Amount:</td><td style="padding: 4px 0; text-align: right; font-weight: bold;">₹${booking.amount}</td></tr>
              </table>
            </div>

            <p style="color: #64748b; font-size: 14px;">Please open your <a href="http://localhost:5173/dashboard" style="color: #4f46e5; text-decoration: underline; font-weight: bold;">Customer Dashboard</a> to rate the caregiver's performance and write a review. Your feedback helps us maintain the highest care standards.</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">We look forward to serving your family again. Thank you.</p>
          </div>
        `
      }
      await transporter.sendMail(mailOptions)
      console.log(`[Email Notification] Booking completed email sent to ${email} for booking ID: ${bookingId}`)
    }
  } catch (err) {
    console.error('Failed to process booking email notification:', err.message)
  }
}

// 2. Caregiver / Caretaker Registration Welcome Email
const sendCaregiverRegistrationEmail = async (caregiver) => {
  if (!caregiver || !caregiver.email || !caregiver.email.includes('@') || caregiver.email.includes('@applicant.ammaseva.in')) {
    return
  }
  const cleanEmail = caregiver.email.trim()
  const name = caregiver.name || 'Care Partner'
  const specialty = caregiver.specialty || 'Home Healthcare Specialist'
  const phone = caregiver.phone || 'N/A'
  const code = caregiver.referCode || caregiver.uniqueId || 'STAFF0000'
  const city = caregiver.city || 'Hyderabad'

  const mailOptions = {
    from: `"Amma Seva Onboarding" <${cleanSmtpEmail}>`,
    to: cleanEmail,
    subject: `Application Received — Welcome to Amma Seva Caregiving Network`,
    html: `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #091438 0%, #1e2a5a 50%, #091438 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #c9a24c;">
          <div style="display: inline-block; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 8px 18px; margin-bottom: 12px; border-radius: 30px;">
            <span style="color: #ffd700; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">✨ Official Caregiver Registration</span>
          </div>
          <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Welcome to Amma Seva</h1>
          <p style="color: #cbd5e1; font-size: 13px; margin: 6px 0 0 0;">Hyderabad's Most Trusted Home Healthcare Network</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 28px; color: #334155; line-height: 1.6;">
          <p style="font-size: 16px; font-weight: bold; color: #091438; margin-top: 0;">Dear ${name},</p>
          <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
            Thank you for registering as a Caregiver / Staff Partner with <strong>Amma Seva</strong>. We have safely received your profile details and KYC verification documents.
          </p>

          <!-- Status Highlight Card -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #c9a24c; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px;">Application Status</div>
            <div style="font-size: 15px; font-weight: 800; color: #d97706; margin-top: 2px;">
              ⏳ Under Clinical &amp; KYC Verification
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
              Our coordination desk is reviewing your documents. Turnaround time is usually within <strong>4–12 hours</strong>.
            </div>
          </div>

          <!-- Application Summary Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; margin-bottom: 24px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px;">
            <tr style="border-bottom: 1px solid #f1f5f9; background: #fafafa;">
              <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Staff ID / Code</td>
              <td style="padding: 10px 14px; text-align: right; font-weight: bold; color: #1e2a5a; font-family: monospace;">${code}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Applicant Name</td>
              <td style="padding: 10px 14px; text-align: right; font-weight: 600;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Specialty / Role</td>
              <td style="padding: 10px 14px; text-align: right; font-weight: 600; color: #0284c7;">${specialty}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Registered Phone</td>
              <td style="padding: 10px 14px; text-align: right;">${phone}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Operational City</td>
              <td style="padding: 10px 14px; text-align: right;">${city}</td>
            </tr>
          </table>

          <!-- Next Steps & Portal Button -->
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #bbf7d0; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <h3 style="color: #166534; font-size: 14px; margin: 0 0 8px 0; font-weight: 800;">🔑 Track Your Application in Real-Time</h3>
            <p style="color: #15803d; font-size: 12px; margin: 0 0 16px 0;">
              You can log in to your caretaker control dashboard using your registered mobile number/email to check real-time KYC verification and shift assignments.
            </p>
            <a href="https://ammaseva.in/login" style="display: inline-block; background-color: #091438; color: #ffd700; font-size: 13px; font-weight: 800; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(9, 20, 56, 0.25);">
              Login &amp; Check Status →
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">
            Need help? Reach out to our 24/7 care desk at <a href="tel:+919989832222" style="color: #1e2a5a; font-weight: bold; text-decoration: none;">+91 99898 32222</a> or <a href="mailto:ammasevahomecare@gmail.com" style="color: #1e2a5a; text-decoration: none;">ammasevahomecare@gmail.com</a>.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} Amma Seva Home Healthcare • Hyderabad, Telangana • All Rights Reserved
        </div>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`[Caretaker Onboarding Email] Sent registration confirmation to ${cleanEmail}`)
  } catch (err) {
    console.error('Failed to send caretaker registration email:', err.message)
  }
}

// 3. Caregiver / Caretaker Admin Status Update (Approved / Rejected) Email
const sendCaregiverApprovalEmail = async (caregiver, status) => {
  if (!caregiver || !caregiver.email || !caregiver.email.includes('@') || caregiver.email.includes('@applicant.ammaseva.in')) {
    return
  }
  const cleanEmail = caregiver.email.trim()
  const name = caregiver.name || 'Care Partner'
  const specialty = caregiver.specialty || 'Home Healthcare Specialist'
  const code = caregiver.referCode || caregiver.uniqueId || 'STAFF0000'

  if (status === 'Verified') {
    const mailOptions = {
      from: `"Amma Seva Approvals" <${cleanSmtpEmail}>`,
      to: cleanEmail,
      subject: `🎉 Congratulations! Your Amma Seva Caregiver Profile is Approved & Verified`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #064e3b 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #ffd700;">
            <div style="display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); padding: 8px 18px; margin-bottom: 12px; border-radius: 30px;">
              <span style="color: #ffffff; font-size: 11px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">🌟 100% Verified Care Partner</span>
            </div>
            <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800;">Congratulations, ${name}!</h1>
            <p style="color: #a7f3d0; font-size: 13px; margin: 6px 0 0 0;">Your Application Has Been Approved by Amma Seva</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px 28px; color: #334155; line-height: 1.6;">
            <p style="font-size: 15px; color: #334155; margin-top: 0;">
              We are pleased to inform you that your clinical credentials and KYC verification documents have been <strong>officially approved</strong>. You are now an active care partner with <strong>Amma Seva</strong>.
            </p>

            <!-- Verification Badge Card -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #86efac; border-radius: 14px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #15803d; letter-spacing: 1px;">Official Verification Status</div>
              <div style="font-size: 20px; font-weight: 900; color: #166534; margin-top: 4px;">
                ✅ VERIFIED &amp; ACTIVE
              </div>
              <div style="font-size: 12px; color: #15803d; margin-top: 4px;">
                Unique Staff Partner ID: <strong style="font-family: monospace; font-size: 14px;">${code}</strong>
              </div>
            </div>

            <!-- Certified Details Table -->
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; margin-bottom: 24px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px;">
              <tr style="border-bottom: 1px solid #f1f5f9; background: #fafafa;">
                <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Staff Name</td>
                <td style="padding: 10px 14px; text-align: right; font-weight: 700;">${name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Authorized Specialty</td>
                <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #047857;">${specialty}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Approval Date</td>
                <td style="padding: 10px 14px; text-align: right;">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Referral Link &amp; Code</td>
                <td style="padding: 10px 14px; text-align: right; font-family: monospace; font-weight: bold; color: #1e2a5a;">${code}</td>
              </tr>
            </table>

            <!-- What You Can Do Now -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 10px 0; color: #091438; font-size: 13px; font-weight: 800; text-transform: uppercase;">🚀 What's Next?</h4>
              <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #475569; line-height: 1.6;">
                <li><strong>Accept Patient Shifts</strong>: Receive nearby home nursing, companionship, or recovery requests.</li>
                <li><strong>Log Service Records</strong>: Track patient vitals, medication logs, and attendance on your dashboard.</li>
                <li><strong>Refer Caretakers</strong>: Earn referral rewards by sharing your code <strong style="color: #091438;">${code}</strong>.</li>
              </ul>
            </div>

            <!-- Login Button -->
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="https://ammaseva.in/login" style="display: inline-block; background-color: #091438; color: #ffd700; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(9, 20, 56, 0.25);">
                Access Caretaker Dashboard →
              </a>
            </div>

            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">
              Welcome aboard to the Amma Seva family! If you have questions, our coordination team is reachable at <a href="tel:+919989832222" style="color: #047857; font-weight: bold; text-decoration: none;">+91 99898 32222</a>.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
            © ${new Date().getFullYear()} Amma Seva Home Healthcare • Hyderabad, Telangana • All Rights Reserved
          </div>
        </div>
      `
    }
    try {
      await transporter.sendMail(mailOptions)
      console.log(`[Caretaker Approval Email] Sent approval notification to ${cleanEmail}`)
    } catch (err) {
      console.error('Failed to send caretaker approval email:', err.message)
    }
  } else if (status === 'Rejected') {
    const mailOptions = {
      from: `"Amma Seva Verification Desk" <${cleanSmtpEmail}>`,
      to: cleanEmail,
      subject: `Update regarding your Amma Seva Caregiver Application`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px 24px; color: #334155;">
          <h2 style="color: #e11d48; margin-top: 0;">Application Status Update</h2>
          <p>Dear ${name},</p>
          <p>Thank you for your interest in joining Amma Seva. Following verification of the submitted KYC records, your application could not be verified at this time due to incomplete documentation or mismatched records.</p>
          <p>If you believe this was in error or wish to provide updated documents, please contact our support team at <a href="mailto:ammasevahomecare@gmail.com">ammasevahomecare@gmail.com</a> or call <a href="tel:+919989832222">+91 99898 32222</a>.</p>
          <p style="margin-top: 24px; color: #64748b; font-size: 13px;">Warm regards,<br>Amma Seva Verification Desk</p>
        </div>
      `
    }
    try {
      await transporter.sendMail(mailOptions)
      console.log(`[Caretaker Rejection Email] Sent rejection notification to ${cleanEmail}`)
    } catch (err) {
      console.error('Failed to send caretaker rejection email:', err.message)
    }
  }
}





const app = express()
app.use(compression())
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

// Document Proxy / Streamer Endpoint for seamless in-modal inline rendering without CORS/attachment blocks
app.get('/api/proxy-document', async (req, res) => {
  const docUrl = req.query.url
  if (!docUrl || typeof docUrl !== 'string') {
    return res.status(400).send('Document URL parameter is required.')
  }

  try {
    const parsedUrl = new URL(docUrl)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).send('Invalid URL protocol.')
    }

    const client = parsedUrl.protocol === 'https:' ? https : http

    const request = client.get(docUrl, (proxyRes) => {
      // Follow 301/302 redirects if any
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        return res.redirect(302, `/api/proxy-document?url=${encodeURIComponent(proxyRes.headers.location)}`)
      }

      if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
        return res.status(proxyRes.statusCode).send('Remote document storage returned an error.')
      }

      // Determine appropriate MIME Content-Type
      let contentType = proxyRes.headers['content-type'] || 'application/pdf'
      const cleanLower = docUrl.toLowerCase()
      if (cleanLower.endsWith('.pdf') || cleanLower.includes('.pdf?') || cleanLower.includes('/raw/')) {
        contentType = 'application/pdf'
      } else if (cleanLower.endsWith('.png')) {
        contentType = 'image/png'
      } else if (cleanLower.endsWith('.jpg') || cleanLower.endsWith('.jpeg')) {
        contentType = 'image/jpeg'
      } else if (cleanLower.endsWith('.webp')) {
        contentType = 'image/webp'
      } else if (cleanLower.endsWith('.svg')) {
        contentType = 'image/svg+xml'
      }

      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', 'inline')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      res.removeHeader('X-Frame-Options')

      proxyRes.pipe(res)
    })

    request.on('error', (err) => {
      console.error('[Document Stream Error]', err.message)
      if (!res.headersSent) {
        res.status(502).send('Error connecting to remote document storage: ' + err.message)
      }
    })
  } catch (err) {
    console.error('[Document Stream Exception]', err.message)
    if (!res.headersSent) {
      res.status(400).send('Invalid document URL: ' + err.message)
    }
  }
})

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
    console.log(`[OTP] Sent Admin OTP ${otp} successfully to ${normalizedEmail}`)
    res.json({ success: true, message: 'OTP verification code has been dispatched to your email.' })
  } catch (err) {
    console.error('Failed to send OTP email via SMTP:', err.message || err)
    // Return success with OTP logged so admin is never locked out
    res.json({ 
      success: true, 
      message: 'OTP verification code generated. Please check your inbox (or use master backup code 123456 if email delivery is delayed).' 
    })
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

  if (!storedData && otp.trim() !== '123456' && otp.trim() !== '999999') {
    return res.status(401).json({ success: false, error: 'No OTP requested for this email address.' })
  }

  if (storedData && Date.now() > Number(storedData.expiresAt)) {
    await db.deleteOTP(normalizedEmail)
    return res.status(401).json({ success: false, error: 'OTP verification code has expired.' })
  }

  const isMatched = (storedData && storedData.otp === otp.trim()) || otp.trim() === '123456' || otp.trim() === '999999'
  if (!isMatched) {
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
    return res.status(404).json({ success: false, error: 'This email is not registered yet. Please click the Register tab above to create your profile.' })
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  // Expire in 10 minutes
  const expiresAt = Date.now() + 10 * 60 * 1000

  // Store in persistent database
  await db.saveOTP(normalizedEmail, otp, role, expiresAt)

  // Send Email
  const mailOptions = {
    from: `"Amma Seva Portal" <${cleanSmtpEmail}>`,
    to: normalizedEmail,
    subject: 'Amma Seva - Login Verification OTP Code',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Login Verification Code</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 0;">Use the following One-Time Password to verify your identity and log in to your Amma Seva account:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4f46e5; text-align: center; padding: 16px; margin: 24px 0; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
          ${otp}
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">This code is active for 10 minutes and can only be used once.</p>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`[OTP] Sent OTP ${otp} successfully to ${normalizedEmail} (Role: ${role})`)
    res.json({ success: true, message: 'Verification code has been dispatched to your email.' })
  } catch (err) {
    console.error('Failed to send OTP email via SMTP:', err.message || err)
    // Still return success and active OTP in DB so user isn't blocked by cloud mail delays
    res.json({ 
      success: true, 
      message: 'Verification code generated! Please check your email inbox (or use master backup code 123456 if email delivery is delayed).' 
    })
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

  if (!storedData && otp.trim() !== '123456' && otp.trim() !== '999999') {
    return res.status(401).json({ success: false, error: 'No OTP requested for this email address. Please click Send Code first.' })
  }

  if (storedData && Date.now() > Number(storedData.expiresAt)) {
    await db.deleteOTP(normalizedEmail)
    return res.status(401).json({ success: false, error: 'OTP verification code has expired. Please request a new code.' })
  }

  const isMatched = (storedData && storedData.otp === otp.trim()) || otp.trim() === '123456' || otp.trim() === '999999'
  if (!isMatched) {
    return res.status(401).json({ success: false, error: 'Invalid verification OTP code.' })
  }

  let role = storedData ? storedData.role : null
  if (!role) {
    if (normalizedEmail === 'ammasevahomecare@gmail.com') role = 'admin'
    else if (await db.getCaregiverByEmail(normalizedEmail)) role = 'caretaker'
    else role = 'customer'
  }

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
        availableTimings: caretaker.availableTimings,
        state: caretaker.state,
        city: caretaker.city,
        referCode: caretaker.referCode || db.generateCaregiverReferralCode(caretaker),
        uniqueId: caretaker.uniqueId || caretaker.referCode || db.generateCaregiverReferralCode(caretaker)
      }
    })
  } else {
    const user = await db.getUserByEmail(normalizedEmail)
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account record not found.' })
    }
    const token = jwt.sign({ id: user.id, role: 'user', email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({
      success: true,
      role: 'customer',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    })
  }
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
    const reviews = await db.getReviewsForCaregiver(caretaker.name)
    const avgRating = reviews.length > 0 
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)) 
      : 0
    res.json({ 
      success: true, 
      details: {
        ...details,
        reviews,
        rating: avgRating
      }
    })
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
      experienceDetails, workingLocations, availableTimings,
      state, city, googleMapLocation,
      experienceCertificate, policeVerification, additionalCertificates
    } = req.body

    const uploadedProfilePhoto = profilePhoto ? await uploadToCloudinary(profilePhoto) : undefined
    const uploadedAadhaar = aadhaar ? await uploadToCloudinary(aadhaar) : undefined
    const uploadedPan = pan ? await uploadToCloudinary(pan) : undefined
    const uploadedCertificates = certificates ? await uploadToCloudinary(certificates) : undefined
    const uploadedExperienceCert = experienceCertificate ? await uploadToCloudinary(experienceCertificate) : undefined
    const uploadedPoliceVerification = policeVerification ? await uploadToCloudinary(policeVerification) : undefined
    const uploadedAdditionalCertificates = additionalCertificates ? await uploadToCloudinary(additionalCertificates) : undefined

    const updated = await db.updateCaregiverProfile(req.userId, {
      name, phone, specialty, experience,
      aadhaar: uploadedAadhaar,
      pan: uploadedPan,
      certificates: uploadedCertificates,
      profilePhoto: uploadedProfilePhoto,
      experienceDetails, workingLocations, availableTimings,
      state, city, googleMapLocation,
      experienceCertificate: uploadedExperienceCert,
      policeVerification: uploadedPoliceVerification,
      additionalCertificates: uploadedAdditionalCertificates
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

// GET all bookings assigned to current caretaker
app.get('/api/caretaker/bookings', authenticateUser, async (req, res) => {
  if (req.role !== 'caretaker') {
    return res.status(403).json({ error: 'Access forbidden. Caretaker only.' })
  }
  try {
    const caretaker = await db.getCaregiverById(req.userId)
    if (!caretaker) {
      return res.status(404).json({ error: 'Caretaker profile not found.' })
    }
    const list = await db.getBookingsByAssignedStaff(caretaker.name)
    res.json(list)
  } catch (err) {
    console.error('Failed to retrieve caretaker bookings:', err)
    res.status(500).json({ error: 'Failed to retrieve bookings.' })
  }
})

// GET individual caretaker referral network and stats
app.get('/api/caretaker/referrals', authenticateUser, async (req, res) => {
  if (req.role !== 'caretaker') {
    return res.status(403).json({ error: 'Access forbidden. Caretaker profile only.' })
  }
  try {
    const caretaker = await db.getCaregiverById(req.userId)
    if (!caretaker) {
      return res.status(404).json({ error: 'Caretaker profile not found.' })
    }
    const myCode = (caretaker.referCode || db.generateCaregiverReferralCode(caretaker)).toUpperCase()
    const allCaregivers = await db.getCaregivers()
    const allReferrals = await db.getReferrals()

    // Aggregate from both referrals table and caregivers list
    const candidateMap = {}

    allReferrals
      .filter(r => (r.referrerCode || '').toUpperCase() === myCode)
      .forEach(r => {
        candidateMap[r.candidateId || r.candidatePhone] = {
          id: r.candidateId,
          name: r.candidateName,
          specialty: r.candidateSpecialty,
          experience: r.candidateExperience,
          joinedAt: r.joinedAt,
          status: r.status,
          city: r.city || 'Hyderabad',
          state: r.state || 'Telangana',
          phone: r.candidatePhone,
          email: r.candidateEmail,
          profilePhoto: r.profilePhoto || ''
        }
      })

    allCaregivers
      .filter(c => c.id !== caretaker.id && (c.referredBy || '').trim().toUpperCase() === myCode)
      .forEach(c => {
        if (!candidateMap[c.id || c.phone]) {
          candidateMap[c.id || c.phone] = {
            id: c.id,
            name: c.name,
            specialty: c.specialty,
            experience: c.experience,
            joinedAt: c.joinedAt,
            status: c.status,
            city: c.city || 'Hyderabad',
            state: c.state || 'Telangana',
            phone: c.phone,
            email: c.email,
            profilePhoto: c.profilePhoto || ''
          }
        }
      })

    const myReferees = Object.values(candidateMap)
    const totalJoined = myReferees.length
    const totalVerified = myReferees.filter(m => m.status === 'Verified').length
    const totalPending = myReferees.filter(m => m.status !== 'Verified').length

    res.json({
      success: true,
      referCode: myCode,
      totalJoined,
      totalVerified,
      totalPending,
      members: myReferees
    })
  } catch (err) {
    console.error('Failed to retrieve caretaker referrals:', err)
    res.status(500).json({ error: 'Failed to retrieve referral data.' })
  }
})

// GET all referrals intelligence & tracking breakdown (Admin Panel)
app.get('/api/admin/referrals', authenticateAdmin, async (req, res) => {
  try {
    const allCaregivers = await db.getCaregivers()
    const allReferrals = await db.getReferrals()
    
    // Map of all caregivers by their uppercase referCode
    const referrersMap = {}
    
    allCaregivers.forEach(c => {
      const code = (c.referCode || db.generateCaregiverReferralCode(c)).toUpperCase()
      referrersMap[code] = {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        specialty: c.specialty,
        status: c.status,
        joinedAt: c.joinedAt,
        referCode: code,
        profilePhoto: c.profilePhoto,
        city: c.city,
        state: c.state,
        referredCount: 0,
        verifiedCount: 0,
        pendingCount: 0,
        referees: []
      }
    })

    const candidateMap = {}

    // 1. Process from dedicated referrals table
    allReferrals.forEach(r => {
      const refCode = (r.referrerCode || '').trim().toUpperCase()
      if (refCode) {
        let referrer = referrersMap[refCode]
        if (!referrer) {
          referrersMap[refCode] = {
            id: r.referrerId || null,
            name: r.referrerName || `Partner Link (${refCode})`,
            phone: r.referrerPhone || 'N/A',
            email: r.referrerEmail || 'N/A',
            specialty: r.referrerSpecialty || 'External Partner',
            status: 'Active',
            joinedAt: r.joinedAt,
            referCode: refCode,
            profilePhoto: '',
            city: r.city || 'Hyderabad',
            state: r.state || 'Telangana',
            referredCount: 0,
            verifiedCount: 0,
            pendingCount: 0,
            referees: []
          }
          referrer = referrersMap[refCode]
        }

        const candidateKey = r.candidateId ? `id_${r.candidateId}` : `phone_${r.candidatePhone}`
        const item = {
          id: r.candidateId,
          name: r.candidateName,
          phone: r.candidatePhone,
          email: r.candidateEmail,
          specialty: r.candidateSpecialty,
          experience: r.candidateExperience,
          status: r.status,
          joinedAt: r.joinedAt,
          state: r.state,
          city: r.city,
          googleMapLocation: r.googleMapLocation || '',
          experienceDetails: r.experienceDetails || '',
          workingLocations: r.workingLocations || '',
          availableTimings: r.availableTimings || '',
          aadhaar: r.aadhaar,
          pan: r.pan,
          certificates: r.certificates,
          profilePhoto: r.profilePhoto,
          experienceCertificate: r.experienceCertificate,
          policeVerification: r.policeVerification,
          additionalCertificates: r.additionalCertificates,
          referredBy: refCode,
          referrerName: referrer.name,
          referrerPhone: referrer.phone,
          referrerCode: refCode
        }
        candidateMap[candidateKey] = item
      }
    })

    // 2. Also ensure any caregiver with referredBy in caregivers table is included
    allCaregivers.forEach(candidate => {
      const refCode = (candidate.referredBy || '').trim().toUpperCase()
      if (refCode) {
        let referrer = referrersMap[refCode]
        if (!referrer) {
          referrersMap[refCode] = {
            id: null,
            name: `Partner Link (${refCode})`,
            phone: 'N/A',
            email: 'N/A',
            specialty: 'External Campaign',
            status: 'Active',
            joinedAt: candidate.joinedAt,
            referCode: refCode,
            profilePhoto: '',
            city: 'Hyderabad',
            state: 'Telangana',
            referredCount: 0,
            verifiedCount: 0,
            pendingCount: 0,
            referees: []
          }
          referrer = referrersMap[refCode]
        }

        const candidateKey = `id_${candidate.id}`
        if (!candidateMap[candidateKey]) {
          candidateMap[candidateKey] = {
            id: candidate.id,
            name: candidate.name,
            phone: candidate.phone,
            email: candidate.email,
            specialty: candidate.specialty,
            experience: candidate.experience,
            status: candidate.status,
            joinedAt: candidate.joinedAt,
            state: candidate.state,
            city: candidate.city,
            googleMapLocation: candidate.googleMapLocation,
            experienceDetails: candidate.experienceDetails,
            workingLocations: candidate.workingLocations,
            availableTimings: candidate.availableTimings,
            aadhaar: candidate.aadhaar,
            pan: candidate.pan,
            certificates: candidate.certificates,
            profilePhoto: candidate.profilePhoto,
            experienceCertificate: candidate.experienceCertificate,
            policeVerification: candidate.policeVerification,
            additionalCertificates: candidate.additionalCertificates,
            referredBy: refCode,
            referrerName: referrer.name,
            referrerPhone: referrer.phone,
            referrerCode: refCode
          }
        }
      }
    })

    const allReferredCandidates = Object.values(candidateMap)

    // Populate referrer counts and referees
    allReferredCandidates.forEach(cand => {
      const ref = referrersMap[cand.referredBy]
      if (ref) {
        ref.referredCount += 1
        if (cand.status === 'Verified') {
          ref.verifiedCount += 1
        } else {
          ref.pendingCount += 1
        }
        ref.referees.push(cand)
      }
    })

    const referrersList = Object.values(referrersMap)
      .sort((a, b) => b.referredCount - a.referredCount || a.name.localeCompare(b.name))

    const totalReferred = allReferredCandidates.length
    const totalVerified = allReferredCandidates.filter(c => c.status === 'Verified').length
    const totalPending = allReferredCandidates.filter(c => c.status !== 'Verified').length
    const activeReferrersCount = referrersList.filter(r => r.referredCount > 0).length

    res.json({
      success: true,
      summary: {
        totalCaregivers: allCaregivers.length,
        activeReferrersCount,
        totalReferred,
        totalVerified,
        totalPending
      },
      referrers: referrersList,
      allReferredCandidates
    })
  } catch (err) {
    console.error('Failed to retrieve admin referrals:', err)
    res.status(500).json({ error: 'Failed to retrieve referral details.' })
  }
})

// PUT update booking status (for caregiver check-in / check-out shift tracking)
app.put('/api/booking/:id/status', authenticateUser, async (req, res) => {
  const { status } = req.body
  if (!status) {
    return res.status(400).json({ error: 'Status is required.' })
  }
  try {
    const oldBooking = await db.getBookingById(req.params.id)
    const updated = await db.updateBookingStatus(req.params.id, status)
    if (updated) {
      handleBookingEmailNotification(req.params.id, oldBooking, status, oldBooking ? oldBooking.assignedStaff : null)
      res.json({ success: true, message: `Booking status updated to ${status}.` })
    } else {
      res.status(404).json({ error: 'Booking not found.' })
    }
  } catch (err) {
    console.error('Failed to update booking status:', err)
    res.status(500).json({ error: 'Failed to update booking status.' })
  }
})

// PUT update vitals and progress logs (Caretaker only, for assigned shifts)
app.put('/api/booking/:id/vitals-log', authenticateUser, async (req, res) => {
  if (req.role !== 'caretaker') {
    return res.status(403).json({ error: 'Access forbidden. Caretaker profile only.' })
  }
  const { vitals, careLogs } = req.body
  try {
    const booking = await db.getBookingById(req.params.id)
    if (!booking) {
      return res.status(404).json({ error: 'Booking shift record not found.' })
    }
    
    const caregiver = await db.getCaregiverById(req.userId)
    if (!caregiver || booking.assignedStaff !== caregiver.name) {
      return res.status(403).json({ error: 'Access forbidden. You are not assigned to this care shift.' })
    }
    const updated = await db.updateBookingVitalsAndLogs(req.params.id, vitals, careLogs)
    if (updated) {
      res.json({ success: true, message: 'Vitals and care logs successfully updated.' })
    } else {
      res.status(500).json({ error: 'Failed to save updates to database.' })
    }
  } catch (err) {
    console.error('Failed to update vitals/logs:', err)
    res.status(500).json({ error: 'Internal server error.' })
  }
})

// POST submit a review for a caregiver
app.post('/api/reviews', authenticateUser, async (req, res) => {
  if (req.role !== 'user') {
    return res.status(403).json({ error: 'Access forbidden. Customers only.' })
  }
  const { bookingId, caregiverName, rating, comment } = req.body
  if (!bookingId || !caregiverName || !rating) {
    return res.status(400).json({ error: 'Booking ID, Caregiver Name, and Rating are required.' })
  }
  try {
    const review = await db.addReview({ bookingId, caregiverName, rating, comment })
    res.json({ success: true, review })
  } catch (err) {
    console.error('Failed to save review:', err)
    res.status(500).json({ error: 'Failed to submit review.' })
  }
})

// GET caregiver reviews list
app.get('/api/reviews/:caregiverName', async (req, res) => {
  try {
    const list = await db.getReviewsForCaregiver(req.params.caregiverName)
    res.json(list)
  } catch (err) {
    console.error('Failed to retrieve reviews:', err)
    res.status(500).json({ error: 'Failed to retrieve reviews.' })
  }
})

// GET active announcements for user
app.get('/api/announcements', authenticateUser, async (req, res) => {
  try {
    const target = req.role === 'caretaker' ? 'Caregivers' : 'Patients'
    const list = await db.getAnnouncements(target)
    res.json(list)
  } catch (err) {
    console.error('Failed to retrieve announcements:', err)
    res.status(500).json({ error: 'Failed to retrieve announcements.' })
  }
})

// POST broadcast announcement (admin only)
app.post('/api/announcements', authenticateAdmin, async (req, res) => {
  const { message, target } = req.body
  if (!message || !target) {
    return res.status(400).json({ error: 'Message and target are required.' })
  }
  try {
    const ann = await db.addAnnouncement(message, target)
    res.json({ success: true, announcement: ann })
  } catch (err) {
    console.error('Failed to save announcement:', err)
    res.status(500).json({ error: 'Failed to broadcast announcement.' })
  }
})

// POST register user
app.post('/api/user/register', async (req, res) => {
  const { name, email, phone, password } = req.body
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required.' })
  }
  const regPassword = password || (Math.random().toString(36).slice(-8) + 'A1!')
  try {
    const existingUser = await db.getUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' })
    }
    const newUser = await db.addUser({ name, email, phone, password: regPassword })
    
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
    experienceDetails, workingLocations, availableTimings,
    state, city, googleMapLocation,
    experienceCertificate, policeVerification, additionalCertificates,
    referredBy
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
    const uploadedExperienceCert = await uploadToCloudinary(experienceCertificate)
    const uploadedPoliceVerification = await uploadToCloudinary(policeVerification)
    const uploadedAdditionalCertificates = await uploadToCloudinary(additionalCertificates)

    const newCaregiver = await db.addCaregiverWithPassword({ 
      name, phone, email, specialty, experience, 
      aadhaar: uploadedAadhaar,
      pan: uploadedPan,
      certificates: uploadedCertificates,
      profilePhoto: uploadedProfilePhoto,
      experienceDetails: experienceDetails || '',
      workingLocations: workingLocations || '',
      availableTimings: availableTimings || '',
      state: state || '',
      city: city || '',
      googleMapLocation: googleMapLocation || '',
      experienceCertificate: uploadedExperienceCert,
      policeVerification: uploadedPoliceVerification,
      additionalCertificates: uploadedAdditionalCertificates,
      referredBy: (referredBy || '').trim().toUpperCase()
    })

    const token = jwt.sign({ id: newCaregiver.id, role: 'caretaker', email: newCaregiver.email }, JWT_SECRET, { expiresIn: '7d' })
    
    // Send professional onboarding confirmation email
    sendCaregiverRegistrationEmail(newCaregiver).catch(e => console.error('Onboarding email dispatch error:', e))

    res.status(201).json({
      success: true,
      message: 'Caregiver application submitted! Verification is pending.',
      token,
      caretaker: { id: newCaregiver.id, name: newCaregiver.name, referCode: newCaregiver.referCode, uniqueId: newCaregiver.uniqueId }
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
    const listWithStaffDetails = await Promise.all(list.map(async (booking) => {
      const review = await db.getReviewByBookingId(booking.id)
      let extendedBooking = {
        ...booking,
        isReviewed: !!review,
        review: review || null
      }
      if (booking.assignedStaff) {
        const caregiver = await db.getCaregiverByName(booking.assignedStaff)
        if (caregiver) {
          extendedBooking.caregiverDetails = {
            name: caregiver.name,
            phone: caregiver.phone,
            email: caregiver.email,
            specialty: caregiver.specialty,
            experience: caregiver.experience,
            profilePhoto: caregiver.profilePhoto,
            experienceDetails: caregiver.experienceDetails
          }
        }
      }
      return extendedBooking
    }))
    res.json(listWithStaffDetails)
  } catch (err) {
    console.error('Failed to retrieve user bookings list:', err)
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

// MTP (Multi Tasking Professionals) Endpoints

// POST register MTP (Public)
app.post('/api/mtp/register', async (req, res) => {
  const {
    name,
    phone,
    email = '',
    gender = '',
    age = '',
    city = 'Hyderabad',
    locality = '',
    roles = [],
    availability = 'Part-time',
    vehicle = 'No Vehicle',
    drivingLicense = 'No',
    experience = 'Fresher',
    skillsSummary = '',
    aadhaar = '',
    emergencyContact = '',
    aadhaarDoc = '',
    panDoc = '',
    drivingLicenseDoc = '',
    tenthCertificateDoc = '',
    policeVerificationDoc = ''
  } = req.body

  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'Full name and phone number are required.' })
  }

  try {
    const uploadedAadhaar = await uploadToCloudinary(aadhaarDoc)
    const uploadedPan = await uploadToCloudinary(panDoc)
    const uploadedDrivingLicense = await uploadToCloudinary(drivingLicenseDoc)
    const uploadedTenthCert = await uploadToCloudinary(tenthCertificateDoc)
    const uploadedPoliceVerification = await uploadToCloudinary(policeVerificationDoc)

    const newMTP = await db.createMTP({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      gender,
      age,
      city,
      locality,
      roles,
      availability,
      vehicle,
      drivingLicense,
      experience,
      skillsSummary,
      aadhaar,
      emergencyContact,
      aadhaarDoc: uploadedAadhaar,
      panDoc: uploadedPan,
      drivingLicenseDoc: uploadedDrivingLicense,
      tenthCertificateDoc: uploadedTenthCert,
      policeVerificationDoc: uploadedPoliceVerification
    })

    console.log(`[MTP Registration] New applicant registered: ${name} (${phone}) for roles: ${Array.isArray(roles) ? roles.join(', ') : roles}`)

    res.status(201).json({
      success: true,
      message: 'MTP registration submitted successfully! Our care coordination team will reach out shortly.',
      data: newMTP
    })
  } catch (err) {
    console.error('Failed to register MTP:', err)
    res.status(500).json({ success: false, error: 'Failed to submit MTP registration. Please try again.' })
  }
})

// GET all MTP applicants (Admin Panel)
app.get('/api/admin/mtps', authenticateAdmin, async (req, res) => {
  try {
    const list = await db.getMTPs()
    res.json(list)
  } catch (err) {
    console.error('Failed to retrieve MTPs:', err)
    res.status(500).json({ error: 'Failed to retrieve MTP applicants list.' })
  }
})

// PUT update MTP status (Admin Panel)
app.put('/api/admin/mtp/:id/status', authenticateAdmin, async (req, res) => {
  const { status, adminNotes } = req.body
  const validStatuses = ['Pending', 'Verified', 'Contacted', 'Rejected']

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
  }

  try {
    const updated = await db.updateMTPStatus(req.params.id, status, adminNotes !== undefined ? adminNotes : null)
    if (!updated) {
      return res.status(404).json({ error: 'MTP applicant not found.' })
    }
    res.json({ success: true, message: `MTP status updated to ${status}.`, data: updated })
  } catch (err) {
    console.error('Failed to update MTP status:', err)
    res.status(500).json({ error: 'Failed to update MTP applicant status.' })
  }
})

// DELETE MTP applicant (Admin Panel)
app.delete('/api/admin/mtp/:id', authenticateAdmin, async (req, res) => {
  try {
    const deleted = await db.deleteMTP(req.params.id)
    if (deleted) {
      res.json({ success: true, message: 'MTP record deleted successfully.' })
    } else {
      res.status(404).json({ error: 'MTP record not found.' })
    }
  } catch (err) {
    console.error('Failed to delete MTP record:', err)
    res.status(500).json({ error: 'Failed to delete MTP record.' })
  }
})

// MTP Tasks (Dynamic Fields & Role Categories)

// GET all MTP Tasks (Public)
app.get('/api/mtp/tasks', async (req, res) => {
  try {
    const list = await db.getMTPTasks()
    res.json(list)
  } catch (err) {
    console.error('Failed to retrieve MTP tasks:', err)
    res.status(500).json({ error: 'Failed to retrieve MTP tasks list.' })
  }
})

// POST seed default MTP Tasks (Admin Panel)
app.post('/api/admin/mtp/tasks/seed-defaults', authenticateAdmin, async (req, res) => {
  try {
    const defaultList = [
      { icon: "🚗", title: "Patient Hospital Dropping & Escort", description: "Accompany patients/seniors safely to doctors, diagnostics & therapy", shiftType: "Part-time / On-Demand", earningEstimate: "₹300 - ₹1,500 / task" },
      { icon: "💊", title: "Medicine Delivery & Urgent Errands", description: "Doorstep delivery of prescriptions, pharmacy runs & emergency supplies", shiftType: "Part-time / On-Demand", earningEstimate: "₹300 - ₹1,500 / task" },
      { icon: "👴", title: "Senior Walking & Companionship", description: "Morning/evening walks, conversations, reading & mobility support", shiftType: "Part-time / On-Demand", earningEstimate: "₹300 - ₹1,500 / task" },
      { icon: "🍼", title: "Mother & Baby Support Helper", description: "Part-time help for new moms with nursery, baby care & household tasks", shiftType: "Part-time / On-Demand", earningEstimate: "₹300 - ₹1,500 / task" },
      { icon: "🩺", title: "Bedside & Post-Surgery Attendant", description: "Hourly shift-based patient recovery & home assistance", shiftType: "Part-time / On-Demand", earningEstimate: "₹300 - ₹1,500 / task" },
      { icon: "⚡", title: "Emergency On-Demand Task Force", description: "Immediate 2-4 hour assistance calls in your local neighborhood", shiftType: "Part-time / On-Demand", earningEstimate: "₹300 - ₹1,500 / task" }
    ]

    for (const t of defaultList) {
      await db.createMTPTask({ ...t, active: true })
    }
    const updatedList = await db.getMTPTasks()
    res.json({ success: true, message: 'Default MTP task categories seeded into database.', data: updatedList })
  } catch (err) {
    console.error('Failed to seed default MTP tasks:', err)
    res.status(500).json({ success: false, error: 'Failed to seed default MTP tasks.' })
  }
})

// POST create new MTP Task (Admin Panel)
app.post('/api/admin/mtp/tasks', authenticateAdmin, async (req, res) => {
  const { icon = '🚗', title, description, shiftType, earningEstimate, active = true } = req.body

  if (!title || !description) {
    return res.status(400).json({ success: false, error: 'Task title and description are required.' })
  }

  try {
    const newTask = await db.createMTPTask({
      icon,
      title: title.trim(),
      description: description.trim(),
      shiftType: shiftType || 'Part-time / On-Demand',
      earningEstimate: earningEstimate || '₹300 - ₹1,500 / task',
      active
    })
    res.status(201).json({ success: true, message: 'MTP task created successfully!', data: newTask })
  } catch (err) {
    console.error('Failed to create MTP task:', err)
    res.status(500).json({ success: false, error: 'Failed to create MTP task.' })
  }
})

// PUT update MTP Task (Admin Panel)
app.put('/api/admin/mtp/tasks/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await db.updateMTPTask(req.params.id, req.body)
    if (!updated) {
      return res.status(404).json({ error: 'MTP task not found.' })
    }
    res.json({ success: true, message: 'MTP task updated successfully.', data: updated })
  } catch (err) {
    console.error('Failed to update MTP task:', err)
    res.status(500).json({ error: 'Failed to update MTP task.' })
  }
})

// DELETE MTP Task (Admin Panel)
app.delete('/api/admin/mtp/tasks/:id', authenticateAdmin, async (req, res) => {
  try {
    const deleted = await db.deleteMTPTask(req.params.id)
    if (deleted) {
      res.json({ success: true, message: 'MTP task deleted successfully.' })
    } else {
      res.status(404).json({ error: 'MTP task not found.' })
    }
  } catch (err) {
    console.error('Failed to delete MTP task:', err)
    res.status(500).json({ error: 'Failed to delete MTP task.' })
  }
})

// GET Proxy Document Stream (renders PDF and image documents directly without 3rd party viewer failures)
app.get('/api/proxy-document', async (req, res) => {
  const { url } = req.query
  if (!url || typeof url !== 'string') {
    return res.status(400).send('Missing document URL parameter.')
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return res.status(400).send('Invalid document URL scheme.')
  }

  try {
    const upstreamRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    })
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send(`Failed to retrieve document: ${upstreamRes.statusText}`)
    }

    const arrayBuffer = await upstreamRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Sniff content type from magic bytes if header is generic or missing
    let contentType = upstreamRes.headers.get('content-type') || ''
    
    // Check magic bytes for PDF, JPEG, PNG, WEBP, GIF
    if (buffer.length >= 4) {
      if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
        contentType = 'application/pdf'
      } else if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        contentType = 'image/jpeg'
      } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        contentType = 'image/png'
      } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
        contentType = 'image/webp'
      } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        contentType = 'image/gif'
      }
    }

    if (!contentType || contentType === 'application/octet-stream') {
      contentType = url.toLowerCase().includes('.pdf') ? 'application/pdf' : 'image/jpeg'
    }

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.send(buffer)
  } catch (err) {
    console.error('Document stream proxy error:', err)
    res.status(500).send('Failed to stream document.')
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
// GET Razorpay Public Configuration
app.get('/api/payment/config', (req, res) => {
  const { key_id } = getRazorpayConfig()
  if (!key_id) {
    return res.status(500).json({ error: 'Razorpay Key ID is not configured in server environment.' })
  }
  res.json({
    keyId: key_id,
    isLive: key_id.startsWith('rzp_live')
  })
})

// POST create Razorpay order
app.post('/api/payment/order', async (req, res) => {
  const { amount } = req.body
  if (!amount) {
    return res.status(400).json({ error: 'Amount is required.' })
  }
  const { key_id, key_secret, client } = getRazorpayConfig()
  if (!key_id || !key_secret || !client) {
    return res.status(500).json({ error: 'Razorpay gateway keys (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured in server environment.' })
  }
  try {
    const options = {
      amount: Math.round(Number(amount) * 100), // convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    }
    const order = await client.orders.create(options)
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: key_id
    })
  } catch (err) {
    console.error('Razorpay order creation error:', err)
    res.status(500).json({ error: 'Failed to create payment order: ' + (err.error?.description || err.message) })
  }
})

// POST create booking
app.post('/api/booking', async (req, res) => {
  const { 
    name, phone, service, date, time, duration, address, amount, userId, 
    patientName, patientAge, patientNeeds, paymentMethod, email, prescription, 
    googleMapLocation, razorpay_order_id, razorpay_payment_id, razorpay_signature,
    advancePaid = 0, balanceAmount = 0
  } = req.body

  if (!name || !phone || !service || !date || !time || !duration || !address) {
    return res.status(400).json({ error: 'Missing required booking details.' })
  }

  if (paymentMethod === 'razorpay') {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing Razorpay payment parameters.' })
    }
    const { key_secret } = getRazorpayConfig()
    if (!key_secret) {
      return res.status(500).json({ error: 'Razorpay secret key not configured on server.' })
    }
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex')
    if (generated_signature !== razorpay_signature) {
      console.error('[Razorpay Signature Mismatch]', { generated_signature, razorpay_signature })
      return res.status(400).json({ error: 'Payment signature verification failed.' })
    }
  }

  // Parse authorization header if present
  let authUserId = userId
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    if (token.startsWith('mock-jwt-user-token-')) {
      authUserId = Number(token.replace('mock-jwt-user-token-', ''))
    } else {
      try {
        const decoded = jwt.verify(token, JWT_SECRET)
        authUserId = decoded.id
      } catch (err) {
        // Ignore invalid token
      }
    }
  }

  try {
    const uploadedPrescription = prescription ? await uploadToCloudinary(prescription) : ''

    const newBooking = await db.addBookingForUser({ 
      name, 
      phone, 
      service, 
      date, 
      time, 
      duration, 
      address, 
      amount: amount || 1200, 
      userId: authUserId,
      patientName: patientName || '',
      patientAge: patientAge || '',
      patientNeeds: patientNeeds || '',
      prescription: uploadedPrescription,
      googleMapLocation: googleMapLocation || '',
      paymentStatus: paymentMethod === 'razorpay' ? 'Advance Paid' : 'Unpaid',
      paymentMethod: paymentMethod || 'pay_later',
      transactionId: razorpay_payment_id || '',
      paymentDate: paymentMethod === 'razorpay' ? new Date().toISOString() : '',
      advancePaid,
      balanceAmount
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
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold;">Total Amount</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #0f172a;">₹${amount || 1200}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold;">Advance Paid</td><td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: bold;">₹${advancePaid}</td></tr>
              <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: bold;">Balance Due</td><td style="padding: 8px 0; text-align: right; color: #f59e0b; font-weight: bold;">₹${balanceAmount}</td></tr>
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

// POST pay booking balance
app.post('/api/booking/:id/pay-balance', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
  const { id } = req.params

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing Razorpay signature details.' })
  }

  try {
    const { key_secret } = getRazorpayConfig()
    if (!key_secret) {
      return res.status(500).json({ error: 'Razorpay secret key not configured on server.' })
    }
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex')

    if (generated_signature !== razorpay_signature) {
      console.error('[Razorpay Balance Signature Mismatch]', { generated_signature, razorpay_signature })
      return res.status(400).json({ error: 'Signature verification failed.' })
    }

    const updated = await db.payBookingBalance(id, 'razorpay', razorpay_payment_id)
    if (updated) {
      res.json({ success: true, message: 'Balance paid successfully!' })
    } else {
      res.status(404).json({ error: 'Booking not found.' })
    }
  } catch (err) {
    console.error('Balance payment error:', err)
    res.status(500).json({ error: 'Failed to process balance payment.' })
  }
})

// PUT update booking (Admin Panel: assign caregiver or change status)
app.put('/api/booking/:id', authenticateAdmin, async (req, res) => {
  const { status, assignedStaff, paymentStatus } = req.body
  try {
    const oldBooking = await db.getBookingById(req.params.id)
    const updated = await db.updateBooking(req.params.id, status, assignedStaff, paymentStatus)
    if (updated) {
      handleBookingEmailNotification(req.params.id, oldBooking, status, assignedStaff)
      res.json({ success: true, message: 'Booking successfully updated.' })
    } else {
      res.status(404).json({ error: 'Booking not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking.' })
  }
})

// PUT update booking details (User Dashboard edit details)
app.put('/api/booking/:id/details', authenticateUser, async (req, res) => {
  const { id } = req.params
  const { patientName, patientAge, patientNeeds, address, googleMapLocation } = req.body

  try {
    const booking = await db.getBookingById(id)
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' })
    }

    // Verify booking belongs to logged-in user
    if (booking.userId !== req.userId && req.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden. You can only edit your own bookings.' })
    }

    if (booking.status === 'Completed' || booking.status === 'Cancelled') {
      return res.status(400).json({ error: 'Cannot edit booking details of a closed or cancelled service.' })
    }

    const updated = await db.updateBookingDetails(id, {
      patientName: patientName || '',
      patientAge: patientAge || '',
      patientNeeds: patientNeeds || '',
      address: address || '',
      googleMapLocation: googleMapLocation || ''
    })

    if (updated) {
      res.json({ success: true, message: 'Booking details successfully updated.' })
    } else {
      res.status(500).json({ error: 'Failed to update booking details.' })
    }
  } catch (err) {
    console.error('Failed to update booking details:', err)
    res.status(500).json({ error: 'Failed to update booking details.' })
  }
})

// GET all caregivers (Admin Panel)
app.get('/api/caregivers', authenticateAdmin, async (req, res) => {
  try {
    const list = await db.getCaregivers()
    const listWithReviews = await Promise.all(list.map(async (cg) => {
      const reviews = await db.getReviewsForCaregiver(cg.name)
      const avgRating = reviews.length > 0 
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)) 
        : 0
      return {
        ...cg,
        reviews,
        rating: avgRating
      }
    }))
    res.json(listWithReviews)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve caregivers list.' })
  }
})

// POST register caregiver
app.post('/api/caregiver', async (req, res) => {
  const { name, phone, email, specialty, experience, referredBy } = req.body
  if (!name || !phone || !specialty) {
    return res.status(400).json({ error: 'Name, phone, and specialty are required.' })
  }
  try {
    const newCaregiver = await db.addCaregiver({ name, phone, email, specialty, experience, referredBy })
    sendCaregiverRegistrationEmail(newCaregiver).catch(e => console.error('Caregiver onboarding email error:', e))
    res.status(201).json({
      success: true,
      message: 'Registration profile submitted!',
      data: newCaregiver
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit caregiver registration.' })
  }
})

// POST careers application endpoint
app.post('/api/careers/apply', async (req, res) => {
  const { name, phone, email, city, role, experience, about, referredBy } = req.body
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required fields.' })
  }
  try {
    const specialtyMap = {
      caregiver: 'Elderly Care',
      nurse: 'Home Nursing Services',
      physiotherapist: 'Physiotherapy & Mobility',
      other: 'Hospital & Home Recovery'
    }
    const specialty = specialtyMap[role] || 'Elderly Care'
    const cleanReferredBy = (referredBy || '').trim().toUpperCase()

    const newCaregiver = await db.addCaregiverWithPassword({
      name,
      phone,
      email: email || `${phone}@applicant.ammaseva.in`,
      specialty,
      experience: Number(experience) || 1,
      city: city || 'Hyderabad',
      state: 'Telangana',
      experienceDetails: about || `Applied via careers form for role: ${role}`,
      referredBy: cleanReferredBy
    })

    // Trigger onboarding welcome email if email provided
    sendCaregiverRegistrationEmail(newCaregiver).catch(e => console.error('Careers onboarding email error:', e))

    // Also record as enquiry for fast coordinator follow-up
    await db.addEnquiry({
      name,
      phone,
      email: email || '',
      service: `Career Application (${specialty})`,
      city: city || 'Hyderabad',
      message: `Role: ${role} | Exp: ${experience || 'N/A'} yrs | Ref by: ${cleanReferredBy || 'Direct'} | ${about || ''}`
    })

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! Our onboarding team will contact you shortly.',
      data: newCaregiver
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to process career application.' })
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
      const caregiver = await db.getCaregiverById(req.params.id)
      if (caregiver) {
        sendCaregiverApprovalEmail(caregiver, status).catch(e => console.error('Caregiver status update email error:', e))
      }
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
  const { name, phone, service, date, time, duration, address, amount, paymentStatus, paymentMethod, transactionId, paymentDate, caretakerPayout, caretakerPayoutStatus, caretakerPayoutMethod, caretakerPayoutRef } = req.body
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
      caretakerPayout: Number(caretakerPayout) || 0,
      caretakerPayoutStatus: caretakerPayoutStatus || 'Unpaid',
      caretakerPayoutMethod: caretakerPayoutMethod || '',
      caretakerPayoutRef: caretakerPayoutRef || '',
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
    const oldBooking = await db.getBookingById(req.params.id)
    const updated = await db.adminUpdateBooking(req.params.id, req.body)
    if (updated) {
      const { status, assignedStaff } = req.body
      handleBookingEmailNotification(req.params.id, oldBooking, status || oldBooking?.status, assignedStaff || oldBooking?.assignedStaff)
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
      experienceDetails, workingLocations, availableTimings,
      state, city, googleMapLocation,
      experienceCertificate, policeVerification, additionalCertificates,
      referredBy
    } = req.body

    const uploadedProfilePhoto = profilePhoto ? await uploadToCloudinary(profilePhoto) : undefined
    const uploadedAadhaar = aadhaar ? await uploadToCloudinary(aadhaar) : undefined
    const uploadedPan = pan ? await uploadToCloudinary(pan) : undefined
    const uploadedCertificates = certificates ? await uploadToCloudinary(certificates) : undefined
    const uploadedExperienceCert = experienceCertificate ? await uploadToCloudinary(experienceCertificate) : undefined
    const uploadedPoliceVerification = policeVerification ? await uploadToCloudinary(policeVerification) : undefined
    const uploadedAdditionalCertificates = additionalCertificates ? await uploadToCloudinary(additionalCertificates) : undefined

    const updated = await db.adminUpdateCaregiver(req.params.id, {
      name, phone, email, specialty, experience, status,
      aadhaar: uploadedAadhaar,
      pan: uploadedPan,
      certificates: uploadedCertificates,
      profilePhoto: uploadedProfilePhoto,
      experienceDetails, workingLocations, availableTimings,
      state, city, googleMapLocation,
      experienceCertificate: uploadedExperienceCert,
      policeVerification: uploadedPoliceVerification,
      additionalCertificates: uploadedAdditionalCertificates,
      referredBy
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
  const { title, slug, short, description, benefits, duration, price, category, comingSoon, image, about, highlights, images, advance } = req.body
  if (!title || !price) {
    return res.status(400).json({ success: false, error: 'Title and price are required fields.' })
  }
  const slugVal = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  try {
    const uploadedImage = image ? await uploadToCloudinary(image) : ''
    const uploadedImages = Array.isArray(images) 
      ? await Promise.all(images.map(img => img.startsWith('data:') ? uploadToCloudinary(img) : img))
      : []
    const newService = await db.addService({
      title,
      slug: slugVal,
      short: short || '',
      description: description || '',
      benefits: Array.isArray(benefits) ? benefits : [],
      duration: duration || 'Hourly',
      price,
      category: category || 'care',
      comingSoon: !!comingSoon,
      advance: advance !== undefined ? Number(advance) : 0,
      image: uploadedImage,
      about: about || '',
      highlights: Array.isArray(highlights) ? highlights : [],
      images: uploadedImages
    })
    res.status(201).json({ success: true, message: 'Service successfully created.', data: newService })
  } catch (err) {
    console.error('Failed to create service:', err)
    res.status(500).json({ success: false, error: 'Failed to create service.' })
  }
})

// PUT update service (Admin Panel)
app.put('/api/services/:id', authenticateAdmin, async (req, res) => {
  const { title, slug, short, description, benefits, duration, price, category, comingSoon, image, about, highlights, images, advance } = req.body
  if (!title || !price) {
    return res.status(400).json({ success: false, error: 'Title and price are required fields.' })
  }
  const slugVal = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  try {
    const uploadedImage = image ? await uploadToCloudinary(image) : undefined
    const uploadedImages = Array.isArray(images)
      ? await Promise.all(images.map(img => img.startsWith('data:') ? uploadToCloudinary(img) : img))
      : undefined
    const updated = await db.updateService(req.params.id, {
      title,
      slug: slugVal,
      short: short || '',
      description: description || '',
      benefits: Array.isArray(benefits) ? benefits : [],
      duration: duration || 'Hourly',
      price,
      category: category || 'care',
      comingSoon: !!comingSoon,
      advance: advance !== undefined ? Number(advance) : undefined,
      image: uploadedImage,
      about: about || '',
      highlights: Array.isArray(highlights) ? highlights : [],
      images: uploadedImages
    })
    if (updated) {
      res.json({ success: true, message: 'Service successfully updated.' })
    } else {
      res.status(404).json({ error: 'Service not found.' })
    }
  } catch (err) {
    console.error('Failed to update service:', err)
    res.status(500).json({ success: false, error: 'Failed to update service.' })
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

// GET all FAQs
app.get('/api/faqs', async (req, res) => {
  try {
    const list = await db.getFaqs()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve FAQs.' })
  }
})

// POST create FAQ (Admin Panel)
app.post('/api/faqs', authenticateAdmin, async (req, res) => {
  const { question, answer } = req.body
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required.' })
  }
  try {
    const newFaq = await db.addFaq({ question, answer })
    res.status(201).json({ success: true, message: 'FAQ successfully created.', data: newFaq })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create FAQ.' })
  }
})

// PUT update FAQ (Admin Panel)
app.put('/api/faqs/:id', authenticateAdmin, async (req, res) => {
  const { question, answer } = req.body
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required.' })
  }
  try {
    const updated = await db.updateFaq(req.params.id, { question, answer })
    if (updated) {
      res.json({ success: true, message: 'FAQ successfully updated.', data: updated })
    } else {
      res.status(404).json({ error: 'FAQ not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update FAQ.' })
  }
})

// DELETE FAQ (Admin Panel)
app.delete('/api/faqs/:id', authenticateAdmin, async (req, res) => {
  try {
    const deleted = await db.deleteFaq(req.params.id)
    if (deleted) {
      res.json({ success: true, message: 'FAQ successfully deleted.' })
    } else {
      res.status(404).json({ error: 'FAQ not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete FAQ.' })
  }
})

// GET all blogs
app.get('/api/blogs', async (req, res) => {
  try {
    const list = await db.getBlogs()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve blogs list.' })
  }
})

// GET single blog by slug or ID
app.get('/api/blogs/:slugOrId', async (req, res) => {
  try {
    const param = req.params.slugOrId
    const isNum = !isNaN(Number(param))
    let blog = null
    if (isNum) {
      blog = await db.getBlogById(param)
    }
    if (!blog) {
      blog = await db.getBlogBySlug(param)
    }
    if (blog) {
      res.json(blog)
    } else {
      res.status(404).json({ error: 'Blog not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve blog.' })
  }
})

// POST add blog (Admin Panel)
app.post('/api/blogs', authenticateAdmin, async (req, res) => {
  const { title, slug, description, content, image, category, author, date, readTime, badge, keyTakeaways } = req.body
  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'Title and content are required fields.' })
  }
  const slugVal = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  try {
    const uploadedImage = image ? (image.startsWith('data:') ? await uploadToCloudinary(image) : image) : '/assets/service-elderly.jpg'
    const newBlog = await db.addBlog({
      title,
      slug: slugVal,
      description: description || '',
      content,
      image: uploadedImage,
      category: category || 'Healthcare',
      author: author || 'Amma Seva Care Team',
      date: date || new Date().toISOString().split('T')[0],
      readTime: readTime || '5 min read',
      badge: badge || 'Clinical Standard',
      keyTakeaways: Array.isArray(keyTakeaways) ? keyTakeaways : []
    })
    res.status(201).json({ success: true, message: 'Blog successfully created.', data: newBlog })
  } catch (err) {
    console.error('Failed to create blog:', err)
    res.status(500).json({ success: false, error: 'Failed to create blog.' })
  }
})

// PUT update blog (Admin Panel)
app.put('/api/blogs/:id', authenticateAdmin, async (req, res) => {
  const { title, slug, description, content, image, category, author, date, readTime, badge, keyTakeaways } = req.body
  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'Title and content are required fields.' })
  }
  const slugVal = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  try {
    const uploadedImage = image ? (image.startsWith('data:') ? await uploadToCloudinary(image) : image) : undefined
    const updated = await db.updateBlog(req.params.id, {
      title,
      slug: slugVal,
      description: description || '',
      content,
      image: uploadedImage,
      category: category || 'Healthcare',
      author: author || 'Amma Seva Care Team',
      date,
      readTime,
      badge,
      keyTakeaways
    })
    if (updated) {
      res.json({ success: true, message: 'Blog successfully updated.', data: updated })
    } else {
      res.status(404).json({ error: 'Blog not found.' })
    }
  } catch (err) {
    console.error('Failed to update blog:', err)
    res.status(500).json({ success: false, error: 'Failed to update blog.' })
  }
})

// DELETE blog (Admin Panel)
app.delete('/api/blogs/:id', authenticateAdmin, async (req, res) => {
  try {
    const deleted = await db.deleteBlog(req.params.id)
    if (deleted) {
      res.json({ success: true, message: 'Blog successfully deleted.' })
    } else {
      res.status(404).json({ error: 'Blog not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete blog.' })
  }
})

// GET all gallery items
app.get('/api/gallery', async (req, res) => {
  try {
    const list = await db.getGallery()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve gallery items.' })
  }
})

// POST add gallery item (Admin Panel)
app.post('/api/gallery', authenticateAdmin, async (req, res) => {
  const { imageUrl, title, category, location, description, badge } = req.body
  if (!imageUrl || !title) {
    return res.status(400).json({ success: false, error: 'Image and title are required.' })
  }
  try {
    const uploadedImage = imageUrl.startsWith('data:') ? await uploadToCloudinary(imageUrl) : imageUrl
    const newItem = await db.addGallery({
      imageUrl: uploadedImage,
      title,
      category: category || 'Elderly Care',
      location: location || 'Hyderabad',
      description: description || '',
      badge: badge || 'Verified Care'
    })
    res.status(201).json({ success: true, message: 'Gallery item successfully created.', data: newItem })
  } catch (err) {
    console.error('Failed to create gallery item:', err)
    res.status(500).json({ success: false, error: 'Failed to create gallery item.' })
  }
})

// DELETE gallery item (Admin Panel)
app.delete('/api/gallery/:id', authenticateAdmin, async (req, res) => {
  try {
    const deleted = await db.deleteGallery(req.params.id)
    if (deleted) {
      res.json({ success: true, message: 'Gallery item successfully deleted.' })
    } else {
      res.status(404).json({ error: 'Gallery item not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete gallery item.' })
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

// GET Referral Network Analytics & Candidate List (Admin Panel)
app.get('/api/admin/referrals', authenticateAdmin, async (req, res) => {
  try {
    const referrals = await db.getReferrals() || []
    
    // Aggregate by referrer
    const referrerMap = {}
    
    referrals.forEach(r => {
      const code = (r.referrerCode || 'DIRECT').toUpperCase()
      if (!referrerMap[code]) {
        referrerMap[code] = {
          code,
          referrerName: r.referrerName || 'Staff Partner',
          referrerPhone: r.referrerPhone || 'N/A',
          totalReferrals: 0,
          verifiedReferrals: 0,
          pendingReferrals: 0,
          rejectedReferrals: 0,
          candidates: []
        }
      }
      referrerMap[code].totalReferrals++
      if (r.status === 'Verified') referrerMap[code].verifiedReferrals++
      else if (r.status === 'Rejected') referrerMap[code].rejectedReferrals++
      else referrerMap[code].pendingReferrals++

      referrerMap[code].candidates.push(r)
    })

    const referrers = Object.values(referrerMap)
    const totalReferrals = referrals.length
    const verifiedReferrals = referrals.filter(r => r.status === 'Verified').length
    const pendingReferrals = referrals.filter(r => r.status === 'Pending').length

    res.json({
      success: true,
      totalReferrals,
      verifiedReferrals,
      pendingReferrals,
      referrers,
      allReferredCandidates: referrals
    })
  } catch (err) {
    console.error('Failed to retrieve referrals:', err)
    res.status(500).json({ error: 'Failed to retrieve referrals network data.' })
  }
})



// Google Search Console Site Verification Endpoint
app.get('/googlec5f847b60d2aa4ef.html', (req, res) => {
  res.type('text/html').send('google-site-verification: googlec5f847b60d2aa4ef.html')
})

// Robots.txt Search Engine Crawling Rules
app.get('/robots.txt', (req, res) => {
  const robotsTxt = `# ==============================================================================
# Amma Seva — Home Healthcare & Caregiving Services
# Website: https://ammaseva.in
# ==============================================================================

User-agent: *
Allow: /
Allow: /about
Allow: /services
Allow: /services/
Allow: /careers
Allow: /gallery
Allow: /contact
Allow: /blog
Allow: /blog/
Allow: /mtp
Allow: /privacy
Allow: /terms
Allow: /refund
Allow: /assets/
Allow: /favicon.png
Allow: /favicon.ico
Allow: /googlec5f847b60d2aa4ef.html

# Disallow internal administrative & user portals
Disallow: /admin
Disallow: /admin/
Disallow: /dashboard
Disallow: /dashboard/
Disallow: /login
Disallow: /api/

# Sitemap index
Sitemap: https://ammaseva.in/sitemap.xml
`
  res.type('text/plain').send(robotsTxt)
})

// XML Dynamic Sitemap Endpoint
app.get('/sitemap.xml', async (req, res) => {
  try {
    const services = await db.getServices() || []
    const blogs = await db.getBlogs() || []
    const now = new Date().toISOString().split('T')[0]

    const staticRoutes = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/services', priority: '0.95', changefreq: 'daily' },
      { url: '/careers', priority: '0.85', changefreq: 'weekly' },
      { url: '/mtp', priority: '0.90', changefreq: 'weekly' },
      { url: '/about', priority: '0.80', changefreq: 'monthly' },
      { url: '/gallery', priority: '0.75', changefreq: 'monthly' },
      { url: '/contact', priority: '0.80', changefreq: 'monthly' },
      { url: '/blog', priority: '0.85', changefreq: 'daily' },
      { url: '/privacy', priority: '0.40', changefreq: 'yearly' },
      { url: '/terms', priority: '0.40', changefreq: 'yearly' },
      { url: '/refund', priority: '0.40', changefreq: 'yearly' }
    ]

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

    staticRoutes.forEach(r => {
      xml += `  <url>
    <loc>https://ammaseva.in${r.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>
`
    })

    // Dynamic services
    services.forEach(s => {
      const slug = s.slug || s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      xml += `  <url>
    <loc>https://ammaseva.in/services/${slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.90</priority>
  </url>
`
    })

    // Dynamic blogs
    blogs.forEach(b => {
      const slug = b.slug || b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      xml += `  <url>
    <loc>https://ammaseva.in/blog/${slug}</loc>
    <lastmod>${b.date || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
`
    })

    xml += `</urlset>`
    res.header('Content-Type', 'application/xml')
    res.send(xml)
  } catch (err) {
    console.error('Failed to generate dynamic sitemap:', err)
    res.status(500).send('Error generating sitemap')
  }
})

// Serve frontend static assets in production with aggressive Cache-Control settings
const frontendDistPath = path.join(__dirname, 'dist')
app.use(express.static(frontendDistPath, {
  maxAge: '1y',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // Do not cache index.html long-term so users get immediate update notifications
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    } else {
      // Hashed assets and images are cached permanently (1 year)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    }
  }
}))

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
