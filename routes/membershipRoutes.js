const express = require("express");
const router = express.Router();
const { updatePlanPrice, getAllPlans, initializePlans } = require("../controllers/membershipPlanController");

// Admin Updates Plan Price
router.put("/update-price", updatePlanPrice);

// Fetch Updated Plans for Frontend
router.get("/plans", getAllPlans);

// Update Payment Details After Successful Payment
router.post("/initialize", initializePlans);

module.exports = router;
