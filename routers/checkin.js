const express = require("express");
const db = require("../db");
const router = express.Router();
const authenticateToken = require("./authen.js");

router.post("/", authenticateToken, async (req, res) => {
  const { userId, branchId, date, time } = req.body;

  //   const date = new Date().toLocaleDateString();
  //   const time = new Date().toLocaleTimeString("en-US", {
  //     hour12: false,
  //     hour: "numeric",
  //     minute: "numeric",
  //   }); // Get current time in HH:MM:SS format

  try {
    await checkin(userId, branchId, date, time);
    res.status(200).send({
      status: "Success: 200",
      message: "Check-in successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

async function checkin(userId, branchId, date, time) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Check if there's an existing check-in record for the user and branch
    const checkinQuery = `
        SELECT * FROM checkinhistory 
        WHERE userId = ? AND branchId = ? 
        ORDER BY checkinId DESC 
        LIMIT 1`;
    const [existingCheckin] = await connection.query(checkinQuery, [
      userId,
      branchId,
    ]);

    let count = 1;
    if (existingCheckin.length > 0) {
      count = existingCheckin[0].count + 1;
    }

    // Insert new check-in record
    const insertQuery = `
        INSERT INTO checkinhistory (userId, branchId, date, time, count) 
        VALUES (?, ?, ?, ?, ?)`;
    await connection.query(insertQuery, [userId, branchId, date, time, count]);

    // Update user points
    let pointQuery = `SELECT * FROM userpoint WHERE userId = ? AND branchId = ?`;
    const [existingPoint] = await connection.query(pointQuery, [
      userId,
      branchId,
    ]);

    if (existingPoint.length > 0) {
      // If a point record exists, update it
      pointQuery = `UPDATE userpoint SET points = points + 10 WHERE userId = ? AND branchId = ?`;
    } else {
      // If no point record exists, insert a new one
      pointQuery = `INSERT INTO userpoint (userId, branchId, points) VALUES (?, ?, 10)`;
    }

    await connection.query(pointQuery, [userId, branchId]);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

router.post("/history", authenticateToken, async (req, res) => {
  const { userId, branchId } = req.body;
  try {
    const history = await checkinhistory(userId, branchId);
    res.status(200).send({
      status: "Success: 200",
      message: "List check-in successful",
      result: history,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

async function checkinhistory(userId, branchId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const checkinQuery = `
        SELECT checkinId, userId, branchId, date, time, count
        FROM checkinhistory
        WHERE userId = ? AND branchId = ?
        ORDER BY checkinId DESC 
      `;
    const [history] = await connection.query(checkinQuery, [userId, branchId]);

    await connection.commit();
    return history;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// checkinhistory (nonile)

module.exports = router;
