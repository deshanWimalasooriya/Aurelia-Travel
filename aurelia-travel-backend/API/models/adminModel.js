const knex = require('../../config/db');

// 1. DASHBOARD HEADER STATS (Global)
exports.getGlobalStats = async () => {
    const [bookings, revenue, users, hotels] = await Promise.all([
        knex('bookings').count('id as count').first(),
        knex('bookings').whereIn('status', ['confirmed', 'completed']).sum('total_price as total').first(),
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

// 2. REVENUE TRENDS (Last 6 Months)
exports.getMonthlyRevenue = () => {
    return knex('bookings')
        .select(knex.raw("DATE_FORMAT(check_in, '%b') as name")) // Returns 'Jan', 'Feb'
        .select(knex.raw("DATE_FORMAT(check_in, '%Y-%m') as sort_date"))
        .sum('total_price as value')
        .whereIn('status', ['confirmed', 'completed'])
        .where('check_in', '>=', knex.raw('DATE_SUB(NOW(), INTERVAL 6 MONTH)'))
        .groupBy('name', 'sort_date')
        .orderBy('sort_date', 'asc');
};

// 3. BOOKINGS BY HOTEL (Pie Chart)
exports.getBookingsByHotel = () => {
    return knex('bookings')
        .join('hotels', 'bookings.hotel_id', 'hotels.id')
        .select('hotels.name')
        .count('bookings.id as value')
        .groupBy('hotels.name')
        .orderBy('value', 'desc')
        .limit(5);
};

// 4. BOOKING STATUS DISTRIBUTION (Pie Chart)
exports.getBookingStatusStats = () => {
    return knex('bookings')
        .select('status as name')
        .count('id as value')
        .groupBy('status');
};

// 5. HOTEL FINANCIAL PERFORMANCE TABLE
exports.getHotelFinancials = () => {
    return knex('bookings')
        .join('hotels', 'bookings.hotel_id', 'hotels.id')
        .select(
            'hotels.id',
            'hotels.name',
            'hotels.commission_rate'
        )
        .count('bookings.id as bookings')
        .sum('bookings.total_price as revenue')
        .whereIn('bookings.status', ['confirmed', 'completed'])
        .groupBy('hotels.id', 'hotels.name', 'hotels.commission_rate')
        .orderBy('revenue', 'desc');
};

// 6. RECENT ACTIVITY (Existing)
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

// ✅ NEW: Get All Commission Transactions (For Super Admin Finance Page)
exports.getAllTransactions = () => {
    return knex('commission_payments')
        .join('hotels', 'commission_payments.hotel_id', 'hotels.id')
        .leftJoin('users', 'commission_payments.manager_id', 'users.id') // Join manager info
        .select(
            'commission_payments.*',
            'hotels.name as hotel_name',
            'users.username as manager_name',
            'users.email as manager_email'
        )
        .orderBy('commission_payments.payment_date', 'desc');
};