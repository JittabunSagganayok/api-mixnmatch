const mysql = require("mysql2/promise");

// Environment variables (recommended for security)
// require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root", // Placeholder, replace with a strong password
  database: process.env.DB_NAME || "mixnmatch01",
  port: process.env.DB_PORT || 3306,
  // Optional connection pool configuration
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = db;
