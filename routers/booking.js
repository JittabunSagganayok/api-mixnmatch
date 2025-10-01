const express = require("express");
const db = require("../db");
const router = express.Router();
const authenticateToken = require("./authen.js");
// const { authenticateToken } = require("./general.js");
async function createBookingHistory(
  tablenumbername,
  idBranch,
  seat,
  maxseat,
  dateReserve,
  timeSection,
  isAdmin,
  lastuserId
) {
  // Replace this with your actual database connection and query execution
  try {
    // Connect to database and execute INSERT query
    const result = await db.query(
      `INSERT INTO reservehistory (tablenumbername,id_branch , avaliableseat, maxseat,datereserve, timesection, isadmin,lastuserId) VALUES (?,?,?,?,?,?,?,?)`,
      [
        tablenumbername,
        idBranch,
        seat,
        maxseat,
        dateReserve,
        timeSection,
        isAdmin,
        lastuserId,
      ]
    );

    return result; // Return the result of the query execution (optional)
  } catch (error) {
    throw error; // Re-throw the error for handling in the main function
  }
}

// //post สร้าง โต๊ะที่เปิดสำหรับ admin
router.post("/", authenticateToken, async (req, res) => {
  try {
    // Check if request body is an array
    if (!Array.isArray(req.body)) {
      return res.status(400).send({
        message: "Invalid request body. Must be an array of booking objects.",
      });
    }

    const bookings = req.body; // Array of booking objects

    // Validate each booking object
    const validationErrors = [];
    for (const booking of bookings) {
      const missingFields = [];
      if (!booking.tablenumbername) missingFields.push("tablenumbername");
      if (!booking.idBranch) missingFields.push("idBranch");
      if (!booking.seat) missingFields.push("seat");
      if (!booking.maxseat) missingFields.push("maxseat");
      if (!booking.dateReserve) missingFields.push("dateReserve");
      if (!booking.timeSection) missingFields.push("timeSection");
      if (!booking.isAdmin) missingFields.push("isAdmin");
      if (!booking.lastuserId) missingFields.push("lastuserId");

      if (missingFields.length > 0) {
        validationErrors.push({
          message: `Missing required field(s) for booking: ${missingFields.join(
            ", "
          )}`,
        });
      }
    }

    // Handle validation errors
    if (validationErrors.length > 0) {
      return res
        .status(400)
        .send({ message: "Validation errors", errors: validationErrors });
    }

    // Create bookings in a loop
    const createdBookings = [];
    for (const booking of bookings) {
      const bookingResult = await createBookingHistory(
        booking.tablenumbername,
        booking.idBranch,
        booking.seat,
        booking.maxseat,
        booking.dateReserve,
        booking.timeSection,
        booking.isAdmin,
        booking.lastuserId
      );
      createdBookings.push(bookingResult); // Optional: Store results if needed
    }

    // Handle successful booking creation(s)
    res
      .status(201)
      .send({ message: "Bookings created successfully", createdBookings }); // Optional: Include created booking details
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  const { idBranch, dateReserve } = req.query;

  try {
    // Validate for required parameters
    if (!idBranch || !dateReserve) {
      return res.status(400).send({ message: "Missing required parameters" });
    }

    const bookings = await getBookings(idBranch, dateReserve);

    // Check if any bookings found
    if (bookings.length === 0) {
      return res.status(200).send({
        status: "Success: 200",
        message: "No reservations found for the provided criteria.",
        result: [],
      });
    }
    // const filteredBookings = bookings.map((bookingList) =>
    //   bookingList.filter((booking) => !booking.hasOwnProperty("_buf"))
    // );
    // Handle successful query with bookings found
    res.status(200).send({
      status: "Success: 200",
      message: "There are reservations matching your criteria.",
      result: bookings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

// Implement your getBookings function to fetch data from the database
//tablenumbername,
async function getBookings(idBranch, dateReserve) {
  // Construct the base query without filtering by tablenumbername initially
  let query = `SELECT * FROM reservehistory WHERE id_branch = ? AND datereserve = ? AND isadmin = ?`;

  // Dynamically add filtering for tablenumbername if provided (not 0)
  // if (tablenumbername !== "0") {
  //   query += ` AND tablenumbername = ?`;
  // }

  const result = await db.query(query, [
    idBranch,
    dateReserve,
    1,
    // tablenumbername,
  ]);

  // Return all matching results
  return result[0];
}

router.get("/tableinfo", authenticateToken, async (req, res) => {
  const { idBranch } = req.query;

  try {
    // Validate for required parameters
    if (!idBranch) {
      return res.status(400).send({ message: "Missing required parameters" });
    }

    const tableinfos = await gettableinfo(idBranch);

    res.status(200).send({
      status: "Success: 200",
      message: "Get tablinfo Success",
      result: tableinfos,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

// Implement your getBookings function to fetch data from the database
async function gettableinfo(idBranch) {
  let query = `SELECT * FROM tableinfo WHERE branchid = ? `;

  const result = await db.query(query, [idBranch]);

  return result[0];
}

router.get("/dashboardlist/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query(
      `SELECT * 
      FROM reservehistory rh 
      INNER JOIN users u ON rh.lastuserId = u.userId  
      WHERE rh.id_branch = ? AND u.role = 'customer'
      order by datereserve desc
      ;
    `,
      [id]
    );
    // const u = results.map(formatUsereachBranch);
    res.send(results);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});
router.get("/redeem/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query; // Add this line to get the optional userId

  try {
    let query = `
      SELECT *
      FROM redeempointhistory rh
      INNER JOIN users u ON rh.userId = u.userId
      LEFT JOIN redeemtype rt ON rh.redeemtypeId = rt.redeemtypeId
      WHERE rh.branchId = ? AND u.role = 'customer'
      order by date desc
    `;

    const queryParams = [id];

    // Add userId condition if provided
    if (userId) {
      query += " AND u.userId = ?";
      queryParams.push(userId);
    }

    const [results] = await db.query(query, queryParams);

    res.send(results);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

router.put("/redeem/:id", authenticateToken, async (req, res) => {
  //id = redeemhisId
  const { id } = req.params;
  console.log("type of id :", typeof id, id);
  const updateData = req.body; // User data to be updated

  try {
    const [updateResult] = await db.query(
      "UPDATE redeempointhistory SET ? WHERE redeemhisId = ?",
      [updateData, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    // Get the updated user after successful update
    // const [userResult] = await db.query(
    //   "SELECT * FROM users WHERE userId = ?",
    //   [id]
    // );
    // const updatedUser = formatUser(userResult[0]);

    res.send({ message: "update status sucess" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});
router.post("/confirm", authenticateToken, async (req, res) => {
  const { idReserve } = req.query;
  const { seat, dateReserve, timeSection, lastuserId } = req.body;

  try {
    // Validate for required parameters
    if (!idReserve) {
      return res.status(400).send({ message: "Missing required parameters" });
    }

    const bookingsconfirm = await confirmBookings(
      idReserve,
      seat,
      dateReserve,
      timeSection,
      lastuserId
    );

    res.status(200).send({
      status: "Success: 200",
      //   message: "There are reservations matching your criteria.",
      //   result: { ...bookings },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

// Implement your getBookings function to fetch data from the database
async function confirmBookings(
  idReserve,
  seat,
  dateReserve,
  timeSection,
  lastuserId
) {
  const result = await db.query(
    `UPDATE reservehistory 
    SET avaliableseat = ?, datereserve = ?, timesection = ?,isAdmin = ?, lastuserId = ?
    WHERE reserveId = ?`,
    [seat, dateReserve, timeSection, 0, lastuserId, idReserve]
  );
  return result;
}

module.exports = router;

//router.post("/confirm",
//กดจอง ไป update ตัวที่สร้างมาตอนแรก (ที่ isAdmin == true) update ลดจำนวน seataviable
