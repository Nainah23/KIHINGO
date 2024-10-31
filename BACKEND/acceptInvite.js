const { google } = require('googleapis');
const path = require('path');
const readline = require('readline');

// Path to your OAuth 2.0 credentials file
const CREDENTIALS_PATH = path.join(__dirname, './config/oauth2-credentials.json');

// Define the OAuth 2.0 client
async function authenticateOAuth2() {
    // Load client credentials from JSON file
    const { client_id, client_secret, redirect_uris } = require(CREDENTIALS_PATH).web;
    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Generate the auth URL
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // This will allow obtaining a refresh token
        scope: ['https://www.googleapis.com/auth/youtube.readonly'],
    });

    console.log('Authorize this app by visiting this URL:', authUrl);

    // Prompt for authorization code in the terminal
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve, reject) => {
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oauth2Client.getToken(code, (err, token) => {
                if (err) {
                    reject('Error retrieving access token: ' + err);
                    return;
                }
                // Set the credentials and resolve with the authenticated client
                oauth2Client.setCredentials(token);
                resolve(oauth2Client);
            });
        });
    });
}

async function listChannelVideos() {
    const authClient = await authenticateOAuth2();
    const youtube = google.youtube({ version: 'v3', auth: authClient });

    try {
        const response = await youtube.channels.list({
            part: 'contentDetails',
            mine: true, // Gets channels owned by the authenticated user
        });
        console.log(response.data);
    } catch (error) {
        console.error('Error fetching channel data:', error);
    }
}

listChannelVideos().catch(console.error);
