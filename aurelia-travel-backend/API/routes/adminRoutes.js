// aurelia-travel-backend/API/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// All routes require admin role
router.use(verifyToken, checkRole('admin'));

// Dashboard Stats
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/revenue-chart', adminController.getRevenueChart);
router.get('/dashboard/top-hotels', adminController.getTopHotels);
router.get('/dashboard/user-activity', adminController.getUserActivity);
router.get('/dashboard/booking-status', adminController.getBookingStatus);

// Bookings Management
router.get('/bookings', adminController.getAllBookings);
router.get('/bookings/recent', adminController.getRecentBookings);
router.put('/bookings/:bookingId/status', adminController.updateBookingStatus);

// User Management
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId', adminController.updateUserStatus);
router.delete('/users/:userId', adminController.deleteUser);

module.exports = router;