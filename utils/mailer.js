const fs = require('fs');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Load credentials.json file
const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));

// OAuth2 Client Setup
const { client_id, client_secret, redirect_uris } = credentials.web; // FIXED HERE
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Set your refresh token
oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

// Create transport using OAuth2
const sendMail = async (to, subject, text) => {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.GMAIL_USER,
                clientId: client_id,
                clientSecret: client_secret,
                refreshToken: process.env.GMAIL_REFRESH_TOKEN,
                accessToken: accessToken.token
            }
        });

        await transporter.sendMail({
            from: `"Gym Management" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            text
        });

        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Email sending failed");
    }
};

module.exports = { sendMail };
