const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// Load credentials.json
const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));

const { client_id, client_secret, redirect_uris } = credentials.web;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const getAccessToken = async () => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });

    console.log('Authorize this app by visiting this URL:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter the code from that page here: ', async (code) => {
        rl.close();
        const { tokens } = await oAuth2Client.getToken(code);
        console.log('Refresh Token:', tokens.refresh_token);
    });
};

getAccessToken();
