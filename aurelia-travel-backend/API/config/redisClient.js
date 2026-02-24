// API/config/redisClient.js
const redis = require('redis');

// Create a Redis client
const redisClient = redis.createClient({
    username: 'default',   // ✅ ADD THIS LINE
    password: 'OTTHFaLuIOjMNgaBw9bkJfOvlhVX0rJj', // Double-check this is exactly what Redis Labs shows!
    socket: {
        host: 'redis-11990.c14.us-east-1-3.ec2.cloud.redislabs.com', 
        port: 11990
    }
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