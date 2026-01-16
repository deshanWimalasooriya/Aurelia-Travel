// routes/hotelRoutes.js
const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotelController");
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Public Routes
router.get("/", hotelController.getAllHotels);
router.get("/newest", hotelController.getNewest);
router.get("/top-rated", hotelController.getTopRated);
router.get("/:id", hotelController.getHotelById);

// ✅ NEW: Manager's Route (Must be before /:id)
router.get("/mine", verifyToken, checkRole('admin', 'HotelManager'), hotelController.getMyHotels);

// ✅ Protected Routes (Managers & Admins)
// Note: We use checkRole to allow both admin and HotelManager
router.post("/", verifyToken, checkRole('admin', 'HotelManager'), hotelController.create); 
router.put("/:id", verifyToken, checkRole('admin', 'HotelManager'), hotelController.update); 
router.delete("/:id", verifyToken, checkRole('admin', 'HotelManager'), hotelController.delete); 

module.exports = router;