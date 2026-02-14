const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Debug check
console.log('✅ Platform Routes Loaded');

// Apply Middleware
router.use(verifyToken);
router.use(checkRole('admin'));

// Routes
router.get('/overview', platformController.getPlatformOverview);
router.get('/hotels', platformController.getAllHotels);
router.put('/hotels/:id/status', platformController.updateHotelStatus);
router.get('/users', platformController.getAllUsers);
router.post('/users/:id/action', platformController.manageUser);
router.get('/finance', platformController.getPlatformTransactions);
router.get('/reviews', platformController.getAllReviews);
router.delete('/reviews/:id', platformController.deleteReview);
router.get('/settings', platformController.getSettings);
router.put('/settings', platformController.updateSettings);

module.exports = router;