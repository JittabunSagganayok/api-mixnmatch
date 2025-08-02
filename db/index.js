// const mysql = require("mysql2/promise");

// // Environment variables (recommended for security)
// require("dotenv").config();

// // const db = mysql.createConnection(process.env.DB_URL);

// const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD, // Placeholder, replace with a strong password
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT,
//   // Optional connection pool configuration
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// module.exports = db;

const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    // Use secure transport — required for TiDB Serverless
    rejectUnauthorized: true,
  },
};

console.log("Database connection config:", {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
  ssl: dbConfig.ssl ? "enabled" : "disabled",
});

const db = mysql.createPool(dbConfig);

// Test connection
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("Database connection successful!");
    connection.release();
  } catch (err) {
    console.error("Database connection error:", err.message);
    console.error("Full error:", err);
  }
})();

module.exports = db;
