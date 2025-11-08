const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  password: process.env.REDIS_PASS,
  socket: {
      host: process.env.REDIS_HOST_ID,
      port: process.env.REDIS_PORT 
  }
});

// Add event listeners for logging connection status
redisClient.on('connect', () => {
  console.log('Connecting to Redis...');
});

redisClient.on('ready', () => {
  console.log('Redis connection has been established successfully.');
});

redisClient.on('error', (err) => {
  console.error('Redis connection FAILED:', err);
});

module.exports = redisClient;