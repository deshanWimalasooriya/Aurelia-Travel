const Amenity = require('../models/amenityModel');

// 1. Get All Master Amenities
exports.getAll = async (req, res) => {
    try {
        const amenities = await Amenity.getAllAmenities();
        
        // Optional: Group by category if requested ?grouped=true
        if (req.query.grouped === 'true') {
            const grouped = amenities.reduce((acc, item) => {
                const cat = item.category || 'general';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(item);
                return acc;
            }, {});
            return res.json({ success: true, data: grouped });
        }

        res.json({ success: true, data: amenities });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get Amenity Categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Amenity.getAmenityCategories();
        res.json({ success: true, data: categories });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// 2. Get Hotel Amenities
exports.getByHotel = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const amenities = await Amenity.getAmenitiesByHotelId(hotelId);
        res.json({ success: true, data: amenities });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// 3. Get Room Amenities (Virtual Construction)
// Converts DB columns like 'has_breakfast' into list items like { name: "Breakfast" }
exports.getByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await Amenity.getRoomForFeatures(roomId);

        if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

        const virtualAmenities = [];

        // Map DB columns to UI-friendly objects
        if (room.has_breakfast) {
            virtualAmenities.push({ name: 'Breakfast Included', icon: 'coffee', slug: 'breakfast', category: 'dining' });
        }
        if (room.is_refundable) {
            virtualAmenities.push({ name: 'Free Cancellation', icon: 'check-circle', slug: 'refundable', category: 'policy' });
        }
        if (room.view_type && room.view_type !== 'none') {
            virtualAmenities.push({ 
                name: `${room.view_type.charAt(0).toUpperCase() + room.view_type.slice(1)} View`, 
                icon: 'mountain', 
                slug: 'view_type', 
                category: 'view' 
            });
        }
        if (room.size_sqm) {
            virtualAmenities.push({ name: `${room.size_sqm} m²`, icon: 'maximize', slug: 'size', category: 'room' });
        }
        if (room.air_conditioning !== false) { // Assuming default true if not specified
            virtualAmenities.push({ name: 'Air Conditioning', icon: 'snowflake', slug: 'ac', category: 'room' });
        }
        
        res.json({ success: true, data: virtualAmenities });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};