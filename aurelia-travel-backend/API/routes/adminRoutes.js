const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Apply middleware to all admin routes
router.use(verifyToken, checkRole('admin'));

// Dashboard Statistics
router.get('/stats', adminController.getDashboardStats);

// Recent Bookings
router.get('/bookings', adminController.getRecentBookings);

// Revenue Analytics
router.get('/revenue/monthly', adminController.getMonthlyRevenue);

// Top Hotels
router.get('/hotels/top', adminController.getTopHotels);

// User Growth
router.get('/users/growth', adminController.getUserGrowth);

// Booking Status Distribution
router.get('/bookings/status-distribution', adminController.getBookingStatusDistribution);

// User Management
router.get('/users', adminController.getAllUsers);

// Hotel Management
router.get('/hotels', adminController.getAllHotels);

// Update Booking Status
router.patch('/bookings/:id/status', adminController.updateBookingStatus);

module.exports = router;
