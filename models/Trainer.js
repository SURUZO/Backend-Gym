const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
    trainerID: { type: String, unique: true, required: true }, // Unique Trainer ID
    trainer_name: { type: String, required: true, unique: true },
    specialization: { type: String },
    phone_number: { type: String },
    assigned_Members: { type: Number, default: 0 },
    // ✅ Availability for each day of the week
    availability: {
        monday: { type: Boolean, default: false },
        tuesday: { type: Boolean, default: false },
        wednesday: { type: Boolean, default: false },
        thursday: { type: Boolean, default: false },
        friday: { type: Boolean, default: false },
        saturday: { type: Boolean, default: false },
        sunday: { type: Boolean, default: false }
    },
    // ✅ Add fields for storing photo
    passport_photo: { type: String }, // Base64-encoded image
    photo_mime_type: { type: String } // MIME type (e.g., image/png, image/jpeg)
});

const Trainer = mongoose.model('Trainer', trainerSchema);
module.exports = Trainer;
