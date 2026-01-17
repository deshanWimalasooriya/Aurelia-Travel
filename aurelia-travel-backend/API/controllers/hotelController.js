const hotelModel = require("../models/hotelModel");

// Helper
const parseHotelData = (hotel) => {
  if (!hotel) return null;
  if (typeof hotel.facilities === 'string') {
    try { hotel.facilities = JSON.parse(hotel.facilities); } catch(e) { hotel.facilities = []; }
  }
  if (!hotel.location) hotel.location = `${hotel.city || ''}, ${hotel.country || ''}`;
  if (hotel.price) hotel.price = parseFloat(hotel.price);
  return hotel;
};

// ✅ GET HOTELS BY MANAGER ID
exports.getMyHotels = async (req, res) => {
    try {
        // req.user.userId comes from the verifyToken middleware
        const userId = req.user.userId; 
        
        const allHotels = await hotelModel.getAll();
        
        // Filter logic: manager_id must match user's ID
        const myHotels = allHotels.filter(h => h.manager_id === userId);
        
        res.json({ data: myHotels.map(parseHotelData) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ... (Keep existing create, update, delete, getAllHotels, getHotelById) ...

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.user && req.user.userId) data.manager_id = req.user.userId; // Auto-assign Manager
    if (Array.isArray(data.facilities)) data.facilities = JSON.stringify(data.facilities);
    
    const hotel = await hotelModel.create(data);
    res.status(201).json(parseHotelData(hotel));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAllHotels = async (req, res) => {
  try {
    const hotels = await hotelModel.getAll();
    res.json({ data: hotels.map(parseHotelData) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getHotelById = async (req, res) => {
  try {
    const hotel = await hotelModel.getById(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    res.json(parseHotelData(hotel));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const hotel = await hotelModel.getById(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    // Ownership Check
    if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
    }
    const data = { ...req.body };
    if (Array.isArray(data.facilities)) data.facilities = JSON.stringify(data.facilities);
    delete data.manager_id; // Prevent changing owner
    const updated = await hotelModel.update(req.params.id, data);
    res.json(parseHotelData(updated));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.delete = async (req, res) => {
  try {
    const hotel = await hotelModel.getById(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
    }
    await hotelModel.delete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getTopRated = async (req, res) => {
    try { const hotels = await hotelModel.TopRated(); res.json({ data: hotels.map(parseHotelData) }); } 
    catch (err) { res.status(500).json({ message: err.message }); }
};
exports.getNewest = async (req, res) => {
    try { const hotels = await hotelModel.getNewest(4); res.json({ data: hotels.map(parseHotelData) }); } 
    catch (err) { res.status(500).json({ message: err.message }); }
};