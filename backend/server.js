import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import compression from 'compression'
import nodemailer from 'nodemailer'
import { db, isMTPService } from './db.js'
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
    console.warn('Cloudinary upload warning (using base64 fallback):', error.message)
    return base64Str
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

// Validation helpers
const isValidPhone = (phone) => {
  if (!phone) return false
  const clean = String(phone).replace(/\D/g, '')
  if (clean.length !== 10) return false
  if (!/^[6-9]\d{9}$/.test(clean)) return false
  if (/^(\d)\1{9}$/.test(clean)) return false
  if (clean === '1234567890' || clean === '9876543210' || clean === '0123456789' || clean === '1122334455') return false
  return true
}

const isValidName = (name) => {
  if (!name) return false
  const clean = String(name).trim()
  if (clean.length < 3 || clean.length > 60) return false
  if (!/^[a-zA-Z\s.'-]{3,60}$/.test(clean)) return false
  const letterCount = (clean.match(/[a-zA-Z]/g) || []).length
  if (letterCount < 3) return false
  if (/^([a-zA-Z])\1+$/.test(clean.replace(/\s+/g, ''))) return false
  return true
}

const COMMON_EMAIL_DOMAIN_TYPOS = {
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.cmo': 'gmail.com',
  'gmail.comm': 'gmail.com',
  'gmail.in': 'gmail.com',
  'gmail.co.in': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmaild.com': 'gmail.com',
  'gemail.com': 'gmail.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'ymail.co': 'ymail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'iclod.com': 'icloud.com',
  'icld.com': 'icloud.com',
  'icloud.co': 'icloud.com',
  'rediff.co': 'rediffmail.com',
  'rediff.com': 'rediffmail.com',
  'redif.com': 'rediffmail.com',
}

const INVALID_EMAIL_TLDS = new Set([
  'con', 'comm', 'cmo', 'cm', 'coo', 'ocm', 'vom', 'xom', 'cpm', 'col', 'coom', 'gmai', 'gma', 'gmil', 'c0m'
])

const levenshteinDistance = (a, b) => {
  const dp = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[a.length][b.length]
}

const POPULAR_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'rediffmail.com',
  'proton.me',
  'zoho.com'
]

const detectDomainTypo = (domain) => {
  if (!domain) return null
  const clean = String(domain).trim().toLowerCase()
  if (COMMON_EMAIL_DOMAIN_TYPOS[clean]) {
    return COMMON_EMAIL_DOMAIN_TYPOS[clean]
  }
  for (const pop of POPULAR_DOMAINS) {
    if (clean === pop) return null
    const dist = levenshteinDistance(clean, pop)
    if (dist <= 2) {
      return pop
    }
  }
  return null
}

const validateEmail = (email, required = false, label = 'Email address') => {
  if (!email || !String(email).trim()) {
    return required ? `Please enter ${label.toLowerCase()}.` : null
  }
  const clean = String(email).trim().toLowerCase()
  if (clean.length < 5 || clean.length > 254) {
    return `${label} must be between 5 and 254 characters.`
  }

  const atIndex = clean.indexOf('@')
  if (atIndex === -1 || atIndex !== clean.lastIndexOf('@')) {
    return `Please enter a valid ${label.toLowerCase()} containing a single '@'.`
  }

  const local = clean.slice(0, atIndex)
  const domain = clean.slice(atIndex + 1)

  if (!local || local.length > 64) {
    return `The username part of your ${label.toLowerCase()} is invalid.`
  }
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return `${label} username cannot start, end, or contain consecutive dots.`
  }
  if (!/^[a-z0-9._%+-]+$/.test(local)) {
    return `${label} username contains invalid characters.`
  }

  if (!domain || domain.length > 255) {
    return `${label} domain is invalid.`
  }
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..') || domain.startsWith('-') || domain.endsWith('-')) {
    return `${label} domain format is invalid.`
  }

  const domainParts = domain.split('.')
  if (domainParts.length < 2) {
    return `Please enter a valid ${label.toLowerCase()} ending with a domain (e.g. name@gmail.com).`
  }

  const tld = domainParts[domainParts.length - 1]
  if (!/^[a-z]{2,24}$/.test(tld)) {
    return `Email domain extension '.${tld}' is invalid.`
  }
  if (INVALID_EMAIL_TLDS.has(tld)) {
    return `Invalid domain extension '.${tld}'. Did you mean '.com'?`
  }

  const typoSuggestion = detectDomainTypo(domain)
  if (typoSuggestion) {
    return `Invalid domain '${domain}'. Did you mean '${local}@${typoSuggestion}'?`
  }

  const mainDomain = domainParts.slice(0, -1).join('.')
  if (mainDomain === 'gmail' && tld !== 'com') {
    return `Gmail addresses must end with '@gmail.com' (not '.${tld}').`
  }
  if (mainDomain === 'icloud' && tld !== 'com') {
    return `iCloud addresses must end with '@icloud.com' (not '.${tld}').`
  }

  if (
    clean.endsWith('@test.com') ||
    clean.endsWith('@example.com') ||
    clean.startsWith('test@') ||
    clean.startsWith('temp@') ||
    clean.startsWith('fake@') ||
    clean === 'abc@xyz.com' ||
    clean === 'admin@admin.com' ||
    clean === 'user@user.com'
  ) {
    return 'Please enter a real, active email address.'
  }

  return null
}

const isValidEmail = (email) => {
  return validateEmail(email, true) === null
}

