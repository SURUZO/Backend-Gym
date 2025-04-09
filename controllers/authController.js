require('dotenv').config();
const jwt = require('jsonwebtoken');
const Member = require('../models/Member');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("ERROR: JWT_SECRET is missing from .env file");
    process.exit(1);
}

const normalizeKeys = (obj) => {
    const newObj = {};
    for (let key in obj) {
        const newKey = key.toLowerCase().replace(/\s+/g, "_");
        newObj[newKey] = obj[key];
    }
    return newObj;
};

const generateMembershipID = async () => {
    let membershipID;
    let isUnique = false;

    while (!isUnique) {
        membershipID = `GYM${Math.floor(100000 + Math.random() * 900000)}`;
        const existingMember = await Member.findOne({ membershipID });
        if (!existingMember) {
            isUnique = true; 
        }
    }

    return membershipID;
};

const verifyToken = (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    console.log("Received Authorization Header:", authHeader); 

    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log("Decoded Token:", decoded); 
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await Member.findById(req.user.id).select("-password"); 

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Convert member's photo to base64 data URL
        let photoData = null;
        if (user.passport_photo && user.photo_mime_type) {
            photoData = `data:${user.photo_mime_type};base64,${user.passport_photo}`;
        }

        res.status(200).json({ 
            message: "User profile fetched successfully", 
            user: { 
                ...user.toObject(), 
                passport_photo: photoData 
            } 
        });

    } catch (error) {
        console.error("Error fetching user profile:", error.message);
        res.status(500).json({ error: "Failed to fetch user profile", details: error.message });
    }
};


const handleOTPlessLogin = async (req, res) => {
    const normalizedBody = normalizeKeys(req.body);
    const { email } = normalizedBody;

    try {
        let user = await Member.findOne({ email });

        if (!user) {
            return res.status(200).json({ message: "New user, redirect to registration", newUser: true, email });
        }

        // Convert member's photo to base64 data URL
        let photoData = null;
        if (user.passport_photo && user.photo_mime_type) {
            photoData = `data:${user.photo_mime_type};base64,${user.passport_photo}`;
        }

        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

        return res.status(200).json({ 
            message: "Login Successful", 
            token, 
            user: {
                _id: user._id,
                email: user.email,
                full_name: user.full_name,
                membershipID: user.membershipID, 
                passport_photo: photoData // Include photo
            } 
        });

    } catch (error) {
        console.error("Authentication Error:", error.message);
        res.status(500).json({ error: "Authentication failed", details: error.message });
    }
};



const registerUser = async (req, res) => {
    const normalizedBody = normalizeKeys(req.body);
    const { full_name, email, phone_number, age, gender, trainer_name, address, emergency_contact, health_condition, pincode, passport_photo, photo_mime_type } = normalizedBody;

    try {
        let existingUser = await Member.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already registered" });
        }

        const membershipID = await generateMembershipID();

        const newUser = new Member({ 
            full_name,
            email,
            phone_number,
            age,
            gender,
            emergency_contact,
            health_condition,
            pincode,
            trainer_name,
            address,
            membershipID,
            amount_Paid: 0, 
            payment_status: 'pending', 
            membership_status: 'Inactive', 
            payment_date: null,
            renewal_date: null,
            passport_photo, // Save photo
            photo_mime_type // Save photo MIME type
        });

        await newUser.save();

        // Convert member's photo to base64 data URL
        let photoData = null;
        if (passport_photo && photo_mime_type) {
            photoData = `data:${photo_mime_type};base64,${passport_photo}`;
        }

        const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: "1h" });

        return res.status(200).json({ 
            message: "Registration successful, auto-logged in", 
            token, 
            user: {
                _id: newUser._id,
                email: newUser.email,
                full_name: newUser.full_name,
                membershipID: newUser.membershipID,
                passport_photo: photoData // Include photo
            } 
        });

    } catch (error) {
        console.error("Registration Error:", error.message);
        res.status(500).json({ error: "Failed to register user", details: error.message });
    }
};


module.exports = { handleOTPlessLogin, registerUser, getUserProfile, verifyToken };
