const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Route: GET /api/admin/stats
// Protected: Only 'admin' role can access
router.get('/stats', verifyToken, checkRole('admin'), adminController.getDashboardStats);

// Route: GET /api/admin/bookings
// Protected: Only 'admin' role can access
router.get('/bookings', verifyToken, checkRole('admin'), adminController.getRecentBookings);

// ✅ NEW: Analytics Route
router.get('/analytics', verifyToken, checkRole('admin', 'HotelManager'), adminController.getAnalyticsData);

module.exports = router;