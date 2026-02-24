// API/config/redisClient.js
const redis = require('redis');

// Create a Redis client
const redisClient = redis.createClient({
    // If using a local Redis instance, it defaults to localhost:6379
    // url: 'redis://localhost:6379' 
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis successfully!');
});

// Connect to Redis asynchronously
const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('Failed to connect to Redis', error);
    }
};

connectRedis();

module.exports = redisClient;