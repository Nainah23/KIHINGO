const { google } = require('googleapis');
const path = require('path'); // Import the path module
const youtube = google.youtube('v3');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = 'UCtdZSnZvxOd-wc0GrV6q3tQ'; // Your specified channel ID

const createLiveBroadcast = async (title, description, startTime, endTime) => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '../config/service-account-key.json'), // Updated path
      scopes: ['https://www.googleapis.com/auth/youtube.force-ssl'],
    });

    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const broadcastResponse = await youtube.liveBroadcasts.insert({
      part: ['snippet', 'status', 'contentDetails'],
      requestBody: {
        snippet: {
          title,
          description,
          scheduledStartTime: startTime,
          scheduledEndTime: endTime,
          channelId: CHANNEL_ID,
        },
        status: {
          privacyStatus: 'public',
        },
        contentDetails: {
          enableAutoStart: true,
          enableAutoStop: true,
        },
      },
    });

    const broadcast = broadcastResponse.data;

    const streamResponse = await youtube.liveStreams.insert({
      part: ['snippet', 'cdn'],
      requestBody: {
        snippet: {
          title: `${title} Stream`,
          channelId: CHANNEL_ID,
        },
        cdn: {
          format: '1080p',
          ingestionType: 'rtmp',
        },
      },
    });

    const stream = streamResponse.data;

    await youtube.liveBroadcasts.bind({
      part: ['id', 'contentDetails'],
      id: broadcast.id,
      streamId: stream.id,
    });

    return {
      broadcastId: broadcast.id,
      streamUrl: stream.cdn.ingestionInfo.ingestionAddress,
      streamKey: stream.cdn.ingestionInfo.streamName,
    };
  } catch (error) {
    console.error('Error creating live broadcast:', error);
    throw error;
  }
};

const endLiveBroadcast = async (broadcastId) => {
  try {
    await youtube.liveBroadcasts.transition({
      broadcastStatus: 'complete',
      id: broadcastId,
      part: ['id', 'status'],
    });
  } catch (error) {
    console.error('Error ending live broadcast:', error);
    throw error;
  }
};

module.exports = {
  createLiveBroadcast,
  endLiveBroadcast,
};
