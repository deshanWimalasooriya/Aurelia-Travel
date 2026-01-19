const knex = require('../../config/knex');

// Helper: Include starting price from rooms
const withMinPrice = (query) => {
    return query.select(
        'hotels.*',
        knex.raw('(SELECT MIN(base_price_per_night) FROM rooms WHERE rooms.hotel_id = hotels.id) as price')
    );
};

// ✅ NEW HELPER: Efficiently attach amenities and images to a list of hotels
const attachDetails = async (hotels) => {
    if (hotels.length === 0) return [];

    const hotelIds = hotels.map(h => h.id);

    // 1. Fetch Primary Images
    const images = await knex('hotel_images')
        .whereIn('hotel_id', hotelIds)
        .andWhere('is_primary', true)
        .select('hotel_id', 'image_url');

    // 2. Fetch Amenities (This was missing!)
    const amenities = await knex('hotel_amenities')
        .join('amenities', 'hotel_amenities.amenity_id', 'amenities.id')
        .whereIn('hotel_amenities.hotel_id', hotelIds)
        .select('hotel_amenities.hotel_id', 'amenities.id', 'amenities.name', 'amenities.slug', 'amenities.category');

    // 3. Attach to hotels
    return hotels.map(hotel => {
        const img = images.find(i => i.hotel_id === hotel.id);
        const hotelAmenities = amenities.filter(a => a.hotel_id === hotel.id);
        
        return {
            ...hotel,
            main_image: img ? img.image_url : hotel.main_image,
            amenities: hotelAmenities // Now the frontend has data to filter!
        };
    });
};

// 1. GET ALL
exports.getAll = async () => {
    const hotels = await withMinPrice(knex('hotels').where('is_active', true));
    return await attachDetails(hotels);
};

// 2. GET BY ID
exports.getById = async (id) => {
    const hotel = await withMinPrice(knex('hotels').where('hotels.id', id)).first();
    if (!hotel) return null;

    hotel.images = await knex('hotel_images').where({ hotel_id: id });
    hotel.amenities = await knex('hotel_amenities')
        .join('amenities', 'hotel_amenities.amenity_id', 'amenities.id')
        .where('hotel_amenities.hotel_id', id)
        .select('amenities.id', 'amenities.name', 'amenities.icon');

    return hotel;
};

// 3. CREATE
exports.create = async (hotelData, amenitiesIds, images) => {
    return await knex.transaction(async (trx) => {
        const [hotelId] = await trx('hotels').insert(hotelData);

        if (amenitiesIds && amenitiesIds.length > 0) {
            const amenityRows = amenitiesIds.map(id => ({
                hotel_id: hotelId,
                amenity_id: id
            }));
            await trx('hotel_amenities').insert(amenityRows);
        }

        if (images && images.length > 0) {
            const imageRows = images.map((url, index) => ({
                hotel_id: hotelId,
                image_url: url,
                is_primary: index === 0
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

// 6. MANAGER
exports.getByManagerId = async (managerId) => {
    const hotels = await withMinPrice(knex('hotels').where('manager_id', managerId));
    return await attachDetails(hotels);
};

// 7. PUBLIC HELPERS (Updated to use attachDetails)
exports.TopRated = async (limit = 4) => {
    const hotels = await withMinPrice(knex('hotels'))
        .orderBy('rating_average', 'desc')
        .limit(limit);
    return await attachDetails(hotels); // ✅ Attach Amenities
};

exports.getNewest = async (limit = 4) => {
    const hotels = await withMinPrice(knex('hotels'))
        .orderBy('created_at', 'desc')
        .limit(limit);
    return await attachDetails(hotels); // ✅ Attach Amenities
};