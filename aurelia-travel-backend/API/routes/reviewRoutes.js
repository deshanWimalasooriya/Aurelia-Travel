const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public: Read reviews
router.get('/hotel/:hotelId', reviewController.getHotelReviews);

// Protected: Write review
router.post('/', verifyToken, reviewController.addReview);

module.exports = router;