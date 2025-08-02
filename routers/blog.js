const express = require("express");
const db = require("../db"); // Assuming this connects to your database
const router = express.Router();
const authenticateToken = require("./authen.js");

// Improved user response format (optional ID and consistent naming)
const formatBlog = (row) => ({
  id: row.blogId || "",
  bannerimage: row.bannerimage,
  blogtitle: row.blogtitle,
  blogdesc: row.blogdesc,
  status: row.status,
});
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM bloginformation");
    const blogs = results.map(formatBlog);
    res.send(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query(
      "SELECT * FROM bloginformation WHERE blogId = ?",
      [id]
    );
    const blogs = results.map(formatBlog);
    res.send(blogs);
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
  if (
    !updateData.bannerimage ||
    !updateData.blogtitle ||
    !updateData.blogdesc ||
    !updateData.status
  ) {
    return res.status(400).send({ message: "Missing required fields" });
  }

  try {
    const [updateResult] = await db.query(
      "UPDATE bloginformation SET ? WHERE blogId = ?",
      [updateData, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).send({ message: "Row Not found" });
    }

    // Get the updated user after successful update
    const [Result] = await db.query(
      "SELECT * FROM bloginformation WHERE blogId = ?",
      [id]
    );
    const updated = formatBlog(Result[0]);

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
      "DELETE FROM bloginformation WHERE blogId = ?",
      [id]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).send({ message: "Not found" });
    }

    res.send({ message: "blog deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  const { bannerimage, blogtitle, blogdesc, status } = req.body;

  const blogData = {
    bannerimage,
    blogtitle,
    blogdesc,
    status,
  };

  try {
    const result = await db.query(
      "INSERT INTO bloginformation SET ?",
      blogData
    );
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "insert fail",
      error,
    });
  }

  res.status(201).send({ message: "blog created successfully" });
});

module.exports = router;
