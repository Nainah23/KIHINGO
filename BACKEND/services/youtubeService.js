// // youtubeService.js
// const YouTubeLiveStream = require('youtube-live-streaming'); // Ensure CommonJS import
// const ffmpeg = require('fluent-ffmpeg');
// const ffmpegStatic = require('ffmpeg-static');
// const { google } = require('googleapis');
// const fs = require('fs');
// const path = require('path');

// // Set ffmpeg path
// ffmpeg.setFfmpegPath(ffmpegStatic);

// const TOKEN_PATH = path.join(__dirname, '../config/official-channel-tokens.json');

// // Load client credentials and set up OAuth2 client
// async function getOAuth2Client() {
//     const { client_id, client_secret, redirect_uris } = require('../config/oauth2-credentials.json').web;
//     const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

//     const SCOPES = [
//         'https://www.googleapis.com/auth/youtube.force-ssl',
//         'https://www.googleapis.com/auth/youtube',
//         'https://www.googleapis.com/auth/youtube.upload'
//     ];

//     let tokens;
//     if (fs.existsSync(TOKEN_PATH)) {
//         tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
//     } else {
//         const authUrl = oauth2Client.generateAuthUrl({
//             access_type: 'offline',
//             scope: SCOPES,
//         });
//         console.log('Authorize this app by visiting this url:', authUrl);
//         throw new Error('Authorization required. Visit the URL above.');
//     }

//     oauth2Client.setCredentials(tokens);

//     oauth2Client.on('tokens', (newTokens) => {
//         if (newTokens.refresh_token) {
//             tokens.refresh_token = newTokens.refresh_token;
//         }
//         tokens.access_token = newTokens.access_token;
//         fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
//     });

//     return oauth2Client;
// }

// // Initialize YouTube service
// async function getYouTubeService() {
//     const auth = await getOAuth2Client();
//     return google.youtube({ version: 'v3', auth });
// }

// // Initialize YouTube Live stream with authentication
// async function initYouTubeLiveStream(streamKey, videoSource, audioSource) {
//     const auth = await getOAuth2Client();
//     return new YouTubeLiveStream({
//         oauth2Client: auth,
//         streamKey,
//         videoSource,
//         audioSource,
//     });
// }

// // Simple streaming function using youtube-live-streaming package
// async function startSimpleStreaming(streamKey, videoSource, audioSource) {
//     try {
//         // Verify the stream key is valid using the YouTube API
//         const youtube = await getYouTubeService();
        
//         // Initialize the livestream with authentication
//         const livestream = await initYouTubeLiveStream(streamKey, videoSource, audioSource);
        
//         // Start the stream
//         await livestream.start();
        
//         console.log('Simple streaming started successfully');
//         return {
//             status: 'streaming',
//             streamKey,
//             startTime: new Date(),
//         };
//     } catch (error) {
//         console.error('Error starting simple stream:', error);
//         throw error;
//     }
// }

// // Stop simple streaming
// async function stopSimpleStreaming(streamKey) {
//     try {
//         const livestream = await initYouTubeLiveStream(streamKey);
//         await livestream.stop();
//         console.log('Stream stopped successfully');
//         return { status: 'stopped', endTime: new Date() };
//     } catch (error) {
//         console.error('Error stopping stream:', error);
//         throw error;
//     }
// }

// // Your existing broadcast functions
// const createLiveBroadcast = async (title, description, startTime, endTime) => {
//     try {
//         const youtube = await getYouTubeService();
        
//         // Create broadcast
//         const broadcast = await youtube.liveBroadcasts.insert({
//             part: 'snippet,status,contentDetails',
//             resource: {
//                 snippet: {
//                     title,
//                     description,
//                     scheduledStartTime: startTime,
//                     scheduledEndTime: endTime,
//                 },
//                 status: {
//                     privacyStatus: 'public',
//                     selfDeclaredMadeForKids: false,
//                 },
//                 contentDetails: {
//                     enableAutoStart: true,
//                     enableAutoStop: true,
//                     enableDvr: true,
//                     recordFromStart: true,
//                 },
//             },
//         });

//         // Create stream
//         const stream = await youtube.liveStreams.insert({
//             part: 'snippet,cdn',
//             resource: {
//                 snippet: {
//                     title: `${title} Stream`,
//                 },
//                 cdn: {
//                     frameRate: '60fps',
//                     ingestionType: 'rtmp',
//                     resolution: '1080p',
//                 },
//             },
//         });

//         // Bind broadcast and stream
//         await youtube.liveBroadcasts.bind({
//             id: broadcast.data.id,
//             part: 'id,contentDetails',
//             streamId: stream.data.id,
//         });

//         return {
//             broadcastId: broadcast.data.id,
//             streamUrl: stream.data.cdn.ingestionAddress,
//             streamKey: stream.data.cdn.streamName,
//             broadcast: broadcast.data,
//             stream: stream.data,
//         };
//     } catch (error) {
//         console.error('Error creating live broadcast:', error);
//         throw error;
//     }
// };

// const startStreaming = async (inputSource, streamUrl, streamKey) => {
//     return new Promise((resolve, reject) => {
//         const rtmpUrl = `${streamUrl}/${streamKey}`;
        
//         const stream = ffmpeg(inputSource)
//             .inputOptions(['-re', '-stream_loop -1'])
//             .outputOptions([
//                 '-c:v libx264',
//                 '-preset veryfast',
//                 '-b:v 6000k',
//                 '-maxrate 6000k',
//                 '-bufsize 12000k',
//                 '-acodec aac',
//                 '-ar 44100',
//                 '-b:a 128k',
//                 '-f flv',
//             ])
//             .on('start', () => {
//                 console.log('Stream started:', rtmpUrl);
//                 resolve();
//             })
//             .on('error', (err) => {
//                 console.error('Streaming error:', err);
//                 reject(err);
//             })
//             .on('end', () => {
//                 console.log('Stream ended');
//             });

//         stream.save(rtmpUrl);
//     });
// };

// const endLiveBroadcast = async (broadcastId) => {
//     try {
//         const youtube = await getYouTubeService();
//         await youtube.liveBroadcasts.transition({
//             broadcastStatus: 'complete',
//             id: broadcastId,
//             part: 'id,status',
//         });
//     } catch (error) {
//         console.error('Error ending live broadcast:', error);
//         throw error;
//     }
// };

// module.exports = {
//     createLiveBroadcast,
//     startStreaming,
//     endLiveBroadcast,
//     startSimpleStreaming,
//     stopSimpleStreaming,
// };
