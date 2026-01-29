const knex = require('../../config/knex');

// 1. GET ALL
exports.getAllRooms = () => knex('rooms').select('*');

// 2. GET BY ID (Includes Images)
exports.getRoomById = async (id) => {
    const room = await knex('rooms').where({ id }).first();
    if (!room) return null;
    
    // Fetch Images from room_images table
    const images = await knex('room_images').where({ room_id: id }).select('image_url', 'is_primary');
    
    // Map to frontend-friendly structure
    room.images_meta = images.map(img => ({
        url: img.image_url,
        isPrimary: !!img.is_primary
    }));
    
    // Backward compatibility for old string array
    room.images = images.map(img => img.image_url);
    
    return room;
};

// 3. CREATE (Without Transaction)
exports.createRoom = async (roomData, images = []) => {
    // A. Insert Room
    const [roomId] = await knex('rooms').insert(roomData);

    // B. Insert Images
    if (images.length > 0) {
        const imgRows = images.map((img) => ({
            room_id: roomId,
            image_url: typeof img === 'string' ? img : img.url,
            is_primary: (typeof img === 'object' && img.isPrimary) ? 1 : 0
        }));
        
        // Ensure one primary
        if (!imgRows.some(i => i.is_primary === 1) && imgRows.length > 0) {
            imgRows[0].is_primary = 1;
        }

        await knex('room_images').insert(imgRows);
    }

    // C. GENERATE 365 DAYS INVENTORY
    const inventoryRows = [];
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        inventoryRows.push({
            room_id: roomId,
            date: date, 
            available_quantity: roomData.total_quantity || 1, 
            dynamic_price: roomData.base_price_per_night
        });
    }
    
    // Batch Insert (Chunking)
    const chunkSize = 50;
    for (let i = 0; i < inventoryRows.length; i += chunkSize) {
        await knex('room_availability').insert(inventoryRows.slice(i, i + chunkSize));
    }

    return roomId;
};

// 4. UPDATE (Without Transaction)
exports.updateRoom = async (id, roomData, newImages) => {
    // A. Update Room Details (Table: rooms)
    await knex('rooms').where({ id }).update(roomData);

    // B. Handle Images (Table: room_images)
    if (newImages && Array.isArray(newImages)) {
        // 1. Remove ALL old images for this room
        await knex('room_images').where({ room_id: id }).del();

        // 2. Insert NEW images
        if (newImages.length > 0) {
            const imgRows = newImages.map((img) => ({
                room_id: id,
                image_url: typeof img === 'string' ? img : img.url,
                is_primary: (typeof img === 'object' && img.isPrimary) ? 1 : 0
            }));

            // Ensure one primary
            if (!imgRows.some(i => i.is_primary === 1) && imgRows.length > 0) {
                imgRows[0].is_primary = 1;
            }

            await knex('room_images').insert(imgRows);
        }
    }
    
    return id;
};

// 5. DELETE
exports.deleteRoom = (id) => knex('rooms').where({ id }).del();

// 6. HELPERS
exports.getRoomsByHotelId = async (hotelId) => {
    const rooms = await knex('rooms').where({ hotel_id: hotelId });
    // Attach images
    for (let r of rooms) {
        const imgs = await knex('room_images')
        .where({ room_id: r.id })
        .select('image_url', 'is_primary');
        r.images = imgs.map(i => i.image_url);
        // Find primary for main display
        const primary = imgs.find(i => i.is_primary);
        if(primary) r.main_image = primary.image_url;
    }
    return rooms;
};

exports.getRoomsByManagerId = (managerId) => {
    return knex('rooms')
        .join('hotels', 'rooms.hotel_id', 'hotels.id')
        .where('hotels.manager_id', managerId)
        .select('rooms.*', 'hotels.name as hotel_name')
        .then(async (rooms) => {
            // Populate images
            for (let r of rooms) {
                const img = await knex('room_images').where({ room_id: r.id }).where({ is_primary: 1 }).first();
                r.main_image = img ? img.image_url : null;
            }
            return rooms;
        });
};