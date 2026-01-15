// routes/hotelRoutes.js
const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotelController");

// Static Routes first
router.get("/", hotelController.getAllHotels);
router.get("/newest", hotelController.getNewest);
router.get("/top-rated", hotelController.getTopRated);

// Dynamic Routes next
router.get("/:id", hotelController.getHotelById);
router.post("/", hotelController.create); 
router.put("/:id", hotelController.update); 
router.delete("/:id", hotelController.delete); 

module.exports = router;