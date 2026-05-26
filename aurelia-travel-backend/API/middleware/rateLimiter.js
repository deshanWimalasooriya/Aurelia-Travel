const { rateLimit } = require('express-rate-limit');

// 1. Strict Auth Limiter (For Login & Register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per window for testing
    standardHeaders: true, 
    legacyHeaders: false,
    message: { 
        success: false, 
        message: "Too many login/register attempts from this IP. Please try again in 15 minutes." 
    }
});

// 2. General API Limiter (For all other routes)
const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // Limit each IP to 1000 requests per minute for testing
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
        success: false, 
        message: "You are sending requests too quickly. Please slow down." 
    }
});

module.exports = { authLimiter, generalLimiter };