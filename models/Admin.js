const mongoose = require('mongoose');

// Define the Admin Schema
const adminSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true, // Ensure the email is unique
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true, // Ensure password is required
            minlength: 6, // You can define a minimum length for the password
        },
        resetPasswordToken: {
            type: String,
            default: null, // For password reset functionality
        },
        resetPasswordExpire: {
            type: Date,
            default: null, // Expiry time for password reset
        }
    },
    { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Create an Admin model using the schema
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
