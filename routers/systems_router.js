var express = require("express");

var router = express.Router();
const systemsController = require("../controllers/systems_controller");

router.post("/upload", systemsController.uploadImageS3);

module.exports = router;
