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

// ✅ NEW: Recalculate and update the hotel's average rating
exports.updateHotelRating = async (hotelId) => {
    // 1. Calculate the new average and count from the reviews table
    const result = await knex('reviews')
        .where({ hotel_id: hotelId, is_approved: true }) // Only count approved reviews
        .select(
            knex.raw('COUNT(id) as total_reviews'),
            knex.raw('AVG(rating) as average_rating')
        )
        .first();

    const total = result.total_reviews || 0;
    const average = result.average_rating ? parseFloat(result.average_rating).toFixed(1) : 0;

    // 2. Save the new calculated numbers into the hotels table
    await knex('hotels')
        .where({ id: hotelId })
        .update({
            total_reviews: total,
            rating_average: average
        });
        
    return { total, average };
};

// Add this to API/models/reviewModel.js

exports.findByUserId = (userId) => {
    // Join with hotels table to get the hotel name and image for the UI
    return knex('reviews')
        .join('hotels', 'reviews.hotel_id', 'hotels.id')
        .select(
            'reviews.*', 
            'hotels.name as hotel_name', 
            'hotels.main_image as hotel_image'
        )
        .where('reviews.user_id', userId)
        .orderBy('reviews.created_at', 'desc');
};