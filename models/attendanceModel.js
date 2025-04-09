const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    membershipID: { type: String, required: true }, // Change from ObjectId to String
    date: { type: String, required: true }, // YYYY-MM-DD format
    loginTime: { type: String },
    logoutTime: { type: String }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
