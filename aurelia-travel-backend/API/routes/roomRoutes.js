const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Public routes
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);
router.get('/hotel/:hotelId', roomController.getRoomsByHotelId); // Get rooms by hotel id

// Protected routes (Admin only)
router.post('/', verifyToken, checkRole('admin'), roomController.createRoom);
router.put('/:id', verifyToken, checkRole('admin'), roomController.updateRoom);
router.delete('/:id', verifyToken, checkRole('admin'), roomController.deleteRoom);

module.exports = router;