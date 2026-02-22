const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Public: Read reviews for a hotel
router.get('/hotel/:hotelId', reviewController.getHotelReviews);

// Protected User: Write review
router.post('/', verifyToken, reviewController.addReview);

// ✅ NEW: Manager Routes
router.get('/manager', verifyToken, checkRole('admin', 'hotel_manager'), reviewController.getManagerReviews);
router.put('/:id/reply', verifyToken, checkRole('admin', 'hotel_manager'), reviewController.replyToReview);

module.exports = router;