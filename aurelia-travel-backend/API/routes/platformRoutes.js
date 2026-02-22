const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Prefix: /api/platform

// ==========================================
// 🔓 PUBLIC ROUTES (Must be ABOVE middleware!)
// ==========================================
router.get('/settings/public', platformController.getPublicSettings);
router.post('/contact', platformController.submitContact);
router.get('/stats/public', platformController.getPublicStats);

// ==========================================
// 🔒 PROTECTED SUPER ADMIN ROUTES
// ==========================================
// Everything below these two lines is locked and requires an Admin Token
router.use(verifyToken);
router.use(checkRole('admin'));

// Overview
router.get('/overview', platformController.getPlatformOverview);

// Hotels
router.get('/hotels', platformController.getAllHotels);
router.put('/hotels/:id/status', platformController.updateHotelStatus);

// Users
router.get('/users', platformController.getAllUsers);
router.put('/users/:id', platformController.updateUser); 
router.post('/users/:id/action', platformController.manageUser);

// Finance
router.get('/finance', platformController.getPlatformTransactions);

// Reviews
router.get('/reviews', platformController.getAllReviews);
router.delete('/reviews/:id', platformController.deleteReview);

// Settings
router.get('/settings', platformController.getSettings);
router.put('/settings', platformController.updateSettings);

// Logs
router.get('/logs', platformController.getSystemLogs);

// Messages
router.get('/messages', platformController.getMessages);
router.put('/messages/:id/read', platformController.markMessageRead);
router.delete('/messages/:id', platformController.deleteMessage);

module.exports = router;