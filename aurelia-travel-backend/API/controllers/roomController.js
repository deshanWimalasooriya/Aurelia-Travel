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
            total_quantity, images, description,
            max_adults, max_children, size_sqm, view_type, bed_type,
            has_breakfast, is_refundable, smoking_allowed
        } = req.body;

        // Verify Ownership
        const hotel = await hotelModel.getById(hotel_id);
        if (!hotel) return res.status(404).json({ message: "Hotel not found" });
        
        // --- FIX 403: Convert IDs to String for comparison ---
        if (req.user.role !== 'admin' && String(hotel.manager_id) !== String(req.user.userId)) {
            return res.status(403).json({ message: "Access denied. You do not own this hotel." });
        }

        const roomData = {
            hotel_id, title, room_type, description,
            base_price_per_night,
            total_quantity: total_quantity || 1,
            // Add extra fields
            max_adults: max_adults || 2,
            max_children: max_children || 0,
            capacity: (Number(max_adults)||2) + (Number(max_children)||0),
            size_sqm, view_type, bed_type,
            has_breakfast: has_breakfast ? 1 : 0,
            is_refundable: is_refundable ? 1 : 0,
            smoking_allowed: smoking_allowed ? 1 : 0,
            // --- FIX: Set main_image from the first image in the array ---
            main_image: (images && images.length > 0) ? images[0] : null
        };

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
        // 1. Check if room exists
        const room = await roomModel.getRoomById(req.params.id);
        if(!room) return res.status(404).json({message: "Room not found"});
        
        // 2. Verify Ownership (via Hotel)
        const hotel = await hotelModel.getById(room.hotel_id);
        // Convert IDs to String to avoid Type Mismatch (int vs string)
        if (req.user.role !== 'admin' && String(hotel.manager_id) !== String(req.user.userId)) {
            return res.status(403).json({ message: "Access denied" });
        }

        // 3. Prepare Data
        // Destructure images out of the body, keep the rest as roomData
        const { images, ...roomData } = req.body;

        // Ensure booleans are converted to 1/0 for MySQL
        if (roomData.has_breakfast !== undefined) roomData.has_breakfast = roomData.has_breakfast ? 1 : 0;
        if (roomData.is_refundable !== undefined) roomData.is_refundable = roomData.is_refundable ? 1 : 0;
        if (roomData.smoking_allowed !== undefined) roomData.smoking_allowed = roomData.smoking_allowed ? 1 : 0;

        // Ensure main_image string exists (use first image if not set)
        if (images && images.length > 0) {
            roomData.main_image = images[0];
        }

        // 4. Update in Model
        await roomModel.updateRoom(req.params.id, roomData, images);
        
        res.json({ success: true, message: "Room updated successfully" });

    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
};


// 5. DELETE
exports.deleteRoom = async (req, res) => {
    try {
        const room = await roomModel.getRoomById(req.params.id);
        if(!room) return res.status(404).json({message: "Room not found"});

        const hotel = await hotelModel.getById(room.hotel_id);
        
        // --- FIX 403: Convert IDs to String ---
        if (req.user.role !== 'admin' && String(hotel.manager_id) !== String(req.user.userId)) {
            return res.status(403).json({ message: "Access denied" });
        }

        await roomModel.deleteRoom(req.params.id);
        res.json({ success: true, message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};