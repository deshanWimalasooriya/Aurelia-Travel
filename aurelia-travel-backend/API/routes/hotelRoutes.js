const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotelController");
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Public Routes
router.get("/", hotelController.getAllHotels);
router.get("/newest", hotelController.getNewest);
router.get("/top-rated", hotelController.getTopRated);

// Manager Routes
router.get("/mine", verifyToken, checkRole('admin', 'HotelManager'), hotelController.getMyHotels);

// Dynamic ID Routes
router.get("/:id", hotelController.getHotelById);

// Protected CRUD
router.post("/", verifyToken, checkRole('admin', 'HotelManager'), hotelController.create);
router.put("/:id", verifyToken, checkRole('admin', 'HotelManager'), hotelController.update);
router.delete("/:id", verifyToken, checkRole('admin', 'HotelManager'), hotelController.delete);

module.exports = router;