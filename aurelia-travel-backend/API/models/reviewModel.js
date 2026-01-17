const knex = require('../../config/knex');

exports.create = async (data) => {
    const [id] = await knex('reviews').insert(data);
    return knex('reviews').where({ id }).first();
};

exports.findByHotelId = (hotelId) => {
    return knex('reviews')
        .join('users', 'reviews.user_id', 'users.id')
        .select(
            'reviews.*',
            'users.username as user_name', // Changed from first/last to match typical user model
            'users.profile_image'
        )
        .where('reviews.hotel_id', hotelId)
        .orderBy('reviews.created_at', 'desc');
};

// SECURITY: Ensure user actually stayed there
exports.canUserReview = async (userId, bookingId) => {
    const booking = await knex('bookings')
        .where({ id: bookingId, user_id: userId, status: 'completed' })
        .first();
    return !!booking;
};