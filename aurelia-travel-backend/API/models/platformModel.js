const knex = require('../../config/db');

// 1. Platform Stats
exports.getPlatformRevenue = () => {
    return knex.schema.hasTable('commission_payments').then(exists => {
        if (!exists) return { total: 0 };
        return knex('commission_payments').sum('amount_paid as total').first();
    });
};

exports.getUserCount = () => {
    return knex('users').where('role', 'user').count('id as count').first();
};

exports.getHotelCount = () => {
    return knex('hotels').count('id as count').first();
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
        .select(
            'id', 'username', 'email', 'role', 'is_active', 'created_at',
            'first_name', 'last_name', 'phone', 'bio', 'profile_image',
            'address_line_1', 'city', 'country', 'postal_code'
        )
        .orderBy('created_at', 'desc');
};

exports.getUserById = (id) => knex('users').where({ id }).first();

exports.updateUserStatus = (id, isActive) => {
    return knex('users').where({ id }).update({ is_active: isActive });
};

exports.updateUser = (id, data) => {
    return knex('users').where({ id }).update(data);
};

exports.deleteUser = (id) => knex('users').where({ id }).del();

// 4. Finance (FIXED: Uses 'paid_at' to match your database)
exports.getAllTransactions = async () => {
    const exists = await knex.schema.hasTable('commission_payments');
    if (!exists) return [];

    return knex('commission_payments')
        .join('hotels', 'commission_payments.hotel_id', 'hotels.id')
        .leftJoin('users', 'commission_payments.manager_id', 'users.id')
        .select(
            'commission_payments.id',
            'commission_payments.transaction_id', // Matched your screenshot
            'commission_payments.amount_paid',
            'commission_payments.bookings_count',
            'commission_payments.status',
            'commission_payments.paid_at as payment_date', // ✅ RENAMED HERE to match frontend expectation
            'hotels.name as hotel_name',
            'users.username as manager_name',
            'users.email as manager_email'
        )
        .orderBy('commission_payments.paid_at', 'desc'); // ✅ FIXED SORT COLUMN
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

// ... existing imports

// 7. Activity Logs
exports.getActivityLogs = (filters = {}) => {
    const query = knex('activity_logs')
        .join('users', 'activity_logs.admin_id', 'users.id')
        .select(
            'activity_logs.*',
            'users.username as admin_name',
            'users.email as admin_email'
        )
        .orderBy('activity_logs.created_at', 'desc');

    // Apply Filters
    if (filters.search) {
        query.where(builder => {
            builder.where('users.username', 'like', `%${filters.search}%`)
                   .orWhere('activity_logs.action_type', 'like', `%${filters.search}%`)
                   .orWhere('activity_logs.target', 'like', `%${filters.search}%`);
        });
    }

    if (filters.action && filters.action !== 'all') {
        // Matches "DELETE" with "DELETE_USER", "DELETE_HOTEL", etc.
        query.where('activity_logs.action_type', 'like', `${filters.action}%`);
    }

    if (filters.date) {
        query.whereRaw('DATE(activity_logs.created_at) = ?', [filters.date]);
    }

    return query;
};

// Helper to Create Log (Use this in other controllers)
exports.createLog = (data) => {
    return knex('activity_logs').insert(data);
};

// 8. Contact Messages
exports.createContactMessage = (data) => knex('contact_messages').insert(data);
exports.getContactMessages = () => knex('contact_messages').orderBy('created_at', 'desc');
exports.updateMessageStatus = (id, status) => knex('contact_messages').where({ id }).update({ status });
exports.deleteMessage = (id) => knex('contact_messages').where({ id }).del();