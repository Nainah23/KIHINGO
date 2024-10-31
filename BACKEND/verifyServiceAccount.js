// verifyServiceAccount.js
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function verifyServiceAccount() {
    try {
        // Read and parse the service account file
        const serviceAccountPath = path.join(__dirname, './config/service-account-key.json');
        const serviceAccountContent = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        
        console.log('\nService Account Details:');
        console.log('------------------------');
        console.log('Client Email:', serviceAccountContent.client_email);
        console.log('Project ID:', serviceAccountContent.project_id);

        // Initialize auth with service account
        const auth = new google.auth.GoogleAuth({
            keyFile: serviceAccountPath,
            scopes: ['https://www.googleapis.com/auth/youtube.force-ssl']
        });

        const authClient = await auth.getClient();
        const youtube = google.youtube('v3');
        google.options({ auth: authClient });

        // Try to get channel list to verify authentication
        const response = await youtube.channels.list({
            part: ['snippet,contentDetails,statistics'],
            mine: true
        });

        console.log('\nAPI Authentication:');
        console.log('------------------');
        console.log('✅ Successfully authenticated with YouTube API');
        
        return {
            email: serviceAccountContent.client_email,
            projectId: serviceAccountContent.project_id,
            authenticated: true
        };
    } catch (error) {
        console.error('\nError Details:');
        console.error('--------------');
        console.error('Error:', error.message);
        
        if (error.message.includes('quota')) {
            console.log('\n❗ Quota Error Detected:');
            console.log('1. Check if YouTube Data API is enabled in Google Cloud Console');
            console.log('2. Verify you have available quota');
        }
        
        return {
            error: error.message,
            authenticated: false
        };
    }
}

// Run the verification
verifyServiceAccount()
    .then(result => {
        console.log('\nNext Steps:');
        console.log('------------');
        if (result.authenticated) {
            console.log('1. Use this email to invite as manager:', result.email);
            console.log('2. Go to YouTube Studio > Settings > Channel > Permissions');
            console.log('3. Add the above email as a manager');
            console.log('4. Wait a few minutes before running the accept invitation script');
        } else {
            console.log('Please fix the authentication issues before proceeding');
        }
    })
    .catch(console.error)
    .finally(() => process.exit());