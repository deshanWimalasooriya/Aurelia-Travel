const roomModel = require('../models/roomModel');
const hotelModel = require('../models/hotelModel');

// 1. PUBLIC ROUTES
exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await roomModel.getAllRooms();
        res.json({ success: true, data: rooms });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getRoomById = async (req, res) => {
    try {
        const room = await roomModel.getRoomById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });
        res.json({ success: true, data: room });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getRoomsByHotelId = async (req, res) => {
    try {
        const rooms = await roomModel.getRoomsByHotelId(req.params.hotelId);
        res.json({ success: true, data: rooms });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 2. MANAGER: Create Room (Auto-Inventory)
exports.createRoom = async (req, res) => {
    try {
        const { 
            hotel_id, title, room_type, base_price_per_night, 
            total_quantity, images, description 
        } = req.body;

        // Verify Ownership
        const hotel = await hotelModel.getById(hotel_id);
        if (!hotel) return res.status(404).json({ message: "Hotel not found" });
        
        if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        const roomData = {
            hotel_id, title, room_type, description,
            base_price_per_night,
            total_quantity: total_quantity || 1,
        };

        // ✅ Pass images separately to model
        const newRoomId = await roomModel.createRoom(roomData, images); 
        const newRoom = await roomModel.getRoomById(newRoomId);

        res.status(201).json({ success: true, message: "Room created & Inventory generated", data: newRoom });

    } catch (err) {
        console.error("Create Room Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// 3. MANAGER: Get My Rooms
exports.getMyRooms = async (req, res) => {
    try {
        const rooms = await roomModel.getRoomsByManagerId(req.user.userId);
        res.json({ success: true, data: rooms });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 4. UPDATE
exports.updateRoom = async (req, res) => {
    try {
        const room = await roomModel.getRoomById(req.params.id);
        if(!room) return res.status(404).json({message: "Room not found"});
        
        const hotel = await hotelModel.getById(room.hotel_id);
        if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        const updated = await roomModel.updateRoom(req.params.id, req.body);
        res.json({ success: true, data: updated });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 5. DELETE
exports.deleteRoom = async (req, res) => {
    try {
        const room = await roomModel.getRoomById(req.params.id);
        if(!room) return res.status(404).json({message: "Room not found"});

        const hotel = await hotelModel.getById(room.hotel_id);
        if (req.user.role !== 'admin' && hotel.manager_id !== req.user.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        await roomModel.deleteRoom(req.params.id);
        res.json({ success: true, message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};