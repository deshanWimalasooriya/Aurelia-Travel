// controllers/hotelController.js
const hotelModel = require("../models/hotelModel");

// Create a hotel (FIXED)
exports.create = async (req, res) => {
  try {
    const hotel = await hotelModel.create(req.body);
    res.status(201).json(hotel);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all Hotels (with filters)
exports.getAllHotels = async (req, res) => {
  try {
    const hotels = await hotelModel.getAll();
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a hotel by ID (FIXED - added response)
exports.getHotelById = async (req, res) => {
  try {
    const hotel = await hotelModel.getById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    res.json(hotel); // ✅ Added missing response
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a hotel
exports.update = async (req, res) => {
  try {
    const hotel = await hotelModel.update(req.params.id, req.body);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    res.json({ message: "Hotel " + req.params.id + " updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a hotel
exports.delete = async (req, res) => {
  try {
    const deleted = await hotelModel.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    res.json({ message: "Hotel deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/hotels/top-rated (Top 4 rated hotels)
exports.getTopRated = async (req, res) => {
  try {
    const trHotels = await hotelModel.TopRated();
    res.json(trHotels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/hotels/newest (Newest 4 hotels)
exports.getNewest = async (req, res) => {
  try {
    const nHotels = await hotelModel.getNewest(4);
    res.json(nHotels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

