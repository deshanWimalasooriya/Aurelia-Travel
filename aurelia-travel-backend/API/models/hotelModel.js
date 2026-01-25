const knex = require('../../config/knex');

// --- Helper: Resolve Mixed Amenities (IDs & New Strings) ---
// This handles creating new amenities if the user typed a new one
const resolveAmenities = async (trx, mixedAmenities) => {
    if (!mixedAmenities || mixedAmenities.length === 0) return [];

    const finalIds = [];
    const newNames = [];

    mixedAmenities.forEach(item => {
        // If it's a number (ID) or string number
        if (typeof item === 'number' || (typeof item === 'string' && !isNaN(item) && item.trim() !== '')) {
            finalIds.push(parseInt(item));
        } 
        // If it's a string (New Name)
        else if (typeof item === 'string') {
            newNames.push(item.trim());
        }
    });

    if (newNames.length > 0) {
        // Check existing by name to avoid duplicates
        const existing = await trx('amenities').whereIn('name', newNames).select('id', 'name');
        
        for (const name of newNames) {
            const found = existing.find(e => e.name.toLowerCase() === name.toLowerCase());
            if (found) {
                finalIds.push(found.id);
            } else {
                // Create new amenity
                const [newId] = await trx('amenities').insert({ 
                    name: name, 
                    category: 'general', 
                    slug: name.toLowerCase().replace(/\s+/g, '-') 
                });
                finalIds.push(newId);
            }
        }
    }

    return [...new Set(finalIds)]; // Unique IDs
};

const withMinPrice = (query) => {
    return query.select(
        'hotels.*',
        knex.raw('(SELECT MIN(base_price_per_night) FROM rooms WHERE rooms.hotel_id = hotels.id) as price')
    );
};

// Updated attachDetails to handle multiple images and amenities
const attachDetails = async (hotels) => {
    if (hotels.length === 0) return [];
    const hotelIds = hotels.map(h => h.id);

    // Fetch Images
    const images = await knex('hotel_images').whereIn('hotel_id', hotelIds);
    
    // Fetch Amenities
    const amenities = await knex('hotel_amenities')
        .join('amenities', 'hotel_amenities.amenity_id', 'amenities.id')
        .whereIn('hotel_amenities.hotel_id', hotelIds)
        .select('hotel_amenities.hotel_id', 'amenities.id', 'amenities.name');

    return hotels.map(hotel => {
        // Get all images for this hotel
        const hotelImages = images.filter(i => i.hotel_id === hotel.id).map(i => ({
            url: i.image_url,
            isPrimary: !!i.is_primary
        }));
        
        // Find primary image URL for fallback
        const primaryImg = hotelImages.find(i => i.isPrimary);
        
        return {
            ...hotel,
            main_image: primaryImg ? primaryImg.url : (hotel.main_image || (hotelImages[0]?.url) || null),
            images: hotelImages.map(i => i.url), // Simple array for compatibility
            images_meta: hotelImages, // Detailed array with flags
            amenities: amenities.filter(a => a.hotel_id === hotel.id) // Array of objects
        };
    });
};

// 1. GET ALL
exports.getAll = async () => {
    const hotels = await withMinPrice(knex('hotels'));
    return await attachDetails(hotels);
};

// 2. GET BY ID
exports.getById = async (id) => {
    const hotel = await withMinPrice(knex('hotels').where('hotels.id', id)).first();
    if (!hotel) return null;
    return (await attachDetails([hotel]))[0];
};

// 3. CREATE
exports.create = async (hotelData, images = [], mixedAmenities = []) => {
    return await knex.transaction(async (trx) => {
        const [hotelId] = await trx('hotels').insert(hotelData);

        // Images
        if (images.length > 0) {
            const imgRows = images.map((img) => ({
                hotel_id: hotelId,
                image_url: typeof img === 'string' ? img : img.url,
                is_primary: (typeof img === 'object' && img.isPrimary) ? 1 : 0,
                image_type: 'exterior'
            }));
            
            // Ensure one primary
            if (!imgRows.some(i => i.is_primary === 1) && imgRows.length > 0) {
                imgRows[0].is_primary = 1;
            }
            await trx('hotel_images').insert(imgRows);
        }

        // Amenities
        const amenityIds = await resolveAmenities(trx, mixedAmenities);
        if (amenityIds.length > 0) {
            const amRows = amenityIds.map(id => ({
                hotel_id: hotelId,
                amenity_id: id
            }));
            await trx('hotel_amenities').insert(amRows);
        }

        return hotelId;
    });
};

// 4. UPDATE
exports.update = async (id, updateData, newImages, mixedAmenities) => {
    return await knex.transaction(async (trx) => {
        if (Object.keys(updateData).length > 0) {
            await trx('hotels').where({ id }).update(updateData);
        }

        // Update Images
        if (newImages && Array.isArray(newImages)) {
            await trx('hotel_images').where({ hotel_id: id }).del();
            if (newImages.length > 0) {
                const imgRows = newImages.map((img) => ({
                    hotel_id: id,
                    image_url: typeof img === 'string' ? img : img.url,
                    is_primary: (typeof img === 'object' && img.isPrimary) ? 1 : 0,
                    image_type: 'exterior'
                }));
                
                if (!imgRows.some(i => i.is_primary === 1) && imgRows.length > 0) {
                    imgRows[0].is_primary = 1;
                }
                await trx('hotel_images').insert(imgRows);
            }
        }

        // Update Amenities
        if (mixedAmenities && Array.isArray(mixedAmenities)) {
            await trx('hotel_amenities').where({ hotel_id: id }).del();
            const amenityIds = await resolveAmenities(trx, mixedAmenities);
            
            if (amenityIds.length > 0) {
                const amRows = amenityIds.map(aId => ({
                    hotel_id: id,
                    amenity_id: aId
                }));
                await trx('hotel_amenities').insert(amRows);
            }
        }
    });
};

exports.delete = (id) => knex('hotels').where({ id }).del();

exports.getByManagerId = async (managerId) => {
    const hotels = await withMinPrice(knex('hotels').where('manager_id', managerId));
    return await attachDetails(hotels);
};

exports.TopRated = async (limit = 4) => {
    const hotels = await withMinPrice(knex('hotels').orderBy('rating_average', 'desc').limit(limit));
    return await attachDetails(hotels);
};

exports.getNewest = async (limit = 4) => {
    const hotels = await withMinPrice(knex('hotels').orderBy('created_at', 'desc').limit(limit));
    return await attachDetails(hotels);
};

exports.getAllAmenities = () => knex('amenities').select('id', 'name', 'category');