const isValidAddress = (address) => {
  if (!address) return false
  const clean = String(address).trim()
  if (clean.length < 8 || clean.length > 250) return false
  const words = clean.split(/\s+/).filter(w => w.length > 0)
  if (words.length < 2) return false
  return true
}

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

    // 1. Caretaker / MTP assigned scenario
    const oldStaff = oldBooking ? oldBooking.assignedStaff : null
    if (newAssignedStaff && newAssignedStaff !== oldStaff) {
      let staffPerson = null
      if (booking.assignedStaffId) {
        staffPerson = await db.getCaregiverById(booking.assignedStaffId)
        if (!staffPerson) staffPerson = await db.getMTPById(booking.assignedStaffId)
      }
      if (!staffPerson) {
        staffPerson = await db.getCaregiverByName(newAssignedStaff)
      }
      let isMtp = false
      if (!staffPerson) {
        staffPerson = await db.getMTPByName(newAssignedStaff)
        if (staffPerson) isMtp = true
      } else if (booking.assignedStaffRole === 'mtp') {
        isMtp = true
      }
      const phoneStr = staffPerson ? staffPerson.phone : (booking.assignedStaffPhone || 'N/A')
      const specialtyStr = staffPerson ? (staffPerson.specialty || staffPerson.roles || (isMtp ? 'MTP Companion' : 'Caregiver')) : 'Caregiver / Companion'
      const staffTypeTitle = isMtp ? 'MTP Companion' : 'Caregiver'

      // Email to Customer
      if (email) {
        const mailOptions = {
          from: `"Amma Seva Bookings" <${process.env.SMTP_EMAIL || 'ammasevahomecare@gmail.com'}>`,
          to: email,
          subject: `${staffTypeTitle} Assigned - Booking ID #${bookingId} - Amma Seva`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
              <h2 style="color: #4f46e5; margin-bottom: 8px;">${staffTypeTitle} Assigned!</h2>
              <p style="color: #64748b; font-size: 14px;">Hi ${booking.name},</p>
              <p style="color: #64748b; font-size: 14px;">We have successfully matched and assigned a verified ${staffTypeTitle.toLowerCase()} to your request:</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 16px 0;">
                <h3 style="color: #0f172a; margin-top: 0; margin-bottom: 8px;">Assigned Staff Details</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
                  <tr><td style="padding: 4px 0; font-weight: bold;">Name:</td><td style="padding: 4px 0; text-align: right;">${newAssignedStaff}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Role / Specialty:</td><td style="padding: 4px 0; text-align: right;">${specialtyStr}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Phone:</td><td style="padding: 4px 0; text-align: right;"><a href="tel:${phoneStr}">${phoneStr}</a></td></tr>
                </table>
              </div>

              <p style="color: #64748b; font-size: 14px;">Your assigned professional will arrive on <strong>${booking.date}</strong> at <strong>${booking.time}</strong> as scheduled. You can view the live progress and vitals logs directly inside your customer dashboard.</p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">Thank you for choosing Amma Seva.</p>
            </div>
          `
        }
        await transporter.sendMail(mailOptions).catch(e => console.error('[Customer Assignment Email Error]:', e.message))
        console.log(`[Email Notification] Staff assigned email sent to customer ${email} for booking ID: ${bookingId}`)
      }

      // Email to assigned Staff Member (Caregiver / MTP)
      if (staffPerson && staffPerson.email && staffPerson.email.includes('@')) {
        const staffMailOptions = {
          from: `"Amma Seva Operations" <${process.env.SMTP_EMAIL || 'ammasevahomecare@gmail.com'}>`,
          to: staffPerson.email,
          subject: `📋 New Shift Assigned: ${booking.service} (Booking #${bookingId}) - Amma Seva`,
          html: `
            <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
              <h2 style="color: #0f172a; margin-bottom: 8px;">New Shift Assignment!</h2>
              <p style="color: #475569; font-size: 14px;">Hi ${staffPerson.name},</p>
              <p style="color: #475569; font-size: 14px;">You have been assigned to a new patient homecare shift by the administrator:</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 16px 0;">
                <h3 style="color: #0f172a; margin-top: 0; margin-bottom: 12px; font-size: 15px;">Duty &amp; Patient Details</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
                  <tr><td style="padding: 4px 0; font-weight: bold; width: 35%;">Service:</td><td style="padding: 4px 0;">${booking.service}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Date &amp; Time:</td><td style="padding: 4px 0;">${booking.date} at ${booking.time}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Duration:</td><td style="padding: 4px 0;">${booking.duration}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Patient Name:</td><td style="padding: 4px 0;">${booking.patientName || booking.name}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Patient Age:</td><td style="padding: 4px 0;">${booking.patientAge || 'N/A'}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Contact Phone:</td><td style="padding: 4px 0;"><a href="tel:${booking.phone}">${booking.phone}</a></td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Location Address:</td><td style="padding: 4px 0;">${booking.address}</td></tr>
                  ${booking.patientNeeds ? `<tr><td style="padding: 4px 0; font-weight: bold;">Patient Needs:</td><td style="padding: 4px 0;">${booking.patientNeeds}</td></tr>` : ''}
                </table>
              </div>

              <p style="color: #475569; font-size: 14px;">Please open your dashboard to view this shift and log patient vitals during your duty.</p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">Amma Seva Healthcare Operations Team</p>
            </div>
          `
        }
        await transporter.sendMail(staffMailOptions).catch(e => console.error('[Staff Assignment Email Error]:', e.message))
        console.log(`[Email Notification] Duty assignment alert sent to staff ${staffPerson.name} (${staffPerson.email}) for booking #${bookingId}`)
      }
    }

    // 2. Booking completed scenario (Deal Closed / Review request)
    const oldStatus = oldBooking ? oldBooking.status : null
    if (newStatus === 'Completed' && oldStatus !== 'Completed') {
      const appDashboardUrl = `${process.env.APP_URL || 'https://ammaseva.in'}/dashboard`
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

            <p style="color: #64748b; font-size: 14px;">Please open your <a href="${appDashboardUrl}" style="color: #4f46e5; text-decoration: underline; font-weight: bold;">Customer Dashboard</a> to rate the caregiver's performance and write a review. Your feedback helps us maintain the highest care standards.</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">We look forward to serving your family again. Thank you.</p>
          </div>
        `
      }
      await transporter.sendMail(mailOptions).catch(e => console.error('[Completion Email Error]:', e.message))
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

// 4. MTP (Multi Tasking Professional) Registration Welcome Email
const sendMTPRegistrationEmail = async (mtp) => {
  if (!mtp || !mtp.email || !mtp.email.includes('@') || mtp.email.includes('@applicant.ammaseva.in')) {
    return
  }
  const cleanEmail = mtp.email.trim()
  const name = mtp.name || 'Professional'
  const phone = mtp.phone || 'N/A'
  const id = mtp.id ? `MTP-${mtp.id}` : 'MTP-PENDING'
  const locality = mtp.locality || 'Hyderabad'
  const roles = Array.isArray(mtp.roles) ? mtp.roles.join(', ') : (mtp.roles || 'On-Demand Care & Mobility Services')
  const availability = mtp.availability || 'Flexible / On-Demand'

  const mailOptions = {
    from: `"Amma Seva MTP Network" <${cleanSmtpEmail}>`,
    to: cleanEmail,
    subject: `🎉 Registration Confirmed: Welcome to Amma Seva MTP Network (#${id})`,
    html: `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #091438 0%, #1e2a5a 50%, #091438 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #c9a24c;">
          <div style="display: inline-block; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 8px 18px; margin-bottom: 12px; border-radius: 30px;">
            <span style="color: #ffd700; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">✨ MTP Registration Confirmed</span>
          </div>
          <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Congratulations, ${name}!</h1>
          <p style="color: #cbd5e1; font-size: 13px; margin: 6px 0 0 0;">Welcome to Amma Seva Multi Tasking Professionals (MTP) Network</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 28px; color: #334155; line-height: 1.6;">
          <p style="font-size: 16px; font-weight: bold; color: #091438; margin-top: 0;">Dear ${name},</p>
          <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
            Thank you for registering as a <strong>Multi Tasking Professional (MTP)</strong> with <strong>Amma Seva</strong>. We have received your application and KYC verification documents.
          </p>

          <!-- Status Card -->
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #15803d; letter-spacing: 1px;">Application Status</div>
            <div style="font-size: 15px; font-weight: 800; color: #166534; margin-top: 2px;">
              ⏳ Document Verification in Progress (4–12 Hours)
            </div>
            <div style="font-size: 12px; color: #15803d; margin-top: 4px;">
              Our Hyderabad Care Coordination Desk is reviewing your submitted documents. Once verified, you will receive real-time gig and shift alerts directly on WhatsApp / Phone.
            </div>
          </div>

          <!-- Application Summary Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; margin-bottom: 24px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px;">
            <tr style="border-bottom: 1px solid #f1f5f9; background: #fafafa;">
              <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">MTP Reference ID</td>
              <td style="padding: 10px 14px; text-align: right; font-weight: bold; color: #1e2a5a; font-family: monospace;">#${id}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Applicant Name</td>
              <td style="padding: 10px 14px; text-align: right; font-weight: 600;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Registered Phone</td>
              <td style="padding: 10px 14px; text-align: right; font-weight: 600;">${phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Preferred Locality</td>
              <td style="padding: 10px 14px; text-align: right;">${locality}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Selected Tasks / Roles</td>
              <td style="padding: 10px 14px; text-align: right; color: #0284c7; font-weight: 600;">${roles}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-weight: bold; color: #64748b;">Availability</td>
              <td style="padding: 10px 14px; text-align: right;">${availability}</td>
            </tr>
          </table>

          <!-- Next Steps Box -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; text-align: left; margin-bottom: 24px;">
            <h3 style="color: #091438; font-size: 14px; margin: 0 0 8px 0; font-weight: 800;">📋 What Happens Next?</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #475569; line-height: 1.7;">
              <li><strong>Step 1:</strong> Our coordinator will verify your Aadhaar, PAN and Police Verification documents.</li>
              <li><strong>Step 2:</strong> You will receive a brief 10-minute telephonic orientation on standard patient safety protocols.</li>
              <li><strong>Step 3:</strong> You will start receiving local task alerts (hospital drops, medicine errands, elder walks) on WhatsApp.</li>
              <li><strong>Step 4:</strong> Payouts are transferred weekly directly to your bank/UPI account.</li>
            </ul>
          </div>

          <!-- WhatsApp Connect CTA -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="https://wa.me/919494516543?text=Hi%20Amma%20Seva%20Team,%20I%20registered%20as%20an%20MTP%20(${encodeURIComponent(name)}%20-%20${encodeURIComponent(phone)}).%20My%20Ref%20ID%20is%20${id}." style="display: inline-block; background-color: #25D366; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 13px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);">
              💬 Connect with Coordinator on WhatsApp →
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">
            Questions? Contact our 24/7 care desk at <a href="tel:+919494516543" style="color: #1e2a5a; font-weight: bold; text-decoration: none;">+91 94945 16543</a> or email <a href="mailto:ammasevahomecare@gmail.com" style="color: #1e2a5a; text-decoration: none;">ammasevahomecare@gmail.com</a>.
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
    console.log(`[MTP Onboarding Email] Sent registration confirmation email to ${cleanEmail}`)
  } catch (err) {
    console.error('Failed to send MTP registration email:', err.message)
  }
}

// 4b. Send Instant MTP Task Broadcast Alert to all Approved MTPs (Rapido-Style Dispatch)
const sendMTPBroadcastNotification = async (booking) => {
  try {
    const allMtps = await db.getMTPs()
    const approvedMtps = allMtps.filter(m => m.status === 'Verified' || m.status === 'Approved' || m.status === 'Active')
    if (approvedMtps.length === 0) {
      console.log(`[MTP Broadcast] No verified MTPs found in system to broadcast booking #${booking.id}.`)
      return
    }

    const serviceTitle = booking.service || 'MTP On-Demand Companion Task'
    const bookingDate = booking.date || 'Immediate'
    const bookingTime = booking.time || 'Immediate'
    const bookingLocation = booking.address || 'Hyderabad'
    const taskDetails = booking.patientNeeds || 'Assistance requested by client'
    const bookingAmount = booking.amount || 800

    const validEmails = approvedMtps
      .map(m => (m.email || '').trim().toLowerCase())
      .filter(e => e.includes('@') && !e.includes('@applicant.ammaseva.in'))

    console.log(`[MTP Gig Broadcast] Broadcasting open gig #${booking.id} (${serviceTitle}) to ${approvedMtps.length} MTPs (${validEmails.length} emails).`)

    if (validEmails.length > 0) {
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
          <div style="background: linear-gradient(135deg, #091438 0%, #1e2a5a 100%); padding: 32px 24px; text-align: center;">
            <span style="display: inline-block; background-color: rgba(255,215,0,0.2); color: #ffd700; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; padding: 6px 14px; border-radius: 999px; margin-bottom: 12px; border: 1px solid rgba(255,215,0,0.4);">
              ⚡ NEW GIG BROADCAST — LIVE DISPATCH RADAR
            </span>
            <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
              New MTP Companion Task Available!
            </h1>
            <p style="color: #cbd5e1; font-size: 13px; margin: 8px 0 0 0;">
              First-come, first-served! Review details below &amp; accept on your dashboard.
            </p>
          </div>

          <div style="padding: 28px 24px;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">🚗 Task / Service:</td>
                  <td style="padding: 8px 0; color: #091438; font-weight: 800; text-align: right;">${serviceTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">💰 Estimated Payout:</td>
                  <td style="padding: 8px 0; color: #059669; font-weight: 800; text-align: right; font-size: 16px;">₹${bookingAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📅 Date &amp; Time:</td>
                  <td style="padding: 8px 0; color: #091438; font-weight: 700; text-align: right;">${bookingDate} at ${bookingTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📍 Location / Locality:</td>
                  <td style="padding: 8px 0; color: #091438; font-weight: 700; text-align: right;">${bookingLocation}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📝 Needs / Errand:</td>
                  <td style="padding: 8px 0; color: #334155; font-weight: 600; text-align: right;">${taskDetails}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 28px 0 16px 0;">
              <a href="https://ammaseva.in/dashboard" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #091438; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 36px; border-radius: 14px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
                ⚡ Open Dashboard &amp; Accept Task Now
              </a>
            </div>

            <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 16px;">
              ⚡ First partner to accept locks the gig instantly. Once accepted, it disappears from other dashboards.
            </p>
          </div>
        </div>
      `

      const mailOptions = {
        from: `"Amma Seva MTP Dispatch" <${cleanSmtpEmail}>`,
        to: cleanSmtpEmail,
        bcc: validEmails,
        subject: `⚡ New MTP Task Available: ${serviceTitle} in ${bookingLocation} (Earn ₹${bookingAmount})`,
        html: emailHtml
      }
      await transporter.sendMail(mailOptions)
      console.log(`[MTP Gig Broadcast] Email alert dispatched successfully to ${validEmails.length} MTPs.`)
    }
  } catch (err) {
    console.error('[MTP Gig Broadcast Error]:', err.message)
  }
}

// 4c. Send Notification to Customer when an MTP accepts their task
const sendMTPClaimedNotificationToCustomer = async (booking, mtp) => {
  try {
    const customerEmail = (booking.email || '').trim().toLowerCase()
    const customerPhone = booking.phone || ''
    console.log(`[MTP Claimed Alert] Dispatching confirmation for Booking #${booking.id} to customer ${customerPhone} / ${customerEmail}`)

    if (customerEmail && customerEmail.includes('@')) {
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
          <div style="background: linear-gradient(135deg, #091438 0%, #1e2a5a 100%); padding: 32px 24px; text-align: center;">
            <span style="display: inline-block; background-color: rgba(37,211,102,0.2); color: #25d366; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; padding: 6px 14px; border-radius: 999px; margin-bottom: 12px; border: 1px solid rgba(37,211,102,0.4);">
              ✓ MTP COMPANION ASSIGNED &amp; CONFIRMED
            </span>
            <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0;">
              Your Companion has Accepted!
            </h1>
            <p style="color: #cbd5e1; font-size: 13px; margin: 8px 0 0 0;">
              Multi-Tasking Partner ${mtp.name} will attend to your request.
            </p>
          </div>

          <div style="padding: 28px 24px;">
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #166534; font-size: 15px; font-weight: 800; margin-top: 0; margin-bottom: 12px;">
                🚗 Assigned MTP Partner Profile
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #475569; font-weight: 600;">Companion Name:</td>
                  <td style="padding: 6px 0; color: #091438; font-weight: 800; text-align: right;">${mtp.name}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #475569; font-weight: 600;">Contact Phone:</td>
                  <td style="padding: 6px 0; color: #091438; font-weight: 800; text-align: right;">${mtp.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #475569; font-weight: 600;">Vehicle / Mobility:</td>
                  <td style="padding: 6px 0; color: #091438; font-weight: 700; text-align: right;">${mtp.vehicle || 'Available'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #475569; font-weight: 600;">Verification Status:</td>
                  <td style="padding: 6px 0; color: #166534; font-weight: 800; text-align: right;">✓ Background Verified</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; margin-bottom: 24px;">
              <h4 style="color: #334155; font-size: 13px; font-weight: 700; margin: 0 0 10px 0;">Booking Details:</h4>
              <p style="color: #475569; font-size: 13px; margin: 4px 0;"><strong>Service:</strong> ${booking.service}</p>
              <p style="color: #475569; font-size: 13px; margin: 4px 0;"><strong>Scheduled:</strong> ${booking.date} at ${booking.time}</p>
              <p style="color: #475569; font-size: 13px; margin: 4px 0;"><strong>Location:</strong> ${booking.address}</p>
            </div>

            <div style="text-align: center;">
              <a href="tel:${mtp.phone}" style="display: inline-block; background-color: #091438; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; margin-right: 8px;">
                📞 Call Companion
              </a>
              <a href="https://wa.me/91${String(mtp.phone).replace(/\D/g, '').slice(-10)}" style="display: inline-block; background-color: #25D366; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px;">
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      `

      await transporter.sendMail({
        from: `"Amma Seva Bookings" <${cleanSmtpEmail}>`,
        to: customerEmail,
        bcc: process.env.ADMIN_EMAIL || cleanSmtpEmail,
        subject: `🚗 Companion Confirmed! ${mtp.name} has accepted your request (#${booking.id})`,
        html: emailHtml
      })
    }
  } catch (err) {
    console.error('[Customer MTP Claimed Alert Error]:', err.message)
  }
}

// 4d. Send Alert to Admin when an MTP accepts a gig
const sendAdminMTPClaimedAlert = async (booking, mtp) => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || cleanSmtpEmail).trim()
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
        <h2 style="color: #091438; margin-top: 0;">⚡ MTP Task Claimed via Live Radar</h2>
        <p style="color: #475569; font-size: 14px;">MTP Partner <strong>${mtp.name}</strong> has just accepted Booking <strong>#${booking.id}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0;">
          <tr><td style="padding: 6px 0; color: #64748b;">MTP Name:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${mtp.name}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">MTP Phone:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${mtp.phone}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Service:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${booking.service}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Customer:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${booking.name} (${booking.phone})</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Accepted At:</td><td style="padding: 6px 0; font-weight: bold; text-align: right;">${new Date().toLocaleString('en-IN')}</td></tr>
        </table>
        <p style="color: #059669; font-size: 12px; font-weight: bold;">Status updated to Confirmed. Gig is locked and hidden from other MTPs.</p>
      </div>
    `
    await transporter.sendMail({
      from: `"Amma Seva Dispatch Desk" <${cleanSmtpEmail}>`,
      to: adminEmail,
      subject: `✅ MTP Accepted: ${mtp.name} claimed Booking #${booking.id} (${booking.service})`,
      html: emailHtml
    })
  } catch (err) {
    console.error('[Admin MTP Claimed Alert Error]:', err.message)
  }
}

