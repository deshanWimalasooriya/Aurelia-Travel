// controllers/hotelController.js
const hotelModel = require("../models/hotelModel");

// Helper: Parse JSON fields and formats
const parseHotelData = (hotel) => {
  if (!hotel) return null;
  
  if (typeof hotel.facilities === 'string') {
    try { hotel.facilities = JSON.parse(hotel.facilities); } catch(e) { hotel.facilities = []; }
  }
  
  if (!hotel.location) {
      hotel.location = `${hotel.city}, ${hotel.country}`;
  }
  
  if (hotel.price) {
      hotel.price = parseFloat(hotel.price);
  } else {
      hotel.price = 0; 
  }

  return hotel;
};



exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    
    // ✅ 1. Assign Manager ID automatically from the logged-in user
    // (req.user is set by the authMiddleware)
    if (req.user && req.user.userId) {
        data.manager_id = req.user.userId;
    }

    if (Array.isArray(data.facilities)) data.facilities = JSON.stringify(data.facilities);
    
    const hotel = await hotelModel.create(data);
    res.status(201).json(parseHotelData(hotel));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllHotels = async (req, res) => {
  try {
    // Optional: If you want an endpoint that returns ONLY the manager's hotels
    // You can check a query param like ?mode=manager
    let hotels;
    if (req.query.mode === 'manager' && req.user) {
        // This assumes you add a getByManagerId method to your model, 
        // or filter here (less efficient). 
        // For now, let's keep the standard public list behavior unless specifically requested.
        hotels = await hotelModel.getAll(); 
        // Filter in memory if needed, or add model support.
        // Better approach: create a separate export 'getMyHotels'
    } else {
        hotels = await hotelModel.getAll();
    }

    const parsed = hotels.map(parseHotelData);
    res.json({ data: parsed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ NEW: Get only hotels managed by the current user
exports.getMyHotels = async (req, res) => {
    try {
        const allHotels = await hotelModel.getAll();
        // Filter by manager_id
        const myHotels = allHotels.filter(h => h.manager_id === req.user.userId);
        res.json({ data: myHotels.map(parseHotelData) });
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
    const hotelId = req.params.id;
    const existingHotel = await hotelModel.getById(hotelId);

    if (!existingHotel) {
        return res.status(404).json({ message: "Hotel not found" });
    }

    // ✅ 2. Ownership Check: Only Admin or the Owner can update
    if (req.user.role !== 'admin' && existingHotel.manager_id !== req.user.userId) {
        return res.status(403).json({ message: "Access denied. You do not own this hotel." });
    }

    const data = { ...req.body };
    if (Array.isArray(data.facilities)) data.facilities = JSON.stringify(data.facilities);

    // Prevent changing the owner unless admin
    if (req.user.role !== 'admin') {
        delete data.manager_id;
    }

    const hotel = await hotelModel.update(hotelId, data);
    res.json(parseHotelData(hotel));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const hotelId = req.params.id;
    const existingHotel = await hotelModel.getById(hotelId);

    if (!existingHotel) {
        return res.status(404).json({ message: "Hotel not found" });
    }

    // ✅ 3. Ownership Check for Deletion
    if (req.user.role !== 'admin' && existingHotel.manager_id !== req.user.userId) {
        return res.status(403).json({ message: "Access denied. You do not own this hotel." });
    }

    await hotelModel.delete(hotelId);
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