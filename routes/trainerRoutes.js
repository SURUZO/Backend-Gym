const express = require('express');
const router = express.Router();
const { addTrainer, getTrainers, getTrainerById, editTrainer, deleteTrainer } = require('../controllers/trainerController');

router.post('/trainers/add-trainer', addTrainer);
router.get('/trainers', getTrainers);
router.get('/trainers/:trainerID', getTrainerById); 
router.put('/trainers/edit/:trainerID', editTrainer); 
router.delete('/trainers/delete/:trainerID', deleteTrainer);

module.exports = router;
