const knex = require('../../config/knex');

// 1. GET ALL (Master List)
exports.getAllAmenities = () => {
    return knex('amenities').select('*').orderBy('category', 'asc');
};

// Get all amenity categories
exports.getAmenityCategories = async () => {
    const categories = await knex('amenities')
        .distinct('category')
        .whereNotNull('category')
        .orderBy('category', 'asc');
    return categories.map(cat => cat.category);
}

// 2. GET BY HOTEL ID
exports.getAmenitiesByHotelId = (hotelId) => {
    return knex('amenities')
        .join('hotel_amenities', 'amenities.id', 'hotel_amenities.amenity_id')
        .where('hotel_amenities.hotel_id', hotelId)
        .select('amenities.id', 'amenities.name', 'amenities.icon', 'amenities.category', 'amenities.slug');
};

// 3. CREATE (Admin Only)
exports.createAmenity = async (data) => {
    const [id] = await knex('amenities').insert(data);
    return { id, ...data };
};

// 4. LINK AMENITIES TO HOTEL
exports.addAmenitiesToHotel = async (hotelId, amenityIds) => {
    const rows = amenityIds.map(amenityId => ({
        hotel_id: hotelId,
        amenity_id: amenityId
    }));
    // Use onConflict ignore to prevent duplicates
    return knex('hotel_amenities').insert(rows).onConflict(['hotel_id', 'amenity_id']).ignore();
};

// 5. HELPER: Get Room Data for Virtual Amenities
exports.getRoomForFeatures = (roomId) => {
    return knex('rooms').where({ id: roomId }).first();
};