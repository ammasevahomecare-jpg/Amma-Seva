import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import os from 'os'
 
 // Resolve dirname
 const __filename = fileURLToPath(import.meta.url)
 const __dirname = path.dirname(__filename)
 
 const PERSISTENT_DB_PATH = process.env.DB_PATH || path.join(os.homedir(), '.ammaseva_db.json')
 const LEGACY_DB_PATH = path.join(__dirname, 'db.json')
 
 // Automatic migration of existing data on first startup
 if (!fs.existsSync(PERSISTENT_DB_PATH) && fs.existsSync(LEGACY_DB_PATH)) {
   try {
     fs.copyFileSync(LEGACY_DB_PATH, PERSISTENT_DB_PATH)
     console.log(`[Database Migration] Success: Migrated database to persistent location: ${PERSISTENT_DB_PATH}`)
   } catch (err) {
     console.error(`[Database Migration] Error: Failed to migrate database:`, err)
   }
 }
 
 const JSON_DB_PATH = PERSISTENT_DB_PATH

let pool = null
let useMySQL = false

// Initial default data structure
const DEFAULT_MOCK_DATA = {
  users: [],
  volunteers: [],
  donations: [],
  enquiries: [],
  bookings: [],
  caregivers: [],
  mtps: [],
  mtpTasks: [
    {
      id: 1,
      icon: "🚗",
      title: "Patient Hospital Dropping & Escort",
      description: "Accompany patients/seniors safely to doctors, diagnostics & therapy",
      shiftType: "Part-time / On-Demand",
      earningEstimate: "₹300 - ₹1,500 / task",
      active: true
    },
    {
      id: 2,
      icon: "💊",
      title: "Medicine Delivery & Urgent Errands",
      description: "Doorstep delivery of prescriptions, pharmacy runs & emergency supplies",
      shiftType: "Part-time / On-Demand",
      earningEstimate: "₹300 - ₹1,500 / task",
      active: true
    },
    {
      id: 3,
      icon: "👴",
      title: "Senior Walking & Companionship",
      description: "Morning/evening walks, conversations, reading & mobility support",
      shiftType: "Part-time / On-Demand",
      earningEstimate: "₹300 - ₹1,500 / task",
      active: true
    },
    {
      id: 4,
      icon: "🍼",
      title: "Mother & Baby Support Helper",
      description: "Part-time help for new moms with nursery, baby care & household tasks",
      shiftType: "Part-time / On-Demand",
      earningEstimate: "₹300 - ₹1,500 / task",
      active: true
    },
    {
      id: 5,
      icon: "🩺",
      title: "Bedside & Post-Surgery Attendant",
      description: "Hourly shift-based patient recovery & home assistance",
      shiftType: "Part-time / On-Demand",
      earningEstimate: "₹300 - ₹1,500 / task",
      active: true
    },
    {
      id: 6,
      icon: "⚡",
      title: "Emergency On-Demand Task Force",
      description: "Immediate 2-4 hour assistance calls in your local neighborhood",
      shiftType: "Part-time / On-Demand",
      earningEstimate: "₹300 - ₹1,500 / task",
      active: true
    }
  ],
  gallery: [],
  services: [
    {
      id: 1,
      slug: "elderly-care",
      title: "Elderly Care at Home",
      short: "Compassionate, respectful care for seniors in the comfort of home.",
      description: "Trained caregivers assist your elderly loved ones with daily activities, mobility, medication reminders, meals, and companionship — always with dignity and warmth.",
      benefits: ["Personal hygiene & grooming", "Medication reminders", "Meal preparation", "Mobility assistance", "Companionship"],
      duration: "Hourly, Daily, or Live-in",
      price: "Starting ₹500 / visit",
      category: "Elderly Care",
      comingSoon: false,
      image: "",
      about: "",
      highlights: [],
      images: []
    },
    {
      id: 2,
      slug: "mother-baby-care",
      title: "Mother & Baby Care",
      short: "Postnatal support for new mothers and their newborns.",
      description: "Experienced maternity attendants and nurses help new mothers with recovery, feeding guidance, baby bathing, and round-the-clock newborn care.",
      benefits: ["Postnatal recovery support", "Breastfeeding guidance", "Baby bathing & massage", "Sleep scheduling", "Emotional wellness"],
      duration: "Daily, Weekly, or Monthly",
      price: "Starting ₹18,000 / month",
      category: "Maternal",
      comingSoon: false,
      image: "",
      about: "",
      highlights: [],
      images: []
    },
    {
      id: 3,
      slug: "pregnancy-care",
      title: "Pregnancy Care",
      short: "Attentive prenatal support for expectant mothers at home.",
      description: "Qualified nurses provide antenatal check-ins, wellness monitoring, and comforting care throughout pregnancy — so you can rest, recover and prepare in peace.",
      benefits: ["Vitals monitoring", "Diet & nutrition guidance", "Wellness check-ins", "Mobility support", "Doctor coordination"],
      duration: "Hourly, Daily, or Monthly",
      price: "Starting ₹700 / visit",
      category: "Prenatal",
      comingSoon: false,
      image: "",
      about: "",
      highlights: [],
      images: []
    },
    {
      id: 4,
      slug: "newborn-baby-care",
      title: "Newborn Baby Care",
      short: "Specialist care for babies in their most delicate first weeks.",
      description: "Trained newborn caregivers handle feeding, sleep routines, bathing, and gentle massages so parents can rest while their little one is in expert hands.",
      benefits: ["Feeding & burping", "Bathing & massage", "Sleep routines", "Vaccination reminders", "Overnight care"],
      duration: "Daily, Weekly, or Monthly",
      price: "Starting ₹20,000 / month",
      category: "Pediatric",
      comingSoon: false,
      image: "",
      about: "",
      highlights: [],
      images: []
    },
    {
      id: 5,
      slug: "home-nursing",
      title: "Home Nursing Services",
      short: "Qualified nurses delivering hospital-grade care at home.",
      description: "Registered nurses provide wound care, IV therapy, catheter care, tracheostomy care, and general nursing tailored to your medical needs.",
      benefits: ["Wound dressing", "IV / injection therapy", "Catheter & tube care", "Vitals monitoring", "Doctor coordination"],
      duration: "Hourly, 12-hour, or 24-hour",
      price: "Starting ₹800 / visit",
      category: "Clinical",
      comingSoon: false,
      image: "",
      about: "",
      highlights: [],
      images: []
    },
    {
      id: 6,
      slug: "injection-services",
      title: "Injection Services",
      short: "Safe, sterile injections administered by trained nurses at home.",
      description: "On-demand injection service for insulin, antibiotics, vitamin shots, and prescribed medication — quick, hygienic, and pain-conscious.",
      benefits: ["Sterile procedure", "Trained nurses only", "Same-day availability", "Safe disposal", "Doctor prescription verified"],
      duration: "Per visit",
      price: "Starting ₹299 / visit",
      category: "Clinical",
      comingSoon: false,
      image: "",
      about: "",
      highlights: [],
      images: []
    },
    {
      id: 7,
      slug: "post-surgery-care",
      title: "Post-Surgery Care",
      short: "Guided recovery care after hospital discharge.",
      description: "Nurses and attendants support post-operative healing with wound care, medication schedules, mobility help, and gentle physical support.",
      benefits: ["Wound & suture care", "Pain management support", "Mobility assistance", "Diet planning", "Progress reporting"],
      duration: "Daily or 24-hour",
      price: "Starting ₹1,500 / day",
      category: "Recovery",
      comingSoon: false,
      image: "",
      about: "",
      highlights: [],
      images: []
    },
    {
      id: 8,
      slug: "patient-care-attendant",
      title: "Patient Care Attendant",
      short: "Dedicated attendants for personal and daily patient needs.",
      description: "Trained attendants assist with feeding, hygiene, positioning and companionship so families can focus on being together.",
      benefits: ["Feeding assistance", "Personal hygiene", "Turning & positioning", "Household support", "Emotional companionship"],
      duration: "12-hour or 24-hour",
      price: "Starting ₹900 / day",
      category: "Assistance",
      comingSoon: false,
      image: "",
      about: "",
      highlights: [],
      images: []
    },
    {
      id: 9,
      slug: "bedridden-patient-care",
      title: "Bedridden Patient Care",
      short: "Specialist care for patients confined to bed.",
      description: "Attendants and nurses trained in bedsore prevention, position changes, sponge baths, catheter care, and full daily support for bedridden patients.",
      benefits: ["Bedsore prevention", "Sponge bath & hygiene", "Position changes", "Diaper care", "Catheter care"],
      duration: "12-hour or 24-hour",
      price: "Starting ₹1,200 / day",
      category: "Specialized",
      comingSoon: false,
      image: "",
      about: "",
      highlights: [],
      images: []
    },
    {
      id: 10,
      slug: "icu-home-recovery",
      title: "ICU / Home Recovery Support",
      short: "ICU-level home support for critical recovery.",
      description: "Critical-care trained nurses handle ventilator monitoring, tracheostomy care, and intensive recovery routines under doctor guidance.",
      benefits: ["Critical-care nurses", "Ventilator monitoring", "Tracheostomy care", "24/7 vitals tracking", "Doctor coordination"],
      duration: "24-hour",
      price: "Starting ₹2,500 / day",
      category: "Intensive",
      comingSoon: false,
      image: "",
      about: "",
      highlights: [],
      images: []
    },
    {
      id: 11,
      slug: "physiotherapy",
      title: "Physiotherapy",
      short: "Home physiotherapy sessions for recovery and mobility.",
      description: "Professional physiotherapists visit your home for orthopaedic, neurological and post-surgery rehabilitation programs.",
      benefits: ["Custom rehab plans", "Orthopaedic care", "Neuro rehab", "Post-surgery recovery", "Progress reviews"],
      duration: "Per session",
      price: "Coming Soon",
      category: "Therapy",
      comingSoon: true,
      image: "",
      about: "",
      highlights: [],
      images: []
    },
    {
      id: 12,
      slug: "doctor-consultation",
      title: "Doctor Consultation",
      short: "Home visit and online consultations with trusted doctors.",
      description: "Consult experienced general physicians and specialists from the comfort of your home — with follow-ups and prescriptions.",
      benefits: ["Home visits", "Online consults", "Follow-ups", "e-Prescriptions", "Specialist referrals"],
      duration: "Per consultation",
      price: "Coming Soon",
      category: "Medical",
      comingSoon: true,
      image: "",
      about: "",
      highlights: [],
      images: []
    }
  ],
  notifications: [],
  reviews: [],
  announcements: [],
  blogs: [],
  faqs: [
    { id: 1, question: "Are your caregivers and nurses verified?", answer: "Yes. Every professional undergoes ID verification, background checks, and skill assessments before joining." },
    { id: 2, question: "How quickly can care be arranged?", answer: "In most cities, we can arrange care within 4–12 hours depending on the service and shift." },
    { id: 3, question: "Can I choose the shift duration?", answer: "Absolutely. We offer hourly visits, 12-hour and 24-hour shifts, plus weekly and monthly plans." },
    { id: 4, question: "How do payments work?", answer: "You can pay online via Razorpay. Shift booking is confirmed immediately after secure payment." },
    { id: 5, question: "What if I need to reschedule or cancel?", answer: "You can reschedule anytime via your dashboard panel. Cancellations follow our refund policy." }
  ]
}

