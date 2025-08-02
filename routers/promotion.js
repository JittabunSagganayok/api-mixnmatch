const express = require("express");
const db = require("../db");
const router = express.Router();
const authenticateToken = require("./authen.js");

async function createReedeemPromotion(
  redeemtype_name,
  redeemtype_desc,
  redeemgift,
  redeemtype_point,
  redeemtype_limit,
  isExpired,
  branchId
) {
  try {
    const result = await db.query(
      `INSERT INTO redeemtype (redeemtype_name,redeemtype_desc , redeemgift, redeemtype_point, redeemtype_limit, isExpired,branchId) VALUES (?,?,?,?,?,?,?)`,
      [
        redeemtype_name,
        redeemtype_desc,
        redeemgift,
        redeemtype_point,
        redeemtype_limit,
        isExpired,
        branchId,
      ]
    );

    return result;
  } catch (error) {
    throw error;
  }
}

router.post("/", authenticateToken, async (req, res) => {
  try {
    const redeemtype = req.body;

    // const createdPromo = [];

    const bookingResult = await createReedeemPromotion(
      redeemtype.redeemtype_name,
      redeemtype.redeemtype_desc,
      redeemtype.redeemgift,
      redeemtype.redeemtype_point,
      redeemtype.redeemtype_limit,
      redeemtype.isExpired,
      redeemtype.branchId
    );
    // createdPromo.push(bookingResult);

    res
      .status(201)
      .send({ message: "Promo created successfully", bookingResult });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  const { idBranch } = req.query;
  try {
    const promos = await getPromos(idBranch);

    res.status(200).send({
      status: "Success: 200",
      message: "All Reedeem Promotions",
      result: promos,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

async function getPromos(idBranch) {
  let query = `SELECT * FROM redeemtype WHERE branchId = ?`;

  const result = await db.query(query, [idBranch]);

  return result[0];
}

module.exports = router;
