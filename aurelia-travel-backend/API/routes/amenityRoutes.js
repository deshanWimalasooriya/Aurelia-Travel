const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/amenityController');

// GET /api/amenities
// Returns all master amenities. Supports ?grouped=true
router.get('/', amenityController.getAll);

// GET /api/amenities/categories
// Returns all amenity categories
router.get('/categories', amenityController.getCategories);

// GET /api/amenities/hotel/:hotelId
// Returns amenities specific to a hotel (Pool, WiFi, etc.)
router.get('/hotel/:hotelId', amenityController.getByHotel);

// GET /api/amenities/room/:roomId
// Returns "virtual" amenities for a room (Breakfast, View, Size)
router.get('/room/:roomId', amenityController.getByRoom);

module.exports = router;