// Initialize JSON database with default template
const initJSONDb = () => {
  if (!fs.existsSync(JSON_DB_PATH)) {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(DEFAULT_MOCK_DATA, null, 2))
  } else {
    try {
      const data = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'))
      let modified = false
      if (!data.users) { data.users = DEFAULT_MOCK_DATA.users; modified = true }
      if (!data.enquiries) { data.enquiries = DEFAULT_MOCK_DATA.enquiries; modified = true }
      if (!data.bookings) { data.bookings = DEFAULT_MOCK_DATA.bookings; modified = true }
      if (!data.caregivers) { data.caregivers = DEFAULT_MOCK_DATA.caregivers; modified = true }
      if (!data.services || data.services.length === 0) { data.services = DEFAULT_MOCK_DATA.services; modified = true }
      if (data.services) {
        data.services.forEach(s => {
          if (s.advance === undefined) {
            const priceVal = Number(String(s.price).replace(/[^0-9]/g, '')) || 500
            s.advance = Math.round(priceVal * 0.2)
            modified = true
          }
        })
      }
      if (!data.notifications) { data.notifications = DEFAULT_MOCK_DATA.notifications; modified = true }
      if (!data.reviews) { data.reviews = []; modified = true }
      if (!data.announcements) { data.announcements = []; modified = true }
      if (!data.mtps) { data.mtps = []; modified = true }
      if (!data.mtpTasks || data.mtpTasks.length === 0) { data.mtpTasks = DEFAULT_MOCK_DATA.mtpTasks; modified = true }
      if (!data.blogs || data.blogs.length === 0) { data.blogs = DEFAULT_MOCK_DATA.blogs; modified = true }
      if (!data.faqs || data.faqs.length === 0) { data.faqs = DEFAULT_MOCK_DATA.faqs; modified = true }
      if (modified) {
        fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2))
      }
    } catch (e) {
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(DEFAULT_MOCK_DATA, null, 2))
    }
  }
}

// Read JSON database file
const readJSONDb = async () => {
  initJSONDb()
  const data = await fs.promises.readFile(JSON_DB_PATH, 'utf-8')
  return JSON.parse(data)
}

