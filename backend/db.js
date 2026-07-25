import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Resolve dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const JSON_DB_PATH = path.join(__dirname, 'db.json')

let pool = null
let useMySQL = false

// Initialize JSON database with default template
const initJSONDb = () => {
  if (!fs.existsSync(JSON_DB_PATH)) {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify({ volunteers: [], donations: [], enquiries: [] }, null, 2))
  } else {
    // Migrate to ensure enquiries array exists in JSON
    try {
      const data = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'))
      if (!data.enquiries) {
        data.enquiries = []
        fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2))
      }
    } catch (e) {
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify({ volunteers: [], donations: [], enquiries: [] }, null, 2))
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
    // Check if MySQL environment variables are configured
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

        connection.release()
        useMySQL = true
        console.log(`✅ MySQL Tables verified successfully!`)
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

  // Volunteers Operations
  getVolunteers: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM volunteers ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      return [...data.volunteers].reverse()
    }
  },

  addVolunteer: async (name, email) => {
    const registeredAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO volunteers (name, email, registeredAt) VALUES (?, ?, ?)',
        [name, email, registeredAt]
      )
      return { id: result.insertId, name, email, registeredAt }
    } else {
      const data = await readJSONDb()
      const newVolunteer = {
        id: data.volunteers.length > 0 ? Math.max(...data.volunteers.map(v => v.id)) + 1 : 1,
        name,
        email,
        registeredAt
      }
      data.volunteers.push(newVolunteer)
      await writeJSONDb(data)
      return newVolunteer
    }
  },

  deleteVolunteer: async (id) => {
    if (useMySQL) {
      await pool.query('DELETE FROM volunteers WHERE id = ?', [id])
      return true
    } else {
      const data = await readJSONDb()
      const initialLength = data.volunteers.length
      data.volunteers = data.volunteers.filter(v => v.id !== Number(id))
      await writeJSONDb(data)
      return data.volunteers.length < initialLength
    }
  },

  // Donations Operations
  getDonations: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM donations ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      return [...data.donations].reverse()
    }
  },

  addDonation: async (amount) => {
    const donatedAt = new Date().toISOString()
    const parsedAmount = Number(amount)
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO donations (amount, donatedAt) VALUES (?, ?)',
        [parsedAmount, donatedAt]
      )
      return { id: result.insertId, amount: parsedAmount, donatedAt }
    } else {
      const data = await readJSONDb()
      const newDonation = {
        id: data.donations.length > 0 ? Math.max(...data.donations.map(d => d.id)) + 1 : 1,
        amount: parsedAmount,
        donatedAt
      }
      data.donations.push(newDonation)
      await writeJSONDb(data)
      return newDonation
    }
  },

  deleteDonation: async (id) => {
    if (useMySQL) {
      await pool.query('DELETE FROM donations WHERE id = ?', [id])
      return true
    } else {
      const data = await readJSONDb()
      const initialLength = data.donations.length
      data.donations = data.donations.filter(d => d.id !== Number(id))
      await writeJSONDb(data)
      return data.donations.length < initialLength
    }
  }
}
