const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Get current user's bookings (Critical: Must be before /:id)
router.get('/my-bookings', verifyToken, bookingController.getMyBookings);

// Get bookings by user ID (Admin only)
router.get('/user/:userId', verifyToken, checkRole('admin'), bookingController.getBookingsByUserId);

// Get all bookings (Admin only)
router.get('/', verifyToken, checkRole('admin'), bookingController.getAllBookings);

// Get specific booking
router.get('/:id', verifyToken, bookingController.getBookingById);

// Create a booking
router.post('/', verifyToken, bookingController.createBooking);

// Update a booking
router.put('/:id', verifyToken, bookingController.updateBooking);

// Delete a booking
router.delete('/:id', verifyToken, bookingController.deleteBooking);

module.exports = router;