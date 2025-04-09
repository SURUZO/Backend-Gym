const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const Admin = require('../models/Admin');
const { sendMail } = require('../utils/mailer');
const multer = require('multer');
dotenv.config();

const normalizeKeys = (obj) => {
    const newObj = {};
    for (let key in obj) {
        const newKey = key.toLowerCase().replace(/\s+/g, "_"); 
        newObj[newKey] = obj[key];
    }
    return newObj;
};


const roleBasedLogin = async (req, res) => {
    try {
        const normalizedBody = normalizeKeys(req.body);
        const { email, password, role } = normalizedBody; // Frontend will provide role

        // Role credentials and secrets
        const roles = {
            admin: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, secret: process.env.ADMIN_SECRET },
            trainer: { email: process.env.TRAINER_EMAIL, password: process.env.TRAINER_PASSWORD, secret: process.env.TRAINER_SECRET },
            sales: { email: process.env.SALES_EMAIL, password: process.env.SALES_PASSWORD, secret: process.env.SALES_SECRET },
        };

        // Validate provided role
        if (!roles[role]) return res.status(401).json({ error: 'Invalid role' });

        // Validate email and role match
        if (roles[role].email !== email) return res.status(401).json({ error: 'Invalid credentials' });

        // Compare passwords (hashed in .env)
        const isPasswordValid = await bcrypt.compare(password, roles[role].password);
        if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

        // Generate token using the role-specific secret key
        const token = jwt.sign({ email, role }, roles[role].secret, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token, role });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in', details: error.message });
    }
};


// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const normalizedBody = normalizeKeys(req.body);
        const { email } = normalizedBody;

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        const resetToken = crypto.randomBytes(32).toString('hex');

        admin.resetToken = resetToken;
        admin.resetTokenExpiry = Date.now() + 3600000;
        await admin.save();

        const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        await sendMail(email, 'Admin Password Reset Request', `Click the link to reset your password: ${resetLink}`);

        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ error: 'Error sending password reset email', details: error.message });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const normalizedBody = normalizeKeys(req.body);
        const { email, new_password } = normalizedBody;

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        if (!new_password) return res.status(400).json({ error: 'New password is required' });

        const hashedPassword = await bcrypt.hash(new_password, 10);
        admin.password = hashedPassword;
        await admin.save();

        await sendMail(email, 'Your password has been reset', 'Your password has been successfully reset.');

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ error: 'Error resetting password', details: error.message });
    }
};


const getMembers = async (req, res) => {
    try {
        const members = await Member.find();

        // Map over the members to include the passport photo in base64 format
        const membersWithPhotos = members.map(member => ({
            ...member.toObject(),
            passport_photo: member.passport_photo ? `data:${member.photo_mime_type};base64,${member.passport_photo}` : null
        }));

        res.status(200).json(membersWithPhotos);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching members', details: error.message });
    }
};


const getMemberById = async (req, res) => {
    try {
        const { membershipID } = req.params;
        const member = await Member.findOne({ membershipID });

        if (!member) return res.status(404).json({ error: 'Member not found' });

        res.status(200).json({
            ...member.toObject(),
            passport_photo: member.passport_photo ? `data:${member.photo_mime_type};base64,${member.passport_photo}` : null
        });

    } catch (error) {
        res.status(500).json({ error: 'Error fetching member', details: error.message });
    }
};



const editMember = async (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const { membershipID } = req.params;
            let updates = normalizeKeys(req.body);

            // Handle new photo upload (replace old one)
            if (req.file) {
                updates.passport_photo = req.file.buffer.toString('base64');  
                updates.photo_mime_type = req.file.mimetype;
            }

            const updatedMember = await Member.findOneAndUpdate({ membershipID }, updates, { new: true });

            if (!updatedMember) {
                return res.status(404).json({ message: 'Member not found' });
            }

            res.status(200).json({ message: 'Member updated successfully', member: updatedMember });

        } catch (error) {
            res.status(500).json({ message: 'Internal server error', details: error.message });
        }
    });
};



const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
}).single('passport_photo');  


const addMember = async (req, res) => {
    // Handle file upload using multer
    upload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            // Normalize the keys of the incoming data
            const mappedBody = normalizeKeys(req.body);

            // Destructure the data from req.body (JSON fields)
            const { 
                full_name, email, phone_number, age, gender, 
                trainer_name, membership_plan, amount_paid, 
                payment_status, membership_status, payment_date, 
                renewal_date, pincode, emergency_contact, address 
            } = mappedBody;

            // Check if required fields are present
            if (!pincode || !emergency_contact) {
                return res.status(400).json({ error: "Pincode and Emergency Contact are required." });
            }

            // Check if the trainer exists and is available
            let newTrainer = null;
            if (trainer_name) {
                newTrainer = await Trainer.findOne({ trainer_name: new RegExp(`^${trainer_name}$`, 'i') });
                if (!newTrainer) return res.status(404).json({ error: 'Trainer not found' });
                if (!newTrainer.availability) return res.status(400).json({ error: 'Trainer is not available' });
            }

            // Generate a unique membership ID
            let membershipID;
            let isUnique = false;
            while (!isUnique) {
                membershipID = `GYM${Math.floor(100000 + Math.random() * 900000)}`;
                const existingMember = await Member.findOne({ membershipID });
                if (!existingMember) isUnique = true;
            }

            // Create a new member object
            const newMember = new Member({
                full_name, email, phone_number, age, gender, address,
                trainer_name: newTrainer ? newTrainer.trainer_name : null,
                membership_plan, amount_paid: amount_paid || 0,
                payment_status: payment_status?.toLowerCase() === 'completed' ? 'completed' : 'pending',
                membership_status: membership_status || 'Inactive',
                payment_date: payment_date || null,
                renewal_date: renewal_date || null,
                membershipID, pincode, emergency_contact
            });

            // If a photo is uploaded, save it in base64 format
            if (req.file) {
                newMember.passport_photo = req.file.buffer.toString('base64');
                newMember.photo_mime_type = req.file.mimetype;
            }

            // Save the new member to the database
            await newMember.save();

            // If a trainer is assigned, update the trainer's assigned member count
            if (newTrainer) {
                newTrainer.assigned_Members = await Member.countDocuments({ trainer_name: newTrainer.trainer_name });
                await newTrainer.save();
            }

            // Send response with the new member details
            res.status(201).json({ message: 'Member added successfully', member: newMember });
        } catch (error) {
            res.status(500).json({ error: 'Error adding member', details: error.message });
        }
    });
};


const deleteMember = async (req, res) => {

    try {

        const { membershipID } = req.params;

        const member = await Member.findOne({ membershipID });
        if (!member) return res.status(404).json({ error: 'Member not found' });

        if (member.trainer_name) {
            const trainer = await Trainer.findOne({ trainer_name: member.trainer_name });
            if (trainer) {
                trainer.assigned_Members = Math.max(0, trainer.assigned_Members - 1);
                await trainer.save();
            }
        }

        await Member.findOneAndDelete({ membershipID });

        res.status(200).json({ message: 'Member deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting member', details: error.message });
    }
};



module.exports = { roleBasedLogin, forgotPassword, resetPassword, getMembers, getMemberById, editMember, addMember,deleteMember };
