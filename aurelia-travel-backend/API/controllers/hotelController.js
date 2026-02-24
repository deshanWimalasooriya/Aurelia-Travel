const hotelModel = require("../models/hotelModel");
const { notifyAdmins } = require('./notificationController');
const logService = require('../services/logService');
// ✅ STEP 1: Import our new Redis Client
const redisClient = require('../config/redisClient'); 

const parseHotelData = (hotel) => {
    if (!hotel) return null;
    if (hotel.price) hotel.price = parseFloat(hotel.price);
    if (hotel.latitude) hotel.latitude = parseFloat(hotel.latitude);
    if (hotel.longitude) hotel.longitude = parseFloat(hotel.longitude);
    return hotel;
};

// --- PUBLIC ---
exports.getAllHotels = async (req, res) => {
    try {
        const cacheKey = 'all_hotels';
        
        // ✅ STEP 2: Try to get data from Redis first
        // Note: Make sure redisClient is connected. We use an optional chaining `.?` 
        // to prevent crashing if Redis is offline during development.
        if (redisClient?.isReady) {
            const cachedHotels = await redisClient.get(cacheKey);
            if (cachedHotels) {
                console.log("⚡ Served Hotels from Redis Cache!");
                return res.json({ success: true, data: JSON.parse(cachedHotels) });
            }
        }

        // ✅ STEP 3: Cache Miss - Get from Database
        console.log("🗄️ Served Hotels from MySQL Database");
        const hotels = await hotelModel.getAll();
        const parsedHotels = hotels.map(parseHotelData);

        // ✅ STEP 4: Save to Redis for the next user (Cache for 1 Hour: 3600 seconds)
        if (redisClient?.isReady) {
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(parsedHotels));
        }

        res.json({ success: true, data: parsedHotels });
    } catch (err) { 
        res.status(500).json({ success: false, error: err.message }); 
    }
};

// --- NEW FUNCTION: ADMIN GET HOTELS BY MANAGER ID ---
exports.getHotelsByManagerId = async (req, res) => {
    try {
        const { managerId } = req.params;
        const hotels = await hotelModel.getByManagerId(managerId);
        res.json({ success: true, data: hotels.map(parseHotelData) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getHotelById = async (req, res) => {
    try {
        const hotel = await hotelModel.getById(req.params.id);
        if (!hotel) return res.status(404).json({ success: false, message: "Hotel not found" });
        res.json({ success: true, data: parseHotelData(hotel) });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

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

exports.getAmenitiesList = async (req, res) => {
    try {
        const list = await hotelModel.getAllAmenities();
        res.json({ success: true, data: list });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

//get hotel amenities by hotel id
exports.getAmenitiesByHotelId = async (req, res) => {
    try {
        const amenities = await hotelModel.getAmenitiesByHotelId(req.params.id);
        res.json({ success: true, data: amenities });
    } catch (err) { res.status(500).json({ error: err.message }); }
};


// --- MANAGER ---
exports.getMyHotels = async (req, res) => {
    try {
        const userId = req.user.userId;
        const myHotels = await hotelModel.getByManagerId(userId);
        res.json({ success: true, data: myHotels.map(parseHotelData) });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// --- CRUD ---
exports.create = async (req, res) => {
    try {
        console.log("Received Hotel Payload:", req.body);

        const { 
            name, description, address_line_1, city, state, postal_code, country, 
            latitude, longitude, email, phone, website, 
            check_in_time, check_out_time, cancellation_policy_hours, 
            images, amenities 
        } = req.body;

        let primaryUrl = null;
        if (images && images.length > 0) {
            const primaryObj = images.find(img => img.isPrimary);
            primaryUrl = primaryObj ? primaryObj.url : (images[0].url || images[0]);
        }

        const hotelData = {
            name: name || "New Hotel",
            description: description || null,
            address_line_1: address_line_1 || "",
            city: city || "",
            state: state || null,
            postal_code: postal_code || null,
            country: country || "",
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            email: email || null,
            phone: phone || null,
            website: website || null,
            check_in_time: check_in_time || "14:00:00",
            check_out_time: check_out_time || "11:00:00",
            cancellation_policy_hours: cancellation_policy_hours ? parseInt(cancellation_policy_hours) : 24,
            main_image: primaryUrl,
            manager_id: req.user.userId,
            is_featured: 0
        };

        await notifyAdmins(
            "New Property Added",
            `A new hotel "${hotelData.name}" has been listed and requires review.`,
            "warning", 
            `/superAdmin/hotels` 
        );

        const newHotelId = await hotelModel.create(hotelData, images, amenities);

        // ✅ INVALIDATE CACHE: Force next search query to grab this new hotel
        if (redisClient?.isReady) await redisClient.del('all_hotels');

        res.status(201).json({ success: true, message: "Hotel created", hotelId: newHotelId });

    } catch (err) {
        console.error("Create Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const hotelId = req.params.id;
        const { images, amenities, ...rest } = req.body;
        
        const oldHotel = await hotelModel.getById(hotelId);
        
        const updateData = {};
        const validColumns = [
            'name', 'description', 'address_line_1', 'city', 'state', 'postal_code', 
            'country', 'latitude', 'longitude', 'email', 'phone', 'website', 
            'check_in_time', 'check_out_time', 'cancellation_policy_hours', 
            'main_image', 'is_featured', 'is_active'
        ];

        validColumns.forEach(field => {
            if (rest[field] !== undefined) updateData[field] = rest[field];
        });

        if (images && images.length > 0) {
            const primaryObj = images.find(img => img.isPrimary);
            updateData.main_image = primaryObj ? primaryObj.url : (images[0].url || images[0]);
        }

        await hotelModel.update(hotelId, updateData, images, amenities);

        // ✅ INVALIDATE CACHE: Changes made (e.g., price drop), wipe old cache
        if (redisClient?.isReady) await redisClient.del('all_hotels');

        if (req.user.role === 'admin') {
            let changes = [];
            for (const key in updateData) {
                if (key === 'main_image') continue; 
                if (oldHotel[key] != updateData[key]) {
                    changes.push(`${key}: '${oldHotel[key] || ''}' -> '${updateData[key]}'`);
                }
            }
            if (changes.length > 0) {
                await logService.logAction(
                    req.user.userId, 'UPDATE_HOTEL', 'Hotels', oldHotel.name, 
                    changes.join(' | '), updateData.is_active === false ? 'warning' : 'info'
                );
            }
        }

        res.status(200).json({ success: true, message: "Hotel updated" });

    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const hotel = await hotelModel.getById(req.params.id);
        if (!hotel) return res.status(404).json({ message: "Hotel not found" });
        if (req.user.role !== 'admin' && String(hotel.manager_id) !== String(req.user.userId)) {
            return res.status(403).json({ message: "Access denied" });
        }
        await hotelModel.delete(req.params.id);

        // ✅ INVALIDATE CACHE: Hotel is gone, remove it from memory
        if (redisClient?.isReady) await redisClient.del('all_hotels');

        if (req.user.role === 'admin') {
            await logService.logAction(req.user.userId, 'DELETE_HOTEL', 'Hotels', hotel.name, 'Admin permanently deleted property.', 'error');
        }
        
        res.json({ success: true, message: "Deleted" });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};