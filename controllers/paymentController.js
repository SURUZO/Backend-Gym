const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Member = require('../models/Member');
const bwipjs = require('bwip-js');

const MERCHANT_KEY = "96434309-7796-489d-8924-ab56988a6076";
const MERCHANT_ID = "PGTESTPAYUAT86";

const MERCHANT_BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
const MERCHANT_STATUS_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status";

const redirectUrl = "http://localhost:5000/api/payment/status";
const successUrl = "http://localhost:3000/dashboard";
const failureUrl = "http://localhost:3000/dashboard";

const MembershipPlan = require("../models/membershipPlanModel");


const createOrder = async (req, res) => {
    try {
        const { membership_plan } = req.body;
        const { membershipID } = req.params;

        if (!membershipID || !membership_plan) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Find the member
        const member = await Member.findOne({ membershipID });
        if (!member) {
            return res.status(404).json({ error: "Member not found" });
        }

        // Fetch the membership plan prices dynamically
        const membershipPlans = await MembershipPlan.findOne();
        if (!membershipPlans) {
            return res.status(404).json({ error: "Membership plans not found. Please initialize them first." });
        }

        // Get the selected plan price
        const amount = membershipPlans[membership_plan];
        if (!amount) {
            return res.status(400).json({ error: "Invalid membership plan" });
        }

        const orderId = uuidv4();

        const paymentPayload = {
            merchantId: MERCHANT_ID,
            merchantUserId: membershipID,
            mobileNumber: member.mobileNumber,
            amount: amount * 100, // Convert to paisa (INR)
            merchantTransactionId: orderId,
            redirectUrl: `${redirectUrl}?id=${orderId}&membershipID=${membershipID}&membership_plan=${membership_plan}`,
            redirectMode: 'POST',
            paymentInstrument: { type: 'PAY_PAGE' }
        };

        const payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
        const keyIndex = 1;
        const stringToHash = payload + '/pg/v1/pay' + MERCHANT_KEY;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const checksum = sha256 + '###' + keyIndex;

        const options = {
            method: 'POST',
            url: MERCHANT_BASE_URL,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            data: { request: payload }
        };

        const response = await axios.request(options);

        if (response.data.success === true) {
            return res.status(200).json({ msg: "OK", url: response.data.data.instrumentResponse.redirectInfo.url });
        } else {
            return res.status(400).json({ error: "Failed to create order", details: response.data });
        }
    } catch (error) {
        console.error("Error in createOrder:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const checkPaymentStatus = async (req, res) => {
    try {
        const { id: merchantTransactionId, membershipID, membership_plan } = req.query;

        if (!merchantTransactionId || !membershipID || !membership_plan) {
            return res.status(400).json({ error: "Transaction ID, Membership ID, and Membership Plan are required" });
        }

        const keyIndex = 1;
        const stringToHash = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + MERCHANT_KEY;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const checksum = sha256 + '###' + keyIndex;

        const options = {
            method: 'GET',
            url: `${MERCHANT_STATUS_URL}/${MERCHANT_ID}/${merchantTransactionId}`,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': MERCHANT_ID
            },
        };

        const response = await axios.request(options);
        const member = await Member.findOne({ membershipID });

        if (!member) {
            return res.status(404).json({ error: "Member not found" });
        }

        if (!response.data.success) {
            await Member.findOneAndUpdate(
                { membershipID },
                { 
                    payment_status: "failed", 
                    membership_status: "Inactive" 
                }
            );
            return res.redirect(failureUrl);
        }

        // Fetch membership plan price again to update payment info
        const membershipPlans = await MembershipPlan.findOne();
        if (!membershipPlans) {
            return res.status(404).json({ error: "Membership plans not found." });
        }

        const amountPaid = membershipPlans[membership_plan];
        if (!amountPaid) {
            return res.status(400).json({ error: "Invalid membership plan" });
        }

        let renewalDate = new Date();
        if (membership_plan === "Monthly") {
            renewalDate.setMonth(renewalDate.getMonth() + 1);
        } else if (membership_plan === "Quarterly") {
            renewalDate.setMonth(renewalDate.getMonth() + 3);
        } else if (membership_plan === "Annually") {
            renewalDate.setFullYear(renewalDate.getFullYear() + 1);
        } else {
            return res.status(400).json({ error: "Invalid membership plan" });
        }

        const updateResult = await Member.findOneAndUpdate(
            { membershipID },
            {
                payment_date: new Date(),
                renewal_date: renewalDate,
                amount_paid: amountPaid, // Update with actual price from MembershipPlanModel
                payment_status: "completed",
                membership_status: "Active",
                membership_plan: membership_plan,
                transactionID: merchantTransactionId
            },
            { new: true }
        );

        if (!updateResult) {
            return res.status(500).json({ error: "Failed to update member details" });
        }

        return res.redirect(successUrl);
    } catch (error) {
        console.error("Error in checkPaymentStatus:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { createOrder, checkPaymentStatus };

const editPaymentDetails = async (req, res) => {
    try {
        const { membershipID } = req.params;
        const updates = req.body; 

        if (!membershipID || Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "Membership ID and at least one update field are required" });
        }

        const updatedMember = await Member.findOneAndUpdate(
            { membershipID },
            updates,
            { new: true }
        );

        if (!updatedMember) {
            return res.status(404).json({ error: "Member not found or update failed" });
        }

        return res.status(200).json({ msg: "Payment details updated successfully", updatedMember });
    } catch (error) {
        console.error("Error in editPaymentDetails:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const getPaymentDetailsbyID = async (req, res) => {
    try {
        const { membershipID } = req.params;

        if (!membershipID) {
            return res.status(400).json({ error: "Membership ID is required" });
        }

        const member = await Member.findOne({ membershipID });

        if (!member) {
            return res.status(404).json({ error: "Member not found" });
        }

        return res.status(200).json(member);
    } catch (error) {
        console.error("Error in getPaymentDetailsbyID:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};



const getPaymentDetails = async (req, res) => {
    try {
        const members = await Member.find({}, {
            full_name: 1,
            email: 1,
            amount_paid: 1,
            payment_date: 1,
            renewal_date: 1,
            membership_plan: 1,
            payment_status: 1,
            transactionID: 1,
            _id: 0
        });

        if (!members.length) {
            return res.status(404).json({ error: "No members found" });
        }

        return res.status(200).json(members);
    } catch (error) {
        console.error("Error in getPaymentDetails:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


const generateBarcode = async (req, res) => {
    try {
        const { membershipID } = req.params;

        if (!membershipID) {
            return res.status(400).json({ error: "Membership ID is required" });
        }

        // 🔍 Check if payment is completed
        const member = await Member.findOne({ membershipID });

        if (!member) {
            return res.status(404).json({ error: "Member not found" });
        }

        if (member.payment_status !== "completed") {
            return res.status(400).json({ error: "Payment not completed. Barcode cannot be generated." });
        }

        // ✅ Generate Barcode
        const barcodeBuffer = await bwipjs.toBuffer({
            bcid: 'code128',
            text: membershipID,
            scale: 3,
            height: 10,
            includetext: true,
            textxalign: 'center'
        });

        const barcodeBase64 = `data:image/png;base64,${barcodeBuffer.toString('base64')}`;

        return res.json({
            success: true,
            membershipID,
            barcode: barcodeBase64  // ✅ Return barcode if payment is completed
        });

    } catch (error) {
        console.error("Error in generateBarcode:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


module.exports = { createOrder, checkPaymentStatus, getPaymentDetailsbyID, getPaymentDetails, editPaymentDetails,generateBarcode };
