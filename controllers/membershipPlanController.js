const MembershipPlan = require("../models/membershipPlanModel");

// Update the price of a specific plan (Monthly, Quarterly, Annually)
exports.updatePlanPrice = async (req, res) => {
    try {
        const { planName, newPrice } = req.body;

        if (!planName || !newPrice) {
            return res.status(400).json({ error: "Plan name and new price are required" });
        }

        // Validate planName
        if (!["Monthly", "Quarterly", "Annually"].includes(planName)) {
            return res.status(400).json({ error: "Invalid plan name. Use Monthly, Quarterly, or Annually." });
        }

        // Update the specific plan field
        const updatedPlan = await MembershipPlan.findOneAndUpdate(
            {},
            { [planName]: newPrice },  // Dynamically update the correct field
            { new: true }
        );

        if (!updatedPlan) {
            return res.status(404).json({ error: "No membership plan found. Initialize it first." });
        }

        res.json({ message: `${planName} price updated successfully`, updatedPlan });
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

// Get the current plan prices
exports.getAllPlans = async (req, res) => {
    try {
        const plans = await MembershipPlan.findOne();
        if (!plans) return res.status(404).json({ error: "No membership plans found." });

        res.json({ plans });
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
};


exports.initializePlans = async (req, res) => {
    try {
        const { Monthly, Quarterly, Annually } = req.body;

        // Check if a plan already exists
        const existingPlan = await MembershipPlan.findOne();
        if (existingPlan) {
            return res.status(400).json({ error: "Plans already exist. Use update API instead." });
        }

        // Create a new plan entry
        const newPlan = new MembershipPlan({ Monthly, Quarterly, Annually });
        await newPlan.save();

        res.json({ message: "Membership plans initialized successfully", newPlan });
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
};
