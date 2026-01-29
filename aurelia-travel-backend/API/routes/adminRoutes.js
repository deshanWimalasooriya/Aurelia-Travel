const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 1. Import Middleware with the correct names
// We use 'verifyToken' because that is what your server.js uses.
const { verifyToken } = require('../middleware/authMiddleware');

// 2. Define a simple Admin Check middleware directly here
// (This prevents crashes if checkRole/admin is missing in your authMiddleware file)
const verifyAdmin = (req, res, next) => {
    // Check if user exists and has admin role
    // Note: Adjust 'role' or 'isAdmin' based on your actual database column
    if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) {
        next();
    } else {
        res.status(403).json({ 
            success: false, 
            message: 'Access denied. Admin privileges required.' 
        });
    }
};

// 3. Apply Authentication & Admin Check to ALL routes below
router.use(verifyToken); // 1st: Ensure user is logged in
router.use(verifyAdmin); // 2nd: Ensure user is an admin

// ==========================================
// ROUTES
// ==========================================

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