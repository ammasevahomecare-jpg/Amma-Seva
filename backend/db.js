import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

// Resolve dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const JSON_DB_PATH = path.join(__dirname, 'db.json')

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
  services: [],
  notifications: [],
  reviews: [],
  announcements: []
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
      if (!data.services) { data.services = DEFAULT_MOCK_DATA.services; modified = true }
      if (!data.notifications) { data.notifications = DEFAULT_MOCK_DATA.notifications; modified = true }
      if (!data.reviews) { data.reviews = []; modified = true }
      if (!data.announcements) { data.announcements = []; modified = true }
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
            createdAt VARCHAR(255) NOT NULL
          )
        `)

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
            image LONGTEXT
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

        const [servicesRows] = await connection.query('SELECT count(*) as count FROM services')
        if (servicesRows[0].count === 0) {
          console.log('Inserting initial mock services into MySQL...')
          for (const s of DEFAULT_MOCK_DATA.services) {
            await connection.query(
              'INSERT INTO services (title, slug, short, description, benefits, duration, price, category, comingSoon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [s.title, s.slug, s.short, s.description, JSON.stringify(s.benefits), s.duration, s.price, s.category, s.comingSoon ? 1 : 0]
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
        console.log(`⚠️ Falling back to local JSON database...`)
        initJSONDb()
      }
    } else {
      console.log(`ℹ️ MySQL env variables not set. Initializing local JSON database at backend/db.json...`)
      initJSONDb()
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
    const { name, phone, service, date, time, duration, address, amount = 1200, paymentStatus = 'Unpaid', paymentMethod = '', transactionId = '', paymentDate = '', prescription = '', googleMapLocation = '' } = bookingData
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO bookings (name, phone, service, date, time, duration, address, amount, paymentStatus, paymentMethod, transactionId, paymentDate, prescription, googleMapLocation, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, phone, service, date, time, duration, address, amount, paymentStatus, paymentMethod, transactionId, paymentDate, prescription, googleMapLocation, createdAt]
      )
      return { id: result.insertId, name, phone, service, date, time, duration, address, status: 'Pending', assignedStaff: null, amount, paymentStatus, paymentMethod, transactionId, paymentDate, prescription, googleMapLocation, createdAt }
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
        prescription,
        googleMapLocation,
        createdAt
      }
      data.bookings.push(newBooking)
      await writeJSONDb(data)
      return newBooking
    }
  },
        amount,
        paymentStatus,
        paymentMethod,
        transactionId,
        paymentDate,
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
        data.bookings[bookingIdx] = {
          ...data.bookings[bookingIdx],
          status,
          assignedStaff,
          paymentStatus
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
      return rows
    } else {
      const data = await readJSONDb()
      return [...data.caregivers].reverse()
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
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      return data.caregivers.find(c => c.id === Number(id)) || null
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
    const { name, phone, service, date, time, duration, address, amount = 1200, userId = null, patientName = '', patientAge = '', patientNeeds = '', prescription = '', googleMapLocation = '' } = bookingData
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO bookings (name, phone, service, date, time, duration, address, amount, userId, createdAt, patientName, patientAge, patientNeeds, prescription, googleMapLocation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, phone, service, date, time, duration, address, amount, userId, createdAt, patientName, patientAge, patientNeeds, prescription, googleMapLocation]
      )
      return { id: result.insertId, name, phone, service, date, time, duration, address, status: 'Pending', assignedStaff: null, amount, paymentStatus: 'Unpaid', userId, createdAt, patientName, patientAge, patientNeeds, prescription, googleMapLocation }
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
        paymentStatus: 'Unpaid',
        userId: userId ? Number(userId) : null,
        patientName,
        patientAge,
        patientNeeds,
        prescription,
        googleMapLocation,
        createdAt
      }
      data.bookings.push(newBooking)
      await writeJSONDb(data)
      return newBooking
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
    const { name, phone, service, date, time, duration, address, status, assignedStaff, amount, paymentStatus, paymentMethod = '', transactionId = '', paymentDate = '' } = bookingData
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
        comingSoon: !!row.comingSoon
      }))
    } else {
      const data = await readJSONDb()
      if (!data.services) data.services = []
      return [...data.services].reverse()
    }
  },

  addService: async (serviceData) => {
    const { title, slug, short, description, benefits, duration, price, category, comingSoon = false, image = '' } = serviceData
    const benefitsStr = Array.isArray(benefits) ? JSON.stringify(benefits) : JSON.stringify([])
    const comingSoonVal = comingSoon ? 1 : 0
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO services (title, slug, short, description, benefits, duration, price, category, comingSoon, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, slug, short, description, benefitsStr, duration, price, category, comingSoonVal, image]
      )
      return { id: result.insertId, title, slug, short, description, benefits, duration, price, category, comingSoon, image }
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
        image
      }
      data.services.push(newService)
      await writeJSONDb(data)
      return newService
    }
  },

  updateService: async (id, serviceData) => {
    const { title, slug, short, description, benefits, duration, price, category, comingSoon = false, image } = serviceData
    const benefitsStr = Array.isArray(benefits) ? JSON.stringify(benefits) : JSON.stringify([])
    const comingSoonVal = comingSoon ? 1 : 0
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE services SET title = ?, slug = ?, short = ?, description = ?, benefits = ?, duration = ?, price = ?, category = ?, comingSoon = ?, image = COALESCE(?, image) WHERE id = ?',
        [title, slug, short, description, benefitsStr, duration, price, category, comingSoonVal, image !== undefined ? image : null, id]
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
          image: image !== undefined ? image : data.services[idx].image
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
        data.bookings[idx].status = status
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
  }
}
