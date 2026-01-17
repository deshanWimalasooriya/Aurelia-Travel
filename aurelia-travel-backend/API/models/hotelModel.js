const knex = require('../../config/knex');

// Helper: Include starting price from rooms (Preserved)
const withMinPrice = (query) => {
    return query.select(
        'hotels.*',
        knex.raw('(SELECT MIN(base_price_per_night) FROM rooms WHERE rooms.hotel_id = hotels.id) as price')
    );
};

// 1. GET ALL (Optimized for Search Lists)
exports.getAll = async () => {
    const hotels = await withMinPrice(knex('hotels').where('is_active', true));
    
    // Fetch primary images for these hotels (Optimization)
    for (let hotel of hotels) {
        const img = await knex('hotel_images').where({ hotel_id: hotel.id, is_primary: true }).first();
        hotel.main_image = img ? img.image_url : null;
    }
    return hotels;
};

// 2. GET BY ID (Detailed: Joins Images & Amenities)
exports.getById = async (id) => {
    const hotel = await withMinPrice(knex('hotels').where('hotels.id', id)).first();
    if (!hotel) return null;

    // Fetch Images
    hotel.images = await knex('hotel_images').where({ hotel_id: id });

    // Fetch Amenities (Join with new 'amenities' table)
    hotel.amenities = await knex('hotel_amenities')
        .join('amenities', 'hotel_amenities.amenity_id', 'amenities.id')
        .where('hotel_amenities.hotel_id', id)
        .select('amenities.id', 'amenities.name', 'amenities.icon');

    return hotel;
};

// 3. CREATE (Transactional: Hotel + Images + Amenities)
// ✅ Updated: Handles the new relationship tables automatically
exports.create = async (hotelData, amenitiesIds, images) => {
    return await knex.transaction(async (trx) => {
        // A. Insert Hotel
        const [hotelId] = await trx('hotels').insert(hotelData);

        // B. Insert Amenities (Junction Table)
        if (amenitiesIds && amenitiesIds.length > 0) {
            const amenityRows = amenitiesIds.map(id => ({
                hotel_id: hotelId,
                amenity_id: id
            }));
            await trx('hotel_amenities').insert(amenityRows);
        }

        // C. Insert Images (Gallery Table)
        if (images && images.length > 0) {
            const imageRows = images.map((url, index) => ({
                hotel_id: hotelId,
                image_url: url,
                is_primary: index === 0 // First image is main
            }));
            await trx('hotel_images').insert(imageRows);
        }

        return hotelId;
    });
};

// 4. UPDATE
exports.update = async (id, hotelData) => {
    await knex('hotels').where({ id }).update(hotelData);
    return exports.getById(id);
};

// 5. DELETE
exports.delete = (id) => knex('hotels').where({ id }).del();

// 6. MANAGER: Get My Hotels (Preserved)
exports.getByManagerId = async (managerId) => {
    return await withMinPrice(knex('hotels').where('manager_id', managerId));
};

// 7. PUBLIC HELPERS (Preserved)
exports.TopRated = (limit = 4) => 
    withMinPrice(knex('hotels'))
        .orderBy('rating_average', 'desc')
        .limit(limit);

exports.getNewest = (limit = 4) => 
    withMinPrice(knex('hotels'))
        .orderBy('created_at', 'desc')
        .limit(limit);