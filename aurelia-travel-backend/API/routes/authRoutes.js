const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {verifyToken} = require('../middleware/authMiddleware');

// POST /api/auth/login - Login user
router.post('/login', authController.login);

// POST /api/auth/logout - Logout user
router.post('/logout', authController.logout);

// POST /api/auth/register - Register new user
router.post('/register', authController.register);

// NEW: Add the /me route here
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;