const express = require("express");
const {registerUser, handleOTPlessLogin,verifyToken,getUserProfile } = require("../controllers/authController");

const router = express.Router();

router.post("/handlelogin",handleOTPlessLogin)
router.post("/register",registerUser)
router.get("/profile", verifyToken, getUserProfile);

module.exports = router;
