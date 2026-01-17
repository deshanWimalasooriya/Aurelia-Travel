const knex = require('../../config/knex');

// 1. DASHBOARD HEADER STATS
exports.getGlobalStats = async () => {
    // Parallel queries for speed
    const [bookings, revenue, users, hotels] = await Promise.all([
        knex('bookings').count('id as count').first(),
        // Revenue: Sum of 'amount' from successful transactions
        knex('payment_transactions').where('status', 'succeeded').sum('amount as total').first(),
        knex('users').where('role', 'user').count('id as count').first(),
        knex('hotels').where('is_active', true).count('id as count').first()
    ]);

    return {
        total_bookings: bookings.count,
        total_revenue: revenue.total || 0,
        total_users: users.count,
        active_hotels: hotels.count
    };
};

// 2. RECENT ACTIVITY
exports.getRecentActivity = () => {
    return knex('bookings')
        .join('users', 'bookings.user_id', 'users.id')
        .select(
            'bookings.id', 'bookings.booking_reference', 'bookings.total_price', 'bookings.status', 'bookings.created_at',
            'users.username'
        )
        .orderBy('bookings.created_at', 'desc')
        .limit(10);
};

// 3. COMMISSION REPORT (Monthly)
exports.getMonthlyRevenue = () => {
    return knex('payment_transactions')
        .select(knex.raw("DATE_FORMAT(created_at, '%Y-%m') as month"))
        .sum('amount as total')
        .where('status', 'succeeded')
        .groupBy('month')
        .orderBy('month', 'desc')
        .limit(6);
};