const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotelController");
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// ==========================================
// 1. STATIC ROUTES (MUST BE FIRST)
// ==========================================
router.get("/", hotelController.getAllHotels);
router.get("/newest", hotelController.getNewest);
router.get("/top-rated", hotelController.getTopRated);

// ✅ MANAGER ROUTE (Filters by Logged-in User ID)
router.get("/mine", verifyToken, checkRole('admin', 'HotelManager'), hotelController.getMyHotels);

// ==========================================
// 2. DYNAMIC ROUTES (MUST BE LAST)
// ==========================================
router.get("/:id", hotelController.getHotelById);

// Protected CRUD
router.post("/", verifyToken, checkRole('admin', 'HotelManager'), hotelController.create); 
router.put("/:id", verifyToken, checkRole('admin', 'HotelManager'), hotelController.update); 
router.delete("/:id", verifyToken, checkRole('admin', 'HotelManager'), hotelController.delete); 

module.exports = router;