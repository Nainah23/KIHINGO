const { SDK } = require('@100mslive/server-sdk');

const hmsAuthMiddleware = async (req, res, next) => {
  try {
    // Validate HMS configuration
    if (!process.env.HMS_ACCESS_KEY || !process.env.HMS_SECRET || !process.env.HMS_TEMPLATE_ID) {
      console.error('HMS configuration missing');
      return res.status(500).json({
        success: false,
        msg: 'Streaming service configuration error - missing required credentials'
      });
    }

    // Initialize HMS SDK client
    const hmsClient = new SDK({
      access_key: process.env.HMS_ACCESS_KEY, // Changed from access_key to accessKey
      secret: process.env.HMS_SECRET
    });

    // No need to validate management token - HMS SDK handles authentication internally
    // Instead, verify the SDK initialization by making a test API call
    try {
      // Try to fetch rooms (lightweight operation) to verify credentials
      await hmsClient.rooms.list({ limit: 1 });
    } catch (sdkError) {
      console.error('HMS SDK initialization error:', sdkError);
      return res.status(401).json({
        success: false,
        msg: 'Invalid streaming service credentials - please check your HMS access key and secret'
      });
    }

    // Attach HMS client to request object
    req.hmsClient = hmsClient;
    req.hmsAccessKey = process.env.HMS_ACCESS_KEY;
    req.hmsSecret = process.env.HMS_SECRET;
    req.hmsManagementToken = process.env.HMS_AUTH_TOKEN;

    next();
  } catch (err) {
    console.error('HMS Auth middleware error:', err);
    return res.status(500).json({
      success: false,
      msg: 'Streaming service authentication error',
      error: err.message
    });
  }
};

module.exports = hmsAuthMiddleware;