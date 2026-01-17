const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// ==========================================
// 1. STATIC ROUTES
// ==========================================
router.get('/', roomController.getAllRooms);

// ✅ MANAGER ROUTE (Must be before /:id)
router.get('/mine', verifyToken, checkRole('admin', 'HotelManager'), roomController.getMyRooms);

// ==========================================
// 2. DYNAMIC ROUTES
// ==========================================
router.get('/:id', roomController.getRoomById);
router.get('/hotel/:hotelId', roomController.getRoomsByHotelId);

// Protected CRUD
router.post('/', verifyToken, checkRole('admin', 'HotelManager'), roomController.createRoom);
router.put('/:id', verifyToken, checkRole('admin', 'HotelManager'), roomController.updateRoom);
router.delete('/:id', verifyToken, checkRole('admin', 'HotelManager'), roomController.deleteRoom);

module.exports = router;