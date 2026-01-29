const knex = require('../../config/knex');

// ========================================
// 1. DASHBOARD STATS
// ========================================
exports.getGlobalStats = async () => {
    try {
        const bookings = await knex('bookings')
            .count('* as total_bookings')
            .first();
        
        const revenue = await knex('bookings')
            .sum('totalprice as total_revenue')
            .whereIn('status', ['completed', 'confirmed'])
            .first();
        
        const activeHotels = await knex('hotels')
            .count('* as active_hotels')
            .first();
        
        const activeUsers = await knex('users')
            .count('* as active_users')
            .where('isactive', true)
            .first();

        return {
            total_bookings: parseInt(bookings.total_bookings) || 0,
            total_revenue: parseFloat(revenue.total_revenue || 0),
            active_hotels: parseInt(activeHotels.active_hotels) || 0,
            active_users: parseInt(activeUsers.active_users) || 0
        };
    } catch (err) {
        console.error('Model Error - getGlobalStats:', err);
        throw err;
    }
};

// ========================================
// 2. RECENT ACTIVITY
// ========================================
exports.getRecentActivity = async (limit = 10) => {
    try {
        return await knex('bookings')
            .join('users', 'bookings.userid', 'users.id')
            .join('hotels', 'bookings.hotelid', 'hotels.id')
            .select(
                'bookings.id',
                'bookings.bookingreference',
                'bookings.checkin',
                'bookings.checkout',
                'bookings.totalprice',
                'bookings.status',
                'users.username as guest',
                'users.email as guest_email',
                'hotels.name as hotel'
            )
            .orderBy('bookings.createdat', 'desc')
            .limit(limit);
    } catch (err) {
        console.error('Model Error - getRecentActivity:', err);
        throw err;
    }
};

// ========================================
// 3. MONTHLY REVENUE (for Charts)
// ========================================
exports.getMonthlyRevenue = async () => {
    try {
        const currentYear = new Date().getFullYear();
        
        return await knex('bookings')
            .select(
                knex.raw('DATE_FORMAT(checkin, "%b") as month'),
                knex.raw('SUM(totalprice) as revenue'),
                knex.raw('COUNT(*) as bookings')
            )
            .whereRaw('YEAR(checkin) = ?', [currentYear])
            .groupByRaw('MONTH(checkin)')
            .orderByRaw('MONTH(checkin)');
    } catch (err) {
        console.error('Model Error - getMonthlyRevenue:', err);
        return [];
    }
};

// ========================================
// 4. BOOKING STATUS BREAKDOWN
// ========================================
exports.getBookingsByStatus = async () => {
    try {
        return await knex('bookings')
            .select('status as name')
            .count('* as count')
            .groupBy('status');
    } catch (err) {
        console.error('Model Error - getBookingsByStatus:', err);
        return [];
    }
};

// ========================================
// 5. TOP PERFORMING HOTELS
// ========================================
exports.getTopHotels = async (limit = 5) => {
    try {
        return await knex('hotels')
            .join('bookings', 'hotels.id', 'bookings.hotelid')
            .select(
                'hotels.id',
                'hotels.name',
                'hotels.city',
                'hotels.ratingaverage'
            )
            .count('bookings.id as total_bookings')
            .sum('bookings.totalprice as revenue')
            .groupBy('hotels.id', 'hotels.name', 'hotels.city', 'hotels.ratingaverage')
            .orderBy('revenue', 'desc')
            .limit(limit);
    } catch (err) {
        console.error('Model Error - getTopHotels:', err);
        return [];
    }
};

// ========================================
// 6. USER MANAGEMENT
// ========================================
exports.getAllUsers = async (filters = {}) => {
    let query = knex('users')
        .select('id', 'username', 'email', 'role', 'isactive', 'createdat')
        .where('isactive', true);

    if (filters.role) {
        query = query.where('role', filters.role);
    }

    if (filters.search) {
        query = query.where(function() {
            this.where('username', 'like', `%${filters.search}%`)
                .orWhere('email', 'like', `%${filters.search}%`);
        });
    }

    return await query.orderBy('createdat', 'desc');
};

