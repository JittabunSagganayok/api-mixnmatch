const express = require("express");
const db = require("../db");
const router = express.Router();
const authenticateToken = require("./authen.js");
//ดึง list customer เพศตรงข้ามในร้านเดียวกัน
router.post("/list", authenticateToken, async (req, res) => {
  const { userId, branchId } = req.body;

  try {
    const userList = await getUsersToSwipe(userId, branchId);
    res.status(200).send({
      status: "Success: 200",
      message: "User list retrieved successfully",
      result: userList,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

async function getUsersToSwipe(userId, branchId) {
  const connection = await db.getConnection();
  try {
    const [currentUser] = await connection.query(
      "SELECT gender FROM users WHERE userId = ?",
      [userId]
    );

    const query = `
  SELECT u.*
  FROM users u
  WHERE JSON_CONTAINS(u.branchId, CAST(? AS JSON))
    AND u.gender != ?
    AND u.userId != ?
    AND u.role = 'customer'
    AND u.userId NOT IN (
      SELECT targetUserId
      FROM matchswipe
      WHERE userId = ? AND branchId = ?
    )
  LIMIT 100
`;

    const [users] = await connection.query(query, [
      branchId,
      currentUser[0].gender,
      userId,
      userId,
      branchId,
    ]);

    return users;
  } finally {
    connection.release();
  }
}

//เส้น submit ปัดชอบ ถ้ามี record ว่าอีกฝั่งปัดเราแล้ว จะ return ว่า match ถ้ายังจะเก็บเข้า table
// ตย. response
// { แบบ MATCH
//     "status": "Success: 200",
//     "message": "Match!",
//     "isMatch": true
//   }
//แบบไม่ MATCH
// {
//     "status": "Success: 200",
//     "message": "Swipe recorded successfully",
//     "isMatch": false
//   }
router.post("/submit", authenticateToken, async (req, res) => {
  const { userId, targetUserId, branchId } = req.body;

  try {
    const result = await submitSwipe(userId, targetUserId, branchId);
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
async function submitSwipe(userId, targetUserId, branchId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Check if swipe already exists
    const [existingSwipe] = await connection.query(
      "SELECT * FROM matchswipe WHERE userId = ? AND targetUserId = ? AND branchId = ?",
      [userId, targetUserId, branchId]
    );

    if (existingSwipe.length > 0) {
      await connection.rollback();
      return {
        status: "Skipped",
        message: "Swipe already exists",
        isMatch: false,
      };
    }

    // 2. Insert the new swipe
    await connection.query(
      "INSERT INTO matchswipe (userId, targetUserId, branchId) VALUES (?, ?, ?)",
      [userId, targetUserId, branchId]
    );

    // 3. Check if there's a mutual match
    const [mutualMatch] = await connection.query(
      "SELECT * FROM matchswipe WHERE userId = ? AND targetUserId = ? AND branchId = ?",
      [targetUserId, userId, branchId]
    );

    await connection.commit();

    // 4. Return response based on mutual match
    if (mutualMatch.length > 0) {
      return {
        status: "Success: 200",
        message: "Match!",
        isMatch: true,
      };
    } else {
      return {
        status: "Success: 200",
        message: "Swipe recorded successfully",
        isMatch: false,
      };
    }
  } catch (error) {
    await connection.rollback();
    console.error("Error in submitSwipe:", error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = router;
