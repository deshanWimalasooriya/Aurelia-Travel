const roomModel = require('../models/roomModel');
const hotelModel = require('../models/hotelModel'); // Needed for ownership check

const parseRoom = (room) => {
    if (!room) return null;
    const jsonFields = ['facilities', 'bathroom_amenities', 'photos'];
    jsonFields.forEach(field => {
        if (typeof room[field] === 'string') {
            try { room[field] = JSON.parse(room[field]); } catch (e) { room[field] = []; }
        }
    });
    if (room.price_per_night) room.price_per_night = parseFloat(room.price_per_night);
    return room;
};

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
        
        // ✅ 1. Validate Hotel Ownership
        const hotel = await hotelModel.getById(dbData.hotel_id);
        if (!hotel) {
            return res.status(404).json({ message: "Target hotel not found" });
        }

        if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) {
            return res.status(403).json({ message: "Access denied. You can only add rooms to your own hotels." });
        }

        const newRoom = await roomModel.createRoom(dbData);
        res.status(201).json(parseRoom(newRoom));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const roomId = req.params.id;
        const existingRoom = await roomModel.getRoomById(roomId);
        if (!existingRoom) return res.status(404).json({ message: 'Room not found' });

        // ✅ 2. Validate Ownership (via parent Hotel)
        const hotel = await hotelModel.getById(existingRoom.hotel_id);
        if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) {
            return res.status(403).json({ message: "Access denied. You do not own this room." });
        }

        const dbData = prepareForDb(req.body);
        const updated = await roomModel.updateRoom(roomId, dbData);
        res.json(parseRoom(updated));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const roomId = req.params.id;
        const existingRoom = await roomModel.getRoomById(roomId);
        if (!existingRoom) return res.status(404).json({ message: 'Room not found' });

        // ✅ 3. Validate Ownership
        const hotel = await hotelModel.getById(existingRoom.hotel_id);
        if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) {
            return res.status(403).json({ message: "Access denied. You do not own this room." });
        }

        await roomModel.deleteRoom(roomId);
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