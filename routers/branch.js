const express = require("express");
const db = require("../db"); // Assuming this connects to your database
const router = express.Router();
const authenticateToken = require("./authen.js");

// Improved user response format (optional ID and consistent naming)
const formatBranch = (row) => ({
  id_branch: row.id_branch || "",
  name_branch: row.name_branch,
  totaltable: row.totaltable,
  address: row.address,
  branchtype: row.branchtype,
  //branchtype = ประเภทร้าน
});

router.get("/", authenticateToken, async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM branchinfo");
    const branchs = results.map(formatBranch);
    res.send(branchs);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query(
      "SELECT * FROM branchinfo WHERE id_branch = ?",
      [id]
    );
    const branchs = results.map(formatBranch);
    res.send(branchs);
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
    !updateData.name_branch ||
    !updateData.totaltable ||
    !updateData.address ||
    !updateData.branchtype
  ) {
    return res.status(400).send({ message: "Missing required fields" });
  }

  try {
    const [updateResult] = await db.query(
      "UPDATE branchinfo SET ? WHERE id_branch = ?",
      [updateData, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).send({ message: "Row Not found" });
    }

    // Get the updated user after successful update
    const [Result] = await db.query(
      "SELECT * FROM branchinfo WHERE id_branch = ?",
      [id]
    );
    const updated = formatBranch(Result[0]);

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
      "DELETE FROM branchinfo WHERE id_branch = ?",
      [id]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).send({ message: "Not found" });
    }

    res.send({ message: "branch deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const { name_branch, totaltable, address, branchtype } = req.body;

  const branchData = {
    name_branch,
    totaltable,
    address,
    branchtype,
  };

  try {
    const result = await db.query("INSERT INTO branchinfo SET ?", branchData);
    // Get the inserted branch ID

    res.status(201).send({
      message: "branch created successfully",
      result: result[0],
      id_branch: result[0].insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "insert fail",
      error,
    });
  }
});

module.exports = router;
