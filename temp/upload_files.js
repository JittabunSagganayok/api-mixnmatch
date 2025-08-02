const multer = require("multer");
const multerS3 = require("multer-s3");
const moment = require("moment");
const util = require("util");
const uuid = require("uuid");
const AWS = require("aws-sdk");
// const S3 = require("../config/space");

const spacesEndpoint = new AWS.Endpoint("sgp1.digitaloceanspaces.com");
const s3 = new AWS.S3({ endpoint: spacesEndpoint });
const maxasize = 1024 * 1024; // 10mb

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.body.type == "customer") {
      cb(null, __basedir + "/uploads/customer");
    } else {
      cb(null, __basedir + "/uploads/file");
    }
  },
  filename: (req, file, cb) => {
    let newtime = `${moment(new Date()).format("YYYYMMDD")}`;
    let ext = file.originalname.split(".")[1];
    cb(null, `${file.fieldname}_${uuid.v4()}.${ext}`);
  },
});

/* digitalocean s3 spaces */
const s3Digital = multer({
  storage: multerS3({
    s3: s3,
    // S3.s3,
    bucket: "s3dev-gramick",
    // S3.bucket,
    acl: "public-read",
    key: function (req, file, cb) {
      let ext = file.originalname.split(".")[1];
      if (req.body.module) {
        cb(
          null,
          `mcic/${req.body.module}/${file.fieldname}_${uuid.v4()}.${ext}`
        );
      } else {
        cb(null, `mcic/file/${file.fieldname}_${uuid.v4()}.${ext}`);
      }
      // console.log("222");
      // console.log(`mcic/file/${file.fieldname}_${uuid.v4()}.${ext}`);
    },
  }),
}).single("file");

const tempUpload = multer({
  storage: storage,
  limits: {
    fieldSize: maxasize,
  },
}).single("file");

const tempUpload_ = multer({
  storage: storage,
  limits: {
    fieldSize: maxasize,
  },
}).array("files");

let uploadFile = util.promisify(tempUpload);
let uploadFile_ = util.promisify(tempUpload_);
let uploadS3 = util.promisify(s3Digital);

module.exports = {
  uploadFile: uploadFile,
  uploadFile_: uploadFile_,
  uploadS3: uploadS3,
};
