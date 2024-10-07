const { google } = require('googleapis');
const youtube = google.youtube('v3');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Function to create a live broadcast
const createLiveBroadcast = async (title, description, startTime, endTime) => {
  try {
    const broadcastResponse = await youtube.liveBroadcasts.insert({
      key: YOUTUBE_API_KEY,
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          scheduledStartTime: startTime,
          scheduledEndTime: endTime,
        },
        status: {
          privacyStatus: 'public', // or 'unlisted', 'private'
        },
      },
    });

    const broadcast = broadcastResponse.data;

    // Create a live stream
    const streamResponse = await youtube.liveStreams.insert({
      key: YOUTUBE_API_KEY,
      part: ['snippet', 'cdn'],
      requestBody: {
        snippet: {
          title: `${title} Stream`,
        },
        cdn: {
          format: '1080p',
          ingestionType: 'rtmp',
        },
      },
    });

    const stream = streamResponse.data;

    // Bind the live stream to the broadcast
    await youtube.liveBroadcasts.bind({
      key: YOUTUBE_API_KEY,
      part: ['id', 'snippet'],
      id: broadcast.id,
      streamId: stream.id,
      requestBody: {},
    });

    return {
      broadcastId: broadcast.id,
      streamUrl: stream.cdn.ingestionInfo.streamName, // or ingestionInfo.rtmpUrl
    };
  } catch (error) {
    console.error('Error creating live broadcast:', error);
    throw error;
  }
};

// Function to end a live broadcast
const endLiveBroadcast = async (broadcastId) => {
  try {
    await youtube.liveBroadcasts.transition({
      key: YOUTUBE_API_KEY,
      part: ['status'],
      id: broadcastId,
      broadcastStatus: 'complete',
      notifySubscribers: false,
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
