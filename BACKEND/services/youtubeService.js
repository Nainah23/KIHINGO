// BACKEND/services/youtubeService.js
const YouTubeLiveStream = require('youtube-live-streaming');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const TOKEN_PATH = path.join(__dirname, '../config/official-channel-tokens.json');

// Load client credentials and set up OAuth2 client
async function getOAuth2Client() {
    const { client_id, client_secret, redirect_uris } = require('../config/oauth2-credentials.json').web;
    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Set the scopes you need
    const SCOPES = [
        'https://www.googleapis.com/auth/youtube.force-ssl',
        // You can add other scopes here if needed
    ];

    // If the tokens file exists, read it, else create the authorization URL
    let tokens;
    if (fs.existsSync(TOKEN_PATH)) {
        tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    } else {
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        throw new Error('Authorization required. Visit the URL above.');
    }

    oauth2Client.setCredentials(tokens);

    oauth2Client.on('tokens', (newTokens) => {
        if (newTokens.refresh_token) {
            tokens.refresh_token = newTokens.refresh_token;
        }
        tokens.access_token = newTokens.access_token;
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    });

    return oauth2Client;
}

// Initialize YouTube Live instance
async function getYouTubeLive() {
    const authClient = await getOAuth2Client();
    return new YouTubeLiveStream(authClient);
}


const createLiveBroadcast = async (title, description, startTime, endTime) => {
    try {
        const youtubeLive = await getYouTubeLive();
        
        // Create broadcast
        const broadcast = await youtubeLive.createBroadcast({
            snippet: {
                title,
                description,
                scheduledStartTime: startTime,
                scheduledEndTime: endTime,
            },
            status: {
                privacyStatus: 'public',
                selfDeclaredMadeForKids: false,
            },
            contentDetails: {
                enableAutoStart: true,
                enableAutoStop: true,
                enableDvr: true,
                recordFromStart: true,
            },
        });

        // Create stream
        const stream = await youtubeLive.createStream({
            snippet: {
                title: `${title} Stream`,
            },
            cdn: {
                frameRate: '60fps',
                ingestionType: 'rtmp',
                resolution: '1080p',
            },
        });

        // Bind broadcast and stream
        await youtubeLive.bindBroadcastToStream(broadcast.id, stream.id);

        return {
            broadcastId: broadcast.id,
            streamUrl: stream.cdn.ingestionAddress,
            streamKey: stream.cdn.streamName,
            broadcast,
            stream,
        };
    } catch (error) {
        console.error('Error creating live broadcast:', error);
        throw error;
    }
};

const startStreaming = async (inputSource, streamUrl, streamKey) => {
    return new Promise((resolve, reject) => {
        const rtmpUrl = `${streamUrl}/${streamKey}`;
        
        const stream = ffmpeg(inputSource)
            .inputOptions([
                '-re', // Read input at native framerate
                '-stream_loop -1', // Loop the input indefinitely
            ])
            .outputOptions([
                '-c:v libx264', // Video codec
                '-preset veryfast', // Encoding preset
                '-b:v 6000k', // Video bitrate
                '-maxrate 6000k',
                '-bufsize 12000k',
                '-acodec aac', // Audio codec
                '-ar 44100', // Audio sample rate
                '-b:a 128k', // Audio bitrate
                '-f flv', // Output format
            ])
            .on('start', () => {
                console.log('Stream started:', rtmpUrl);
                resolve();
            })
            .on('error', (err) => {
                console.error('Streaming error:', err);
                reject(err);
            })
            .on('end', () => {
                console.log('Stream ended');
            });

        stream.save(rtmpUrl);
    });
};

const endLiveBroadcast = async (broadcastId) => {
    try {
        const youtubeLive = await getYouTubeLive();
        await youtubeLive.transitionBroadcast(broadcastId, 'complete');
    } catch (error) {
        console.error('Error ending live broadcast:', error);
        throw error;
    }
};

module.exports = {
    createLiveBroadcast,
    startStreaming,
    endLiveBroadcast,
};