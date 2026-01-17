const roomModel = require('../models/roomModel');
const hotelModel = require('../models/hotelModel');

const parseRoom = (room) => {
    if (!room) return null;
    ['facilities', 'bathroom_amenities', 'photos'].forEach(f => {
        if (typeof room[f] === 'string') { try { room[f] = JSON.parse(room[f]); } catch (e) { room[f] = []; } }
    });
    if (room.price_per_night) room.price_per_night = parseFloat(room.price_per_night);
    return room;
};

// ✅ GET ROOMS FOR LOGGED-IN MANAGER
exports.getMyRooms = async (req, res) => {
    try {
        // This function in model should JOIN hotels table
        const rooms = await roomModel.getRoomsByManagerId(req.user.userId);
        res.json(rooms.map(parseRoom));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ... (Keep existing createRoom, updateRoom, deleteRoom, etc.) ...

exports.getAllRooms = async (req, res) => {
    try { const rooms = await roomModel.getAllRooms(); res.json(rooms.map(parseRoom)); } 
    catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getRoomById = async (req, res) => {
    try {
        const room = await roomModel.getRoomById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });
        res.json(parseRoom(room));
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createRoom = async (req, res) => {
    try {
        const dbData = { ...req.body };
        ['facilities', 'bathroom_amenities', 'photos'].forEach(f => {
            if(Array.isArray(dbData[f])) dbData[f] = JSON.stringify(dbData[f]);
        });

        // Validate Ownership
        const hotel = await hotelModel.getById(dbData.hotel_id);
        if (!hotel) return res.status(404).json({ message: "Hotel not found" });
        if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        const newRoom = await roomModel.createRoom(dbData);
        res.status(201).json(parseRoom(newRoom));
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateRoom = async (req, res) => {
    try {
        const room = await roomModel.getRoomById(req.params.id);
        if(!room) return res.status(404).json({message: "Room not found"});
        
        const hotel = await hotelModel.getById(room.hotel_id);
        if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) return res.status(403).json({ message: "Access denied" });

        const dbData = { ...req.body };
        ['facilities', 'bathroom_amenities', 'photos'].forEach(f => {
            if(Array.isArray(dbData[f])) dbData[f] = JSON.stringify(dbData[f]);
        });

        const updated = await roomModel.updateRoom(req.params.id, dbData);
        res.json(parseRoom(updated));
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteRoom = async (req, res) => {
    try {
        const room = await roomModel.getRoomById(req.params.id);
        if(!room) return res.status(404).json({message: "Room not found"});

        const hotel = await hotelModel.getById(room.hotel_id);
        if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) return res.status(403).json({ message: "Access denied" });

        await roomModel.deleteRoom(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getRoomsByHotelId = async (req, res) => {
    try {
        const rooms = await roomModel.getRoomsByHotelId(req.params.hotelId);
        res.json(rooms.map(parseRoom));
    } catch (err) { res.status(500).json({ error: err.message }); }
}; 
