const knex = require('../../config/knex');

// 1. GET ALL
exports.getAllRooms = () => knex('rooms').select('*');

// 2. GET BY ID (Includes Images)
exports.getRoomById = async (id) => {
    const room = await knex('rooms').where({ id }).first();
    if (!room) return null;
    
    // Fetch Images from new table
    room.images = await knex('room_images').where({ room_id: id }).select('image_url');
    return room;
};

// 3. CREATE (Transactional + Inventory Generation)
// ✅ Updated: This is the logic that powers your "Availability" system
exports.createRoom = async (roomData, imageUrls) => {
    return await knex.transaction(async (trx) => {
        // A. Insert Room
        const [roomId] = await trx('rooms').insert(roomData);

        // B. Insert Images
        if (imageUrls && imageUrls.length > 0) {
            const imgRows = imageUrls.map((url, i) => ({
                room_id: roomId,
                image_url: url,
                is_primary: i === 0
            }));
            await trx('room_images').insert(imgRows);
        }

        // C. GENERATE 365 DAYS INVENTORY (Crucial!)
        const inventoryRows = [];
        const today = new Date();
        
        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            
            inventoryRows.push({
                room_id: roomId,
                date: date, // YYYY-MM-DD
                available_quantity: roomData.total_quantity || 1, // Start with full stock
                dynamic_price: roomData.base_price_per_night
            });
        }
        
        // Batch Insert (Chunking to be safe with SQL limits)
        const chunkSize = 50;
        for (let i = 0; i < inventoryRows.length; i += chunkSize) {
            await trx('room_availability').insert(inventoryRows.slice(i, i + chunkSize));
        }

        return roomId;
    });
};

// 4. UPDATE
exports.updateRoom = async (id, roomData) => {
    await knex('rooms').where({ id }).update(roomData);
    return exports.getRoomById(id);
};

// 5. DELETE
exports.deleteRoom = (id) => knex('rooms').where({ id }).del();

// 6. HELPERS (Preserved)
exports.getRoomsByHotelId = async (hotelId) => {
    const rooms = await knex('rooms').where({ hotel_id: hotelId });
    // Attach images
    for (let r of rooms) {
        r.images = await knex('room_images').where({ room_id: r.id }).select('image_url');
    }
    return rooms;
};

exports.getRoomsByManagerId = (managerId) => {
    return knex('rooms')
        .join('hotels', 'rooms.hotel_id', 'hotels.id')
        .where('hotels.manager_id', managerId)
        .select('rooms.*', 'hotels.name as hotel_name');
};

// Alias for internal use
exports.findById = exports.getRoomById;