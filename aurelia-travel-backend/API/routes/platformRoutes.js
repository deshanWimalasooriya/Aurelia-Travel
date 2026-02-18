const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Prefix: /api/platform

router.use(verifyToken);
router.use(checkRole('admin'));

// Overview
router.get('/overview', platformController.getPlatformOverview);

// Hotels
router.get('/hotels', platformController.getAllHotels);
router.put('/hotels/:id/status', platformController.updateHotelStatus);

// Users
router.get('/users', platformController.getAllUsers);
router.put('/users/:id', platformController.updateUser); // ✅ NEW: Edit User Route
router.post('/users/:id/action', platformController.manageUser); // Ban/Delete

// Finance
router.get('/finance', platformController.getPlatformTransactions);

// Reviews
router.get('/reviews', platformController.getAllReviews);
router.delete('/reviews/:id', platformController.deleteReview);

// Settings
router.get('/settings', platformController.getSettings);
router.put('/settings', platformController.updateSettings);

// ✅ NEW: Logs
router.get('/logs', platformController.getSystemLogs);

module.exports = router;