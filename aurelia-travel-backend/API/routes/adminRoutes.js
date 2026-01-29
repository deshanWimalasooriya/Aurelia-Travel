const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware'); 

// IMPORTANT: Apply authentication middleware to all routes
// This ensures only logged-in Admins can access these
router.use(protect); 
router.use(admin);

// 1. Dashboard & Analytics
router.get('/stats', adminController.getDashboardStats);
router.get('/bookings/recent', adminController.getRecentBookings);
router.get('/analytics', adminController.getAnalytics);
router.get('/finance', adminController.getFinancialData);

// 2. User Management
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// 3. Hotel Management
router.get('/hotels', adminController.getHotels);
router.put('/hotels/:id', adminController.updateHotel);
router.put('/hotels/:id/toggle-status', adminController.toggleHotelStatus);

// 4. Booking Management
router.get('/bookings', adminController.getBookings);
router.put('/bookings/:id', adminController.updateBooking);

// 5. Review Management
router.get('/reviews', adminController.getReviews);
router.put('/reviews/:id/toggle', adminController.toggleReview);
router.delete('/reviews/:id', adminController.deleteReview);

module.exports = router;