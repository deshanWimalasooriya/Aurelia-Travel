const knex = require('../../config/knex');

// 1. GET ALL
exports.getAllRooms = () => knex('rooms').select('*');

// 2. GET BY ID (Includes Images)
exports.getRoomById = async (id) => {
    const room = await knex('rooms').where({ id }).first();
    if (!room) return null;
    
    // Fetch Images from room_images table
    const images = await knex('room_images').where({ room_id: id }).select('image_url');
    // Return array of strings for easier frontend handling
    room.images = images.map(img => img.image_url); 
    return room;
};

// 3. CREATE (Transactional)
exports.createRoom = async (roomData, imageUrls) => {
    return await knex.transaction(async (trx) => {
        // A. Insert Room
        const [roomId] = await trx('rooms').insert(roomData);

        // B. Insert Images
        if (imageUrls && imageUrls.length > 0) {
            const imgRows = imageUrls.map((url, i) => ({
                room_id: roomId,
                image_url: url,
                is_primary: i === 0 ? 1 : 0
            }));
            await trx('room_images').insert(imgRows);
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
            await trx('room_availability').insert(inventoryRows.slice(i, i + chunkSize));
        }

        return roomId;
    });
};

// 4. UPDATE (Fixed for Multiple Images)
exports.updateRoom = async (id, roomData, newImages) => {
    return await knex.transaction(async (trx) => {
        // A. Update Room Details (Table: rooms)
        await trx('rooms').where({ id }).update(roomData);

        // B. Handle Images (Table: room_images)
        // Only update images if a new array was sent
        if (newImages && Array.isArray(newImages)) {
            // 1. Remove ALL old images for this room
            await trx('room_images').where({ room_id: id }).del();

            // 2. Insert NEW images
            if (newImages.length > 0) {
                const imgRows = newImages.map((url, i) => ({
                    room_id: id,
                    image_url: url,
                    is_primary: i === 0 ? 1 : 0
                }));
                await trx('room_images').insert(imgRows);
            }
        }
        
        return id;
    });
};

// 5. DELETE
exports.deleteRoom = (id) => knex('rooms').where({ id }).del();

// 6. HELPERS
exports.getRoomsByHotelId = async (hotelId) => {
    const rooms = await knex('rooms').where({ hotel_id: hotelId });
    for (let r of rooms) {
        const imgs = await knex('room_images').where({ room_id: r.id }).select('image_url');
        r.images = imgs.map(i => i.image_url);
    }
    return rooms;
};

// Filter by joining hotels table (Since rooms doesn't have manager_id)
exports.getRoomsByManagerId = (managerId) => {
    return knex('rooms')
        .join('hotels', 'rooms.hotel_id', 'hotels.id')
        .where('hotels.manager_id', managerId)
        .select('rooms.*', 'hotels.name as hotel_name')
        .then(async (rooms) => {
            // Optional: Populate images for the list view
            for (let r of rooms) {
                const img = await knex('room_images').where({ room_id: r.id }).where({ is_primary: 1 }).first();
                r.main_image = img ? img.image_url : null;
            }
            return rooms;
        });
};