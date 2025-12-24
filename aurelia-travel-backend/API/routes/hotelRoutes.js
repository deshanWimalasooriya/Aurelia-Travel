// routes/hotelRoutes.js
const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotelController");


router.get("/", hotelController.getAllHotels); // Read All
router.get("/newest", hotelController.getNewest);
router.get('/top-rated', hotelController.getTopRated);
router.post("/", hotelController.create); // Create
router.put("/:id", hotelController.update); // Update
router.delete("/:id", hotelController.delete); // Delete
router.get("/:id", hotelController.getHotelById); // Read One




module.exports = router;

