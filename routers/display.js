const express = require("express");
const db = require("../db"); // Assuming this connects to your database
const router = express.Router();
const authenticateToken = require("./authen.js");

// const formatDisplay = (row) => ({
//   id: row.blogId || "",
//   bannerimage: row.bannerimage,
//   blogtitle: row.blogtitle,
//   blogdesc: row.blogdesc,
//   status: row.status,
// });
router.get("/", authenticateToken, async (req, res) => {
  try {
    const branchId = req.query.branchId;

    if (!branchId) {
      return res.status(400).send({ message: "branchId is required" });
    }

    const [results] = await db.query(
      `SELECT d.*, u.username 
       FROM displayshow d 
       LEFT JOIN users u ON d.userId = u.userId
       WHERE d.branchId = ?`,
      [branchId]
    );

    const display = results;

    res.send({ result: display });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  const { displayimage, displaytext, socialId, userId, branchId } = req.body;

  const blogData = {
    displayimage,
    displaytext,
    socialId,
    userId,
    branchId,
  };

  try {
    const result = await db.query("INSERT INTO displayshow SET ?", blogData);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "insert fail",
      error,
    });
  }

  res.status(201).send({ message: "displayshow created successfully" });
});

module.exports = router;
