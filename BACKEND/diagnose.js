// diagnose.js
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function diagnoseYouTubeSetup() {
    console.log('Starting YouTube API diagnostic...\n');

    // 1. Check if service account file exists
    const serviceAccountPath = path.resolve(__dirname, './config/service-account-key.json');
    console.log('1. Checking service account file...');
    
    try {
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            console.log('✓ Service account file found');
            console.log(`   Client email: ${serviceAccount.client_email}`);
        } else {
            console.log('✗ Service account file not found at:', serviceAccountPath);
            return;
        }
    } catch (error) {
        console.error('✗ Error reading service account file:', error.message);
        return;
    }

    // 2. Try to authenticate
    console.log('\n2. Attempting to authenticate...');
    
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: serviceAccountPath,
            scopes: ['https://www.googleapis.com/auth/youtube'],
        });

        const authClient = await auth.getClient();
        console.log('✓ Authentication successful');

        // 3. Initialize YouTube API
        console.log('\n3. Initializing YouTube API...');
        const youtube = google.youtube('v3');
        google.options({ auth: authClient });
        console.log('✓ YouTube API initialized');

        // 4. Try to list channels
        console.log('\n4. Attempting to list channels...');
        const response = await youtube.channels.list({
            part: ['snippet', 'brandingSettings'],
            mine: true,
        });

        console.log('✓ API request successful');
        console.log('Response data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('✗ Error occurred:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
    }
}

// Run the diagnostic
console.log('YouTube API Diagnostic Tool');
console.log('=========================\n');

diagnoseYouTubeSetup()
    .then(() => {
        console.log('\nDiagnostic completed');
    })
    .catch(error => {
        console.error('\nDiagnostic failed:', error);
    });