exports.updateUser = async (id, data) => {
    await knex('users').where({ id }).update(data);
    return await knex('users').where({ id }).first();
};

exports.deleteUser = async (id) => {
    return await knex('users').where({ id }).update({
        isactive: false,
        deletedat: knex.fn.now()
    });
};

// ========================================
// 7. HOTEL MANAGEMENT
// ========================================
exports.getAllHotelsForAdmin = async () => {
    return await knex('hotels')
        .leftJoin('users', 'hotels.managerid', 'users.id')
        .leftJoin('bookings', 'hotels.id', 'bookings.hotelid')
        .select(
            'hotels.*',
            'users.username as manager_name',
            'users.email as manager_email'
        )
        .count('bookings.id as total_bookings')
        .groupBy('hotels.id')
        .orderBy('hotels.createdat', 'desc');
};

exports.updateHotel = async (id, data) => {
    await knex('hotels').where({ id }).update(data);
    return await knex('hotels').where({ id }).first();
};

exports.toggleHotelStatus = async (id) => {
    const hotel = await knex('hotels').where({ id }).first();
    if (!hotel) {
        throw new Error('Hotel not found');
    }
    // Hotels table doesn't have isactive column; toggle `isfeatured` carefully
    await knex('hotels').where({ id }).update({
        isfeatured: !hotel.isfeatured
    });
    return await knex('hotels').where({ id }).first();
};

// ========================================
// 8. BOOKING MANAGEMENT
// ========================================
exports.getAllBookingsForAdmin = async (filters = {}) => {
    let query = knex('bookings')
        .join('users', 'bookings.userid', 'users.id')
        .join('hotels', 'bookings.hotelid', 'hotels.id')
        .join('rooms', 'bookings.roomid', 'rooms.id')
        .select(
            'bookings.*',
            'users.username as guest_name',
            'users.email as guest_email',
            'hotels.name as hotel_name',
            'rooms.title as room_title'
        );

    if (filters.status) {
        query = query.where('bookings.status', filters.status);
    }
    if (filters.date_from) {
        query = query.where('bookings.checkin', '>=', filters.date_from);
    }
    if (filters.date_to) {
        query = query.where('bookings.checkout', '<=', filters.date_to);
    }

    return await query.orderBy('bookings.createdat', 'desc');
};

exports.updateBookingStatus = async (id, status) => {
    await knex('bookings').where({ id }).update({ status });
    return await knex('bookings').where({ id }).first();
};

// ========================================
// 9. REVIEWS MANAGEMENT
// ========================================
exports.getAllReviews = async (filters = {}) => {
    let query = knex('reviews')
        .join('users', 'reviews.userid', 'users.id')
        .join('hotels', 'reviews.hotelid', 'hotels.id')
        .select(
            'reviews.*',
            'users.username',
            'hotels.name as hotel_name'
        );

    if (filters.is_approved !== undefined) {
        query = query.where('reviews.isapproved', filters.is_approved);
    }

    return await query.orderBy('reviews.createdat', 'desc');
};

exports.toggleReviewApproval = async (id) => {
    const review = await knex('reviews').where({ id }).first();
    await knex('reviews').where({ id }).update({
        isapproved: !review.isapproved
    });
    return await knex('reviews').where({ id }).first();
};

exports.deleteReview = async (id) => {
    return await knex('reviews').where({ id }).del();
};

// ========================================
// 10. FINANCIAL ANALYTICS
// ========================================
exports.getFinancialSummary = async () => {
    const total = await knex('bookings')
        .sum('totalprice as gross_revenue')
        .where('status', 'completed')
        .first();

    const grossRevenue = parseFloat(total.gross_revenue || 0);
    const aureliaShare = grossRevenue * 0.15;
    const hotelShare = grossRevenue * 0.85;

    const pending = await knex('bookings')
        .sum('totalprice as pending_revenue')
        .whereIn('status', ['pending', 'confirmed'])
        .first();

    return {
        gross_revenue: grossRevenue,
        aurelia_commission: aureliaShare,
        hotel_payouts: hotelShare,
        pending_revenue: parseFloat(pending.pending_revenue || 0)
    };
};

module.exports = exports;
