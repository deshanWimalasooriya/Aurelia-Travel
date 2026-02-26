const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected Routes (Session Check)
router.get('/me', verifyToken, authController.getCurrentUser);

// --- TWO-FACTOR AUTHENTICATION ROUTES ---

// 1. Generate the QR Code (Requires the user to be logged in)
router.post('/2fa/generate', verifyToken, authController.generate2FA);

// 2. Verify the 6-digit code and permanently enable 2FA
router.post('/2fa/verify-enable', verifyToken, authController.verifyAndEnable2FA);

// 3. Login verification for 2FA (Public route, user isn't logged in yet)
router.post('/verify-2fa-login', authController.verify2FALogin);

module.exports = router;