// BACKEND/config/hms.js
const { SDK } = require('@100mslive/server-sdk');

const initializeHMSSDK = () => {
  if (!process.env.HMS_ACCESS_KEY || !process.env.HMS_SECRET) {
    throw new Error('HMS credentials not configured');
  }

  return new SDK({
    access_key: process.env.HMS_ACCESS_KEY,
    secret: process.env.HMS_SECRET
  });
};

const hmsClient = initializeHMSSDK();
module.exports = hmsClient;