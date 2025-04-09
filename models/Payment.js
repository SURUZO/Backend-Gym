const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
    name: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    orderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    planType: { type: String, enum: ["monthly", "quarterly", "annually"], required: true },
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
}, { timestamps: true });

module.exports = mongoose.model("Payment", PaymentSchema);
