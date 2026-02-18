const knex = require('../../config/db');

exports.addToWishlist = async (userId, hotelId) => {
    // Ignore if already exists
    return knex('wishlists')
        .insert({ user_id: userId, hotel_id: hotelId })
        .onConflict(['user_id', 'hotel_id'])
        .ignore();
};

exports.removeFromWishlist = async (userId, hotelId) => {
    return knex('wishlists')
        .where({ user_id: userId, hotel_id: hotelId })
        .del();
};

exports.clearWishlist = async (userId) => {
    return knex('wishlists')
        .where({ user_id: userId })
        .del();
};

exports.getUserWishlist = async (userId) => {
    return knex('wishlists')
        .join('hotels', 'wishlists.hotel_id', 'hotels.id')
        .select(
            'hotels.id',
            'hotels.name',
            'hotels.city',
            'hotels.country',
            'hotels.main_image',
            'hotels.rating_average',
            'wishlists.created_at'
        )
        .where('wishlists.user_id', userId)
        .orderBy('wishlists.created_at', 'desc');
};