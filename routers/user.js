const express = require("express");
const db = require("../db"); // Assuming this connects to your database
const router = express.Router();
const authenticateToken = require("./authen.js");

// Improved user response format (optional ID and consistent naming)
const formatUser = (row) => ({
  id: row.userId || "",
  fname: row.fname,
  lname: row.lname,
  email: row.email,
  phone: row.phone,
  username: row.username,
  avatar: row.avatar,
  gender: row.gender,
  age: row.age,
  branchId: row.branchId,
  // [...row.branchId, 1],
  role: row.role,
  isActive: row.isActive,
});
const formatUsereachBranch = (row) => ({
  id: row.userId || "",
  fname: row.fname,
  lname: row.lname,
  username: row.username,
  email: row.email,

  gender: row.gender,
  age: row.age,
  avatar: row.avatar,
  phone: row.phone,
  isActive: row.isActive,
  dateRegis: row.dateRegis,
  point: row.point,
  role: row.role,
  isActive: row.isActive,
});
const formatUserRequestJoin = (row) => ({
  name_branch: row.name_branch,
  username: row.username,
  address: row.address,
  phone: row.phone,
  email: row.email,
  isActive: row.isActive,
  userId: row.userId,
});

// Get all users (existing functionality)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM users");
    const users = results.map(formatUser);
    res.send(users);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});
router.get("/requestjoin", authenticateToken, async (req, res) => {
  try {
    const [results] = await db.query(`SELECT 
    bi.name_branch,
    u.username,
    bi.address,
    u.phone,
    u.email,
    u.isActive,
    u.userId
  FROM branchinfo bi
  INNER JOIN users u ON JSON_CONTAINS(u.branchId, CAST(bi.id_branch AS JSON))
  WHERE u.role = 'shopadmin';
  `);
    const usersRequestjoin = results.map(formatUserRequestJoin);
    res.send(usersRequestjoin);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});
//ข้อมูล user แต่ละ สาขา
router.get("/branch/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query(
      `SELECT u.*, COALESCE(up.points, 0) AS point
      FROM users u
      LEFT JOIN userpoint up ON u.userId = up.userId
        AND JSON_CONTAINS(u.branchId, CAST(up.branchId AS JSON))
        AND up.branchId = ?
      WHERE u.role = 'customer'
    AND JSON_CONTAINS(u.branchId, CAST('[${id}]' AS JSON));
    
  `,
      [id]
    );
    const u = results.map(formatUsereachBranch);
    res.send(u);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query("SELECT * FROM users WHERE userId = ?", [
      id,
    ]);
    const users = results.map(formatUser);
    res.send(users);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

// Update user by ID
router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  console.log("type of id :", typeof id, id);
  const updateData = req.body; // User data to be updated

  // Check for required fields (modify as needed)
  // if (!updateData.email || !updateData.fname || !updateData.lname) {
  //   return res.status(400).send({ message: "Missing required fields" });
  // }

  try {
    const [updateResult] = await db.query(
      "UPDATE users SET ? WHERE userId = ?",
      [updateData, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    // Get the updated user after successful update
    const [userResult] = await db.query(
      "SELECT * FROM users WHERE userId = ?",
      [id]
    );
    const updatedUser = formatUser(userResult[0]);

    res.send(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});
// Update user branchId by ID
router.put("/branchid/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { branchid } = req.body; // Branch ID to be added

  try {
    // Get the current branchId from the user
    const [userResult] = await db.query(
      "SELECT branchId FROM users WHERE userId = ?",
      [id]
    );
    const currentUserBranchId = userResult[0].branchId;
    //*** in this line check branchid is already in currentUserBranchId if its already have dont update
    if (currentUserBranchId.includes(branchid)) {
      return res
        .status(400)
        .send({ message: "Branch ID already exists for this user" });
    }
    // Add the new branchId to the current branchId array
    const updatedBranchId = [...currentUserBranchId, branchid];

    const updatedBranchIdJSON = JSON.stringify(updatedBranchId);

    // Update the user with the new branchId
    const [updateResult] = await db.query(
      "UPDATE users SET branchId = ? WHERE userId = ?",
      [updatedBranchIdJSON, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    // Get the updated user after successful update
    const [updatedUserResult] = await db.query(
      "SELECT * FROM users WHERE userId = ?",
      [id]
    );
    const updatedUser = formatUser(updatedUserResult[0]);

    res.send(updatedUser);
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
      "DELETE FROM users WHERE userId = ?",
      [id]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

module.exports = router;
