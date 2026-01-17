const hotelModel = require("../models/hotelModel");

// Helper (Updated to handle new structure)
const parseHotelData = (hotel) => {
    if (!hotel) return null;
    // We no longer need to JSON.parse facilities/images because the model returns them as Objects/Arrays now.
    // However, if we still have old data, we check:
    if (typeof hotel.location === 'undefined') {
        hotel.location = `${hotel.city || ''}, ${hotel.country || ''}`;
    }
    if (hotel.price) hotel.price = parseFloat(hotel.price);
    return hotel;
};

// 1. PUBLIC SEARCH
exports.getAllHotels = async (req, res) => {
    try {
        const hotels = await hotelModel.getAll();
        res.json({ success: true, data: hotels.map(parseHotelData) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getHotelById = async (req, res) => {
    try {
        const hotel = await hotelModel.getById(req.params.id);
        if (!hotel) return res.status(404).json({ success: false, message: "Hotel not found" });
        res.json({ success: true, data: parseHotelData(hotel) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 2. MANAGER: Get My Hotels
exports.getMyHotels = async (req, res) => {
    try {
        const userId = req.user.userId;
        const myHotels = await hotelModel.getByManagerId(userId);
        res.json({ success: true, data: myHotels.map(parseHotelData) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 3. CREATE (Complex)
exports.create = async (req, res) => {
    try {
        const { 
            name, description, address_line_1, city, country, 
            latitude, longitude, amenities, images // Arrays from frontend
        } = req.body;

        const hotelData = {
            name, description, address_line_1, city, country,
            latitude, longitude,
            manager_id: req.user.userId,
            rating_average: 0,
            is_active: true
        };

        // ✅ Calls the new Transactional Create
        const newHotelId = await hotelModel.create(hotelData, amenities, images);
        const newHotel = await hotelModel.getById(newHotelId);

        res.status(201).json({ success: true, message: "Hotel created", data: parseHotelData(newHotel) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 4. UPDATE
exports.update = async (req, res) => {
    try {
        const hotel = await hotelModel.getById(req.params.id);
        if (!hotel) return res.status(404).json({ message: "Hotel not found" });

        // Ownership Check
        if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        const { name, description, city, country } = req.body;
        const updateData = { name, description, city, country };

        const updated = await hotelModel.update(req.params.id, updateData);
        res.json({ success: true, data: parseHotelData(updated) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 5. DELETE
exports.delete = async (req, res) => {
    try {
        const hotel = await hotelModel.getById(req.params.id);
        if (!hotel) return res.status(404).json({ message: "Hotel not found" });

        if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        await hotelModel.delete(req.params.id);
        res.json({ success: true, message: "Deleted" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 6. HELPERS
exports.getTopRated = async (req, res) => {
    try {
        const hotels = await hotelModel.TopRated();
        res.json({ success: true, data: hotels.map(parseHotelData) });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getNewest = async (req, res) => {
    try {
        const hotels = await hotelModel.getNewest();
        res.json({ success: true, data: hotels.map(parseHotelData) });
    } catch (err) { res.status(500).json({ error: err.message }); }
};