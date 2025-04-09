const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone_number: { type: String, required: true },
    emergency_contact: { type: String, required: true },  
    age: { type: Number },
    address: { type: String, required: true },
    gender: { type: String, required: true },
    trainer_name: { type: String },
    membershipID: { type: String, unique: true },
    password: { type: String },
    membership_plan: { type: String, required: false, default: null },
    amount_paid: { type: String, default: 0 },
    payment_status: { type: String, enum: ['completed', 'pending'], default: 'pending' },
    membership_status: { type: String, enum: ['Active', 'Inactive'], default: 'Inactive' },

    payment_date: { type: Date, default: null }, 
    renewal_date: { type: Date, default: null }, 

    transactionID: { type: String, default: null }, // Added transaction ID

    health_condition: { 
        type: String, 
        enum: ['Normal', 'Not Normal'],  
        required: true, 
        default: 'Normal' 
    },
    pincode: { type: String, required: true },  

    passport_photo: { type: Buffer },
    photo_mime_type: { type: String }  
});

module.exports = mongoose.model('Member', MemberSchema);
