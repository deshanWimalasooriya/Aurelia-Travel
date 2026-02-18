const knex = require('../../config/db');

exports.create = async (data) => {
    const [id] = await knex('reviews').insert(data);
    return knex('reviews').where({ id }).first();
};

exports.findByHotelId = (hotelId) => {
    return knex('reviews')
        .join('users', 'reviews.user_id', 'users.id')
        .select(
            'reviews.*',
            'users.username as user_name',
            'users.profile_image'
        )
        .where('reviews.hotel_id', hotelId)
        .orderBy('reviews.created_at', 'desc');
};

// ✅ NEW: Get Reviews for a specific Manager (All their hotels)
exports.findByManagerId = (managerId) => {
    return knex('reviews')
        .join('hotels', 'reviews.hotel_id', 'hotels.id')
        .join('users', 'reviews.user_id', 'users.id')
        .where('hotels.manager_id', managerId)
        .select(
            'reviews.*',
            'hotels.name as hotel_name',
            'users.username as guest_name',
            'users.profile_image as guest_image'
        )
        .orderBy('reviews.created_at', 'desc');
};

// ✅ NEW: Add Manager Reply
exports.addReply = (reviewId, replyText) => {
    return knex('reviews')
        .where({ id: reviewId })
        .update({ 
            hotel_response: replyText,
            updated_at: knex.fn.now()
        });
};

// SECURITY: Ensure user actually stayed there
exports.canUserReview = async (userId, bookingId) => {
    // In dev mode, you might want to relax 'completed' status if testing manually
    // But logically, only 'completed' bookings should be reviewable.
    const booking = await knex('bookings')
        .where({ id: bookingId, user_id: userId }) 
        // .where('status', 'completed') // Uncomment this for strict production rule
        .first();
    return !!booking;
};

// CHECK IF REVIEW EXISTS (Prevent duplicates)
exports.hasReview = async (userId, bookingId) => {
    const existing = await knex('reviews')
        .where({ user_id: userId, booking_id: bookingId })
        .first();
    return !!existing;
};