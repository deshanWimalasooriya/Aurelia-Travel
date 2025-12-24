const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const {verifyToken} = require('../middleware/authMiddleware');

// POST /api/auth/login - Login user
router.post('/login', authController.login);

// POST /api/auth/logout - Logout user
router.post('/logout', authController.logout);

// POST /api/auth/register - Register new user
router.post('/register', authController.register);

router.get('/me', verifyToken, userController.getCurrentUser);

module.exports = router;