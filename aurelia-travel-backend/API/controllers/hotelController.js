// controllers/hotelController.js
const hotelModel = require("../models/hotelModel");

// Helper: MySQL often returns JSON columns as strings. We must parse them.
const parseHotelData = (hotel) => {
  if (!hotel) return null;
  
  // Ensure facilities is an array
  if (typeof hotel.facilities === 'string') {
    try { hotel.facilities = JSON.parse(hotel.facilities); } catch(e) { hotel.facilities = []; }
  }
  
  // Combine address fields for simple display if needed
  if (!hotel.location) {
      hotel.location = `${hotel.city}, ${hotel.country}`;
  }
  
  // Ensure Price is a number (aggregates return strings sometimes)
  if (hotel.price) {
      hotel.price = parseFloat(hotel.price);
  } else {
      hotel.price = 0; // Fallback if no rooms
  }

  return hotel;
};

exports.create = async (req, res) => {
  try {
    // If facilities came as string from form-data, parse it, otherwise stringify for DB
    const data = { ...req.body };
    if (Array.isArray(data.facilities)) data.facilities = JSON.stringify(data.facilities);
    
    const hotel = await hotelModel.create(data);
    res.status(201).json(parseHotelData(hotel));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllHotels = async (req, res) => {
  try {
    const hotels = await hotelModel.getAll();
    const parsed = hotels.map(parseHotelData);
    res.json({ data: parsed }); // Consistent response format { data: [...] }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getHotelById = async (req, res) => {
  try {
    const hotel = await hotelModel.getById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    res.json(parseHotelData(hotel));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (Array.isArray(data.facilities)) data.facilities = JSON.stringify(data.facilities);

    const hotel = await hotelModel.update(req.params.id, data);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    res.json(parseHotelData(hotel));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

exports.getTopRated = async (req, res) => {
  try {
    const hotels = await hotelModel.TopRated();
    res.json({ data: hotels.map(parseHotelData) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNewest = async (req, res) => {
  try {
    const hotels = await hotelModel.getNewest(4);
    res.json({ data: hotels.map(parseHotelData) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
