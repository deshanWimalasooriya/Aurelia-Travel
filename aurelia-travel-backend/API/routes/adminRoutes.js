const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// All routes require admin role
router.use(verifyToken, checkRole('admin'));

// ========================================
// DASHBOARD
// ========================================
router.get('/stats', adminController.getDashboardStats);
router.get('/bookings/recent', adminController.getRecentBookings);
router.get('/analytics', adminController.getAnalyticsData);
router.get('/finance', adminController.getFinancialData);

// ========================================
// USER MANAGEMENT
// ========================================
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// ========================================
// HOTEL MANAGEMENT
// ========================================
router.get('/hotels', adminController.getAllHotels);
router.put('/hotels/:id', adminController.updateHotel);
router.put('/hotels/:id/toggle-status', adminController.toggleHotelStatus);

// ========================================
// BOOKING MANAGEMENT
// ========================================
router.get('/bookings', adminController.getAllBookings);
router.put('/bookings/:id', adminController.updateBooking);

// ========================================
// REVIEW MANAGEMENT
// ========================================
router.get('/reviews', adminController.getAllReviews);
router.put('/reviews/:id/toggle', adminController.toggleReviewApproval);
router.delete('/reviews/:id', adminController.deleteReview);

module.exports = router;
