const knex = require('../../config/knex'); // Links to the file in Step 1

// 1. Platform Stats
exports.getPlatformRevenue = () => {
    return knex('commission_payments')
        .sum('amount_paid as total')
        .first();
};

exports.getUserCount = () => {
    return knex('users')
        .where('role', 'user')
        .count('id as count')
        .first();
};

exports.getHotelCount = () => {
    return knex('hotels')
        .count('id as count')
        .first();
};

exports.getRecentActivity = () => {
    return knex('bookings')
        .join('users', 'bookings.user_id', 'users.id')
        .join('hotels', 'bookings.hotel_id', 'hotels.id')
        .select(
            'bookings.id', 
            'users.username as guest', 
            'hotels.name as hotel', 
            'bookings.total_price', 
            'bookings.created_at'
        )
        .orderBy('bookings.created_at', 'desc')
        .limit(5);
};

// 2. Hotel Management
exports.getAllHotelsWithManagers = () => {
    return knex('hotels')
        .leftJoin('users', 'hotels.manager_id', 'users.id')
        .select(
            'hotels.*', 
            'users.username as manager_name', 
            'users.email as manager_email'
        )
        .orderBy('hotels.created_at', 'desc');
};

exports.updateHotelStatus = (id, isActive) => {
    return knex('hotels').where({ id }).update({ is_active: isActive });
};

// 3. User Management
exports.getAllUsers = () => {
    return knex('users')
        .select('id', 'username', 'email', 'role', 'is_active', 'created_at')
        .orderBy('created_at', 'desc');
};

exports.getUserById = (id) => knex('users').where({ id }).first();

exports.updateUserStatus = (id, isActive) => {
    return knex('users').where({ id }).update({ is_active: isActive });
};

exports.deleteUser = (id) => knex('users').where({ id }).del();

// 4. Finance
exports.getAllTransactions = () => {
    return knex('commission_payments')
        .join('hotels', 'commission_payments.hotel_id', 'hotels.id')
        .select(
            'commission_payments.id',
            'commission_payments.amount_paid',
            'commission_payments.transaction_id',
            'commission_payments.payment_date',
            'commission_payments.status',
            'hotels.name as hotel_name'
        )
        .orderBy('payment_date', 'desc');
};

// 5. Reviews
exports.getRecentReviews = () => {
    return knex('reviews')
        .join('users', 'reviews.user_id', 'users.id')
        .join('hotels', 'reviews.hotel_id', 'hotels.id')
        .select(
            'reviews.id',
            'reviews.rating',
            'reviews.comment',
            'reviews.created_at',
            'users.username as guest',
            'users.profile_image',
            'hotels.name as hotel_name'
        )
        .orderBy('reviews.created_at', 'desc')
        .limit(50);
};

exports.deleteReview = (id) => knex('reviews').where({ id }).del();

// 6. Settings
exports.getSettings = () => knex('platform_settings').first();

exports.updateSettings = async (data) => {
    const exists = await knex('platform_settings').first();
    if (exists) {
        return knex('platform_settings').update(data);
    } else {
        return knex('platform_settings').insert(data);
    }
};