const Trainer = require('../models/Trainer');
const multer = require('multer');

// Generate a unique Trainer ID
const generateTrainerID = () => {
    return `TRN-${Math.floor(100000 + Math.random() * 900000)}`;
};

// Normalize the keys (convert to lowercase and replace spaces with underscores)
const normalizeKeys = (obj) => {
    const newObj = {};
    for (let key in obj) {
        const trimmedKey = key.trim();
        const newKey = trimmedKey.toLowerCase().replace(/\s+/g, "_");
        newObj[newKey] = obj[key];
    }
    console.log("Normalized Object:", newObj);
    return newObj;
};

// Multer setup for image file upload (passport photo)
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
}).single('passport_photo');  // 'passport_photo' will be the name of the file input

// Add Trainer with Photo Upload
const addTrainer = async (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const mappedBody = normalizeKeys(req.body);
            const { trainer_name, specialization, phone_number, availability } = mappedBody;

            // Check if the trainer already exists
            const existingTrainer = await Trainer.findOne({ trainer_name });
            if (existingTrainer) return res.status(400).json({ error: 'Trainer with this name already exists' });

            // Generate a unique trainerID
            const trainerID = generateTrainerID();

            // Create a new trainer object with trainerID
            const newTrainer = new Trainer({
                trainerID,  // Add generated trainerID here
                trainer_name,
                specialization,
                phone_number,
                availability,
            });

            // If a photo is uploaded, save it in base64 format
            if (req.file) {
                newTrainer.passport_photo = req.file.buffer.toString('base64');  // Store photo as base64
                newTrainer.photo_mime_type = req.file.mimetype;  // Store MIME type
            }

            // Save the new trainer to the database
            await newTrainer.save();

            res.status(201).json({ message: 'Trainer added successfully', trainer: newTrainer });
        } catch (error) {
            res.status(500).json({ error: 'Error adding trainer', details: error.message });
        }
    });
};

// Edit Trainer with Photo Upload
const editTrainer = async (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const { trainerID } = req.params;
            let updates = normalizeKeys(req.body);

            // Handle new photo upload (replace old one)
            if (req.file) {
                updates.passport_photo = req.file.buffer.toString('base64');  // Convert photo to base64
                updates.photo_mime_type = req.file.mimetype;  // Store MIME type
            }

            const updatedTrainer = await Trainer.findOneAndUpdate({ trainerID }, updates, { new: true });

            if (!updatedTrainer) {
                return res.status(404).json({ message: 'Trainer not found' });
            }

            res.status(200).json({ message: 'Trainer updated successfully', trainer: updatedTrainer });

        } catch (error) {
            res.status(500).json({ message: 'Internal server error', details: error.message });
        }
    });
};

// Get Trainer by ID
const Member = require('../models/Member'); // Import Member model

const getTrainerById = async (req, res) => {
    try {
        const { membershipID } = req.params;

        // Find the member based on membershipID
        const member = await Member.findOne({ membershipID });

        if (!member) {
            return res.status(404).json({ error: "Member not found" });
        }

        // Extract trainer's name from the member details
        const trainerName = member.trainerName;

        // Find the trainer based on trainer_name
        const trainer = await Trainer.findOne({ trainer_name: trainerName });

        if (!trainer) {
            return res.status(404).json({ error: "Trainer not found for this member" });
        }

        // Convert base64 image to a proper data URL
        let photoData = null;
        if (trainer.passport_photo && trainer.photo_mime_type) {
            photoData = `data:${trainer.photo_mime_type};base64,${trainer.passport_photo}`;
        }

        res.status(200).json({
            trainerID: trainer.trainerID,
            trainer_name: trainer.trainer_name,
            specialization: trainer.specialization,
            phone_number: trainer.phone_number,
            assigned_Members: trainer.assigned_Members,
            availability: trainer.availability,
            passport_photo: photoData, // Base64 image with MIME type
        });
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

const getTrainers = async (req, res) => {
    try {
        const trainers = await Trainer.find();

        // Map over the trainers to include the passport photo in base64 format
        const trainersWithPhotos = trainers.map(trainer => ({
            ...trainer.toObject(),
            passport_photo: trainer.passport_photo 
                ? `data:${trainer.photo_mime_type};base64,${trainer.passport_photo}` 
                : null
        }));

        res.status(200).json(trainersWithPhotos);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching trainers', details: error.message });
    }
};

// Delete Trainer
const deleteTrainer = async (req, res) => {
    try {
        const { trainerID } = req.params;
        const deletedTrainer = await Trainer.findOneAndDelete({ trainerID });

        if (!deletedTrainer) {
            return res.status(404).json({ error: "Trainer not found" });
        }

        res.json({ message: "Trainer deleted successfully", trainer: deletedTrainer });
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

module.exports = { addTrainer, getTrainers, getTrainerById, editTrainer, deleteTrainer };