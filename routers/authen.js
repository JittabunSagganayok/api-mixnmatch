const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const router = express.Router();

const secret = "mysecret";
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  //   const token = req.cookies.token;
  //   console.log("session", req.session.userId);

  if (token == null) return res.sendStatus(401); // if there isn't any token

  try {
    const user = jwt.verify(token, secret);
    req.user = user;
    //เอา ข้อมูล จาก JWT token
    console.log("Get Data From Beaer Token :", user);
    // this role cannot access แก้ตรงนี้
    // user.roleshow != "customer"
    true
      ? // || user.roleshow == "admin"
        next()
      : res.send("this role cannot access");
  } catch (error) {
    return res.sendStatus(403);
  }
};

module.exports = authenticateToken;
