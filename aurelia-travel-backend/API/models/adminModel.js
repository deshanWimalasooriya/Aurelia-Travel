const knex = require('../../config/db');

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

// --- DB AGNOSTIC ANALYTICS FIXES ---
exports.getMonthlyRevenue = async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const bookings = await knex('bookings').whereIn('status', ['confirmed', 'completed']).where('check_in', '>=', sixMonthsAgo).select('check_in', 'total_price');

    const grouped = {};
    bookings.forEach(b => {
        const d = new Date(b.check_in);
        const sortDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
        if(!grouped[sortDate]) grouped[sortDate] = { name: d.toLocaleString('en-US', {month: 'short'}), sort_date: sortDate, value: 0 };
        grouped[sortDate].value += parseFloat(b.total_price || 0);
    });
    return Object.values(grouped).sort((a, b) => a.sort_date.localeCompare(b.sort_date));
};

exports.getBookingsByHotel = () => {
    return knex('bookings').join('hotels', 'bookings.hotel_id', 'hotels.id').select('hotels.name').count('bookings.id as value').groupBy('hotels.name').orderBy('value', 'desc').limit(5);
};

exports.getBookingStatusStats = () => {
    return knex('bookings').select('status as name').count('id as value').groupBy('status');
};

exports.getHotelFinancials = () => {
    return knex('bookings').join('hotels', 'bookings.hotel_id', 'hotels.id').select('hotels.id', 'hotels.name').count('bookings.id as bookings').sum('bookings.total_price as revenue').whereIn('bookings.status', ['confirmed', 'completed']).groupBy('hotels.id', 'hotels.name').orderBy('revenue', 'desc');
};

exports.getRecentActivity = () => {
    return knex('bookings').join('users', 'bookings.user_id', 'users.id').select('bookings.id', 'bookings.booking_reference', 'bookings.total_price', 'bookings.status', 'bookings.created_at', 'users.username').orderBy('bookings.created_at', 'desc').limit(10);
};

exports.getAllTransactions = () => {
    return knex('commission_payments').join('hotels', 'commission_payments.hotel_id', 'hotels.id').leftJoin('users', 'commission_payments.manager_id', 'users.id').select('commission_payments.*', 'hotels.name as hotel_name', 'users.username as manager_name', 'users.email as manager_email').orderBy('commission_payments.payment_date', 'desc');
};