const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
// const session = require("express-session");
const bcrypt = require("bcrypt");
const app = express();
const db = require("./db");
const generalRouter = require("./routers/general");
const userRouter = require("./routers/user");
const blogRouter = require("./routers/blog");
const shoprecomRouter = require("./routers/shoprecom");
const bookingRouter = require("./routers/booking");
const branchRouter = require("./routers/branch");
const redeempromoRouter = require("./routers/promotion");
const dashboardRouter = require("./routers/dashboard");
const displayRouter = require("./routers/display");
const checkinRouter = require("./routers/checkin");
const redeemRouter = require("./routers/redeem");
const swipeRouter = require("./routers/swipe");
var systemRoute = require("./routers/systems_router");
const ngrok = require("ngrok");
//เปิด websocket
// const { wss } = require("./websocketchat");
// var multer = require("multer");
// var multerS3 = require("multer-s3");
// var AWS = require("aws-sdk");

// AWS.config.update({
//   accessKeyId: "O3TQJLWVSBSFMAPWQQMO",
//   secretAccessKey: "D+oNa1vbCW2cJgvQJ2anozYmub23d48CnQ2OIY6KOg",
//   region: "sgp-singapore-1",
// });
// const s3 = new AWS.S3();
// var upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: "s3dev-gramick",
//     acl: "public-read",
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     key: function (req, file, cb) {
//       cb(null, file.originalname);
//     },
//   }),
// });
app.use(express.json());
app.use(
  cors({
    // credentials: true,
    // origin: ["http://localhost:8888"],
  })
);

const port = 8000;
//เส้นจองโต๊ะ
//เส้นtinder
//เส้นเช็คอิน admin,cus (1.admin กดปุ่มเจน qr ,แอพเจ็นเลขมา แล้วให้ เจนเป็น qrcode แล้ว post เก็บเข้า table 2. cus สแกน admin qr แปลงเป็นเลข แล้ว post ไป เช็คว่ามีใน table ไหม + เวลาใน 15 min ไหม สมบูรณืได้แต้ม )
//เส้นสะสมแต้มและแลกรางวัล
//เส้น upload ข้อความ หรือ รูปขึ้นจอ

app.use("/systems", systemRoute);
// app.post("/upload", upload.single("myPic"), (req, res) => {
//   console.log(req.file);
//   res.send("Success upload");
// });
app.use("/api", generalRouter);
app.use("/users", userRouter);
app.use("/blog", blogRouter);
app.use("/shoprecom", shoprecomRouter);
app.use("/booking", bookingRouter);
app.use("/branch", branchRouter);
app.use("/redeempromo", redeempromoRouter);
app.use("/dashboard", dashboardRouter);
app.use("/display", displayRouter);
app.use("/checkin", checkinRouter);
app.use("/redeem", redeemRouter);
app.use("/swipe", swipeRouter);

app.get("/test", (req, res) => {
  res.status(200).json({
    message: "API is working! 2",
    database: process.env.DB_NAME,
  });
});

// Listen
app.listen(port, async () => {
  // await initMySQL();
  console.log("Server started at port 8000");

  ngrok
    .connect(port)
    .then((ngrokUrl) => {
      console.log(`NGROK run in ${ngrokUrl}`);
    })
    .catch((e) => {
      console.log(e);
    });
});

//เปิด websocket
// console.log(`WebSocket server running on port ${wss.options.port}`);
// app.use(cookieParser());
// app.use(
//   session({
//     secret: "secret",
//     resave: false,
//     saveUninitialized: true,
//   })
// );

//sql query การลำดับรายชื่อลูกค้าประจำ เรียงตามจำนวนการเช็คอิน count
// SELECT u.userId, ch.count
// FROM checkinhistory ch
// INNER JOIN (
//   SELECT userId, MAX(count) AS max_count
//   FROM checkinhistory
//   GROUP BY userId
// ) AS u ON ch.userId = u.userId AND ch.count = u.max_count
// ORDER BY ch.count DESC;