// Write JSON database file
const writeJSONDb = async (data) => {
  await fs.promises.writeFile(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export const db = {
  // Initialize Database
  init: async () => {
    const host = process.env.DB_HOST
    const user = process.env.DB_USER
    const password = process.env.DB_PASSWORD
    const database = process.env.DB_NAME

    if (host && user && database) {
      console.log(`🔌 Detected MySQL environment variables. Initializing MySQL pool connection...`)
      try {
        pool = mysql.createPool({
          host,
          user,
          password,
          database,
          port: process.env.DB_PORT || 3306,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        })

        // Verify connection & create tables
        const connection = await pool.getConnection()
        console.log(`✅ MySQL connected. Ensuring tables exist...`)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS volunteers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            registeredAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS donations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            amount DECIMAL(10,2) NOT NULL,
            donatedAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS enquiries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            email VARCHAR(255),
            service VARCHAR(255),
            city VARCHAR(255),
            message TEXT,
            submittedAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            service VARCHAR(255) NOT NULL,
            date VARCHAR(50) NOT NULL,
            time VARCHAR(50) NOT NULL,
            duration VARCHAR(50) NOT NULL,
            address TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            assignedStaff VARCHAR(255),
            amount DECIMAL(10,2) DEFAULT 0,
            paymentStatus VARCHAR(50) DEFAULT 'Unpaid',
            paymentMethod VARCHAR(100),
            transactionId VARCHAR(255),
            paymentDate VARCHAR(100),
            patientName LONGTEXT,
            patientAge VARCHAR(50),
            patientNeeds LONGTEXT,
            prescription LONGTEXT,
            googleMapLocation TEXT,
            advancePaid DECIMAL(10,2) DEFAULT 0,
            balanceAmount DECIMAL(10,2) DEFAULT 0,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        try {
          await connection.query('ALTER TABLE bookings ADD COLUMN vitals TEXT')
          console.log('[MySQL] Added column vitals to bookings table.')
        } catch (err) {
          // Column probably already exists, ignore
        }
        try {
          await connection.query('ALTER TABLE bookings ADD COLUMN careLogs TEXT')
          console.log('[MySQL] Added column careLogs to bookings table.')
        } catch (err) {
          // Column probably already exists, ignore
        }

        await connection.query(`
          CREATE TABLE IF NOT EXISTS caregivers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            email VARCHAR(255),
            specialty VARCHAR(255) NOT NULL,
            experience INT DEFAULT 0,
            status VARCHAR(50) DEFAULT 'Pending',
            aadhaar LONGTEXT,
            pan LONGTEXT,
            certificates LONGTEXT,
            profilePhoto LONGTEXT,
            experienceDetails TEXT,
            workingLocations TEXT,
            availableTimings TEXT,
            state VARCHAR(100),
            city VARCHAR(100),
            googleMapLocation TEXT,
            experienceCertificate LONGTEXT,
            policeVerification LONGTEXT,
            additionalCertificates LONGTEXT,
            joinedAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            phone VARCHAR(50) NOT NULL,
            password VARCHAR(255) NOT NULL,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS services (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            short TEXT,
            description TEXT,
            benefits TEXT,
            duration VARCHAR(100),
            price VARCHAR(50) NOT NULL,
            category VARCHAR(50),
            comingSoon TINYINT DEFAULT 0,
            advance INT DEFAULT 0,
            image LONGTEXT,
            about TEXT,
            highlights TEXT,
            images TEXT
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            recipient VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) NOT NULL,
            sentAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS otp_verifications (
            email VARCHAR(255) PRIMARY KEY,
            otp VARCHAR(10) NOT NULL,
            role VARCHAR(50) NOT NULL,
            expiresAt BIGINT NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bookingId INT UNIQUE,
            caregiverName VARCHAR(255) NOT NULL,
            rating INT NOT NULL,
            comment TEXT,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message TEXT NOT NULL,
            target VARCHAR(50) NOT NULL,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS gallery (
            id INT AUTO_INCREMENT PRIMARY KEY,
            imageUrl LONGTEXT NOT NULL,
            title VARCHAR(255) NOT NULL,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS blogs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            content LONGTEXT NOT NULL,
            image TEXT,
            category VARCHAR(255),
            author VARCHAR(255),
            date VARCHAR(255)
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS faqs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS mtps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            email VARCHAR(255),
            gender VARCHAR(50),
            age VARCHAR(50),
            city VARCHAR(100) DEFAULT 'Hyderabad',
            locality VARCHAR(255),
            roles TEXT,
            availability VARCHAR(100),
            vehicle VARCHAR(100),
            drivingLicense VARCHAR(50),
            experience VARCHAR(100),
            skillsSummary TEXT,
            aadhaar VARCHAR(100),
            emergencyContact VARCHAR(255),
            status VARCHAR(50) DEFAULT 'Pending',
            adminNotes TEXT,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS mtp_tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            icon VARCHAR(50) DEFAULT '🚗',
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            shiftType VARCHAR(100) DEFAULT 'Part-time / On-Demand',
            earningEstimate VARCHAR(100) DEFAULT '₹300 - ₹1,500 / task',
            active TINYINT DEFAULT 1,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        // Add columns to existing tables if missing
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN password VARCHAR(255)`)
        } catch (e) {
          // ignore column already exists error
        }
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN aadhaar LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN pan LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN certificates LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN profilePhoto LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN experienceDetails TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN workingLocations TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN availableTimings TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN state VARCHAR(100)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN city VARCHAR(100)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN googleMapLocation TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN experienceCertificate LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN policeVerification LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN additionalCertificates LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN userId INT`)
        } catch (e) {
          // ignore column already exists error
        }
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN paymentMethod VARCHAR(100)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN transactionId VARCHAR(255)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN paymentDate VARCHAR(100)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN patientName LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN patientAge VARCHAR(50)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN patientNeeds LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN prescription LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN googleMapLocation TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN advance INT DEFAULT 0`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN advancePaid DECIMAL(10,2) DEFAULT 0`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN balanceAmount DECIMAL(10,2) DEFAULT 0`)
        } catch (e) {}

        // Migration queries for services table
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN slug VARCHAR(255)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN short TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN benefits TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN duration VARCHAR(100)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN comingSoon TINYINT DEFAULT 0`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN image LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN about TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN highlights TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN images TEXT`)
        } catch (e) {}

        // Insert initial values if MySQL database is fresh/empty
        const [bookingsRows] = await connection.query('SELECT count(*) as count FROM bookings')
        if (bookingsRows[0].count === 0) {
          console.log('Inserting initial mock bookings into MySQL...')
          for (const b of DEFAULT_MOCK_DATA.bookings) {
            await connection.query(
              'INSERT INTO bookings (name, phone, service, date, time, duration, address, status, assignedStaff, amount, paymentStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [b.name, b.phone, b.service, b.date, b.time, b.duration, b.address, b.status, b.assignedStaff, b.amount, b.paymentStatus, b.createdAt]
            )
          }
        }

        const [caregiverRows] = await connection.query('SELECT count(*) as count FROM caregivers')
        if (caregiverRows[0].count === 0) {
          console.log('Inserting initial mock caregivers into MySQL...')
          for (const c of DEFAULT_MOCK_DATA.caregivers) {
            await connection.query(
              'INSERT INTO caregivers (name, phone, email, specialty, experience, status, joinedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [c.name, c.phone, c.email, c.specialty, c.experience, c.status, c.joinedAt]
            )
          }
        }

        const [enquiryRows] = await connection.query('SELECT count(*) as count FROM enquiries')
        if (enquiryRows[0].count === 0) {
          console.log('Inserting initial mock enquiries into MySQL...')
          for (const e of DEFAULT_MOCK_DATA.enquiries) {
            await connection.query(
              'INSERT INTO enquiries (name, phone, email, service, city, message, submittedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [e.name, e.phone, e.email, e.service, e.city, e.message, e.submittedAt]
            )
          }
        }

        // Clean up old default sample/mock services from the live database
        try {
          await connection.query(`
            DELETE FROM services 
            WHERE slug IN ('baby-care', 'injection-services', 'elderly-care-at-home', 'elderly-care') 
               OR description IN ('wklbcbkfhip', 'IV, IM, and subcutaneous drug administrations', 'Assisting seniors with daily tasks and medication routine')
          `)
          console.log('🧹 Cleaned up old default mock/sample services from MySQL database.')
        } catch (e) {
          console.error('Failed to cleanup old mock services:', e)
        }

        const [servicesRows] = await connection.query('SELECT count(*) as count FROM services')
        if (servicesRows[0].count === 0) {
          console.log('Inserting initial mock services into MySQL...')
          for (const s of DEFAULT_MOCK_DATA.services) {
            const priceVal = Number(String(s.price).replace(/[^0-9]/g, '')) || 500
            const advanceVal = s.advance || Math.round(priceVal * 0.2)
            await connection.query(
              'INSERT INTO services (title, slug, short, description, benefits, duration, price, category, comingSoon, advance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [s.title, s.slug, s.short, s.description, JSON.stringify(s.benefits), s.duration, s.price, s.category, s.comingSoon ? 1 : 0, advanceVal]
            )
          }
        }

        const [faqsRows] = await connection.query('SELECT count(*) as count FROM faqs')
        if (faqsRows[0].count === 0) {
          console.log('Inserting initial mock FAQs into MySQL...')
          for (const f of DEFAULT_MOCK_DATA.faqs) {
            await connection.query(
              'INSERT INTO faqs (question, answer, createdAt) VALUES (?, ?, ?)',
              [f.question, f.answer, new Date().toISOString()]
            )
          }
        }

        const [notificationsRows] = await connection.query('SELECT count(*) as count FROM notifications')
        if (notificationsRows[0].count === 0) {
          console.log('Inserting initial mock notifications into MySQL...')
          for (const n of DEFAULT_MOCK_DATA.notifications) {
            await connection.query(
              'INSERT INTO notifications (recipient, message, type, sentAt) VALUES (?, ?, ?, ?)',
              [n.recipient, n.message, n.type, n.sentAt]
            )
          }
        }

        connection.release()
        useMySQL = true
        console.log(`✅ MySQL Tables verified and seeded successfully!`)
      } catch (err) {
        console.error(`❌ Failed to connect to MySQL database:`, err.message)
        console.warn(`⚠️ Warning: MySQL database offline. Falling back to JSON database.`)
        useMySQL = false
      }
    } else {
      console.warn(`⚠️ Warning: MySQL environment variables (DB_HOST, DB_USER, DB_NAME) are not defined. Falling back to JSON database.`)
      useMySQL = false
    }
  },

  // Enquiries Operations
  getEnquiries: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM enquiries ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      return [...data.enquiries].reverse()
    }
  },

  addEnquiry: async (enquiryData) => {
    const { name, phone, email = '', service = '', city = '', message = '' } = enquiryData
    const submittedAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO enquiries (name, phone, email, service, city, message, submittedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, phone, email, service, city, message, submittedAt]
      )
      return { id: result.insertId, name, phone, email, service, city, message, submittedAt }
    } else {
      const data = await readJSONDb()
      const newEnquiry = {
        id: data.enquiries.length > 0 ? Math.max(...data.enquiries.map(e => e.id)) + 1 : 1,
        name,
        phone,
        email,
        service,
        city,
        message,
        submittedAt
      }
      data.enquiries.push(newEnquiry)
      await writeJSONDb(data)
      return newEnquiry
    }
  },

  deleteEnquiry: async (id) => {
    if (useMySQL) {
      await pool.query('DELETE FROM enquiries WHERE id = ?', [id])
      return true
    } else {
      const data = await readJSONDb()
      const initialLength = data.enquiries.length
      data.enquiries = data.enquiries.filter(e => e.id !== Number(id))
      await writeJSONDb(data)
      return data.enquiries.length < initialLength
    }
  },

  // Bookings Operations
  getBookings: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM bookings ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      return [...data.bookings].reverse()
    }
  },

  addBooking: async (bookingData) => {
    const { name, phone, service, date, time, duration, address, amount = 1200, paymentStatus = 'Unpaid', paymentMethod = '', transactionId = '', paymentDate = '', prescription = '', googleMapLocation = '', caretakerPayout, caretakerPayoutStatus = 'Unpaid', caretakerPayoutMethod = '', caretakerPayoutRef = '', advancePaid = 0, balanceAmount = 0 } = bookingData
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO bookings (name, phone, service, date, time, duration, address, amount, paymentStatus, paymentMethod, transactionId, paymentDate, prescription, googleMapLocation, advancePaid, balanceAmount, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, phone, service, date, time, duration, address, amount, paymentStatus, paymentMethod, transactionId, paymentDate, prescription, googleMapLocation, advancePaid, balanceAmount, createdAt]
      )
      return { id: result.insertId, name, phone, service, date, time, duration, address, status: 'Pending', assignedStaff: null, amount, paymentStatus, paymentMethod, transactionId, paymentDate, prescription, googleMapLocation, advancePaid, balanceAmount, createdAt }
    } else {
      const data = await readJSONDb()
      const newBooking = {
        id: data.bookings.length > 0 ? Math.max(...data.bookings.map(b => b.id)) + 1 : 1,
        name,
        phone,
        service,
        date,
        time,
        duration,
        address,
        status: 'Pending',
        assignedStaff: null,
        amount,
        caretakerPayout: Number(caretakerPayout) || 0,
        caretakerPayoutStatus,
        caretakerPayoutMethod,
        caretakerPayoutRef,
        paymentStatus,
        paymentMethod,
        transactionId,
        paymentDate,
        prescription,
        googleMapLocation,
        advancePaid: Number(advancePaid) || 0,
        balanceAmount: Number(balanceAmount) || 0,
        createdAt
      }
      data.bookings.push(newBooking)
      await writeJSONDb(data)
      return newBooking
    }
  },

  updateBooking: async (id, status, assignedStaff, paymentStatus) => {
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE bookings SET status = ?, assignedStaff = ?, paymentStatus = ? WHERE id = ?',
        [status, assignedStaff, paymentStatus, id]
      )
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const bookingIdx = data.bookings.findIndex(b => b.id === Number(id))
      if (bookingIdx > -1) {
        const oldBooking = data.bookings[bookingIdx]
        const now = new Date().toISOString()
        
        let confirmedAt = oldBooking.confirmedAt
        if ((status === 'Confirmed' || status === 'Active' || status === 'Completed') && !confirmedAt) {
          confirmedAt = now
        }
        
        let assignedAt = oldBooking.assignedAt
        if (assignedStaff && assignedStaff !== oldBooking.assignedStaff && !assignedAt) {
          assignedAt = now
        }
        
        let completedAt = oldBooking.completedAt
        if (status === 'Completed' && !completedAt) {
          completedAt = now
        }

        let cancelledAt = oldBooking.cancelledAt
        if (status === 'Cancelled' && !cancelledAt) {
          cancelledAt = now
        }

        data.bookings[bookingIdx] = {
          ...oldBooking,
          status,
          assignedStaff,
          paymentStatus,
          confirmedAt,
          assignedAt,
          completedAt,
          cancelledAt
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  payBookingBalance: async (id, paymentMethod, transactionId) => {
    const paymentDate = new Date().toISOString()
    if (useMySQL) {
      const [rows] = await pool.query('SELECT amount, advancePaid FROM bookings WHERE id = ?', [id])
      if (rows[0]) {
        await pool.query(
          'UPDATE bookings SET paymentStatus = "Paid", advancePaid = amount, balanceAmount = 0, paymentMethod = ?, transactionId = ?, paymentDate = ? WHERE id = ?',
          [paymentMethod, transactionId, paymentDate, id]
        )
        return true
      }
      return false
    } else {
      const data = await readJSONDb()
      const idx = data.bookings.findIndex(b => b.id === Number(id))
      if (idx > -1) {
        const b = data.bookings[idx]
        data.bookings[idx] = {
          ...b,
          paymentStatus: "Paid",
          advancePaid: b.amount,
          balanceAmount: 0,
          paymentMethod,
          transactionId,
          paymentDate
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  updateBookingDetails: async (id, details) => {
    const { patientName, patientAge, patientNeeds, address, googleMapLocation } = details
    if (useMySQL) {
      await pool.query(
        'UPDATE bookings SET patientName = ?, patientAge = ?, patientNeeds = ?, address = ?, googleMapLocation = ? WHERE id = ?',
        [patientName, patientAge, patientNeeds, address, googleMapLocation, id]
      )
      return true
    } else {
      const data = await readJSONDb()
      const idx = data.bookings.findIndex(b => b.id === Number(id))
      if (idx > -1) {
        data.bookings[idx] = {
          ...data.bookings[idx],
          patientName,
          patientAge,
          patientNeeds,
          address,
          googleMapLocation
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  // Caregivers Operations
  getCaregivers: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM caregivers ORDER BY id DESC')
      return rows.map(r => ({
        ...r,
        uniqueId: `AMMASEVA-${String(r.id).padStart(4, '0')}`
      }))
    } else {
      const data = await readJSONDb()
      return [...data.caregivers].reverse().map(r => ({
        ...r,
        uniqueId: `AMMASEVA-${String(r.id).padStart(4, '0')}`
      }))
    }
  },

  addCaregiver: async (caregiverData) => {
    const { name, phone, email, specialty, experience } = caregiverData
    const joinedAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO caregivers (name, phone, email, specialty, experience, joinedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [name, phone, email, specialty, experience, joinedAt]
      )
      return { id: result.insertId, name, phone, email, specialty, experience, status: 'Pending', joinedAt }
    } else {
      const data = await readJSONDb()
      const newCaregiver = {
        id: data.caregivers.length > 0 ? Math.max(...data.caregivers.map(c => c.id)) + 1 : 1,
        name,
        phone,
        email,
        specialty,
        experience,
        status: 'Pending',
        joinedAt
      }
      data.caregivers.push(newCaregiver)
      await writeJSONDb(data)
      return newCaregiver
    }
  },

  updateCaregiverStatus: async (id, status) => {
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE caregivers SET status = ? WHERE id = ?',
        [status, id]
      )
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const caregiverIdx = data.caregivers.findIndex(c => c.id === Number(id))
      if (caregiverIdx > -1) {
        data.caregivers[caregiverIdx].status = status
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  // Users Auth & Management
  addUser: async (userData) => {
    const { name, email, phone, password } = userData
    const createdAt = new Date().toISOString()
    const hashedPassword = await bcrypt.hash(password, 10)
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO users (name, email, phone, password, createdAt) VALUES (?, ?, ?, ?, ?)',
        [name, email.toLowerCase().trim(), phone, hashedPassword, createdAt]
      )
      return { id: result.insertId, name, email, phone, createdAt }
    } else {
      const data = await readJSONDb()
      if (!data.users) data.users = []
      const newUser = {
        id: data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1,
        name,
        email: email.toLowerCase().trim(),
        phone,
        password: hashedPassword,
        createdAt
      }
      data.users.push(newUser)
      await writeJSONDb(data)
      return newUser
    }
  },

  getUserById: async (id) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.users) data.users = []
      return data.users.find(u => u.id === Number(id)) || null
    }
  },

  getUserByEmail: async (email) => {
    const normalized = email.toLowerCase().trim()
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [normalized])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.users) data.users = []
      return data.users.find(u => u.email === normalized) || null
    }
  },

  getCaregiverByEmail: async (email) => {
    const normalized = email.toLowerCase().trim()
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM caregivers WHERE email = ?', [normalized])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      return data.caregivers.find(c => c.email && c.email.toLowerCase().trim() === normalized) || null
    }
  },

  getCaregiverById: async (id) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM caregivers WHERE id = ?', [id])
      return rows[0] ? { ...rows[0], uniqueId: `AMMASEVA-${String(rows[0].id).padStart(4, '0')}` } : null
    } else {
      const data = await readJSONDb()
      const c = data.caregivers.find(c => c.id === Number(id))
      return c ? { ...c, uniqueId: `AMMASEVA-${String(c.id).padStart(4, '0')}` } : null
    }
  },

  getCaregiverByName: async (name) => {
    const trimmed = name.trim()
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM caregivers WHERE name = ?', [trimmed])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      return data.caregivers.find(c => c.name && c.name.trim() === trimmed) || null
    }
  },

  updateCaregiverProfile: async (id, profileData) => {
    const { 
      name, phone, specialty, experience, 
      aadhaar, pan, certificates, profilePhoto, 
      experienceDetails, workingLocations, availableTimings,
      state, city, googleMapLocation,
      experienceCertificate, policeVerification, additionalCertificates
    } = profileData
    if (useMySQL) {
      const [result] = await pool.query(
        `UPDATE caregivers SET 
          name = COALESCE(?, name), 
          phone = COALESCE(?, phone), 
          specialty = COALESCE(?, specialty), 
          experience = COALESCE(?, experience), 
          aadhaar = COALESCE(?, aadhaar), 
          pan = COALESCE(?, pan), 
          certificates = COALESCE(?, certificates), 
          profilePhoto = COALESCE(?, profilePhoto), 
          experienceDetails = COALESCE(?, experienceDetails), 
          workingLocations = COALESCE(?, workingLocations), 
          availableTimings = COALESCE(?, availableTimings),
          state = COALESCE(?, state),
          city = COALESCE(?, city),
          googleMapLocation = COALESCE(?, googleMapLocation),
          experienceCertificate = COALESCE(?, experienceCertificate),
          policeVerification = COALESCE(?, policeVerification),
          additionalCertificates = COALESCE(?, additionalCertificates)
        WHERE id = ?`,
        [
          name !== undefined ? name : null, 
          phone !== undefined ? phone : null, 
          specialty !== undefined ? specialty : null, 
          experience !== undefined ? Number(experience) : null, 
          aadhaar !== undefined ? aadhaar : null, 
          pan !== undefined ? pan : null, 
          certificates !== undefined ? certificates : null, 
          profilePhoto !== undefined ? profilePhoto : null, 
          experienceDetails !== undefined ? experienceDetails : null, 
          workingLocations !== undefined ? workingLocations : null, 
          availableTimings !== undefined ? availableTimings : null, 
          state !== undefined ? state : null,
          city !== undefined ? city : null,
          googleMapLocation !== undefined ? googleMapLocation : null,
          experienceCertificate !== undefined ? experienceCertificate : null,
          policeVerification !== undefined ? policeVerification : null,
          additionalCertificates !== undefined ? additionalCertificates : null,
          id
        ]
      )
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.caregivers.findIndex(c => c.id === Number(id))
      if (idx > -1) {
        data.caregivers[idx] = {
          ...data.caregivers[idx],
          name: name !== undefined ? name : data.caregivers[idx].name,
          phone: phone !== undefined ? phone : data.caregivers[idx].phone,
          specialty: specialty !== undefined ? specialty : data.caregivers[idx].specialty,
          experience: experience !== undefined ? Number(experience) : data.caregivers[idx].experience,
          aadhaar: aadhaar !== undefined ? aadhaar : data.caregivers[idx].aadhaar,
          pan: pan !== undefined ? pan : data.caregivers[idx].pan,
          certificates: certificates !== undefined ? certificates : data.caregivers[idx].certificates,
          profilePhoto: profilePhoto !== undefined ? profilePhoto : data.caregivers[idx].profilePhoto,
          experienceDetails: experienceDetails !== undefined ? experienceDetails : data.caregivers[idx].experienceDetails,
          workingLocations: workingLocations !== undefined ? workingLocations : data.caregivers[idx].workingLocations,
          availableTimings: availableTimings !== undefined ? availableTimings : data.caregivers[idx].availableTimings,
          state: state !== undefined ? state : data.caregivers[idx].state,
          city: city !== undefined ? city : data.caregivers[idx].city,
          googleMapLocation: googleMapLocation !== undefined ? googleMapLocation : data.caregivers[idx].googleMapLocation,
          experienceCertificate: experienceCertificate !== undefined ? experienceCertificate : data.caregivers[idx].experienceCertificate,
          policeVerification: policeVerification !== undefined ? policeVerification : data.caregivers[idx].policeVerification,
          additionalCertificates: additionalCertificates !== undefined ? additionalCertificates : data.caregivers[idx].additionalCertificates
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  updateUserPassword: async (id, hashedPassword) => {
    if (useMySQL) {
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id])
    } else {
      const data = await readJSONDb()
      const idx = data.users.findIndex(u => u.id === Number(id))
      if (idx > -1) {
        data.users[idx].password = hashedPassword
        await writeJSONDb(data)
      }
    }
  },

  updateCaregiverPassword: async (id, hashedPassword) => {
    if (useMySQL) {
      await pool.query('UPDATE caregivers SET password = ? WHERE id = ?', [hashedPassword, id])
    } else {
      const data = await readJSONDb()
      const idx = data.caregivers.findIndex(c => c.id === Number(id))
      if (idx > -1) {
        data.caregivers[idx].password = hashedPassword
        await writeJSONDb(data)
      }
    }
  },

  addCaregiverWithPassword: async (caregiverData) => {
    const { 
      name, phone, email, specialty, experience, 
      aadhaar = '', pan = '', certificates = '', profilePhoto = '', 
      experienceDetails = '', workingLocations = '', availableTimings = '',
      state = '', city = '', googleMapLocation = '',
      experienceCertificate = '', policeVerification = '', additionalCertificates = ''
    } = caregiverData
    const joinedAt = new Date().toISOString()
    const dummyPassword = ''
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO caregivers (name, phone, email, specialty, experience, password, joinedAt, aadhaar, pan, certificates, profilePhoto, experienceDetails, workingLocations, availableTimings, state, city, googleMapLocation, experienceCertificate, policeVerification, additionalCertificates) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, phone, email, specialty, experience, dummyPassword, joinedAt, aadhaar, pan, certificates, profilePhoto, experienceDetails, workingLocations, availableTimings, state, city, googleMapLocation, experienceCertificate, policeVerification, additionalCertificates]
      )
      return { id: result.insertId, name, phone, email, specialty, experience, status: 'Pending', joinedAt, state, city, googleMapLocation, experienceCertificate, policeVerification, additionalCertificates }
    } else {
      const data = await readJSONDb()
      const newCaregiver = {
        id: data.caregivers.length > 0 ? Math.max(...data.caregivers.map(c => c.id)) + 1 : 1,
        name,
        phone,
        email,
        specialty,
        experience,
        password: dummyPassword,
        status: 'Pending',
        joinedAt,
        aadhaar,
        pan,
        certificates,
        profilePhoto,
        experienceDetails,
        workingLocations,
        availableTimings,
        state,
        city,
        googleMapLocation,
        experienceCertificate,
        policeVerification,
        additionalCertificates
      }
      data.caregivers.push(newCaregiver)
      await writeJSONDb(data)
      return newCaregiver
    }
  },

  // User Bookings Operations
  addBookingForUser: async (bookingData) => {
    const { name, phone, service, date, time, duration, address, amount = 1200, userId = null, patientName = '', patientAge = '', patientNeeds = '', prescription = '', googleMapLocation = '', paymentStatus = 'Unpaid', paymentMethod = '', transactionId = '', paymentDate = '', advancePaid = 0, balanceAmount = 0 } = bookingData
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO bookings (name, phone, service, date, time, duration, address, amount, userId, createdAt, patientName, patientAge, patientNeeds, prescription, googleMapLocation, paymentStatus, paymentMethod, transactionId, paymentDate, advancePaid, balanceAmount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, phone, service, date, time, duration, address, amount, userId, createdAt, patientName, patientAge, patientNeeds, prescription, googleMapLocation, paymentStatus, paymentMethod, transactionId, paymentDate, advancePaid, balanceAmount]
      )
      return { id: result.insertId, name, phone, service, date, time, duration, address, status: 'Pending', assignedStaff: null, amount, paymentStatus, userId, createdAt, patientName, patientAge, patientNeeds, prescription, googleMapLocation, paymentMethod, transactionId, paymentDate, advancePaid, balanceAmount }
    } else {
      const data = await readJSONDb()
      const newBooking = {
        id: data.bookings.length > 0 ? Math.max(...data.bookings.map(b => b.id)) + 1 : 1,
        name,
        phone,
        service,
        date,
        time,
        duration,
        address,
        status: 'Pending',
        assignedStaff: null,
        amount,
        paymentStatus,
        paymentMethod,
        transactionId,
        paymentDate,
        userId: userId ? Number(userId) : null,
        patientName,
        patientAge,
        patientNeeds,
        prescription,
        googleMapLocation,
        advancePaid: Number(advancePaid) || 0,
        balanceAmount: Number(balanceAmount) || 0,
        createdAt
      }
      data.bookings.push(newBooking)
      await writeJSONDb(data)
      return newBooking
    }
  },

  getBookingById: async (id) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      return data.bookings.find(b => b.id === Number(id)) || null
    }
  },

  getBookingsByUserId: async (userId) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM bookings WHERE userId = ? ORDER BY id DESC', [userId])
      return rows
    } else {
      const data = await readJSONDb()
      return data.bookings.filter(b => b.userId === Number(userId)).reverse()
    }
  },

  getBookingsByAssignedStaff: async (staffName) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM bookings WHERE assignedStaff = ? ORDER BY id DESC', [staffName])
      return rows
    } else {
      const data = await readJSONDb()
      return data.bookings.filter(b => b.assignedStaff === staffName).reverse()
    }
  },

  rescheduleBooking: async (id, date, time) => {
    if (useMySQL) {
      const [result] = await pool.query('UPDATE bookings SET date = ?, time = ? WHERE id = ?', [date, time, id])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.bookings.findIndex(b => b.id === Number(id))
      if (idx > -1) {
        data.bookings[idx].date = date
        data.bookings[idx].time = time
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  cancelBooking: async (id) => {
    if (useMySQL) {
      const [result] = await pool.query("UPDATE bookings SET status = 'Cancelled' WHERE id = ?", [id])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.bookings.findIndex(b => b.id === Number(id))
      if (idx > -1) {
        data.bookings[idx].status = 'Cancelled'
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  // Admin CRUD operations: Users
  getUsers: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT id, name, email, phone, createdAt FROM users ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.users) data.users = []
      return data.users.map(({ password, ...u }) => u).reverse()
    }
  },

  deleteUser: async (id) => {
    if (useMySQL) {
      const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const initialLength = data.users.length
      data.users = data.users.filter(u => u.id !== Number(id))
      await writeJSONDb(data)
      return data.users.length < initialLength
    }
  },

  // Admin CRUD operations: Bookings (Full Edit & Delete)
  adminUpdateBooking: async (id, bookingData) => {
    const { name, phone, service, date, time, duration, address, status, assignedStaff, amount, paymentStatus, paymentMethod = '', transactionId = '', paymentDate = '', caretakerPayout, caretakerPayoutStatus, caretakerPayoutMethod, caretakerPayoutRef } = bookingData
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE bookings SET name = ?, phone = ?, service = ?, date = ?, time = ?, duration = ?, address = ?, status = ?, assignedStaff = ?, amount = ?, paymentStatus = ?, paymentMethod = ?, transactionId = ?, paymentDate = ? WHERE id = ?',
        [name, phone, service, date, time, duration, address, status, assignedStaff || null, amount, paymentStatus, paymentMethod, transactionId, paymentDate, id]
      )
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.bookings.findIndex(b => b.id === Number(id))
      if (idx > -1) {
        data.bookings[idx] = {
          ...data.bookings[idx],
          name,
          phone,
          service,
          date,
          time,
          duration,
          address,
          status,
          assignedStaff: assignedStaff || null,
          amount: Number(amount),
          caretakerPayout: caretakerPayout !== undefined ? Number(caretakerPayout) : (data.bookings[idx].caretakerPayout || 0),
          caretakerPayoutStatus: caretakerPayoutStatus !== undefined ? caretakerPayoutStatus : (data.bookings[idx].caretakerPayoutStatus || 'Unpaid'),
          caretakerPayoutMethod: caretakerPayoutMethod !== undefined ? caretakerPayoutMethod : (data.bookings[idx].caretakerPayoutMethod || ''),
          caretakerPayoutRef: caretakerPayoutRef !== undefined ? caretakerPayoutRef : (data.bookings[idx].caretakerPayoutRef || ''),
          paymentStatus,
          paymentMethod,
          transactionId,
          paymentDate
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  deleteBooking: async (id) => {
    if (useMySQL) {
      const [result] = await pool.query('DELETE FROM bookings WHERE id = ?', [id])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const initialLength = data.bookings.length
      data.bookings = data.bookings.filter(b => b.id !== Number(id))
      await writeJSONDb(data)
      return data.bookings.length < initialLength
    }
  },

  // Admin CRUD operations: Caregivers (Full Edit & Delete)
  adminUpdateCaregiver: async (id, caregiverData) => {
    const { 
      name, phone, email, specialty, experience, status, 
      aadhaar, pan, certificates, profilePhoto, 
      experienceDetails, workingLocations, availableTimings,
      state, city, googleMapLocation,
      experienceCertificate, policeVerification, additionalCertificates
    } = caregiverData
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE caregivers SET name = ?, phone = ?, email = ?, specialty = ?, experience = ?, status = ?, aadhaar = COALESCE(?, aadhaar), pan = COALESCE(?, pan), certificates = COALESCE(?, certificates), profilePhoto = COALESCE(?, profilePhoto), experienceDetails = COALESCE(?, experienceDetails), workingLocations = COALESCE(?, workingLocations), availableTimings = COALESCE(?, availableTimings), state = COALESCE(?, state), city = COALESCE(?, city), googleMapLocation = COALESCE(?, googleMapLocation), experienceCertificate = COALESCE(?, experienceCertificate), policeVerification = COALESCE(?, policeVerification), additionalCertificates = COALESCE(?, additionalCertificates) WHERE id = ?',
        [name, phone, email, specialty, experience, status, aadhaar, pan, certificates, profilePhoto, experienceDetails, workingLocations, availableTimings, state !== undefined ? state : null, city !== undefined ? city : null, googleMapLocation !== undefined ? googleMapLocation : null, experienceCertificate !== undefined ? experienceCertificate : null, policeVerification !== undefined ? policeVerification : null, additionalCertificates !== undefined ? additionalCertificates : null, id]
      )
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.caregivers.findIndex(c => c.id === Number(id))
      if (idx > -1) {
        data.caregivers[idx] = {
          ...data.caregivers[idx],
          name,
          phone,
          email,
          specialty,
          experience: Number(experience),
          status,
          aadhaar: aadhaar !== undefined ? aadhaar : data.caregivers[idx].aadhaar,
          pan: pan !== undefined ? pan : data.caregivers[idx].pan,
          certificates: certificates !== undefined ? certificates : data.caregivers[idx].certificates,
          profilePhoto: profilePhoto !== undefined ? profilePhoto : data.caregivers[idx].profilePhoto,
          experienceDetails: experienceDetails !== undefined ? experienceDetails : data.caregivers[idx].experienceDetails,
          workingLocations: workingLocations !== undefined ? workingLocations : data.caregivers[idx].workingLocations,
          availableTimings: availableTimings !== undefined ? availableTimings : data.caregivers[idx].availableTimings,
          state: state !== undefined ? state : data.caregivers[idx].state,
          city: city !== undefined ? city : data.caregivers[idx].city,
          googleMapLocation: googleMapLocation !== undefined ? googleMapLocation : data.caregivers[idx].googleMapLocation,
          experienceCertificate: experienceCertificate !== undefined ? experienceCertificate : data.caregivers[idx].experienceCertificate,
          policeVerification: policeVerification !== undefined ? policeVerification : data.caregivers[idx].policeVerification,
          additionalCertificates: additionalCertificates !== undefined ? additionalCertificates : data.caregivers[idx].additionalCertificates
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  deleteCaregiver: async (id) => {
    if (useMySQL) {
      const [result] = await pool.query('DELETE FROM caregivers WHERE id = ?', [id])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const initialLength = data.caregivers.length
      data.caregivers = data.caregivers.filter(c => c.id !== Number(id))
      await writeJSONDb(data)
      return data.caregivers.length < initialLength
    }
  },

  // Persistent OTP methods
  saveOTP: async (email, otp, role, expiresAt) => {
    if (useMySQL) {
      await pool.query(
        'INSERT INTO otp_verifications (email, otp, role, expiresAt) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, role = ?, expiresAt = ?',
        [email, otp, role, expiresAt, otp, role, expiresAt]
      )
    } else {
      const data = await readJSONDb()
      if (!data.otps) data.otps = []
      const idx = data.otps.findIndex(o => o.email === email)
      const otpObj = { email, otp, role, expiresAt }
      if (idx > -1) {
        data.otps[idx] = otpObj
      } else {
        data.otps.push(otpObj)
      }
      await writeJSONDb(data)
    }
  },

  getOTP: async (email) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM otp_verifications WHERE email = ?', [email])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.otps) return null
      return data.otps.find(o => o.email === email) || null
    }
  },

  deleteOTP: async (email) => {
    if (useMySQL) {
      await pool.query('DELETE FROM otp_verifications WHERE email = ?', [email])
    } else {
      const data = await readJSONDb()
      if (data.otps) {
        data.otps = data.otps.filter(o => o.email !== email)
        await writeJSONDb(data)
      }
    }
  },

  // Admin CRUD operations: Services
  getServices: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM services ORDER BY id DESC')
      return rows.map(row => ({
        ...row,
        benefits: row.benefits ? JSON.parse(row.benefits) : [],
        highlights: row.highlights ? JSON.parse(row.highlights) : [],
        images: row.images ? JSON.parse(row.images) : [],
        comingSoon: !!row.comingSoon
      }))
    } else {
      const data = await readJSONDb()
      if (!data.services) data.services = []
      return [...data.services].reverse()
    }
  },

  addService: async (serviceData) => {
    const { 
      title, slug, short, description, benefits, duration, price, category, 
      comingSoon = false, image = '', about = '', highlights = [], images = [],
      advance = 0
    } = serviceData
    const benefitsStr = Array.isArray(benefits) ? JSON.stringify(benefits) : JSON.stringify([])
    const highlightsStr = Array.isArray(highlights) ? JSON.stringify(highlights) : JSON.stringify([])
    const imagesStr = Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([])
    const comingSoonVal = comingSoon ? 1 : 0
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO services (title, slug, short, description, benefits, duration, price, category, comingSoon, image, about, highlights, images, advance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, slug, short, description, benefitsStr, duration, price, category, comingSoonVal, image, about, highlightsStr, imagesStr, advance]
      )
      return { id: result.insertId, title, slug, short, description, benefits, duration, price, category, comingSoon, image, about, highlights, images, advance }
    } else {
      const data = await readJSONDb()
      if (!data.services) data.services = []
      const newService = {
        id: data.services.length > 0 ? Math.max(...data.services.map(s => s.id)) + 1 : 1,
        title,
        slug,
        short,
        description,
        benefits: Array.isArray(benefits) ? benefits : [],
        duration,
        price,
        category,
        comingSoon: !!comingSoon,
        advance: Number(advance) || 0,
        image,
        about,
        highlights: Array.isArray(highlights) ? highlights : [],
        images: Array.isArray(images) ? images : []
      }
      data.services.push(newService)
      await writeJSONDb(data)
      return newService
    }
  },

  updateService: async (id, serviceData) => {
    const { 
      title, slug, short, description, benefits, duration, price, category, 
      comingSoon = false, image, about, highlights, images, advance 
    } = serviceData
    const benefitsStr = Array.isArray(benefits) ? JSON.stringify(benefits) : JSON.stringify([])
    const highlightsStr = Array.isArray(highlights) ? JSON.stringify(highlights) : JSON.stringify([])
    const imagesStr = Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([])
    const comingSoonVal = comingSoon ? 1 : 0
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE services SET title = ?, slug = ?, short = ?, description = ?, benefits = ?, duration = ?, price = ?, category = ?, comingSoon = ?, image = COALESCE(?, image), about = ?, highlights = ?, images = ?, advance = COALESCE(?, advance) WHERE id = ?',
        [title, slug, short, description, benefitsStr, duration, price, category, comingSoonVal, image !== undefined ? image : null, about, highlightsStr, imagesStr, advance !== undefined ? Number(advance) : null, id]
      )
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.services.findIndex(s => s.id === Number(id))
      if (idx > -1) {
        data.services[idx] = {
          ...data.services[idx],
          title,
          slug,
          short,
          description,
          benefits: Array.isArray(benefits) ? benefits : [],
          duration,
          price,
          category,
          comingSoon: !!comingSoon,
          advance: advance !== undefined ? Number(advance) : data.services[idx].advance,
          image: image !== undefined ? image : data.services[idx].image,
          about: about !== undefined ? about : (data.services[idx].about || ''),
          highlights: Array.isArray(highlights) ? highlights : (data.services[idx].highlights || []),
          images: Array.isArray(images) ? images : (data.services[idx].images || [])
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  deleteService: async (id) => {
    if (useMySQL) {
      const [result] = await pool.query('DELETE FROM services WHERE id = ?', [id])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const initialLength = data.services.length
      data.services = data.services.filter(s => s.id !== Number(id))
      await writeJSONDb(data)
      return data.services.length < initialLength
    }
  },

  // Admin CRUD operations: Notifications
  getNotifications: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM notifications ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.notifications) data.notifications = []
      return [...data.notifications].reverse()
    }
  },

  addNotification: async (notificationData) => {
    const { recipient, message, type } = notificationData
    const sentAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO notifications (recipient, message, type, sentAt) VALUES (?, ?, ?, ?)',
        [recipient, message, type, sentAt]
      )
      return { id: result.insertId, recipient, message, type, sentAt }
    } else {
      const data = await readJSONDb()
      if (!data.notifications) data.notifications = []
      const newNotification = {
        id: data.notifications.length > 0 ? Math.max(...data.notifications.map(n => n.id)) + 1 : 1,
        recipient,
        message,
        type,
        sentAt
      }
      data.notifications.push(newNotification)
      await writeJSONDb(data)
      return newNotification
    }
  },

  updateBookingStatus: async (id, status) => {
    if (useMySQL) {
      const [result] = await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.bookings.findIndex(b => b.id === Number(id))
      if (idx > -1) {
        const oldBooking = data.bookings[idx]
        const now = new Date().toISOString()
        
        let confirmedAt = oldBooking.confirmedAt
        if ((status === 'Confirmed' || status === 'Active' || status === 'Completed') && !confirmedAt) {
          confirmedAt = now
        }
        
        let completedAt = oldBooking.completedAt
        if (status === 'Completed' && !completedAt) {
          completedAt = now
        }

        let cancelledAt = oldBooking.cancelledAt
        if (status === 'Cancelled' && !cancelledAt) {
          cancelledAt = now
        }

        data.bookings[idx] = {
          ...oldBooking,
          status,
          confirmedAt,
          completedAt,
          cancelledAt
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  updateBookingVitalsAndLogs: async (id, vitals, careLogs) => {
    const vitalsStr = typeof vitals === 'object' ? JSON.stringify(vitals) : vitals
    const careLogsStr = typeof careLogs === 'object' ? JSON.stringify(careLogs) : careLogs
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE bookings SET vitals = ?, careLogs = ? WHERE id = ?',
        [vitalsStr, careLogsStr, id]
      )
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.bookings.findIndex(b => b.id === Number(id))
      if (idx > -1) {
        data.bookings[idx].vitals = vitalsStr
        data.bookings[idx].careLogs = careLogsStr
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  addReview: async (reviewData) => {
    const { bookingId, caregiverName, rating, comment } = reviewData
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO reviews (bookingId, caregiverName, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?)',
        [bookingId, caregiverName, rating, comment, createdAt]
      )
      return { id: result.insertId, bookingId, caregiverName, rating, comment, createdAt }
    } else {
      const data = await readJSONDb()
      if (!data.reviews) data.reviews = []
      data.reviews = data.reviews.filter(r => r.bookingId !== Number(bookingId))
      const newReview = {
        id: data.reviews.length > 0 ? Math.max(...data.reviews.map(r => r.id)) + 1 : 1,
        bookingId: Number(bookingId),
        caregiverName,
        rating: Number(rating),
        comment,
        createdAt
      }
      data.reviews.push(newReview)
      await writeJSONDb(data)
      return newReview
    }
  },

  getReviewsForCaregiver: async (caregiverName) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM reviews WHERE caregiverName = ? ORDER BY id DESC', [caregiverName])
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.reviews) data.reviews = []
      return data.reviews.filter(r => r.caregiverName === caregiverName).reverse()
    }
  },

  getReviewByBookingId: async (bookingId) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM reviews WHERE bookingId = ?', [bookingId])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.reviews) data.reviews = []
      return data.reviews.find(r => r.bookingId === Number(bookingId)) || null
    }
  },

  getAnnouncements: async (target) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM announcements WHERE target = ? OR target = "All" ORDER BY id DESC', [target])
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.announcements) data.announcements = []
      return data.announcements.filter(a => a.target === target || a.target === 'All').reverse()
    }
  },

  addAnnouncement: async (message, target) => {
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO announcements (message, target, createdAt) VALUES (?, ?, ?)',
        [message, target, createdAt]
      )
      return { id: result.insertId, message, target, createdAt }
    } else {
      const data = await readJSONDb()
      if (!data.announcements) data.announcements = []
      const newAnn = {
        id: data.announcements.length > 0 ? Math.max(...data.announcements.map(a => a.id)) + 1 : 1,
        message,
        target,
        createdAt
      }
      data.announcements.push(newAnn)
      await writeJSONDb(data)
      return newAnn
    }
  },

  getBlogs: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM blogs ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.blogs) data.blogs = []
      return data.blogs.slice().reverse()
    }
  },

  addBlog: async (blog) => {
    const date = blog.date || new Date().toISOString().split('T')[0]
    const author = blog.author || 'Amma Seva Care Team'
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO blogs (title, slug, description, content, image, category, author, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [blog.title, blog.slug, blog.description, blog.content, blog.image, blog.category, author, date]
      )
      return { id: result.insertId, ...blog, author, date }
    } else {
      const data = await readJSONDb()
      if (!data.blogs) data.blogs = []
      const newBlog = {
        id: data.blogs.length > 0 ? Math.max(...data.blogs.map(b => b.id)) + 1 : 1,
        ...blog,
        author,
        date
      }
      data.blogs.push(newBlog)
      await writeJSONDb(data)
      return newBlog
    }
  },

  updateBlog: async (id, blog) => {
    const date = blog.date || new Date().toISOString().split('T')[0]
    if (useMySQL) {
      await pool.query(
        'UPDATE blogs SET title = ?, slug = ?, description = ?, content = ?, image = ?, category = ?, author = ?, date = ? WHERE id = ?',
        [blog.title, blog.slug, blog.description, blog.content, blog.image, blog.category, blog.author, date, Number(id)]
      )
      return { id: Number(id), ...blog, date }
    } else {
      const data = await readJSONDb()
      if (!data.blogs) data.blogs = []
      const idx = data.blogs.findIndex(b => b.id === Number(id))
      if (idx !== -1) {
        data.blogs[idx] = { ...data.blogs[idx], ...blog, date }
        await writeJSONDb(data)
        return data.blogs[idx]
      }
      return null
    }
  },

  deleteBlog: async (id) => {
    if (useMySQL) {
      await pool.query('DELETE FROM blogs WHERE id = ?', [Number(id)])
      return true
    } else {
      const data = await readJSONDb()
      if (!data.blogs) data.blogs = []
      const filtered = data.blogs.filter(b => b.id !== Number(id))
      data.blogs = filtered
      await writeJSONDb(data)
      return true
    }
  },

  getFaqs: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM faqs ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      return data.faqs || []
    }
  },

  addFaq: async (faq) => {
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO faqs (question, answer, createdAt) VALUES (?, ?, ?)',
        [faq.question, faq.answer, createdAt]
      )
      return { id: result.insertId, ...faq, createdAt }
    } else {
      const data = await readJSONDb()
      if (!data.faqs) data.faqs = []
      const newFaq = {
        id: data.faqs.length > 0 ? Math.max(...data.faqs.map(f => f.id)) + 1 : 1,
        ...faq,
        createdAt
      }
      data.faqs.push(newFaq)
      await writeJSONDb(data)
      return newFaq
    }
  },

  updateFaq: async (id, faq) => {
    if (useMySQL) {
      await pool.query(
        'UPDATE faqs SET question = ?, answer = ? WHERE id = ?',
        [faq.question, faq.answer, Number(id)]
      )
      return { id: Number(id), ...faq }
    } else {
      const data = await readJSONDb()
      if (!data.faqs) data.faqs = []
      const idx = data.faqs.findIndex(f => f.id === Number(id))
      if (idx !== -1) {
        data.faqs[idx] = { ...data.faqs[idx], ...faq }
        await writeJSONDb(data)
        return data.faqs[idx]
      }
      return null
    }
  },

  deleteFaq: async (id) => {
    if (useMySQL) {
      await pool.query('DELETE FROM faqs WHERE id = ?', [Number(id)])
      return true
    } else {
      const data = await readJSONDb()
      if (!data.faqs) data.faqs = []
      const filtered = data.faqs.filter(f => f.id !== Number(id))
      data.faqs = filtered
      await writeJSONDb(data)
      return true
    }
  },

  getGallery: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM gallery ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.gallery) data.gallery = []
      return data.gallery.slice().reverse()
    }
  },

  addGallery: async (item) => {
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO gallery (imageUrl, title, createdAt) VALUES (?, ?, ?)',
        [item.imageUrl, item.title, createdAt]
      )
      return { id: result.insertId, ...item, createdAt }
    } else {
      const data = await readJSONDb()
      if (!data.gallery) data.gallery = []
      const newItem = {
        id: data.gallery.length > 0 ? Math.max(...data.gallery.map(g => g.id)) + 1 : 1,
        ...item,
        createdAt
      }
      data.gallery.push(newItem)
      await writeJSONDb(data)
      return newItem
    }
  },

  deleteGallery: async (id) => {
    if (useMySQL) {
      await pool.query('DELETE FROM gallery WHERE id = ?', [Number(id)])
      return true
    } else {
      const data = await readJSONDb()
      if (!data.gallery) data.gallery = []
      data.gallery = data.gallery.filter(g => g.id !== Number(id))
      await writeJSONDb(data)
      return true
    }
  },

  // MTP (Multi Tasking Professionals) Operations
  getMTPs: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM mtps ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.mtps) data.mtps = []
      return [...data.mtps].reverse()
    }
  },

  getMTPById: async (id) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM mtps WHERE id = ?', [Number(id)])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.mtps) data.mtps = []
      return data.mtps.find(m => m.id === Number(id)) || null
    }
  },

  createMTP: async (mtpData) => {
    const createdAt = new Date().toISOString()
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
      status = 'Pending',
      adminNotes = ''
    } = mtpData

    const rolesString = Array.isArray(roles) ? roles.join(', ') : (roles || '')

    if (useMySQL) {
      const [result] = await pool.query(
        `INSERT INTO mtps (name, phone, email, gender, age, city, locality, roles, availability, vehicle, drivingLicense, experience, skillsSummary, aadhaar, emergencyContact, status, adminNotes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, phone, email, gender, age, city, locality, rolesString, availability, vehicle, drivingLicense, experience, skillsSummary, aadhaar, emergencyContact, status, adminNotes, createdAt]
      )
      return { id: result.insertId, ...mtpData, roles: rolesString, createdAt, status }
    } else {
      const data = await readJSONDb()
      if (!data.mtps) data.mtps = []
      const newMTP = {
        id: data.mtps.length > 0 ? Math.max(...data.mtps.map(m => m.id)) + 1 : 1,
        name,
        phone,
        email,
        gender,
        age,
        city,
        locality,
        roles: rolesString,
        availability,
        vehicle,
        drivingLicense,
        experience,
        skillsSummary,
        aadhaar,
        emergencyContact,
        status,
        adminNotes,
        createdAt
      }
      data.mtps.push(newMTP)
      await writeJSONDb(data)
      return newMTP
    }
  },

  updateMTPStatus: async (id, status, adminNotes = null) => {
    if (useMySQL) {
      if (adminNotes !== null) {
        await pool.query('UPDATE mtps SET status = ?, adminNotes = ? WHERE id = ?', [status, adminNotes, Number(id)])
      } else {
        await pool.query('UPDATE mtps SET status = ? WHERE id = ?', [status, Number(id)])
      }
      const [rows] = await pool.query('SELECT * FROM mtps WHERE id = ?', [Number(id)])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.mtps) data.mtps = []
      const index = data.mtps.findIndex(m => m.id === Number(id))
      if (index === -1) return null
      data.mtps[index].status = status
      if (adminNotes !== null) {
        data.mtps[index].adminNotes = adminNotes
      }
      await writeJSONDb(data)
      return data.mtps[index]
    }
  },

  deleteMTP: async (id) => {
    if (useMySQL) {
      await pool.query('DELETE FROM mtps WHERE id = ?', [Number(id)])
      return true
    } else {
      const data = await readJSONDb()
      if (!data.mtps) data.mtps = []
      data.mtps = data.mtps.filter(m => m.id !== Number(id))
      await writeJSONDb(data)
      return true
    }
  },

  // MTP Tasks (Dynamic Task Categories / Roles)
  getMTPTasks: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM mtp_tasks ORDER BY id ASC')
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.mtpTasks) data.mtpTasks = DEFAULT_MOCK_DATA.mtpTasks
      return data.mtpTasks
    }
  },

  getMTPTaskById: async (id) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM mtp_tasks WHERE id = ?', [Number(id)])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.mtpTasks) data.mtpTasks = DEFAULT_MOCK_DATA.mtpTasks
      return data.mtpTasks.find(t => t.id === Number(id)) || null
    }
  },

  createMTPTask: async (taskData) => {
    const createdAt = new Date().toISOString()
    const {
      icon = '🚗',
      title,
      description,
      shiftType = 'Part-time / On-Demand',
      earningEstimate = '₹300 - ₹1,500 / task',
      active = true
    } = taskData

    if (useMySQL) {
      const [result] = await pool.query(
        `INSERT INTO mtp_tasks (icon, title, description, shiftType, earningEstimate, active, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [icon, title, description, shiftType, earningEstimate, active ? 1 : 0, createdAt]
      )
      return { id: result.insertId, ...taskData, createdAt }
    } else {
      const data = await readJSONDb()
      if (!data.mtpTasks) data.mtpTasks = [...DEFAULT_MOCK_DATA.mtpTasks]
      const newTask = {
        id: data.mtpTasks.length > 0 ? Math.max(...data.mtpTasks.map(t => t.id)) + 1 : 1,
        icon,
        title,
        description,
        shiftType,
        earningEstimate,
        active: Boolean(active),
        createdAt
      }
      data.mtpTasks.push(newTask)
      await writeJSONDb(data)
      return newTask
    }
  },

  updateMTPTask: async (id, taskData) => {
    const { icon, title, description, shiftType, earningEstimate, active } = taskData
    if (useMySQL) {
      await pool.query(
        `UPDATE mtp_tasks 
         SET icon = COALESCE(?, icon),
             title = COALESCE(?, title),
             description = COALESCE(?, description),
             shiftType = COALESCE(?, shiftType),
             earningEstimate = COALESCE(?, earningEstimate),
             active = COALESCE(?, active)
         WHERE id = ?`,
        [icon, title, description, shiftType, earningEstimate, active !== undefined ? (active ? 1 : 0) : null, Number(id)]
      )
      const [rows] = await pool.query('SELECT * FROM mtp_tasks WHERE id = ?', [Number(id)])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.mtpTasks) data.mtpTasks = [...DEFAULT_MOCK_DATA.mtpTasks]
      const index = data.mtpTasks.findIndex(t => t.id === Number(id))
      if (index === -1) return null
      data.mtpTasks[index] = {
        ...data.mtpTasks[index],
        ...taskData,
        id: Number(id)
      }
      await writeJSONDb(data)
      return data.mtpTasks[index]
    }
  },

  deleteMTPTask: async (id) => {
    if (useMySQL) {
      await pool.query('DELETE FROM mtp_tasks WHERE id = ?', [Number(id)])
      return true
    } else {
      const data = await readJSONDb()
      if (!data.mtpTasks) data.mtpTasks = [...DEFAULT_MOCK_DATA.mtpTasks]
      data.mtpTasks = data.mtpTasks.filter(t => t.id !== Number(id))
      await writeJSONDb(data)
      return true
    }
  }
}
