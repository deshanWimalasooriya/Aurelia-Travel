const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { verifyToken } = require('../middleware/authMiddleware');

// ============================================================================
// 1. PUBLIC ROUTES (No JWT required)
// ============================================================================
// Public view of shared itineraries
router.get('/shared/:uuid', tripController.getSharedTrip);

// ============================================================================
// 2. PROTECTED ROUTES (JWT required)
// ============================================================================
// Save or update customized itinerary (Knex Transaction)
router.post('/save', verifyToken, tripController.saveTrip);

// Retrieve all saved trips for the authenticated user
router.get('/my-trips', verifyToken, tripController.getMyTrips);

// Delete saved trip by ID
router.delete('/:id', verifyToken, tripController.deleteTrip);

module.exports = router;

