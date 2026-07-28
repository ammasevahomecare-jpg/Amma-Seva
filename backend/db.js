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
  notifications: []
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
            comingSoon TINYINT DEFAULT 0
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

        // Add columns to existing tables if missing
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN password VARCHAR(255)`)
        } catch (e) {
          // ignore column already exists error
        }
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
    const { name, phone, service, date, time, duration, address, amount = 1200, paymentStatus = 'Unpaid', paymentMethod = '', transactionId = '', paymentDate = '' } = bookingData
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO bookings (name, phone, service, date, time, duration, address, amount, paymentStatus, paymentMethod, transactionId, paymentDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, phone, service, date, time, duration, address, amount, paymentStatus, paymentMethod, transactionId, paymentDate, createdAt]
      )
      return { id: result.insertId, name, phone, service, date, time, duration, address, status: 'Pending', assignedStaff: null, amount, paymentStatus, paymentMethod, transactionId, paymentDate, createdAt }
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
    const { name, phone, email, specialty, experience, password } = caregiverData
    const joinedAt = new Date().toISOString()
    const hashedPassword = await bcrypt.hash(password, 10)
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO caregivers (name, phone, email, specialty, experience, password, joinedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, phone, email, specialty, experience, hashedPassword, joinedAt]
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
        password: hashedPassword,
        status: 'Pending',
        joinedAt
      }
      data.caregivers.push(newCaregiver)
      await writeJSONDb(data)
      return newCaregiver
    }
  },

  // User Bookings Operations
  addBookingForUser: async (bookingData) => {
    const { name, phone, service, date, time, duration, address, amount = 1200, userId = null } = bookingData
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO bookings (name, phone, service, date, time, duration, address, amount, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, phone, service, date, time, duration, address, amount, userId, createdAt]
      )
      return { id: result.insertId, name, phone, service, date, time, duration, address, status: 'Pending', assignedStaff: null, amount, paymentStatus: 'Unpaid', userId, createdAt }
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
    const { name, phone, email, specialty, experience, status } = caregiverData
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE caregivers SET name = ?, phone = ?, email = ?, specialty = ?, experience = ?, status = ? WHERE id = ?',
        [name, phone, email, specialty, experience, status, id]
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
          status
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
    const { title, slug, short, description, benefits, duration, price, category, comingSoon = false } = serviceData
    const benefitsStr = Array.isArray(benefits) ? JSON.stringify(benefits) : JSON.stringify([])
    const comingSoonVal = comingSoon ? 1 : 0
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO services (title, slug, short, description, benefits, duration, price, category, comingSoon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, slug, short, description, benefitsStr, duration, price, category, comingSoonVal]
      )
      return { id: result.insertId, title, slug, short, description, benefits, duration, price, category, comingSoon }
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
        comingSoon: !!comingSoon
      }
      data.services.push(newService)
      await writeJSONDb(data)
      return newService
    }
  },

  updateService: async (id, serviceData) => {
    const { title, slug, short, description, benefits, duration, price, category, comingSoon = false } = serviceData
    const benefitsStr = Array.isArray(benefits) ? JSON.stringify(benefits) : JSON.stringify([])
    const comingSoonVal = comingSoon ? 1 : 0
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE services SET title = ?, slug = ?, short = ?, description = ?, benefits = ?, duration = ?, price = ?, category = ?, comingSoon = ? WHERE id = ?',
        [title, slug, short, description, benefitsStr, duration, price, category, comingSoonVal, id]
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
          comingSoon: !!comingSoon
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
  }
}
