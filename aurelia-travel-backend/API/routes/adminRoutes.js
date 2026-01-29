const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// FIX: Use 'verifyToken' matching your authMiddleware.js export
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware to check if user is Admin
const verifyAdmin = (req, res, next) => {
    // Check role based on your database 'role' column ('admin')
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
};

// Apply security to all admin routes
router.use(verifyToken);
router.use(verifyAdmin);

// --- Routes ---
// Dashboard
router.get('/stats', adminController.getDashboardStats);
router.get('/bookings/recent', adminController.getRecentBookings);
router.get('/analytics', adminController.getAnalytics);
router.get('/finance', adminController.getFinancialData);

// Users
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Hotels
router.get('/hotels', adminController.getHotels);
router.put('/hotels/:id', adminController.updateHotel);
router.put('/hotels/:id/toggle-status', adminController.toggleHotelStatus);

// Bookings
router.get('/bookings', adminController.getBookings);
router.put('/bookings/:id', adminController.updateBooking);

// Reviews
router.get('/reviews', adminController.getReviews);
router.put('/reviews/:id/toggle', adminController.toggleReview);
router.delete('/reviews/:id', adminController.deleteReview);

module.exports = router;