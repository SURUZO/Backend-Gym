const express = require('express');
const { createOrder, checkPaymentStatus, getPaymentDetails, getPaymentDetailsbyID, editPaymentDetails, generateBarcode} = require('../controllers/paymentController');

const router = express.Router();

router.post('/create-order/:membershipID', createOrder);

router.post('/status', checkPaymentStatus);
router.get('/status', checkPaymentStatus);
router.get('/payment-details/:membershipID', getPaymentDetailsbyID); // New route for getting payment details
router.get('/barcode/:membershipID',generateBarcode)
router.get('/payment-details',getPaymentDetails);
router.put('/edit/:membershipID',editPaymentDetails);
module.exports = router;
