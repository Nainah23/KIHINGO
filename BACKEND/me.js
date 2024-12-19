module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  // MediaSoup settings
  MEDIASOUP_LISTEN_IP: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
  MEDIASOUP_ANNOUNCED_IP: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1', // Change this to your server's public IP
  MEDIASOUP_MIN_PORT: 40000,
  MEDIASOUP_MAX_PORT: 49999,
};