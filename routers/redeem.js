const express = require("express");
const db = require("../db");
const router = express.Router();
const authenticateToken = require("./authen.js");

router.post("/", authenticateToken, async (req, res) => {
  const { redeemtypeId, userId, pointredeem, date, time, status, branchId } =
    req.body;
  try {
    await redeem(
      redeemtypeId,
      userId,
      pointredeem,
      date,
      time,
      status,
      branchId
    );
    res.status(200).send({
      status: "Success: 200",
      message: "Redeem successful",
    });
  } catch (err) {
    console.error(err);
    if (err.message === "Not enough points") {
      res.status(400).send({ message: "Not enough points for redemption" });
    } else {
      res.status(500).send({ message: "Server error" });
    }
  }
});

async function redeem(
  redeemtypeId,
  userId,
  pointredeem,
  date,
  time,
  status,
  branchId
) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if user has enough points
    const [userPoints] = await connection.query(
      "SELECT points FROM userpoint WHERE userId = ? AND branchId = ?",
      [userId, branchId]
    );

    if (userPoints.length === 0 || userPoints[0].points < pointredeem) {
      throw new Error("Not enough points");
    }

    // Update userpoint table
    await connection.query(
      "UPDATE userpoint SET points = points - ? WHERE userId = ? AND branchId = ?",
      [pointredeem, userId, branchId]
    );

    // Add new row to redeempointhistory table
    await connection.query(
      "INSERT INTO redeempointhistory (redeemtypeId, userId, pointredeem, date, time, status, branchId) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [redeemtypeId, userId, pointredeem, date, time, status, branchId]
    );

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
    const history = await redeemhistory(userId, branchId);
    res.status(200).send({
      status: "Success: 200",
      message: "List Redeem successful",
      result: history,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

async function redeemhistory(userId, branchId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const checkinQuery = `
        SELECT *
        FROM redeempointhistory
        WHERE userId = ? AND branchId = ?
        ORDER BY redeemhisId DESC
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

router.post("/mypoints", authenticateToken, async (req, res) => {
  const { userId, branchId } = req.body;
  try {
    const mypoint = await getmypoint(userId, branchId);
    res.status(200).send({
      status: "Success: 200",
      message: "Get point successful",
      result: mypoint[0] || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

async function getmypoint(userId, branchId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const pQuery = `
        SELECT *
        FROM userpoint
        WHERE userId = ? AND branchId = ?
      `;
    const [mp] = await connection.query(pQuery, [userId, branchId]);

    await connection.commit();
    return mp;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// checkinhistory (nonile)

module.exports = router;
