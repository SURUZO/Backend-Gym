const mongoose = require("mongoose");

const membershipPlanSchema = new mongoose.Schema({
    Monthly: { type: Number, required: true },
    Quarterly: { type: Number, required: true },
    Annually: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model("MembershipPlan", membershipPlanSchema);
