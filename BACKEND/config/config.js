const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
  MPESA_PASSKEY: process.env.MPESA_PASSKEY,
  MPESA_SHORTCODE: process.env.MPESA_SHORTCODE,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  FCM_PROJECT_ID: process.env.FCM_PROJECT_ID,
  FCM_PRIVATE_KEY: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'), // Important to replace escaped newlines
  FCM_CLIENT_EMAIL: process.env.FCM_CLIENT_EMAIL,
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET
};
