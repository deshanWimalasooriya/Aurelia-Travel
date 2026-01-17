const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// All Admin routes require 'admin' role
router.use(verifyToken, checkRole('admin'));

router.get('/stats', adminController.getDashboardStats);
router.get('/bookings', adminController.getRecentBookings);
router.get('/analytics', adminController.getAnalyticsData);

module.exports = router;