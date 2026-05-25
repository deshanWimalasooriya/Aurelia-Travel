const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.post('/guest', bookingController.createBooking);
router.put('/guest/:id/confirm', bookingController.confirmGuestBooking);

// 1. CONSUMER ROUTES
router.get('/my-bookings', verifyToken, bookingController.getMyBookings);
router.post('/', verifyToken, bookingController.createBooking);
router.put('/:id/confirm', verifyToken, bookingController.confirmUserBooking);



// 2. MANAGER ROUTES
router.get('/manager/all', verifyToken, checkRole('admin', 'hotel_manager'), bookingController.getManagerBookings);
router.put('/:id/status', verifyToken, checkRole('admin', 'hotel_manager'), bookingController.updateBookingStatus);

// 3. ADMIN / GENERIC
router.get('/', verifyToken, checkRole('admin'), bookingController.getAllBookings);
router.get('/:id', verifyToken, bookingController.getBookingById);
router.delete('/:id', verifyToken, checkRole('admin'), bookingController.deleteBooking);
router.get('/hotel/:hotelId', verifyToken, checkRole('admin', 'hotel_manager'), bookingController.getBookingsByHotelId);

module.exports = router;