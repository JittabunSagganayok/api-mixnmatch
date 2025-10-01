const express = require("express");
const db = require("../db");
const router = express.Router();
const authenticateToken = require("./authen.js");
// SELECT *
// FROM checkinhistory ch
// INNER JOIN (
//     SELECT u.*, COALESCE(up.points, 0) AS point
//     FROM users u
//     LEFT JOIN userpoint up ON u.userId = up.userId
//         AND JSON_CONTAINS(u.branchId, CAST(up.branchId AS JSON))
//         AND up.branchId = 1 -- Assuming branchId is an integer
//     WHERE u.role = 'customer'
//     AND JSON_CONTAINS(u.branchId, CAST('[1]' AS JSON)) -- Assuming 1 is the branchId
// ) AS u ON ch.userId = u.userId;
//Check-In List

router.get("/recentcheckin", authenticateToken, async (req, res) => {
  //จำนวนการจองโต๊ะ
  const { idBranch } = req.query;
  // ?idBranch=2
  try {
    const list = await getRecentcheckin(idBranch);

    res.status(200).send({
      status: "Success: 200",
      message: "Get ListRecentcheckin Success",
      result: list,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});
async function getRecentcheckin(idBranch) {
  let query = `SELECT *
   FROM checkinhistory ch
   INNER JOIN (
       SELECT u.*, COALESCE(up.points, 0) AS point
       FROM users u
       LEFT JOIN userpoint up ON u.userId = up.userId
           AND JSON_CONTAINS(u.branchId, CAST(up.branchId AS JSON))
           AND up.branchId = ${idBranch} 
       WHERE u.role = 'customer'
       AND JSON_CONTAINS(u.branchId, CAST('[${idBranch}]' AS JSON)) 
   ) AS u ON ch.userId = u.userId
   order by date desc , time desc
   ;`;

  const result = await db.query(query);

  return result[0];
}

router.get("/maincount", authenticateToken, async (req, res) => {
  //จำนวนการจองโต๊ะ
  const { idBranch } = req.query;
  // ?idBranch=2
  try {
    const bookingcount = await getBookingcount(idBranch);
    const checkincount = await getCheckincount(idBranch);
    const redeemcount = await getRedeemcount(idBranch);

    res.status(200).send({
      status: "Success: 200",
      message: "Get Bookingcount Success",
      result: {
        bookingcount: bookingcount,
        checkincount: checkincount,
        redeemcount: redeemcount,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

async function getBookingcount(idBranch) {
  // DATE(CONVERT_TZ(datereserve, 'UTC', '+07:00')) = CURDATE()
  let query = `SELECT 
  'Today' AS period,
  COALESCE(today_reserve_count, 0) AS reserve_count
FROM (
  SELECT 
      COUNT(*) AS today_reserve_count
  FROM 
      reservehistory
  WHERE 
      DATE(datereserve) = CURDATE()
      AND id_branch = ${idBranch}
      AND isAdmin = 0
) AS today_reservations

UNION

SELECT 
  'This Month' AS period,
  COALESCE(this_month_reserve_count, 0) AS reserve_count
FROM (
  SELECT 
      COUNT(*) AS this_month_reserve_count
  FROM 
      reservehistory
  WHERE 
      YEAR(datereserve) = YEAR(CURDATE())
      AND MONTH(datereserve) = MONTH(CURDATE())
      AND id_branch =  ${idBranch}
      AND isAdmin = 0
) AS this_month_reservations

UNION

SELECT 
  'This Year' AS period,
  COALESCE(this_year_reserve_count, 0) AS reserve_count
FROM (
  SELECT 
      COUNT(*) AS this_year_reserve_count
  FROM 
      reservehistory
  WHERE 
      YEAR(datereserve) = YEAR(CURDATE())
      AND id_branch =  ${idBranch}
      AND isAdmin = 0
) AS this_year_reservations; `;

  const result = await db.query(query);

  return result[0];
}

async function getCheckincount(idBranch) {
  let query = `SELECT 
  'Today' AS period,
  COALESCE(today_checkin_count, 0) AS checkin_count
FROM (
  SELECT 
      COUNT(*) AS today_checkin_count
  FROM 
      checkinhistory
  WHERE 
      DATE(date) = CURDATE()
      AND branchId = ${idBranch}
) AS today_checkins

UNION

SELECT 
  'This Month' AS period,
  COALESCE(this_month_checkin_count, 0) AS checkin_count
FROM (
  SELECT 
      COUNT(*) AS this_month_checkin_count
  FROM 
      checkinhistory
  WHERE 
      YEAR(date) = YEAR(CURDATE())
      AND MONTH(date) = MONTH(CURDATE())
      AND branchId = ${idBranch}
) AS this_month_checkins

UNION

SELECT 
  'This Year' AS period,
  COALESCE(this_year_checkin_count, 0) AS checkin_count
FROM (
  SELECT 
      COUNT(*) AS this_year_checkin_count
  FROM 
      checkinhistory
  WHERE 
      YEAR(date) = YEAR(CURDATE())
      AND branchId = ${idBranch}
) AS this_year_checkins;`;

  const result = await db.query(query);

  return result[0];
}

async function getRedeemcount(idBranch) {
  let query = ` SELECT 
  'Today' AS period,
  COALESCE(today_redeem_count, 0) AS redeem_count
FROM (
  SELECT 
      COUNT(*) AS today_redeem_count
  FROM 
      redeempointhistory
  WHERE 
      DATE(date) = CURDATE()
      AND branchId =  ${idBranch}
) AS today_redeems

UNION

SELECT 
  'This Month' AS period,
  COALESCE(this_month_redeem_count, 0) AS redeem_count
FROM (
  SELECT 
      COUNT(*) AS this_month_redeem_count
  FROM 
      redeempointhistory
  WHERE 
      YEAR(date) = YEAR(CURDATE())
      AND MONTH(date) = MONTH(CURDATE())
      AND branchId =  ${idBranch}
) AS this_month_redeems

UNION

SELECT 
  'This Year' AS period,
  COALESCE(this_year_redeem_count, 0) AS redeem_count
FROM (
  SELECT 
      COUNT(*) AS this_year_redeem_count
  FROM 
      redeempointhistory
  WHERE 
      YEAR(date) = YEAR(CURDATE())
      AND branchId =  ${idBranch}
) AS this_year_redeems; `;

  const result = await db.query(query);

  return result[0];
}

router.get("/graphdata", authenticateToken, async (req, res) => {
  //จำนวนการจองโต๊ะ
  const { idBranch } = req.query;
  // ?idBranch=2
  try {
    const list = await getGraphdata(idBranch);

    res.status(200).send({
      status: "Success: 200",
      message: "Get Graphdata Success",
      result: list,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});
async function getGraphdata(idBranch) {
  let query = ` SELECT 
    'Jan' AS name,
    COALESCE(Jan_checkin_count, 0) AS CheckIn,
    COALESCE(Jan_registration_count, 0) AS User
FROM (
    SELECT 
        COUNT(*) AS Jan_checkin_count
    FROM 
        checkinhistory
    WHERE 
        MONTH(date) = 1
        AND branchId = ${idBranch}
) AS Jan_checkins
CROSS JOIN (
    SELECT 
        COUNT(*) AS Jan_registration_count
    FROM 
        users
    WHERE 
        MONTH(dateRegis) = 1
        AND JSON_CONTAINS(branchId, CAST('[${idBranch}]' AS JSON))
        AND role = 'customer'
) AS Jan_registrations

UNION ALL

SELECT 
    'Feb' AS name,
    COALESCE(Feb_checkin_count, 0) AS CheckIn,
    COALESCE(Feb_registration_count, 0) AS User
FROM (
    SELECT 
        COUNT(*) AS Feb_checkin_count
    FROM 
        checkinhistory
    WHERE 
        MONTH(date) = 2
        AND branchId = ${idBranch}
) AS Feb_checkins
CROSS JOIN (
    SELECT 
        COUNT(*) AS Feb_registration_count
    FROM 
        users
    WHERE 
        MONTH(dateRegis) = 2
        AND JSON_CONTAINS(branchId, CAST('[${idBranch}]' AS JSON))
        AND role = 'customer'
) AS Feb_registrations

UNION ALL

SELECT 
    'Mar' AS name,
    COALESCE(Mar_checkin_count, 0) AS CheckIn,
    COALESCE(Mar_registration_count, 0) AS User
FROM (
    SELECT 
        COUNT(*) AS Mar_checkin_count
    FROM 
        checkinhistory
    WHERE 
        MONTH(date) = 3
        AND branchId = ${idBranch}
) AS Mar_checkins
CROSS JOIN (
    SELECT 
        COUNT(*) AS Mar_registration_count
    FROM 
        users
    WHERE 
        MONTH(dateRegis) = 3
        AND JSON_CONTAINS(branchId, CAST('[${idBranch}]' AS JSON))
        AND role = 'customer'
) AS Mar_registrations

UNION ALL

SELECT 
    'Apr' AS name,
    COALESCE(Apr_checkin_count, 0) AS CheckIn,
    COALESCE(Apr_registration_count, 0) AS User
FROM (
    SELECT 
        COUNT(*) AS Apr_checkin_count
    FROM 
        checkinhistory
    WHERE 
        MONTH(date) = 4
        AND branchId = ${idBranch}
) AS Apr_checkins
CROSS JOIN (
    SELECT 
        COUNT(*) AS Apr_registration_count
    FROM 
        users
    WHERE 
        MONTH(dateRegis) = 4
        AND JSON_CONTAINS(branchId, CAST('[${idBranch}]' AS JSON))
        AND role = 'customer'
) AS Apr_registrations

UNION ALL

SELECT 
    'May' AS name,
    COALESCE(May_checkin_count, 0) AS CheckIn,
    COALESCE(May_registration_count, 0) AS User
FROM (
    SELECT 
        COUNT(*) AS May_checkin_count
    FROM 
        checkinhistory
    WHERE 
        MONTH(date) = 5
        AND branchId = ${idBranch}
) AS May_checkins
CROSS JOIN (
    SELECT 
        COUNT(*) AS May_registration_count
    FROM 
        users
    WHERE 
        MONTH(dateRegis) = 5
        AND JSON_CONTAINS(branchId, CAST('[${idBranch}]' AS JSON))
        AND role = 'customer'
) AS May_registrations

UNION ALL

SELECT 
    'Jun' AS name,
    COALESCE(Jun_checkin_count, 0) AS CheckIn,
    COALESCE(Jun_registration_count, 0) AS User
FROM (
    SELECT 
        COUNT(*) AS Jun_checkin_count
    FROM 
        checkinhistory
    WHERE 
        MONTH(date) = 6
        AND branchId = ${idBranch}
) AS Jun_checkins
CROSS JOIN (
    SELECT 
        COUNT(*) AS Jun_registration_count
    FROM 
        users
    WHERE 
        MONTH(dateRegis) = 6
        AND JSON_CONTAINS(branchId, CAST('[${idBranch}]' AS JSON))
        AND role = 'customer'
) AS Jun_registrations

UNION ALL

SELECT 
    'Jul' AS name,
    COALESCE(Jul_checkin_count, 0) AS CheckIn,
    COALESCE(Jul_registration_count, 0) AS User
FROM (
    SELECT 
        COUNT(*) AS Jul_checkin_count
    FROM 
        checkinhistory
    WHERE 
        MONTH(date) = 7
        AND branchId = ${idBranch}
) AS Jul_checkins
CROSS JOIN (
    SELECT 
        COUNT(*) AS Jul_registration_count
    FROM 
        users
    WHERE 
    
        MONTH(dateRegis) = 7
        AND JSON_CONTAINS(branchId, CAST('[${idBranch}]' AS JSON))
        AND role = 'customer'
) AS Jul_registrations

UNION ALL

SELECT 
    'Aug' AS name,
    COALESCE(Aug_checkin_count, 0) AS CheckIn,
    COALESCE(Aug_registration_count, 0) AS User
FROM (
    SELECT 
        COUNT(*) AS Aug_checkin_count
    FROM 
        checkinhistory
    WHERE 
        MONTH(date) = 8
        AND branchId = ${idBranch}
) AS Aug_checkins
CROSS JOIN (
    SELECT 
        COUNT(*) AS Aug_registration_count
    FROM 
        users
    WHERE 
        MONTH(dateRegis) = 8
        AND JSON_CONTAINS(branchId, CAST('[${idBranch}]' AS JSON))
        AND role = 'customer'
) AS Aug_registrations

UNION ALL

SELECT 
    'Sep' AS name,
    COALESCE(Sep_checkin_count, 0) AS CheckIn,
    COALESCE(Sep_registration_count, 0) AS User
FROM (
    SELECT 
        COUNT(*) AS Sep_checkin_count
    FROM 
        checkinhistory
    WHERE 
        MONTH(date) = 9
        AND branchId = ${idBranch}
) AS Sep_checkins
CROSS JOIN (
    SELECT 
        COUNT(*) AS Sep_registration_count
    FROM 
        users
    WHERE 
        MONTH(dateRegis) = 9
        AND JSON_CONTAINS(branchId, CAST('[${idBranch}]' AS JSON))
        AND role = 'customer'
) AS Sep_registrations

UNION ALL

SELECT 
    'Oct' AS name,
    COALESCE(Oct_checkin_count, 0) AS CheckIn,
    COALESCE(Oct_registration_count, 0) AS User
FROM (
    SELECT 
        COUNT(*) AS Oct_checkin_count
    FROM 
        checkinhistory
    WHERE 
        MONTH(date) = 10
        AND branchId = ${idBranch}
) AS Oct_checkins
CROSS JOIN (
    SELECT 
        COUNT(*) AS Oct_registration_count
    FROM 
        users
    WHERE 
        MONTH(dateRegis) = 10
        AND JSON_CONTAINS(branchId, CAST('[${idBranch}]' AS JSON))
        AND role = 'customer'
) AS Oct_registrations

UNION ALL

SELECT 
    'Nov' AS name,
    COALESCE(Nov_checkin_count, 0) AS CheckIn,
    COALESCE(Nov_registration_count, 0) AS User
FROM (
    SELECT 
        COUNT(*) AS Nov_checkin_count
    FROM 
        checkinhistory
    WHERE 
        MONTH(date) = 11
        AND branchId = ${idBranch}
) AS Nov_checkins
CROSS JOIN (
    SELECT 
        COUNT(*) AS Nov_registration_count
    FROM 
        users
    WHERE 
        MONTH(dateRegis) = 11
        AND JSON_CONTAINS(branchId, CAST('[${idBranch}]' AS JSON))
        AND role = 'customer'
) AS Nov_registrations

UNION ALL

SELECT 
    'Dec' AS name,
    COALESCE(Dec_checkin_count, 0) AS CheckIn,
    COALESCE(Dec_registration_count, 0) AS User
FROM (
    SELECT 
        COUNT(*) AS Dec_checkin_count
    FROM 
        checkinhistory
    WHERE 
        MONTH(date) = 12
        AND branchId = ${idBranch}
) AS Dec_checkins
CROSS JOIN (
    SELECT 
        COUNT(*) AS Dec_registration_count
    FROM 
        users
    WHERE 
        MONTH(dateRegis) = 12
    	AND JSON_CONTAINS(branchId, CAST('[${idBranch}]' AS JSON))
        AND role = 'customer'
) AS Dec_registrations
ORDER BY FIELD(name, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');`;

  const result = await db.query(query);

  return result[0];
}

router.post("/checkin", authenticateToken, async (req, res) => {
  const { userId, branchId, date, time } = req.body;
  //   const datetime = new Date().toISOString().slice(0, 19).replace("T", " ");

  try {
    await checkin(userId, branchId, date, time);
    res.status(200).send({
      status: "Success: 200",
      message: "Check-in successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

async function checkin(userId, branchId, date, time) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // // Check if there's an existing check-in for this user and branch
    // let query = `SELECT * FROM checkinhistory
    //                WHERE userId = ? AND branchId = ?`;
    // const [existingCheckin] = await connection.query(query, [userId, branchId]);

    // if (existingCheckin.length > 0) {
    //   // If exists, update the count
    //   query = `UPDATE checkinhistory
    //              SET count = count + 1, datetime = ?
    //              WHERE userId = ? AND branchId = ?`;
    //   await connection.query(query, [datetime, userId, branchId]);
    // } else {
    //   // If not exists, insert new record
    //   query = `INSERT INTO checkinhistory (userId, branchId, datetime, count)
    //              VALUES (?, ?, ?, 1)`;
    //   await connection.query(query, [userId, branchId, datetime]);
    // }
    let query = `INSERT INTO checkinhistory (userId, branchId, date,time, count)
             VALUES (?, ?, ?,?, 1)
             ON DUPLICATE KEY UPDATE 
             count = count + 1,
             `;

    await connection.query(query, [userId, branchId, date, time]);

    // Update user points
    let pointQuery = `SELECT * FROM userpoint WHERE userId = ? AND branchId = ?`;
    const [existingPoint] = await connection.query(pointQuery, [
      userId,
      branchId,
    ]);

    if (existingPoint.length > 0) {
      // If a point record exists, update it
      pointQuery = `UPDATE userpoint SET points = points + 10 WHERE userId = ? AND branchId = ?`;
    } else {
      // If no point record exists, insert a new one
      pointQuery = `INSERT INTO userpoint (userId, branchId, points) VALUES (?, ?, 10)`;
    }

    await connection.query(pointQuery, [userId, branchId]);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
module.exports = router;
