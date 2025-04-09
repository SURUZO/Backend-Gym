const express = require("express");
const router = express.Router();
const { scanBarcode,getAllAttendance } = require("../controllers/attendanceController");

router.post("/scan", scanBarcode);
router.get("/all",getAllAttendance)

module.exports = router;
