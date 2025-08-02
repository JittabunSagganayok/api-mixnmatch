const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const router = express.Router();

const secret = "mysecret";

router.post("/register", async (req, res) => {
  const {
    email,
    username,
    password,
    gender,
    age,
    branchId,
    role,
    fname,
    lname,
    avatar,
    isActive,
  } = req.body;

  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", email);
  if (rows.length) {
    return res.status(400).send({ message: "Email is already registered" });
  }

  // Hash the password
  const hash = await bcrypt.hash(password, 10);

  // Store the user data
  //   let gender = "male";
  //   let age = 24;
  const userData = {
    email,
    username,
    password: hash,
    gender,
    age,
    branchId: JSON.stringify(branchId),
    role,
    fname,
    lname,
    avatar,
    isActive,
    dateRegis: new Date().toISOString().slice(0, 19).replace("T", " "),
  };

  try {
    const result = await db.query("INSERT INTO users SET ?", userData);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "insert fail",
      error,
    });
  }

  res.status(201).send({ message: "User registered successfully" });
});

router.post("/changepassword", async (req, res) => {
  const { email, newpassword } = req.body;

  if (!email || !newpassword) {
    return res
      .status(400)
      .json({ message: "Email and new password are required" });
  }

  try {
    // Check if the user exists
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newpassword, 10);

    // Update the password in the database
    await db.query("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [result] = await db.query("SELECT * from users WHERE email = ?", email);

  const user = result[0];
  if (user === undefined) {
    var match = false;
  } else {
    var match = await bcrypt.compare(password, user.password);
    var roleshow = user.role;
    var userid = user.userId;
    var branchId = user.branchId;
    var username = user.username;
    var isActive = user.isActive;
  }

  if (!match) {
    return res.status(400).send({ message: "Invalid email or password" });
  }
  // Create a token
  const token = jwt.sign(
    { email, userid, roleshow, branchId, username },
    secret,
    {
      expiresIn: "2400h",
    }
  );

  // res.cookie("token", token, {
  //   maxAge: 300000,
  //   secure: true,
  //   httpOnly: true,
  //   sameSite: "none",
  // });

  // req.session.userId = user.id;
  // console.log("save session", req.session.userId);

  res.send({
    message: "Login successful",
    token,
    username,
    roleshow,
    userid,
    branchId,
    isActive,
  });
});

// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1];
//   //   const token = req.cookies.token;
//   //   console.log("session", req.session.userId);

//   if (token == null) return res.sendStatus(401); // if there isn't any token

//   try {
//     const user = jwt.verify(token, secret);
//     req.user = user;
//     console.log("user", user);
//     user.role == "user" ? next() : res.send("this role cannot access");
//   } catch (error) {
//     return res.sendStatus(403);
//   }
// };

module.exports = router;
// module.exports = authenticateToken;
