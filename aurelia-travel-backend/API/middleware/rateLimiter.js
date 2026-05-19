// ✅ FIX: Added Destructuring curly braces for Version 8 compatibility
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('../config/redisClient'); 

// 1. Strict Auth Limiter (For Login & Register)
const authLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 10 requests per window
    standardHeaders: true, 
    legacyHeaders: false,
    message: { 
        success: false, 
        message: "Too many login/register attempts from this IP. Please try again in 15 minutes." 
    }
});

// 2. General API Limiter (For all other routes)
const generalLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
        success: false, 
        message: "You are sending requests too quickly. Please slow down." 
    }
});

module.exports = { authLimiter, generalLimiter };