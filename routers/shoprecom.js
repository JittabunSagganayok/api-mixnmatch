const express = require("express");
const db = require("../db"); // Assuming this connects to your database
const router = express.Router();
const authenticateToken = require("./authen.js");

// Improved user response format (optional ID and consistent naming)
const formatShop = (row) => ({
  id: row.shopId || "",
  bannerimage: row.bannerimage,
  shoptitle: row.shoptitle,
  shopdesc: row.shopdesc,
  status: row.status,
});

router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM shoprecommend");
    const shops = results.map(formatShop);
    res.send(shops);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query(
      "SELECT * FROM shoprecommend WHERE shopId = ?",
      [id]
    );
    const shops = results.map(formatShop);
    res.send(shops);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

// Update user by ID
router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  //   console.log("type of id :", typeof id, id);
  const updateData = req.body; // User data to be updated

  // Check for required fields (modify as needed)
  //   if (
  //     !updateData.bannerimage ||
  //     !updateData.shoptitle ||
  //     !updateData.shopdesc ||
  //     !updateData.status
  //   ) {
  //     return res.status(400).send({ message: "Missing required fields" });
  //   }

  try {
    const [updateResult] = await db.query(
      "UPDATE shoprecommend SET ? WHERE shopId = ?",
      [updateData, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).send({ message: "Row Not found" });
    }

    // Get the updated user after successful update
    const [Result] = await db.query(
      "SELECT * FROM shoprecommend WHERE shopId = ?",
      [id]
    );
    const updated = formatShop(Result[0]);

    res.send(updated);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

// Delete user by ID
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [deleteResult] = await db.query(
      "DELETE FROM shoprecommend WHERE shopId = ?",
      [id]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).send({ message: "Not found" });
    }

    res.send({ message: "Shop deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  const { bannerimage, shoptitle, shopdesc, status } = req.body;

  const shopData = {
    bannerimage,
    shoptitle,
    shopdesc,
    status,
  };

  try {
    const result = await db.query("INSERT INTO shoprecommend SET ?", shopData);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "insert fail",
      error,
    });
  }

  res.status(201).send({ message: "Shop created successfully" });
});

module.exports = router;