// 5. Booking Confirmation & GST Tax Invoice Email with Direct Balance Payment Action
const sendBookingConfirmationAndTaxInvoiceEmail = async (booking, userEmail) => {
  if (!userEmail || !userEmail.includes('@')) return

  const cleanEmail = userEmail.trim()
  const bookingId = booking.id
  const name = booking.name || 'Valued Customer'
  const service = booking.service || 'Home Healthcare Service'
  const date = booking.date || ''
  const time = booking.time || ''
  const duration = booking.duration || '1 Day'
  const address = booking.address || 'Hyderabad, Telangana'
  const patientName = booking.patientName || name
  const patientAge = booking.patientAge ? `(${booking.patientAge} yrs)` : ''
  const patientNeeds = booking.patientNeeds || ''
  const totalAmount = Number(booking.amount) || 0
  const advancePaid = Number(booking.advancePaid) || 0
  const balanceAmount = Number(booking.balanceAmount) || Math.max(0, totalAmount - advancePaid)
  const paymentStatus = booking.paymentStatus || (advancePaid >= totalAmount ? 'Paid' : (advancePaid > 0 ? 'Advance Paid' : 'Unpaid'))

  // Calculate 18% GST breakdown
  const calculatedBase = booking.baseAmount !== undefined && booking.baseAmount !== null
    ? Number(booking.baseAmount)
    : Math.round(totalAmount / 1.18)
  const calculatedGst = booking.gstAmount !== undefined && booking.gstAmount !== null
    ? Number(booking.gstAmount)
    : (totalAmount - calculatedBase)
  const cgstAmount = Math.round(calculatedGst / 2)
  const sgstAmount = calculatedGst - cgstAmount

  const payBalanceUrl = `https://ammaseva.in/dashboard?payBookingId=${bookingId}`
  const dashboardUrl = `https://ammaseva.in/dashboard`

  const mailOptions = {
    from: `"Amma Seva Health Desk" <${cleanSmtpEmail}>`,
    to: cleanEmail,
    bcc: process.env.ADMIN_EMAIL || cleanSmtpEmail,
    subject: `Booking Confirmed & Tax Invoice #INV-${bookingId} - Amma Seva Home Healthcare`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #091438 0%, #1e2a5a 50%, #091438 100%); padding: 28px 24px; color: #ffffff; border-bottom: 3px solid #c9a24c;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffd700; letter-spacing: 0.5px;">AMMA SEVA</h1>
              <p style="margin: 4px 0 0; font-size: 11px; color: #cbd5e1;">Professional Home Healthcare &amp; Caregiving Network</p>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background-color: rgba(201, 162, 76, 0.25); border: 1px solid #c9a24c; color: #fef08a; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">
                GST Tax Invoice
              </span>
              <p style="margin: 4px 0 0; font-size: 11px; color: #94a3b8; font-family: monospace;">#INV-${bookingId}</p>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 28px 24px; color: #334155; line-height: 1.5;">
          <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 8px; margin-bottom: 12px;">
            ✓ Booking Confirmed &amp; Escrow Protected
          </div>
          <h2 style="color: #091438; font-size: 18px; margin: 4px 0 8px 0; font-weight: 800;">
            Dear ${name}, your care reservation is confirmed!
          </h2>
          <p style="color: #64748b; font-size: 13px; margin: 0 0 18px;">
            Thank you for booking with <strong>Amma Seva</strong>. Below is your complete shift reservation and GST tax invoice breakdown:
          </p>

          <!-- Shift Details Card -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              📋 Care Shift Reservation Summary
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #475569;">
              <tr><td style="padding: 4px 0; color: #64748b;">Service / Task:</td><td style="padding: 4px 0; text-align: right; font-weight: 700; color: #1e2a5a;">${service}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Shift Date &amp; Time:</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${date} at ${time}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Duration:</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${duration}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Patient:</td><td style="padding: 4px 0; text-align: right; font-weight: 600;">${patientName} ${patientAge}</td></tr>
              ${patientNeeds ? `<tr><td style="padding: 4px 0; color: #64748b;">Special Needs:</td><td style="padding: 4px 0; text-align: right; font-style: italic;">${patientNeeds}</td></tr>` : ''}
              <tr><td style="padding: 4px 0; color: #64748b;">Service Address:</td><td style="padding: 4px 0; text-align: right; font-style: italic;">${address}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748b;">Booking Status:</td><td style="padding: 4px 0; text-align: right;"><span style="color: #059669; font-weight: 700;">${booking.status || 'Confirmed'}</span></td></tr>
            </table>
          </div>

          <!-- Financial Breakdown Table -->
          <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin: 18px 0 8px;">
            💰 Itemized Price &amp; 18% GST Breakdown
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
            <tr style="background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-weight: 700; color: #091438;">Description</td>
              <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #091438;">Amount</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 14px;">Base Service Subtotal</td>
              <td style="padding: 8px 14px; text-align: right; font-weight: 600; font-family: monospace;">₹${calculatedBase.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px;">
              <td style="padding: 6px 14px;">CGST @ 9.0%</td>
              <td style="padding: 6px 14px; text-align: right; font-family: monospace;">₹${cgstAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px;">
              <td style="padding: 6px 14px;">SGST @ 9.0%</td>
              <td style="padding: 6px 14px; text-align: right; font-family: monospace;">₹${sgstAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #fffbeb; font-weight: 600; color: #92400e; font-size: 12px;">
              <td style="padding: 8px 14px;">Total 18% GST (CGST + SGST)</td>
              <td style="padding: 8px 14px; text-align: right; font-family: monospace;">+₹${calculatedGst.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background-color: #f8fafc; border-top: 2px solid #cbd5e1; font-weight: 800; font-size: 14px; color: #091438;">
              <td style="padding: 10px 14px;">Total Order Value (incl. 18% GST)</td>
              <td style="padding: 10px 14px; text-align: right; color: #1e2a5a; font-family: monospace; font-size: 15px;">₹${totalAmount.toLocaleString('en-IN')}</td>
            </tr>
            ${advancePaid > 0 ? `
            <tr style="background-color: #ecfdf5; color: #065f46; font-size: 12px; font-weight: 700; border-top: 1px solid #a7f3d0;">
              <td style="padding: 8px 14px;">✓ Advance Paid (Escrow Locked)</td>
              <td style="padding: 8px 14px; text-align: right; font-family: monospace;">-₹${advancePaid.toLocaleString('en-IN')}</td>
            </tr>` : ''}
            <tr style="background-color: ${balanceAmount > 0 ? '#fffbeb' : '#ecfdf5'}; color: ${balanceAmount > 0 ? '#78350f' : '#065f46'}; font-size: 13px; font-weight: 800; border-top: 1px solid ${balanceAmount > 0 ? '#fde68a' : '#a7f3d0'};">
              <td style="padding: 10px 14px;">Remaining Balance Due</td>
              <td style="padding: 10px 14px; text-align: right; font-family: monospace; font-size: 14px;">₹${balanceAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background-color: #fafafa; font-size: 11px; color: #64748b; border-top: 1px solid #f1f5f9;">
              <td style="padding: 6px 14px;">Payment Status</td>
              <td style="padding: 6px 14px; text-align: right; font-weight: 700; color: ${paymentStatus === 'Paid' ? '#059669' : '#d97706'};">${paymentStatus}</td>
            </tr>
          </table>

          <!-- Direct Pay Balance Action Section -->
          ${balanceAmount > 0 ? `
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1.5px solid #86efac; border-radius: 14px; padding: 22px 20px; text-align: center; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #166534; letter-spacing: 0.5px; margin-bottom: 4px;">
              💳 Settle Outstanding Balance
            </div>
            <p style="margin: 0 0 14px; font-size: 13px; color: #15803d; font-weight: 600;">
              You can instantly pay the remaining balance of <strong>₹${balanceAmount.toLocaleString('en-IN')}</strong> online anytime before or after your shift:
            </p>
            <a href="${payBalanceUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); letter-spacing: 0.3px;">
              👉 Pay Remaining Balance (₹${balanceAmount.toLocaleString('en-IN')}) Now →
            </a>
            <p style="margin: 10px 0 0; font-size: 11px; color: #166534;">
              100% Secure Checkout via UPI (GPay, PhonePe, Paytm), Debit/Credit Cards &amp; NetBanking
            </p>
          </div>
          ` : `
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px; text-align: center; margin-bottom: 20px; color: #065f46; font-size: 13px; font-weight: 700;">
            ✅ Payment Completed in Full! No remaining balance due.
          </div>
          `}

          <!-- Customer Dashboard Button -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #091438; color: #ffd700; font-size: 13px; font-weight: 800; text-decoration: none; padding: 12px 28px; border-radius: 10px; border: 1px solid #c9a24c;">
              📄 View Full Tax Invoice &amp; Track Caregiver in Dashboard →
            </a>
          </div>

          <!-- Escrow Guarantee Box -->
          <div style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 11px; color: #64748b; line-height: 1.5; margin-bottom: 20px;">
            🛡️ <strong>Amma Seva Escrow Protection:</strong> Advance funds are safely escrow-held until your care shift is fulfilled to complete satisfaction. Background-verified staff allocation begins immediately.
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
            <strong>LUXDHANA GLOBAL PRIVATE LIMITED</strong> • GSTIN: 36AAACL8921M1ZT<br />
            8-2-630/B/B/1, Mount Banjara complex, Road No. 12, Banjara Hills, Hyderabad - 500034, Telangana.<br />
            24/7 Helpline: <a href="tel:+919494516543" style="color: #1e2a5a; font-weight: bold; text-decoration: none;">+91 94945 16543</a> | <a href="mailto:ammasevahomecare@gmail.com" style="color: #1e2a5a; text-decoration: none;">ammasevahomecare@gmail.com</a>
          </div>
        </div>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`[Email Notification] Booking confirmation and tax invoice email sent to ${cleanEmail} (Booking #${bookingId})`)
  } catch (err) {
    console.error('Failed to send booking confirmation email:', err.message)
  }
}

// 6. Admin Notification Alert for New Booking
const sendAdminNewBookingNotificationEmail = async (booking) => {
  const adminEmail = (process.env.ADMIN_EMAIL || cleanSmtpEmail).trim()
  const totalAmount = Number(booking.amount) || 0
  const advancePaid = Number(booking.advancePaid) || 0
  const balanceAmount = Number(booking.balanceAmount) || Math.max(0, totalAmount - advancePaid)

  const mailOptions = {
    from: `"Amma Seva System Alert" <${cleanSmtpEmail}>`,
    to: adminEmail,
    subject: `🚨 New Booking Alert: #${booking.id} - ${booking.service} (Total ₹${totalAmount.toLocaleString('en-IN')})`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; color: #334155; background: #ffffff;">
        <div style="border-bottom: 2px solid #e11d48; padding-bottom: 12px; margin-bottom: 16px;">
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #e11d48; letter-spacing: 1px;">Admin Instant Alert</span>
          <h2 style="color: #091438; margin: 4px 0 0; font-size: 20px;">New Service Booking #${booking.id}</h2>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Customer Name:</td><td style="padding: 6px 0; text-align: right; font-weight: 700;">${booking.name}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Customer Phone:</td><td style="padding: 6px 0; text-align: right; font-weight: 700;"><a href="tel:${booking.phone}">${booking.phone}</a></td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Service:</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0284c7;">${booking.service}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Date &amp; Time:</td><td style="padding: 6px 0; text-align: right;">${booking.date} at ${booking.time}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Duration:</td><td style="padding: 6px 0; text-align: right;">${booking.duration}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Patient:</td><td style="padding: 6px 0; text-align: right;">${booking.patientName || booking.name} ${booking.patientAge ? `(${booking.patientAge} yrs)` : ''}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Address:</td><td style="padding: 6px 0; text-align: right; font-style: italic;">${booking.address}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Total Amount:</td><td style="padding: 6px 0; text-align: right; font-weight: 800; font-family: monospace;">₹${totalAmount.toLocaleString('en-IN')}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Advance Paid:</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #059669; font-family: monospace;">₹${advancePaid.toLocaleString('en-IN')}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Balance Due:</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #d97706; font-family: monospace;">₹${balanceAmount.toLocaleString('en-IN')}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Payment Status:</td><td style="padding: 6px 0; text-align: right; font-weight: 700;">${booking.paymentStatus} (${booking.paymentMethod || 'N/A'})</td></tr>
        </table>

        <div style="text-align: center; margin-top: 16px;">
          <a href="https://ammaseva.in/admin" style="display: inline-block; background-color: #091438; color: #ffd700; font-size: 13px; font-weight: 800; text-decoration: none; padding: 12px 24px; border-radius: 10px;">
            Open Admin Panel &amp; Assign Caregiver →
          </a>
        </div>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`[Admin Notification] New booking notification alert dispatched to ${adminEmail} for Booking #${booking.id}`)
  } catch (err) {
    console.error('Failed to send admin booking alert email:', err.message)
  }
}

// 7. Balance Payment Receipt & Final Settlement Confirmation Email
const sendBalancePaymentSettlementEmail = async (booking, userEmail, transactionId) => {
  if (!userEmail || !userEmail.includes('@')) return

  const cleanEmail = userEmail.trim()
  const bookingId = booking.id
  const name = booking.name || 'Valued Customer'
  const service = booking.service || 'Home Healthcare Service'
  const totalAmount = Number(booking.amount) || 0
  const advancePaid = Number(booking.advancePaid) || 0
  const balancePaidNow = totalAmount - advancePaid > 0 ? (totalAmount - advancePaid) : (Number(booking.balanceAmount) || 0)

  const dashboardUrl = `https://ammaseva.in/dashboard`

  const mailOptions = {
    from: `"Amma Seva Accounts Desk" <${cleanSmtpEmail}>`,
    to: cleanEmail,
    bcc: process.env.ADMIN_EMAIL || cleanSmtpEmail,
    subject: `✅ Balance Paid & Final Tax Invoice Receipt #INV-${bookingId} - Amma Seva`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #064e3b 100%); padding: 28px 24px; text-align: center; color: #ffffff; border-bottom: 3px solid #ffd700;">
          <div style="display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); padding: 6px 16px; margin-bottom: 10px; border-radius: 30px;">
            <span style="color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">✓ 100% Fully Settled</span>
          </div>
          <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 800;">Balance Payment Successful</h1>
          <p style="color: #a7f3d0; font-size: 12px; margin: 6px 0 0 0;">Tax Invoice #INV-${bookingId} is now Fully Paid</p>
        </div>

        <!-- Body -->
        <div style="padding: 28px 24px; color: #334155; line-height: 1.5;">
          <p style="font-size: 15px; font-weight: 700; color: #091438; margin-top: 0;">Dear ${name},</p>
          <p style="font-size: 13px; color: #475569; margin-bottom: 18px;">
            We have received your final balance payment of <strong>₹${balancePaidNow.toLocaleString('en-IN')}</strong> for <strong>${service}</strong>. Your account is 100% settled with zero outstanding balance.
          </p>

          <!-- Payment Details Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <tr style="background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-weight: 700; color: #091438;">Settlement Breakdown</td>
              <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #091438;">Amount</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 14px; color: #64748b;">Total Service Value (incl. GST):</td>
              <td style="padding: 8px 14px; text-align: right; font-weight: 700; font-family: monospace;">₹${totalAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 14px; color: #64748b;">Advance Paid Earlier:</td>
              <td style="padding: 8px 14px; text-align: right; font-weight: 600; color: #059669; font-family: monospace;">₹${advancePaid.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9; background-color: #ecfdf5;">
              <td style="padding: 8px 14px; font-weight: 700; color: #065f46;">Balance Paid Now:</td>
              <td style="padding: 8px 14px; text-align: right; font-weight: 800; color: #065f46; font-family: monospace;">₹${balancePaidNow.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background-color: #f0fdf4; border-top: 2px solid #86efac; font-weight: 800; color: #166534;">
              <td style="padding: 10px 14px;">Outstanding Balance Remaining:</td>
              <td style="padding: 10px 14px; text-align: right; font-family: monospace; font-size: 14px;">₹0.00 (Zero)</td>
            </tr>
            ${transactionId ? `
            <tr style="background-color: #fafafa; font-size: 11px; color: #64748b; border-top: 1px solid #f1f5f9;">
              <td style="padding: 6px 14px;">Payment Gateway Ref:</td>
              <td style="padding: 6px 14px; text-align: right; font-family: monospace;">${transactionId}</td>
            </tr>` : ''}
          </table>

          <!-- Button -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #091438; color: #ffd700; font-size: 13px; font-weight: 800; text-decoration: none; padding: 12px 28px; border-radius: 10px; border: 1px solid #c9a24c;">
              📄 View Full Settled Invoice on Dashboard →
            </a>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
            <strong>LUXDHANA GLOBAL PRIVATE LIMITED</strong> • GSTIN: 36AAACL8921M1ZT<br />
            8-2-630/B/B/1, Mount Banjara complex, Road No. 12, Banjara Hills, Hyderabad - 500034, Telangana.<br />
            24/7 Helpline: <a href="tel:+919494516543" style="color: #1e2a5a; font-weight: bold; text-decoration: none;">+91 94945 16543</a> | <a href="mailto:ammasevahomecare@gmail.com" style="color: #1e2a5a; text-decoration: none;">ammasevahomecare@gmail.com</a>
          </div>
        </div>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`[Balance Settlement Email] Final tax invoice receipt sent to ${cleanEmail} (Booking #${bookingId})`)
  } catch (err) {
    console.error('Failed to send balance payment settlement email:', err.message)
  }
}

const app = express()
app.use(compression())
const PORT = process.env.PORT || 5000

// Middleware Configuration
app.use(cors({
  origin: true, // Allow frontend Vite client during dev on any local port
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

// MSG91 Mobile SMS OTP Dispatcher (Dual Flow & OTP Multi-Delivery)
const sendMsg91SmsOtp = async (rawMobile, otp) => {
  if (!rawMobile) return false
  const cleanDigits = String(rawMobile).replace(/\D/g, '')
  const last10 = cleanDigits.slice(-10)
  if (last10.length !== 10 || !/^[6-9]\d{9}$/.test(last10)) {
    console.error(`[MSG91 SMS Error] Invalid Indian phone number (must start with 6, 7, 8, 9): ${rawMobile}`)
    return false
  }
  const formattedMobile = `91${last10}`
  const authKey = (process.env.MSG91_AUTH_KEY || '567130AQrTo6Hb6aba5f7cP1').trim()
  const templateId = (process.env.MSG91_TEMPLATE_ID || '6ab2184345370dac070a9500').trim()
  const senderId = (process.env.MSG91_SENDER_ID || 'AMMASV').trim()
  const otpVar = (process.env.MSG91_OTP_VAR_NAME || 'OTP').trim()

  let sent = false

  // 1. Dispatch via MSG91 Flow SMS Engine (Uses DLT Template ID & Sender ID)
  try {
    const flowResponse = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'authkey': authKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: templateId,
        sender: senderId,
        short_url: '0',
        recipients: [
          {
            mobiles: formattedMobile,
            [otpVar]: String(otp),
            otp: String(otp),
            OTP: String(otp),
            VAR1: String(otp),
            AMMASEVAOTP: String(otp)
          }
        ]
      })
    })
    const flowData = await flowResponse.json().catch(() => ({}))
    console.log(`[MSG91 Flow SMS] Dispatched to +${formattedMobile}:`, flowData)
    if (flowData.type === 'success' || flowResponse.ok) {
      sent = true
    }
  } catch (err) {
    console.error(`[MSG91 Flow Error] Failed to send SMS via flow to +${formattedMobile}:`, err.message)
  }

  // 2. Dispatch via MSG91 OTP v5 API Engine
  try {
    const otpUrl = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(templateId)}&mobile=${encodeURIComponent(formattedMobile)}&authkey=${encodeURIComponent(authKey)}&sender=${encodeURIComponent(senderId)}&${encodeURIComponent(otpVar)}=${encodeURIComponent(otp)}&otp=${encodeURIComponent(otp)}`
    const otpResponse = await fetch(otpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': authKey
      }
    })
    const otpData = await otpResponse.json().catch(() => ({}))
    console.log(`[MSG91 OTP API] Dispatched to +${formattedMobile}:`, otpData)
    if (otpData.type === 'success' || otpResponse.ok) {
      sent = true
    }
  } catch (err) {
    console.error(`[MSG91 OTP Error] Failed to send SMS via OTP endpoint to +${formattedMobile}:`, err.message)
  }

  return sent
}

// MSG91 WhatsApp Automated Booking Confirmation Dispatcher
const sendWhatsAppBookingConfirmation = async (booking) => {
  if (!booking) return false
  const authKey = (process.env.MSG91_AUTH_KEY || '567130AQrTo6Hb6aba5f7cP1').trim()
  const integratedNumber = (process.env.MSG91_WHATSAPP_NUMBER || '919494516543').trim()
  const templateName = (process.env.MSG91_WHATSAPP_TEMPLATE_NAME || 'ammaseva_booking_confirmation').trim()
  const namespace = (process.env.MSG91_WHATSAPP_NAMESPACE || '63c454df_9e23_4f4c_81d2_58201bb7012e').trim()

  const customerName = String(booking.name || booking.patientName || 'Valued Customer').trim()
  const bookingId = String(booking.id || 'N/A')
  const service = String(booking.service || 'Home Care Healthcare').trim()
  const scheduleDate = `${booking.date || 'Scheduled Date'}${booking.time ? ', ' + booking.time : ''}`
  const address = String(booking.address || 'Hyderabad, Telangana').trim()
  const totalAmount = String(booking.amount !== undefined ? booking.amount : '1200')
  const advancePaid = String(booking.advancePaid !== undefined ? booking.advancePaid : (booking.paymentMethod === 'razorpay' ? totalAmount : '0'))
  const balanceDue = String(booking.balanceAmount !== undefined ? booking.balanceAmount : (Math.max(0, Number(totalAmount) - Number(advancePaid))))

  const customerMobileRaw = String(booking.phone || '').replace(/\D/g, '').slice(-10)
  const adminMobileRaw = (process.env.ADMIN_PHONE || '9490587575').replace(/\D/g, '').slice(-10)

  const toList = []
  if (customerMobileRaw.length === 10) {
    toList.push(`91${customerMobileRaw}`)
  }
  if (adminMobileRaw.length === 10 && !toList.includes(`91${adminMobileRaw}`)) {
    toList.push(`91${adminMobileRaw}`)
  }

  if (toList.length === 0) return false

  const requestBody = {
    integrated_number: integratedNumber,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en",
          policy: "deterministic"
        },
        namespace: namespace,
        to_and_components: [
          {
            to: toList,
            components: {
              body_1: { type: "text", value: customerName },
              body_2: { type: "text", value: bookingId },
              body_3: { type: "text", value: service },
              body_4: { type: "text", value: scheduleDate },
              body_5: { type: "text", value: address },
              body_6: { type: "text", value: totalAmount },
              body_7: { type: "text", value: advancePaid },
              body_8: { type: "text", value: balanceDue }
            }
          }
        ]
      }
    }
  }

  try {
    const response = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
      method: 'POST',
      headers: {
        'authkey': authKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const resData = await response.json().catch(() => ({}))
    console.log(`[MSG91 Bulk WhatsApp Alert] Booking #${bookingId} dispatched to [${toList.join(', ')}]:`, resData)
    return resData
  } catch (err) {
    console.error(`[MSG91 Bulk WhatsApp Alert Error] Failed sending to [${toList.join(', ')}]:`, err.message)
    return false
  }
}

// Helper: Check if identifier matches Admin (email or mobile)
const isAdminIdentifier = (val) => {
  if (!val) return false
  const clean = String(val).toLowerCase().trim()
  if (clean === 'ammasevahomecare@gmail.com') return true
  const digits = clean.replace(/\D/g, '').slice(-10)
  const adminPhone = (process.env.ADMIN_PHONE || '9490587575').replace(/\D/g, '').slice(-10)
  return digits === adminPhone || digits === '9490587575'
}

// POST request admin OTP (supports email or mobile 94905 87575)
app.post('/api/admin/send-otp', async (req, res) => {
  const identifier = (req.body.identifier || req.body.email || req.body.phone || '').trim()

  if (!identifier) {
    return res.status(400).json({ success: false, error: 'Admin email or mobile number is required.' })
  }

  if (!isAdminIdentifier(identifier)) {
    return res.status(401).json({ success: false, error: 'Unauthorized administrative credentials.' })
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  // Expire in 10 minutes
  const expiresAt = Date.now() + 10 * 60 * 1000

  // Save OTP for all admin identifiers
  await db.saveOTP('ammasevahomecare@gmail.com', otp, 'admin', expiresAt)
  await db.saveOTP('9490587575', otp, 'admin', expiresAt)
  if (identifier !== 'ammasevahomecare@gmail.com' && identifier !== '9490587575') {
    await db.saveOTP(identifier.toLowerCase(), otp, 'admin', expiresAt)
  }

  // 1. Dispatch SMS OTP via MSG91 to Admin Phone (94905 87575)
  await sendMsg91SmsOtp('9490587575', otp)

  // 2. Dispatch Email OTP via Nodemailer
  const mailOptions = {
    from: `"Amma Seva Admin" <${process.env.SMTP_EMAIL || 'ammasevahomecare@gmail.com'}>`,
    to: 'ammasevahomecare@gmail.com',
    subject: 'Amma Seva - Admin Login Verification OTP Code',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Admin OTP Code</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 0;">Use the following One-Time Password to access your admin control center:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4f46e5; text-align: center; padding: 16px; margin: 24px 0; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
          ${otp}
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">This code is active for 10 minutes and can only be used once.</p>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`[OTP] Sent Admin OTP ${otp} to ammasevahomecare@gmail.com and +91 94905 87575`)
  } catch (err) {
    console.error('Failed to send Admin OTP email via SMTP:', err.message || err)
  }

  res.json({ 
    success: true, 
    message: 'Admin verification OTP sent to Mobile +91 94905 87575 & Email ammasevahomecare@gmail.com.' 
  })
})

// POST admin login (verifies OTP for email or mobile)
app.post('/api/admin/login', async (req, res) => {
  const identifier = (req.body.identifier || req.body.email || req.body.phone || '').trim()
  const { otp } = req.body

  if (!identifier || !otp) {
    return res.status(400).json({ success: false, error: 'Admin Email/Mobile and OTP code are required.' })
  }

  if (!isAdminIdentifier(identifier)) {
    return res.status(401).json({ success: false, error: 'Unauthorized administrative access.' })
  }

  const storedData = (await db.getOTP('ammasevahomecare@gmail.com')) || 
                     (await db.getOTP('9490587575')) || 
                     (await db.getOTP(identifier.toLowerCase()))

  if (!storedData) {
    return res.status(401).json({ success: false, error: 'No OTP requested. Please click Send Code first.' })
  }

  if (Date.now() > Number(storedData.expiresAt)) {
    await db.deleteOTP('ammasevahomecare@gmail.com')
    await db.deleteOTP('9490587575')
    return res.status(401).json({ success: false, error: 'OTP verification code has expired.' })
  }

  const isMatched = storedData.otp === otp.trim()
  if (!isMatched) {
    return res.status(401).json({ success: false, error: 'Invalid verification OTP code.' })
  }

  // Clear OTP on success
  await db.deleteOTP('ammasevahomecare@gmail.com')
  await db.deleteOTP('9490587575')
  if (identifier) await db.deleteOTP(identifier.toLowerCase())

  const token = jwt.sign({ role: 'admin', email: 'ammasevahomecare@gmail.com', phone: '9490587575' }, JWT_SECRET, { expiresIn: '7d' })
  res.json({
    success: true,
    message: 'Admin login successful!',
    token
  })
})

// POST send OTP for Registration (MTP, Caregiver, Customer/User)
app.post('/api/auth/send-registration-otp', async (req, res) => {
  const { phone, email, name, role = 'customer' } = req.body
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10)
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanName = (name || 'Valued User').trim()

  if (!cleanPhone || cleanPhone.length !== 10) {
    return res.status(400).json({ success: false, error: 'Valid 10-digit Indian mobile number is required.' })
  }
  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    return res.status(400).json({ success: false, error: 'Valid email address is required.' })
  }

  // Check if account already exists
  try {
    if (role === 'customer' || role === 'user') {
      const existingEmail = await db.getUserByEmail(cleanEmail)
      const existingPhone = await db.getUserByPhone(cleanPhone)
      if (existingEmail || existingPhone) {
        return res.status(409).json({ 
          success: false, 
          error: 'An account with this mobile number or email already exists. Please switch to Sign In (OTP) to access your dashboard.' 
        })
      }
    } else if (role === 'caretaker' || role === 'caregiver') {
      const existingEmail = cleanEmail ? await db.getCaregiverByEmail(cleanEmail) : null
      const existingPhone = await db.getCaregiverByPhone(cleanPhone)
      if (existingEmail || existingPhone) {
        return res.status(409).json({ 
          success: false, 
          error: 'A caregiver profile with this mobile number or email already exists. Please switch to Sign In (OTP).' 
        })
      }
    } else if (role === 'mtp') {
      const existingEmail = await db.getMTPByEmail(cleanEmail)
      const existingPhone = await db.getMTPByPhone(cleanPhone)
      if (existingEmail || existingPhone) {
        return res.status(409).json({ 
          success: false, 
          error: 'An MTP partner account with this mobile number or email already exists. Please switch to Sign In (OTP).' 
        })
      }
    }
  } catch (err) {
    console.error('Error checking existing user in send-registration-otp:', err)
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = Date.now() + 10 * 60 * 1000

  // Save in DB
  await db.saveOTP(cleanEmail, otp, role, expiresAt)
  await db.saveOTP(cleanPhone, otp, role, expiresAt)

  // Send SMS via MSG91
  let smsSent = await sendMsg91SmsOtp(cleanPhone, otp)

  const roleTitle = role === 'caretaker' || role === 'caregiver'
    ? 'Certified Caregiver'
    : role === 'mtp'
    ? 'MTP Multi Tasking Professional'
    : 'Patient & Family Account'

  // Send Email OTP
  let emailSent = false
  if (cleanEmail && cleanEmail.includes('@')) {
    const mailOptions = {
      from: `"Amma Seva Registration" <${cleanSmtpEmail}>`,
      to: cleanEmail,
      subject: `Amma Seva - ${roleTitle} Registration Verification Code`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #1e2a5a; margin: 0 0 4px 0; font-size: 20px; font-weight: 800;">AMMA SEVA HOMECARE</h2>
            <p style="color: #c9a24c; margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Account Verification</p>
          </div>
          <h3 style="color: #0b183b; margin-bottom: 8px; font-size: 16px;">Registration Verification Code</h3>
          <p style="color: #64748b; font-size: 14px; margin-top: 0; line-height: 1.5;">Hi <strong>${cleanName}</strong>, use the following One-Time Password (OTP) to verify your contact details and complete your ${roleTitle} registration:</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e2a5a; text-align: center; padding: 18px; margin: 20px 0; background-color: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
            ${otp}
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">This code is valid for 10 minutes. For your security, do not share this OTP with anyone.</p>
        </div>
      `
    }
    try {
      await transporter.sendMail(mailOptions)
      emailSent = true
    } catch (e) {
      console.error('[Registration OTP Email Error]:', e.message)
    }
  }

  const maskedPhone = `+91 ${cleanPhone.slice(0, 2)}*****${cleanPhone.slice(-3)}`
  res.json({
    success: true,
    message: `Verification code sent to ${maskedPhone} & ${cleanEmail}.`,
    smsSent,
    emailSent
  })
})

// POST unified send OTP (Supports Email OR Mobile Number)
app.post('/api/auth/send-otp', async (req, res) => {
  const rawInput = (req.body.identifier || req.body.email || req.body.phone || '').trim()

  if (!rawInput) {
    return res.status(400).json({ success: false, error: 'Mobile number or email address is required.' })
  }

  let role = null
  let targetEmail = ''
  let targetPhone = ''
  let targetName = ''

  // 1. Check if identifier is Admin
  if (isAdminIdentifier(rawInput)) {
    role = 'admin'
    targetEmail = 'ammasevahomecare@gmail.com'
    targetPhone = '9490587575'
    targetName = 'Administrator'
  } else {
    // 2. Check by Email or Phone in Caregiver, MTP, and User records
    const isEmailInput = rawInput.includes('@')
    const cleanPhoneDigits = rawInput.replace(/\D/g, '').slice(-10)

    let caretaker = null
    let mtp = null
    let user = null

    if (isEmailInput) {
      caretaker = await db.getCaregiverByEmail(rawInput)
      if (!caretaker) mtp = await db.getMTPByEmail(rawInput)
      if (!caretaker && !mtp) user = await db.getUserByEmail(rawInput)
    } else if (cleanPhoneDigits.length === 10) {
      caretaker = await db.getCaregiverByPhone(cleanPhoneDigits)
      if (!caretaker) mtp = await db.getMTPByPhone(cleanPhoneDigits)
      if (!caretaker && !mtp) user = await db.getUserByPhone(cleanPhoneDigits)
    } else {
      // Fallback try both
      caretaker = await db.getCaregiverByIdentifier(rawInput)
      if (!caretaker) mtp = await db.getMTPByIdentifier(rawInput)
      if (!caretaker && !mtp) user = await db.getUserByIdentifier(rawInput)
    }

    if (caretaker) {
      role = 'caretaker'
      targetEmail = caretaker.email && caretaker.email.includes('@') ? caretaker.email.trim() : ''
      targetPhone = caretaker.phone ? String(caretaker.phone).replace(/\D/g, '').slice(-10) : ''
      targetName = caretaker.name || 'Caregiver'
    } else if (mtp) {
      role = 'caretaker'
      targetEmail = mtp.email && mtp.email.includes('@') ? mtp.email.trim() : ''
      targetPhone = mtp.phone ? String(mtp.phone).replace(/\D/g, '').slice(-10) : ''
      targetName = mtp.name || 'MTP Professional'
    } else if (user) {
      role = 'customer'
      targetEmail = user.email && user.email.includes('@') ? user.email.trim() : ''
      targetPhone = user.phone ? String(user.phone).replace(/\D/g, '').slice(-10) : ''
      targetName = user.name || 'Customer'
    }
  }

  if (!role) {
    return res.status(404).json({ 
      success: false, 
      error: 'This mobile number / email is not registered yet. Please click the Register tab above to create your profile.' 
    })
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  // Expire in 10 minutes
  const expiresAt = Date.now() + 10 * 60 * 1000

  // Store OTP in database across all available keys (raw input, email, phone)
  await db.saveOTP(rawInput.toLowerCase(), otp, role, expiresAt)
  if (targetEmail) {
    await db.saveOTP(targetEmail.toLowerCase(), otp, role, expiresAt)
  }
  if (targetPhone) {
    await db.saveOTP(targetPhone, otp, role, expiresAt)
  }

  // Dispatch via MSG91 Mobile SMS if phone number available
  let smsSent = false
  if (targetPhone && targetPhone.length === 10) {
    smsSent = await sendMsg91SmsOtp(targetPhone, otp)
  }

  // Dispatch via Email if email address available
  let emailSent = false
  if (targetEmail && targetEmail.includes('@') && !targetEmail.includes('@applicant.ammaseva.in')) {
    const mailOptions = {
      from: `"Amma Seva Portal" <${cleanSmtpEmail}>`,
      to: targetEmail,
      subject: 'Amma Seva - Login Verification OTP Code',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
          <h2 style="color: #0f172a; margin-bottom: 8px;">Login Verification Code</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 0;">Hi ${targetName}, use the following One-Time Password to verify your identity and log in to your Amma Seva account:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4f46e5; text-align: center; padding: 16px; margin: 24px 0; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
            ${otp}
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This code is active for 10 minutes and can only be used once.</p>
        </div>
      `
    }
    try {
      await transporter.sendMail(mailOptions)
      emailSent = true
      console.log(`[OTP] Sent Email OTP ${otp} to ${targetEmail}`)
    } catch (err) {
      console.error('Failed to send OTP email via SMTP:', err.message || err)
    }
  }

  // Build user-friendly feedback message
  let displayDestination = ''
  if (targetPhone && targetEmail) {
    const maskedPhone = `+91 ${targetPhone.slice(0, 2)}*****${targetPhone.slice(-3)}`
    displayDestination = `SMS (${maskedPhone}) & Email (${targetEmail})`
  } else if (targetPhone) {
    displayDestination = `SMS (+91 ${targetPhone})`
  } else {
    displayDestination = `Email (${targetEmail})`
  }

  res.json({ 
    success: true, 
    message: `Verification code has been dispatched via ${displayDestination}.`,
    role,
    smsSent,
    emailSent
  })
})

// POST unified login verification (supports Mobile Number or Email)
app.post('/api/auth/login', async (req, res) => {
  const rawInput = (req.body.identifier || req.body.email || req.body.phone || '').trim()
  const { otp } = req.body

  if (!rawInput || !otp) {
    return res.status(400).json({ success: false, error: 'Mobile/Email and OTP code are required.' })
  }

  const cleanDigits = rawInput.replace(/\D/g, '').slice(-10)
  const normalizedEmail = rawInput.toLowerCase()

  // Retrieve stored OTP by checking raw input, email, or 10-digit phone
  let storedData = await db.getOTP(normalizedEmail)
  if (!storedData && cleanDigits.length === 10) {
    storedData = await db.getOTP(cleanDigits)
  }
  if (!storedData && isAdminIdentifier(rawInput)) {
    storedData = (await db.getOTP('ammasevahomecare@gmail.com')) || (await db.getOTP('9490587575'))
  }

  if (!storedData) {
    return res.status(401).json({ success: false, error: 'No OTP requested for this mobile/email. Please click Send Code first.' })
  }

  if (Date.now() > Number(storedData.expiresAt)) {
    await db.deleteOTP(normalizedEmail)
    if (cleanDigits) await db.deleteOTP(cleanDigits)
    return res.status(401).json({ success: false, error: 'OTP verification code has expired. Please request a new code.' })
  }

  const isMatched = storedData.otp === otp.trim()
  if (!isMatched) {
    return res.status(401).json({ success: false, error: 'Invalid verification OTP code.' })
  }

  // Determine user / caregiver / admin record
  let role = storedData ? storedData.role : null

  if (isAdminIdentifier(rawInput) || role === 'admin') {
    role = 'admin'
  } else if (!role || role === 'mtp' || role === 'caretaker') {
    if (await db.getCaregiverByIdentifier(rawInput)) role = 'caretaker'
    else if (await db.getMTPByIdentifier(rawInput)) role = 'caretaker'
    else if (cleanDigits && (await db.getMTPByPhone(cleanDigits))) role = 'caretaker'
    else if (await db.getUserByIdentifier(rawInput)) role = 'customer'
    else role = 'caretaker'
  }

  // Clear OTP on success
  await db.deleteOTP(normalizedEmail)
  if (cleanDigits) await db.deleteOTP(cleanDigits)
  if (role === 'admin') {
    await db.deleteOTP('ammasevahomecare@gmail.com')
    await db.deleteOTP('9490587575')
  }

  if (role === 'admin') {
    const token = jwt.sign({ role: 'admin', email: 'ammasevahomecare@gmail.com', phone: '9490587575' }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({
      success: true,
      role: 'admin',
      token
    })
  } else if (role === 'caretaker' || role === 'mtp') {
    let caretaker = (await db.getCaregiverByIdentifier(rawInput)) || (cleanDigits ? await db.getCaregiverByPhone(cleanDigits) : null)
    let isMtp = false
    let mtp = null
    if (!caretaker) {
      mtp = (await db.getMTPByIdentifier(rawInput)) || (cleanDigits ? await db.getMTPByPhone(cleanDigits) : null)
      if (mtp) isMtp = true
    }
    if (!caretaker && !mtp) {
      return res.status(404).json({ success: false, error: 'Caregiver / MTP account record not found.' })
    }

    if (isMtp && mtp) {
      const mtpStatus = String(mtp.status || 'Pending').trim()
      if (mtpStatus === 'Rejected') {
        return res.status(403).json({
          success: false,
          rejected: true,
          error: 'Your MTP application was reviewed and not approved by the administrator. Please contact Amma Seva support for further assistance.'
        })
      }
      if (mtpStatus === 'Pending' || mtpStatus === 'Contacted') {
        return res.status(403).json({
          success: false,
          pendingApproval: true,
          error: 'Your MTP application is currently under administrative verification. Once verified and approved by the admin team, you will receive an approval notification and will be able to log in.'
        })
      }

      const token = jwt.sign({ id: mtp.id, role: 'caretaker', isMtp: true, email: mtp.email, phone: mtp.phone }, JWT_SECRET, { expiresIn: '7d' })
      return res.json({
        success: true,
        role: 'caretaker',
        isMtp: true,
        token,
        caretaker: {
          id: mtp.id,
          name: mtp.name,
          email: mtp.email,
          phone: mtp.phone,
          status: mtp.status || 'Verified',
          isMtp: true,
          specialty: 'MTP Companion & Tasks',
          experience: mtp.experience || 'Fresher',
          experienceDetails: mtp.skillsSummary || mtp.roles || '',
          workingLocations: mtp.locality || 'Hyderabad',
          roles: mtp.roles,
          vehicle: mtp.vehicle,
          drivingLicense: mtp.drivingLicense,
          aadhaar: mtp.aadhaar,
          aadhaarDoc: mtp.aadhaarDoc,
          panDoc: mtp.panDoc,
          drivingLicenseDoc: mtp.drivingLicenseDoc,
          tenthCertificateDoc: mtp.tenthCertificateDoc,
          policeVerificationDoc: mtp.policeVerificationDoc,
          referCode: `MTP${String(mtp.phone || '').slice(-4)}`,
          uniqueId: `MTP${String(mtp.phone || '').slice(-4)}`
        }
      })
    }

    const caregiverStatus = String(caretaker.status || 'Pending').trim()
    if (caregiverStatus === 'Rejected') {
      return res.status(403).json({
        success: false,
        rejected: true,
        error: 'Your Caregiver application was reviewed and not approved by the administrator. Please contact Amma Seva support for further details.'
      })
    }
    if (caregiverStatus === 'Pending') {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        error: 'Your Caregiver registration is currently under administrative verification. Once approved by the admin team, you will receive an approval notification and can log in to access your shifts.'
      })
    }

    const token = jwt.sign({ id: caretaker.id, role: 'caretaker', isMtp: false, email: caretaker.email, phone: caretaker.phone }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({
      success: true,
      role: 'caretaker',
      isMtp: false,
      token,
      caretaker: { 
        id: caretaker.id, 
        name: caretaker.name, 
        email: caretaker.email, 
        phone: caretaker.phone,
        status: caretaker.status || 'Verified',
        isMtp: false,
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
    const user = (await db.getUserByIdentifier(rawInput)) || (cleanDigits ? await db.getUserByPhone(cleanDigits) : null)
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account record not found.' })
    }
    const token = jwt.sign({ id: user.id, role: 'user', email: user.email, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' })
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

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.id
    req.role = decoded.role
    req.isMtp = !!decoded.isMtp
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
    if (req.isMtp) {
      const mtp = await db.getMTPById(req.userId)
      if (!mtp) {
        return res.status(404).json({ error: 'MTP profile not found.' })
      }
      return res.json({ 
        success: true, 
        details: {
          id: mtp.id,
          name: mtp.name,
          email: mtp.email,
          phone: mtp.phone,
          status: mtp.status || 'Pending',
          isMtp: true,
          specialty: 'MTP Companion & Tasks',
          experience: mtp.experience || 'Fresher',
          experienceDetails: mtp.skillsSummary || mtp.roles || '',
          workingLocations: mtp.locality || 'Hyderabad',
          roles: mtp.roles,
          vehicle: mtp.vehicle,
          drivingLicense: mtp.drivingLicense,
          aadhaar: mtp.aadhaar,
          aadhaarDoc: mtp.aadhaarDoc,
          panDoc: mtp.panDoc,
          drivingLicenseDoc: mtp.drivingLicenseDoc,
          tenthCertificateDoc: mtp.tenthCertificateDoc,
          policeVerificationDoc: mtp.policeVerificationDoc,
          reviews: [],
          rating: 5.0
        }
      })
    }

    let caretaker = await db.getCaregiverById(req.userId)
    if (!caretaker) {
      const mtp = await db.getMTPById(req.userId)
      if (mtp) {
        return res.json({ 
          success: true, 
          details: {
            id: mtp.id,
            name: mtp.name,
            email: mtp.email,
            phone: mtp.phone,
            status: mtp.status || 'Pending',
            isMtp: true,
            specialty: 'MTP Companion & Tasks',
            experience: mtp.experience || 'Fresher',
            experienceDetails: mtp.skillsSummary || mtp.roles || '',
            workingLocations: mtp.locality || 'Hyderabad',
            roles: mtp.roles,
            vehicle: mtp.vehicle,
            drivingLicense: mtp.drivingLicense,
            aadhaar: mtp.aadhaar,
            aadhaarDoc: mtp.aadhaarDoc,
            panDoc: mtp.panDoc,
            drivingLicenseDoc: mtp.drivingLicenseDoc,
            tenthCertificateDoc: mtp.tenthCertificateDoc,
            policeVerificationDoc: mtp.policeVerificationDoc,
            reviews: [],
            rating: 5.0
          }
        })
      }
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

// GET all bookings assigned to current caretaker or MTP
app.get('/api/caretaker/bookings', authenticateUser, async (req, res) => {
  if (req.role !== 'caretaker' && req.role !== 'mtp') {
    return res.status(403).json({ error: 'Access forbidden. Caretaker or MTP only.' })
  }
  try {
    let person = null
    if (req.role === 'mtp' || req.isMtp) {
      person = await db.getMTPById(req.userId)
      if (!person && req.userEmail) {
        person = await db.getMTPByEmail(req.userEmail)
      }
    } else {
      person = await db.getCaregiverById(req.userId)
      if (!person) {
        person = await db.getMTPById(req.userId)
      }
    }
    if (!person) {
      return res.status(404).json({ error: 'Staff or MTP profile not found.' })
    }
    const list = await db.getBookingsByAssignedStaff(person.name, person.id)
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

// PUT update vitals and progress logs (Caretaker or MTP, for assigned shifts)
app.put('/api/booking/:id/vitals-log', authenticateUser, async (req, res) => {
  if (req.role !== 'caretaker' && req.role !== 'mtp') {
    return res.status(403).json({ error: 'Access forbidden. Caretaker or MTP profile only.' })
  }
  const { vitals, careLogs } = req.body
  try {
    const booking = await db.getBookingById(req.params.id)
    if (!booking) {
      return res.status(404).json({ error: 'Booking shift record not found.' })
    }
    
    let staffPerson = null
    if (req.role === 'mtp' || req.isMtp) {
      staffPerson = await db.getMTPById(req.userId)
      if (!staffPerson && req.userEmail) {
        staffPerson = await db.getMTPByEmail(req.userEmail)
      }
    } else {
      staffPerson = await db.getCaregiverById(req.userId)
      if (!staffPerson) {
        staffPerson = await db.getMTPById(req.userId)
      }
    }
    
    const assignedStaffName = (booking.assignedStaff || '').trim().toLowerCase()
    const currentStaffName = (staffPerson ? staffPerson.name : '').trim().toLowerCase()
    
    if (!staffPerson || !assignedStaffName || assignedStaffName !== currentStaffName) {
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
  const { name, email, phone, password, otp } = req.body
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required.' })
  }
  if (!isValidName(name)) {
    return res.status(400).json({ error: 'Please enter a valid full name (letters only, at least 3 characters).' })
  }
  const emailErr = validateEmail(email, true, 'Email address')
  if (emailErr) {
    return res.status(400).json({ error: emailErr })
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.' })
  }
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10)
  const cleanEmail = email.trim().toLowerCase()

  // Strict OTP Verification for Registration
  const inputOtp = String(otp || '').trim()
  if (!inputOtp) {
    return res.status(400).json({ error: 'Verification OTP code is required to complete registration.' })
  }

  const storedData = (await db.getOTP(cleanEmail)) || (await db.getOTP(cleanPhone))

  if (!storedData) {
    return res.status(401).json({ error: 'Verification code has expired or was not requested. Please request a new code.' })
  }
  if (Date.now() > Number(storedData.expiresAt)) {
    await db.deleteOTP(cleanEmail)
    await db.deleteOTP(cleanPhone)
    return res.status(401).json({ error: 'Verification code has expired. Please request a new code.' })
  }
  if (storedData.otp !== inputOtp) {
    return res.status(401).json({ error: 'Invalid verification OTP code. Please enter the 6-digit code received.' })
  }

  // Clear OTP on successful validation
  await db.deleteOTP(cleanEmail)
  await db.deleteOTP(cleanPhone)

  const regPassword = password || (Math.random().toString(36).slice(-8) + 'A1!')
  try {
    const existingUser = (await db.getUserByEmail(cleanEmail)) || (await db.getUserByPhone(cleanPhone))
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address or mobile number already exists.' })
    }
    const newUser = await db.addUser({ name: name.trim(), email: cleanEmail, phone: cleanPhone, password: regPassword })
    
    // Welcome email
    const mailOptions = {
      from: `"Amma Seva" <${process.env.SMTP_EMAIL || 'ammasevahomecare@gmail.com'}>`,
      to: cleanEmail,
      subject: 'Welcome to Amma Seva!',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
          <h2 style="color: #0f172a; margin-bottom: 8px;">Account Created!</h2>
          <p style="color: #64748b; font-size: 14px;">Hi ${name},</p>
          <p style="color: #64748b; font-size: 14px;">Welcome to Amma Seva! Your user account has been registered with email: <strong>${cleanEmail}</strong>.</p>
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
    referredBy, otp
  } = req.body

  if (!name || !phone || !specialty) {
    return res.status(400).json({ error: 'Name, phone, and specialty are required.' })
  }
  if (!isValidName(name)) {
    return res.status(400).json({ error: 'Please enter a valid full name (letters only, at least 3 characters).' })
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.' })
  }
  if (email && email.trim()) {
    const emailErr = validateEmail(email, false, 'Email address')
    if (emailErr) {
      return res.status(400).json({ error: emailErr })
    }
  }
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10)
  const cleanEmail = (email || '').trim().toLowerCase()

  // Strict OTP Verification for Caregiver Registration
  const inputOtp = String(otp || '').trim()
  if (!inputOtp) {
    return res.status(400).json({ error: 'Verification OTP code is required to complete registration.' })
  }

  const storedData = (cleanEmail ? await db.getOTP(cleanEmail) : null) || (await db.getOTP(cleanPhone))

  if (!storedData) {
    return res.status(401).json({ error: 'Verification code has expired or was not requested. Please request a new code.' })
  }
  if (Date.now() > Number(storedData.expiresAt)) {
    if (cleanEmail) await db.deleteOTP(cleanEmail)
    await db.deleteOTP(cleanPhone)
    return res.status(401).json({ error: 'Verification code has expired. Please request a new code.' })
  }
  if (storedData.otp !== inputOtp) {
    return res.status(401).json({ error: 'Invalid verification OTP code. Please enter the 6-digit code received.' })
  }

  // Clear OTP
  if (cleanEmail) await db.deleteOTP(cleanEmail)
  await db.deleteOTP(cleanPhone)

  try {
    if (cleanEmail) {
      const existing = await db.getCaregiverByEmail(cleanEmail)
      if (existing) {
        return res.status(409).json({ error: 'A caretaker profile with this email already exists.' })
      }
    }
    const existingPhone = await db.getCaregiverByPhone(cleanPhone)
    if (existingPhone) {
      return res.status(409).json({ error: 'A caretaker profile with this mobile number already exists.' })
    }

    const uploadedProfilePhoto = await uploadToCloudinary(profilePhoto)
    const uploadedAadhaar = await uploadToCloudinary(aadhaar)
    const uploadedPan = await uploadToCloudinary(pan)
    const uploadedCertificates = await uploadToCloudinary(certificates)
    const uploadedExperienceCert = await uploadToCloudinary(experienceCertificate)
    const uploadedPoliceVerification = await uploadToCloudinary(policeVerification)
    const uploadedAdditionalCertificates = await uploadToCloudinary(additionalCertificates)

    const newCaregiver = await db.addCaregiverWithPassword({ 
      name, phone: cleanPhone, email: cleanEmail, specialty, experience, 
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
    
    // Send professional onboarding confirmation email
    sendCaregiverRegistrationEmail(newCaregiver).catch(e => console.error('Onboarding email dispatch error:', e))

    res.status(201).json({
      success: true,
      pendingApproval: true,
      message: 'Caregiver application submitted successfully! Your application and KYC documents are under administrative verification. Once approved by the administrator, you will receive confirmation and can log in to view shifts.',
      caretaker: { id: newCaregiver.id, name: newCaregiver.name, status: 'Pending', referCode: newCaregiver.referCode, uniqueId: newCaregiver.uniqueId }
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

// GET current customer profile details
app.get('/api/user/profile', authenticateUser, async (req, res) => {
  if (req.role !== 'user' && req.role !== 'customer') {
    return res.status(403).json({ error: 'Access forbidden. Customer profile only.' })
  }
  try {
    const user = await db.getUserById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' })
    }
    const { password, ...safeUser } = user
    res.json({ success: true, user: safeUser })
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile details.' })
  }
})

// GET all bookings for current user
app.get('/api/user/bookings', authenticateUser, async (req, res) => {
  try {
    const user = await db.getUserById(req.userId)
    const list = await db.getBookingsByUserId(req.userId, user ? user.phone : null)
    const listWithStaffDetails = await Promise.all(list.map(async (booking) => {
      const review = await db.getReviewByBookingId(booking.id)
      let extendedBooking = {
        ...booking,
        isReviewed: !!review,
        review: review || null
      }
      if (booking.assignedStaff && booking.assignedStaff.trim() && booking.assignedStaff.trim().toLowerCase() !== 'unassigned') {
        const caregiver = await db.getCaregiverByName(booking.assignedStaff)
        if (caregiver) {
          extendedBooking.caregiverDetails = {
            name: caregiver.name,
            phone: caregiver.phone,
            email: caregiver.email,
            specialty: caregiver.specialty || 'Care Specialist',
            experience: caregiver.experience || 3,
            profilePhoto: caregiver.profilePhoto || '',
            experienceDetails: caregiver.experienceDetails || '',
            type: 'caregiver',
            uniqueId: caregiver.uniqueId || caregiver.referCode || ''
          }
        } else {
          const mtp = await db.getMTPByName(booking.assignedStaff)
          if (mtp) {
            extendedBooking.caregiverDetails = {
              name: mtp.name,
              phone: mtp.phone,
              email: mtp.email,
              specialty: mtp.roles || 'MTP Companion & Tasks',
              experience: mtp.experience || 1,
              profilePhoto: mtp.profilePhoto || '',
              experienceDetails: mtp.skillsSummary || mtp.roles || '',
              type: 'mtp',
              uniqueId: mtp.uniqueId || mtp.referCode || ''
            }
          } else {
            extendedBooking.caregiverDetails = {
              name: booking.assignedStaff,
              phone: 'Contact Admin',
              specialty: 'Assigned Healthcare Partner',
              experience: 3,
              profilePhoto: '',
              type: 'caregiver'
            }
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
    res.json(list || [])
  } catch (err) {
    console.error('[Admin Enquiries Fetch Error]', err)
    res.status(500).json({ error: 'Failed to retrieve enquiries list.' })
  }
})

// POST register enquiry (contact / service details / lead)
app.post('/api/enquiry', async (req, res) => {
  try {
    const { name, phone, email, date, service, city, message } = req.body

    // 1. Validate Name
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Please enter your full name (minimum 2 characters).' })
    }

    // 2. Validate Phone (Strict 10-digit Indian Mobile starting with 6, 7, 8, 9)
    const cleanPhone = String(phone || '').replace(/\D/g, '')
    const phone10 = cleanPhone.slice(-10)
    if (phone10.length !== 10 || !/^[6-9]\d{9}$/.test(phone10)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
      })
    }

    // 3. Validate Email if provided
    if (email && String(email).trim()) {
      const emailErr = validateEmail(email, false, 'Email address')
      if (emailErr) {
        return res.status(400).json({ success: false, error: emailErr })
      }
    }

    // 4. Validate Date (Cannot be before today & must have exactly 4-digit year)
    let validatedDate = ''
    if (date && String(date).trim() !== '') {
      const dateStr = String(date).trim().split('T')[0]
      const [yearStr] = dateStr.split('-')
      const yearNum = Number(yearStr)
      const now = new Date()
      const currentYear = now.getFullYear()

      if (!yearStr || !/^\d{4}$/.test(yearStr) || isNaN(yearNum) || yearNum < currentYear || yearNum > 2099) {
        return res.status(400).json({
          success: false,
          error: `Please provide a valid date with a 4-digit year (${currentYear} - 2099).`
        })
      }

      const todayStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      if (dateStr < todayStr) {
        return res.status(400).json({
          success: false,
          error: 'The expected start date cannot be before today. Please select today or a future date.'
        })
      }
      validatedDate = dateStr
    }

    const newEnquiry = await db.addEnquiry({
      name: String(name).trim(),
      phone: phone10,
      email: email ? String(email).trim() : '',
      date: validatedDate,
      service: service ? String(service).trim() : 'General Inquiry',
      city: city ? String(city).trim() : 'Hyderabad',
      message: message ? String(message).trim() : '',
      status: 'New',
      createdAt: new Date().toISOString()
    })

    console.log(`[Enquiry] Received enquiry from ${newEnquiry.name} (${newEnquiry.phone}) for ${newEnquiry.service} (Date: ${newEnquiry.date || 'Flexible'})`)

    res.json({
      success: true,
      message: 'Thank you! Our care coordinator will contact you shortly.',
      data: newEnquiry
    })
  } catch (err) {
    console.error('[Enquiry Handler Error]', err)
    res.status(500).json({ success: false, error: 'Failed to record enquiry. Please try again or call our helpline.' })
  }
})

// PUT update enquiry status (Admin Panel)
app.put('/api/enquiry/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const updated = await db.updateEnquiryStatus(id, status)
    if (updated) {
      res.json({ success: true, message: 'Enquiry status updated successfully.' })
    } else {
      res.status(404).json({ success: false, error: 'Enquiry record not found.' })
    }
  } catch (err) {
    console.error('[Enquiry Status Update Error]', err)
    res.status(500).json({ success: false, error: 'Failed to update enquiry status.' })
  }
})

// POST careers / caregiver onboarding application
app.post('/api/careers/apply', async (req, res) => {
  const { name, phone, email, city, role, experience, about, referredBy } = req.body

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone number are required.' })
  }
  if (!isValidName(name)) {
    return res.status(400).json({ error: 'Please enter a valid full name (letters only, at least 3 characters).' })
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.' })
  }
  if (email && String(email).trim()) {
    const emailErr = validateEmail(email, false, 'Email address')
    if (emailErr) {
      return res.status(400).json({ error: emailErr })
    }
  }

  const cleanPhone = String(phone).replace(/\D/g, '')

  try {
    const specialtyMap = {
      caregiver: 'Elderly Care',
      nurse: 'Home Nursing Services',
      physiotherapist: 'Physiotherapy & Mobility',
      other: 'Hospital & Home Recovery'
    }
    const specialty = specialtyMap[role] || 'Elderly Care'
    const cleanReferredBy = (referredBy || '').trim().toUpperCase()
    const cleanEmail = email && String(email).trim() ? String(email).trim().toLowerCase() : `${cleanPhone}@applicant.ammaseva.in`

    const newCaregiver = await db.addCaregiverWithPassword({
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      specialty,
      experience: Number(experience) || 1,
      city: city ? String(city).trim() : 'Hyderabad',
      state: 'Telangana',
      experienceDetails: about ? String(about).trim() : `Applied via careers form for role: ${role}`,
      referredBy: cleanReferredBy
    })

    // Trigger onboarding welcome email if real email provided
    if (email && String(email).trim()) {
      sendCaregiverRegistrationEmail(newCaregiver).catch(e => console.error('Careers onboarding email error:', e))
    }

    // Also record as enquiry for fast coordinator follow-up
    await db.addEnquiry({
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      service: `Career Application (${specialty})`,
      city: city ? String(city).trim() : 'Hyderabad',
      message: `Role: ${role} | Exp: ${experience || 'N/A'} yrs | Ref by: ${cleanReferredBy || 'Direct'} | ${about || ''}`
    })

    res.status(201).json({
      success: true,
      message: 'Careers application submitted successfully! Our onboarding team will contact you shortly.',
      data: newCaregiver
    })
  } catch (err) {
    console.error('Failed to submit career application:', err)
    res.status(500).json({ error: 'Failed to submit application. Please try again.' })
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
    otp = '',
    gender = '',
    age = '',
    state = 'Telangana',
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
    return res.status(400).json({ success: false, error: 'Full name and mobile number are required.' })
  }
  if (!isValidName(name)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid full name (letters only, at least 3 characters).' })
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.' })
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ success: false, error: 'A valid email address is required for MTP registration and status updates.' })
  }

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10)
  const cleanEmail = email.trim().toLowerCase()

  // Mandatory Mobile OTP code verification
  const inputOtp = String(otp || '').trim()
  if (!inputOtp) {
    return res.status(400).json({ success: false, error: 'Mobile OTP verification code is mandatory to complete MTP registration. Please verify your mobile number.' })
  }
  const storedData = (await db.getOTP(cleanPhone)) || (await db.getOTP(cleanEmail))
  if (!storedData) {
    return res.status(401).json({ success: false, error: 'Verification code expired or not requested. Please click Send Verification Code to receive OTP on your mobile.' })
  }
  if (Date.now() > Number(storedData.expiresAt)) {
    await db.deleteOTP(cleanPhone)
    await db.deleteOTP(cleanEmail)
    return res.status(401).json({ success: false, error: 'Verification code has expired. Please request a new code.' })
  }
  if (storedData.otp !== inputOtp) {
    return res.status(401).json({ success: false, error: 'Invalid verification OTP code. Please enter the 6-digit code received on your mobile.' })
  }
  // Clear OTP on successful validation
  await db.deleteOTP(cleanPhone)
  await db.deleteOTP(cleanEmail)

  // Check if phone or email already registered
  const existingByPhone = await db.getMTPByPhone(cleanPhone)
  if (existingByPhone) {
    return res.status(409).json({ 
      success: false, 
      error: `An MTP application with mobile +91 ${cleanPhone} already exists (Status: ${existingByPhone.status || 'Pending'}). Please wait for verification or contact admin.` 
    })
  }

  if (emergencyContact) {
    const cleanEC = String(emergencyContact).replace(/\D/g, '')
    if (cleanEC && !isValidPhone(cleanEC)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit emergency contact mobile number starting with 6, 7, 8, or 9.' })
    }
  }

  try {
    const uploadedAadhaar = await uploadToCloudinary(aadhaarDoc)
    const uploadedPan = await uploadToCloudinary(panDoc)
    const uploadedDrivingLicense = await uploadToCloudinary(drivingLicenseDoc)
    const uploadedTenthCert = await uploadToCloudinary(tenthCertificateDoc)
    const uploadedPoliceVerification = await uploadToCloudinary(policeVerificationDoc)

    const newMTP = await db.createMTP({
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      gender,
      age,
      state,
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
      policeVerificationDoc: uploadedPoliceVerification,
      status: 'Pending'
    })

    // Safely clear OTPs after successful insertion
    await db.deleteOTP(cleanEmail)
    await db.deleteOTP(cleanPhone)

    console.log(`[MTP Registration] New applicant registered: ${name} (${cleanPhone}) for roles: ${Array.isArray(roles) ? roles.join(', ') : roles}`)

    // Send confirmation email asynchronously
    if (newMTP && newMTP.email && newMTP.email.includes('@')) {
      sendMTPRegistrationEmail(newMTP).catch(err => console.error('[MTP Email Async Error]:', err.message))
    }

    const caretakerData = {
      id: newMTP.id,
      name: newMTP.name,
      email: newMTP.email,
      phone: newMTP.phone,
      status: 'Pending',
      isMtp: true,
      specialty: 'MTP Companion & Tasks',
      experience: newMTP.experience || 'Fresher',
      experienceDetails: newMTP.skillsSummary || (Array.isArray(newMTP.roles) ? newMTP.roles.join(', ') : newMTP.roles) || '',
      workingLocations: newMTP.locality || 'Hyderabad',
      state: newMTP.state || 'Telangana',
      city: newMTP.city || 'Hyderabad',
      roles: newMTP.roles,
      vehicle: newMTP.vehicle,
      drivingLicense: newMTP.drivingLicense,
      aadhaar: newMTP.aadhaar,
      aadhaarDoc: newMTP.aadhaarDoc,
      panDoc: newMTP.panDoc,
      drivingLicenseDoc: newMTP.drivingLicenseDoc,
      tenthCertificateDoc: newMTP.tenthCertificateDoc,
      policeVerificationDoc: newMTP.policeVerificationDoc,
      referCode: `MTP${String(newMTP.phone || '').slice(-4)}`,
      uniqueId: `MTP${String(newMTP.phone || '').slice(-4)}`
    }

    res.status(201).json({
      success: true,
      pendingApproval: true,
      message: 'MTP registration submitted successfully! Your application and documents are under administrative verification. Once approved by the administrator, you will receive an approval confirmation and can log in to view gigs.',
      caretaker: caretakerData,
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

// ==========================================
// RAPIDO-STYLE ON-DEMAND MTP GIG RADAR APIS
// ==========================================

// GET all open/available MTP gigs (for verified MTP Partners)
app.get('/api/mtp/available-gigs', authenticateUser, async (req, res) => {
  if (req.role !== 'caretaker' && req.role !== 'mtp') {
    return res.status(403).json({ error: 'Access forbidden. MTP profile only.' })
  }
  try {
    let mtp = null
    if (req.role === 'mtp' || req.isMtp) {
      mtp = await db.getMTPById(req.userId)
      if (!mtp && req.userEmail) mtp = await db.getMTPByEmail(req.userEmail)
    } else {
      mtp = await db.getMTPById(req.userId)
    }
    if (!mtp && !req.isMtp) {
      return res.status(403).json({ error: 'Only verified MTP companions can access the on-demand gig pool.' })
    }
    const gigs = await db.getAvailableMTPGigs()
    res.json(gigs)
  } catch (err) {
    console.error('Failed to get available MTP gigs:', err)
    res.status(500).json({ error: 'Failed to retrieve available gigs.' })
  }
})

// POST claim / accept an open MTP gig (atomic first-come, first-served lock)
app.post('/api/mtp/claim-gig/:id', authenticateUser, async (req, res) => {
  if (req.role !== 'caretaker' && req.role !== 'mtp') {
    return res.status(403).json({ error: 'Access forbidden. MTP profile only.' })
  }
  try {
    let mtp = null
    if (req.role === 'mtp' || req.isMtp) {
      mtp = await db.getMTPById(req.userId)
      if (!mtp && req.userEmail) mtp = await db.getMTPByEmail(req.userEmail)
    } else {
      mtp = await db.getMTPById(req.userId)
    }
    if (!mtp) {
      return res.status(404).json({ error: 'MTP profile not found.' })
    }

    const mtpStatus = String(mtp.status || 'Pending').trim()
    if (mtpStatus !== 'Verified' && mtpStatus !== 'Approved' && mtpStatus !== 'Active') {
      return res.status(403).json({ error: 'Your MTP profile must be verified by the admin team before accepting gigs.' })
    }

    const result = await db.claimMTPGig(req.params.id, mtp)
    if (!result.success) {
      if (result.reason === 'already_claimed') {
        return res.status(409).json({
          success: false,
          error: 'This task was already accepted by another companion just now!',
          claimedBy: result.claimedBy
        })
      }
      return res.status(400).json({ success: false, error: result.message || 'Unable to accept gig.' })
    }

    // Gig claimed successfully! Dispatch alerts to customer, admin and WhatsApp
    sendMTPClaimedNotificationToCustomer(result.booking, mtp).catch(err => console.error('[MTP Customer Alert Error]:', err.message))
    sendAdminMTPClaimedAlert(result.booking, mtp).catch(err => console.error('[MTP Admin Alert Error]:', err.message))
    sendWhatsAppBookingConfirmation(result.booking).catch(err => console.error('[WhatsApp MTP Alert Error]:', err.message))

    res.json({
      success: true,
      message: '🎉 Congratulations! You have successfully accepted and locked this task.',
      booking: result.booking
    })
  } catch (err) {
    console.error('Failed to claim MTP gig:', err)
    res.status(500).json({ error: 'Failed to accept gig.' })
  }
})

// POST release / re-open an MTP gig back to the public pool (Admin Panel)
app.post('/api/admin/release-mtp-gig/:id', authenticateAdmin, async (req, res) => {
  try {
    const result = await db.releaseMTPGig(req.params.id)
    if (!result.success) {
      return res.status(404).json({ error: result.message || 'Gig not found.' })
    }
    // Re-broadcast alert to all MTPs!
    sendMTPBroadcastNotification(result.booking).catch(err => console.error('[MTP Re-broadcast Error]:', err.message))
    res.json({
      success: true,
      message: 'Gig released successfully! It is now back in the available pool for all MTPs.',
      booking: result.booking
    })
  } catch (err) {
    console.error('Failed to release MTP gig:', err)
    res.status(500).json({ error: 'Failed to release gig.' })
  }
})

// POST re-broadcast an open MTP gig alert email to all MTPs (Admin Panel)
app.post('/api/admin/rebroadcast-mtp-gig/:id', authenticateAdmin, async (req, res) => {
  try {
    const booking = await db.getBookingById(req.params.id)
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' })
    }
    await sendMTPBroadcastNotification(booking)
    res.json({
      success: true,
      message: 'Broadcast notification successfully sent to all approved MTP partners!'
    })
  } catch (err) {
    console.error('Failed to rebroadcast MTP gig:', err)
    res.status(500).json({ error: 'Failed to send broadcast.' })
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
  
  if (client) {
    try {
      const options = {
        amount: Math.round(Number(amount) * 100), // convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      }
      const order = await client.orders.create(options)
      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: key_id,
        isSimulation: false
      })
    } catch (err) {
      console.warn('[Razorpay API Notice] Live order creation encountered an error:', err?.error?.description || err?.message || err)
    }
  }

  // Graceful simulation fallback for local development or when gateway credentials need refresh
  console.log('[Payment Simulation] Creating simulated payment order token for client checkout.')
  const simulatedOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  return res.json({
    success: true,
    orderId: simulatedOrderId,
    amount: Math.round(Number(amount) * 100),
    currency: 'INR',
    keyId: key_id || 'rzp_test_sim',
    isSimulation: true
  })
})

// POST create booking
app.post('/api/booking', async (req, res) => {
  const { 
    name, phone, service, date, time, duration, address, amount, userId, 
    baseAmount, gstAmount,
    patientName, patientAge, patientNeeds, paymentMethod, email, prescription, 
    googleMapLocation, razorpay_order_id, razorpay_payment_id, razorpay_signature,
    advancePaid = 0, balanceAmount = 0
  } = req.body

  // Parse authorization header if present
  let authUserId = userId
  let authUser = null
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      authUserId = decoded.id
    } catch (err) {
      // Ignore invalid token
    }
  }

  if (authUserId) {
    try {
      authUser = await db.getUserById(authUserId)
    } catch (e) {}
  }

  // If no authUser found by token/id, verify if the phone or email belongs to an existing registered user
  if (!authUser) {
    const rawP = String(phone || '').replace(/\D/g, '').slice(-10)
    const rawE = String(email || '').toLowerCase().trim()
    if (rawP.length === 10) {
      authUser = await db.getUserByPhone(rawP)
    }
    if (!authUser && rawE && rawE.includes('@')) {
      authUser = await db.getUserByEmail(rawE)
    }
    if (authUser) {
      authUserId = authUser.id
    }
  }

  if (!authUser && !authUserId) {
    return res.status(401).json({
      success: false,
      error: 'User registration is required before booking a service. Please register or sign in to continue.'
    })
  }

  const effectiveName = String(name || patientName || (authUser && authUser.name) || 'Valued Customer').trim()
  const effectivePhone = String(phone || (authUser && authUser.phone) || '').trim()
  const effectiveEmail = String(email || (authUser && authUser.email) || '').trim()
  const effectiveService = String(service || 'Home Healthcare Support').trim()
  const effectiveDate = String(date || new Date().toISOString().split('T')[0]).trim()
  const effectiveTime = String(time || '09:00 AM').trim()
  const effectiveDuration = String(duration || '1 Day').trim()
  const effectiveAddress = String(address || (authUser && authUser.address) || 'Hyderabad, Telangana').trim()

  if (paymentMethod === 'razorpay') {
    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing Razorpay payment parameters.' })
    }
    const isSimulated = String(razorpay_order_id).startsWith('order_sim_') || String(razorpay_payment_id).startsWith('pay_sim_')
    if (!isSimulated) {
      const { key_secret } = getRazorpayConfig()
      if (key_secret && razorpay_signature) {
        try {
          const generated_signature = crypto
            .createHmac('sha256', key_secret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex')
          if (generated_signature !== razorpay_signature) {
            console.warn('[Razorpay Signature Warning]', { generated_signature, razorpay_signature })
          }
        } catch (e) {
          console.error('[Signature Verification Error]', e)
        }
      }
    }
  }

  try {
    const uploadedPrescription = prescription ? await uploadToCloudinary(prescription) : ''

    const parsedAmount = typeof amount === 'number' ? amount : (amount !== undefined && amount !== '' ? Number(amount) : (paymentMethod === 'pay_on_service' ? 0 : 1200))
    const statusOfPayment = req.body.paymentStatus || (paymentMethod === 'razorpay' ? 'Advance Paid' : (paymentMethod === 'pay_on_service' ? 'Pay on Service' : 'Unpaid'))

    // Dynamic 18% GST Calculations
    const calculatedBase = baseAmount !== undefined && baseAmount !== null 
      ? Number(baseAmount) 
      : Math.round(parsedAmount / 1.18)
    const calculatedGst = gstAmount !== undefined && gstAmount !== null 
      ? Number(gstAmount) 
      : (parsedAmount - calculatedBase)
    const cgstAmount = Math.round(calculatedGst / 2)
    const sgstAmount = calculatedGst - cgstAmount

    const newBooking = await db.addBookingForUser({ 
      name: effectiveName, 
      phone: effectivePhone, 
      service: effectiveService, 
      date: effectiveDate, 
      time: effectiveTime, 
      duration: effectiveDuration, 
      address: effectiveAddress, 
      amount: parsedAmount, 
      baseAmount: calculatedBase,
      gstAmount: calculatedGst,
      userId: authUserId,
      patientName: patientName || effectiveName,
      patientAge: patientAge || '',
      patientNeeds: patientNeeds || '',
      prescription: uploadedPrescription,
      googleMapLocation: googleMapLocation || '',
      paymentStatus: statusOfPayment,
      paymentMethod: paymentMethod || 'pay_later',
      transactionId: razorpay_payment_id || '',
      paymentDate: paymentMethod === 'razorpay' ? new Date().toISOString() : '',
      advancePaid,
      balanceAmount,
      isMtp: req.body.isMtp
    })

    // Prepare notification logs and automated WhatsApp confirmation
    console.log(`[SMS/WhatsApp Notification] Booking confirmation alert triggered for ${effectivePhone} (Booking #${newBooking.id}).`)
    sendWhatsAppBookingConfirmation(newBooking).catch(err => console.error('[WhatsApp Async Dispatch Error]:', err.message))

    // Send automated email confirmation to customer & GST tax invoice with direct balance payment action
    if (effectiveEmail) {
      sendBookingConfirmationAndTaxInvoiceEmail(newBooking, effectiveEmail).catch(err => console.error('[Booking Email Async Error]:', err.message))
    }
    // Dispatch instant new booking alert to admin
    sendAdminNewBookingNotificationEmail(newBooking).catch(err => console.error('[Admin Booking Alert Error]:', err.message))

    // If MTP Task, trigger instant Rapido-style broadcast to all verified MTPs
    if (newBooking.isMtp === 1 || isMTPService(newBooking.service, newBooking.isMtp)) {
      sendMTPBroadcastNotification(newBooking).catch(err => console.error('[MTP Broadcast Async Error]:', err.message))
    }

    let userToken = null
    if (authUser) {
      userToken = jwt.sign({ id: authUser.id, role: 'user', email: authUser.email }, JWT_SECRET, { expiresIn: '7d' })
    }

    res.status(201).json({
      success: true,
      message: 'Booking successfully created!',
      data: newBooking,
      token: userToken,
      user: authUser ? { id: authUser.id, name: authUser.name, email: authUser.email, phone: authUser.phone } : undefined
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking.' })
  }
})

// POST pay booking balance
app.post('/api/booking/:id/pay-balance', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
  const { id } = req.params

  if (!razorpay_order_id || !razorpay_payment_id) {
    return res.status(400).json({ error: 'Missing Razorpay signature details.' })
  }

  const isSimulated = String(razorpay_order_id).startsWith('order_sim_') || String(razorpay_payment_id).startsWith('pay_sim_')
  if (!isSimulated) {
    const { key_secret } = getRazorpayConfig()
    if (key_secret && razorpay_signature) {
      try {
        const generated_signature = crypto
          .createHmac('sha256', key_secret)
          .update(razorpay_order_id + '|' + razorpay_payment_id)
          .digest('hex')

        if (generated_signature !== razorpay_signature) {
          console.warn('[Razorpay Balance Signature Mismatch Warning]', { generated_signature, razorpay_signature })
        }
      } catch (e) {}
    }
  }

  try {
    const updated = await db.payBookingBalance(id, 'razorpay', razorpay_payment_id)
    if (updated) {
      const settledBooking = await db.getBookingById(id)
      let userEmail = ''
      if (settledBooking && settledBooking.userId) {
        try {
          const u = await db.getUserById(settledBooking.userId)
          if (u && u.email) userEmail = u.email
        } catch (e) {}
      }
      if (!userEmail && settledBooking && settledBooking.email) {
        userEmail = settledBooking.email
      }
      if (userEmail && settledBooking) {
        sendBalancePaymentSettlementEmail(settledBooking, userEmail, razorpay_payment_id).catch(err => console.error('[Balance Email Error]:', err.message))
      }
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
  const { status, assignedStaff, paymentStatus, assignedStaffId, assignedStaffRole, assignedStaffPhone } = req.body
  try {
    const oldBooking = await db.getBookingById(req.params.id)
    const updated = await db.updateBooking(req.params.id, status, assignedStaff, paymentStatus, assignedStaffId, assignedStaffRole, assignedStaffPhone)
    if (updated) {
      const refreshedBooking = await db.getBookingById(req.params.id)
      handleBookingEmailNotification(req.params.id, oldBooking, status, assignedStaff)
      if (refreshedBooking && (status === 'Confirmed' || assignedStaff)) {
        sendWhatsAppBookingConfirmation(refreshedBooking).catch(err => console.error('[WhatsApp Status Update Error]:', err.message))
      }
      res.json({ success: true, message: 'Booking successfully updated.' })
    } else {
      res.status(404).json({ error: 'Booking not found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking.' })
  }
})

// POST test WhatsApp message dispatch
app.post('/api/admin/test-whatsapp', async (req, res) => {
  const testPhone = req.body.phone || '9490587575'
  const mockBooking = {
    id: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
    name: req.body.name || 'Test Customer',
    phone: testPhone,
    service: 'Elderly Home Care (12 Hours)',
    date: new Date().toLocaleDateString('en-IN'),
    time: '10:00 AM',
    address: 'Kukatpally, Hyderabad, Telangana',
    amount: 5000,
    advancePaid: 1000,
    balanceAmount: 4000
  }

  try {
    await sendWhatsAppBookingConfirmation(mockBooking)
    res.json({ success: true, message: `Test WhatsApp notification sent to ${testPhone} and Admin.` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
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

// DELETE user account completely from database (Admin Panel)
app.delete('/api/admin/user/:id', authenticateAdmin, async (req, res) => {
  const role = String(req.query.role || req.body?.role || 'user').toLowerCase()
  const id = req.params.id

  try {
    let deleted = false
    if (role === 'caregiver' || role === 'caretaker' || role === 'staff') {
      deleted = await db.deleteCaregiver(id)
    } else if (role === 'mtp' || role === 'partner') {
      deleted = await db.deleteMTP(id)
    } else {
      deleted = await db.deleteUser(id)
    }

    if (deleted) {
      console.log(`[Admin Account Deletion] ID ${id} (${role}) and all related records completely purged from database.`)
      res.json({ success: true, message: `Account (Role: ${role}) and all associated records permanently purged from database.` })
    } else {
      res.status(404).json({ success: false, error: 'User account not found in database.' })
    }
  } catch (err) {
    console.error('Failed to delete user account:', err)
    res.status(500).json({ success: false, error: 'Failed to delete user account from database.' })
  }
})

// POST create booking directly as admin (Admin Panel)
app.post('/api/admin/booking', authenticateAdmin, async (req, res) => {
  const { 
    name, phone, service, date, time, duration, address, amount, 
    status, assignedStaff, assignedStaffId, assignedStaffRole, assignedStaffPhone,
    paymentStatus, paymentMethod, transactionId, paymentDate, 
    caretakerPayout, caretakerPayoutStatus, caretakerPayoutMethod, caretakerPayoutRef,
    patientName, patientAge, patientNeeds, googleMapLocation
  } = req.body
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
      status: status || 'Pending',
      assignedStaff: assignedStaff || null,
      assignedStaffId: assignedStaffId || null,
      assignedStaffRole: assignedStaffRole || null,
      assignedStaffPhone: assignedStaffPhone || null,
      amount: Number(amount) || 1200,
      caretakerPayout: Number(caretakerPayout) || 0,
      caretakerPayoutStatus: caretakerPayoutStatus || 'Unpaid',
      caretakerPayoutMethod: caretakerPayoutMethod || '',
      caretakerPayoutRef: caretakerPayoutRef || '',
      paymentStatus: paymentStatus || 'Unpaid',
      paymentMethod: paymentMethod || '',
      transactionId: transactionId || '',
      paymentDate: paymentDate || '',
      patientName: patientName || '',
      patientAge: patientAge || '',
      patientNeeds: patientNeeds || '',
      googleMapLocation: googleMapLocation || '',
      isMtp: req.body.isMtp !== undefined ? req.body.isMtp : undefined
    })
    if (newBooking && newBooking.assignedStaff) {
      handleBookingEmailNotification(newBooking.id, null, newBooking.status, newBooking.assignedStaff)
    }
    if (newBooking && (newBooking.isMtp === 1 || isMTPService(newBooking.service, newBooking.isMtp)) && !newBooking.assignedStaff) {
      sendMTPBroadcastNotification(newBooking).catch(err => console.error('[Admin MTP Broadcast Error]:', err.message))
    }
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
// PUT /api/booking/:id/reschedule - Reschedule shift date & time
app.put('/api/booking/:id/reschedule', authenticateUser, async (req, res) => {
  const { id } = req.params
  const { date, time } = req.body

  if (!date || !time) {
    return res.status(400).json({ success: false, error: 'New date and time are required for rescheduling.' })
  }

  const dateStr = String(date).trim().split('T')[0]
  const todayStr = getTodayDateString()
  if (dateStr < todayStr) {
    return res.status(400).json({
      success: false,
      error: 'Reschedule date cannot be in the past. Please select today or a future date.'
    })
  }

  try {
    const booking = await db.getBookingById(id)
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found.' })
    }

    if (booking.userId !== req.userId && req.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized to reschedule this booking.' })
    }

    const updated = await db.updateBookingDetails(id, {
      date: dateStr,
      time: String(time).trim(),
      status: 'Rescheduled'
    })

    if (updated) {
      res.json({ success: true, message: 'Shift rescheduled successfully!' })
    } else {
      res.status(500).json({ success: false, error: 'Failed to reschedule shift.' })
    }
  } catch (err) {
    console.error('[Reschedule Error]', err)
    res.status(500).json({ success: false, error: 'Failed to reschedule shift.' })
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
