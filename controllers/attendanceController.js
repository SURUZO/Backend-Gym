const Attendance = require("../models/attendanceModel");
const Member = require("../models/Member");

const scanBarcode = async (req, res) => {
    try {
        const { membershipID } = req.body;
        if (!membershipID) return res.status(400).json({ error: "Member ID required" });

        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const currentTime = new Date().toLocaleTimeString(); // HH:MM:SS

        // Find an existing login record for today
        let attendance = await Attendance.findOne({ membershipID, date: today });

        if (!attendance) {
            // First scan → Register login
            attendance = new Attendance({ membershipID, date: today, loginTime: currentTime });
            await attendance.save();
            return res.json({ message: "Login recorded", attendance });
        } else if (!attendance.logoutTime) {
            // Second scan → Register logout
            attendance.logoutTime = currentTime;
            await attendance.save();
            return res.json({ message: "Logout recorded", attendance });
        } else {
            return res.status(400).json({ error: "Already logged out for today" });
        }
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
};


const getAllAttendance = async (req, res) => {
    try {
        const attendanceRecords = await Attendance.find();

        // Fetch member details for each attendance record
        const enrichedAttendance = await Promise.all(
            attendanceRecords.map(async (record) => {
                const member = await Member.findOne({ membershipID: record.membershipID });

                // Convert member's photo to a data URL format
                let photoData = null;
                if (member && member.passport_photo && member.photo_mime_type) {
                    photoData = `data:${member.photo_mime_type};base64,${member.passport_photo}`;
                }

                return {
                    ...record.toObject(), // Convert Mongoose document to plain object
                    member_photo: photoData, // Attach the member's photo
                };
            })
        );

        res.json({ attendance: enrichedAttendance });
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
};


module.exports = { scanBarcode, getAllAttendance };
