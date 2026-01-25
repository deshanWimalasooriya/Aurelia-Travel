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

// 3. CREATE
exports.create = async (req, res) => {
    try {
        console.log("Received Hotel Payload:", req.body);

        const { 
            name, description, address_line_1, city, state, postal_code, country, 
            latitude, longitude, email, phone, website, 
            check_in_time, check_out_time, cancellation_policy_hours, 
            main_image 
        } = req.body;

        // ✅ FIX 1: Map fields EXACTLY to your database columns
        // Removed 'is_active' because it is not in your DB image
        const hotelData = {
            name: name || "New Hotel",
            description: description || null,
            address_line_1: address_line_1 || "",
            city: city || "",
            state: state || null,
            postal_code: postal_code || null,
            country: country || "",
            // Use specific fallbacks for validation
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            email: email || null,
            phone: phone || null,
            website: website || null,
            // Ensure Time format is HH:MM:SS
            check_in_time: check_in_time ? (check_in_time.length === 5 ? check_in_time + ':00' : check_in_time) : "14:00:00",
            check_out_time: check_out_time ? (check_out_time.length === 5 ? check_out_time + ':00' : check_out_time) : "11:00:00",
            cancellation_policy_hours: cancellation_policy_hours ? parseInt(cancellation_policy_hours) : 24,
            main_image: main_image || null,
            manager_id: req.user.userId || req.user.id,
            rating_average: 0,
            is_featured: 0 // Using is_featured instead of is_active
        };

        // ✅ FIX 2: Simplified Model Call (No images/amenities arrays yet to prevent crashes)
        const newHotelId = await hotelModel.create(hotelData);
        
        res.status(201).json({ 
            success: true, 
            message: "Hotel created successfully", 
            hotelId: newHotelId 
        });

    } catch (err) {
        console.error("Create Hotel Error:", err);
        // Returns the actual database error to the frontend so you can see it in the alert
        res.status(500).json({ success: false, error: err.message });
    }
};

// 4. UPDATE
exports.update = async (req, res) => {
    try {
        const hotelId = req.params.id;
        const updateData = {};
        
        // Only allow updating columns that actually exist
        const validColumns = [
            'name', 'description', 'address_line_1', 'city', 'state', 'postal_code', 
            'country', 'latitude', 'longitude', 'email', 'phone', 'website', 
            'check_in_time', 'check_out_time', 'cancellation_policy_hours', 
            'main_image', 'is_featured'
        ];

        validColumns.forEach(field => {
            if (req.body[field] !== undefined) {
                // Formatting for time fields
                if ((field === 'check_in_time' || field === 'check_out_time') && req.body[field].length === 5) {
                    updateData[field] = req.body[field] + ':00';
                } else {
                    updateData[field] = req.body[field];
                }
            }
        });

        await hotelModel.update(hotelId, updateData);

        res.status(200).json({ success: true, message: "Hotel updated successfully" });

    } catch (err) {
        console.error("Update Hotel Error:", err);
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