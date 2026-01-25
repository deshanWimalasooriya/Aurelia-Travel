const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Public
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);
router.get('/hotel/:hotelId', roomController.getRoomsByHotelId);

// Manager
router.get('/mine', verifyToken, checkRole('admin', 'hotel_manager'), roomController.getMyRooms);

// Protected CRUD
router.post('/', verifyToken, checkRole('admin', 'hotel_manager'), roomController.createRoom);
router.put('/:id', verifyToken, checkRole('admin', 'hotel_manager'), roomController.updateRoom);
router.delete('/:id', verifyToken, checkRole('admin', 'hotel_manager'), roomController.deleteRoom);

module.exports = router;