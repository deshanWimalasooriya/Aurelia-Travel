const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('../config/redisClient'); // Your working Redis connection!

// 1. Strict Auth Limiter (For Login & Register)
// Hackers love to spam these routes to guess passwords. We lock this down tight.
const authLimiter = rateLimit({
    store: new RedisStore({
        // This tells the rate limiter to use your existing Redis connection
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes memory window
    max: 10, // Limit each IP to 10 requests per window
    standardHeaders: true, 
    legacyHeaders: false,
    message: { 
        success: false, 
        message: "Too many login/register attempts from this IP. Please try again in 15 minutes." 
    }
});

// 2. General API Limiter (For all other routes)
// Protects your server from general DDoS attacks trying to crash your database
const generalLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 100, // Limit each IP to 100 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
        success: false, 
        message: "You are sending requests too quickly. Please slow down." 
    }
});

module.exports = { authLimiter, generalLimiter };