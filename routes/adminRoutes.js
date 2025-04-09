const express = require('express');
const router = express.Router();
const { 
    roleBasedLogin,
    getMembers, 
    getMemberById, 
    editMember, 
    addMember, 
    deleteMember,  
    forgotPassword, 
    resetPassword 
} = require('../controllers/adminController');

// Admin authentication routes
router.post('/login',roleBasedLogin);

// Member management routes
router.get('/members', getMembers);
router.get('/members/:membershipID', getMemberById); 
router.put('/members/:membershipID', editMember);   
router.post('/members', addMember);
router.delete('/members/:membershipID', deleteMember); 

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
