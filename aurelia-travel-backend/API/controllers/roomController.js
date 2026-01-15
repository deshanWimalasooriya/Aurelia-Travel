const roomModel = require('../models/roomModel');

// --- HELPER: Parse JSON fields from MySQL ---
const parseRoom = (room) => {
    if (!room) return null;
    const jsonFields = ['facilities', 'bathroom_amenities', 'photos'];
    
    jsonFields.forEach(field => {
        if (typeof room[field] === 'string') {
            try {
                room[field] = JSON.parse(room[field]);
            } catch (e) {
                room[field] = [];
            }
        }
    });
    
    // Ensure numbers are numbers (MySQL decimals come as strings sometimes)
    if (room.price_per_night) room.price_per_night = parseFloat(room.price_per_night);
    
    return room;
};

// --- HELPER: Stringify JSON fields for MySQL ---
const prepareForDb = (data) => {
    const dbData = { ...data };
    const jsonFields = ['facilities', 'bathroom_amenities', 'photos'];
    
    jsonFields.forEach(field => {
        if (Array.isArray(dbData[field])) {
            dbData[field] = JSON.stringify(dbData[field]);
        }
    });
    return dbData;
}

exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await roomModel.getAllRooms();
        res.json(rooms.map(parseRoom));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRoomById = async (req, res) => {
    try {
        const room = await roomModel.getRoomById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });
        res.json(parseRoom(room));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createRoom = async (req, res) => {
    try {
        const dbData = prepareForDb(req.body);
        const newRoom = await roomModel.createRoom(dbData);
        res.status(201).json(parseRoom(newRoom));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const dbData = prepareForDb(req.body);
        const updated = await roomModel.updateRoom(req.params.id, dbData);
        if (!updated) return res.status(404).json({ message: 'Room not found' });
        res.json(parseRoom(updated));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const deleted = await roomModel.deleteRoom(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Room not found' });
        res.json({ message: 'Room deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRoomsByHotelId = async (req, res) => {
    try {
        const rooms = await roomModel.getRoomsByHotelId(req.params.hotelId);
        res.json(rooms.map(parseRoom));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};