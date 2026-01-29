const knex = require('../../config/knex');

// ========================================
// 1. DASHBOARD STATS
// ========================================
exports.getGlobalStats = async () => {
    try {
        const bookings = await knex('bookings')
            .count('* as total_bookings')
            .first();

        // FIX: 'totalprice' -> 'total_price'
        const revenue = await knex('bookings')
            .sum('total_price as total_revenue') 
            .whereIn('status', ['completed', 'confirmed'])
            .first();

        const activeHotels = await knex('hotels')
            .count('* as active_hotels')
            // FIX: 'isactive' -> 'is_active' (assuming hotels has this, added in migration 05)
            .where('is_active', true) 
            .first();

        // FIX: 'isactive' -> 'is_active'
        const activeUsers = await knex('users')
            .count('* as active_users')
            .where('is_active', true)
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
            // FIX: 'userid' -> 'user_id', 'hotelid' -> 'hotel_id'
            .join('users', 'bookings.user_id', 'users.id')
            .join('hotels', 'bookings.hotel_id', 'hotels.id')
            .select(
                'bookings.id',
                'bookings.booking_reference', // FIX: added underscore
                'bookings.check_in',          // FIX: added underscore
                'bookings.check_out',         // FIX: added underscore
                'bookings.total_price',       // FIX: added underscore
                'bookings.status',
                'users.username as guest',
                'users.email as guest_email',
                'hotels.name as hotel'
            )
            .orderBy('bookings.created_at', 'desc') // FIX: 'createdat' -> 'created_at'
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
                // FIX: 'checkin' -> 'check_in', 'totalprice' -> 'total_price'
                knex.raw('DATE_FORMAT(check_in, "%b") as month'),
                knex.raw('SUM(total_price) as revenue'),
                knex.raw('COUNT(*) as bookings')
            )
            .whereRaw('YEAR(check_in) = ?', [currentYear])
            .groupByRaw('MONTH(check_in)')
            .orderByRaw('MONTH(check_in)');
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
            // FIX: 'hotelid' -> 'hotel_id'
            .join('bookings', 'hotels.id', 'bookings.hotel_id')
            .select(
                'hotels.id',
                'hotels.name',
                'hotels.city',
                'hotels.rating_average' // FIX: 'ratingaverage' -> 'rating_average'
            )
            .count('bookings.id as total_bookings')
            // FIX: 'totalprice' -> 'total_price'
            .sum('bookings.total_price as revenue')
            .groupBy('hotels.id', 'hotels.name', 'hotels.city', 'hotels.rating_average')
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
exports.getAllUsers = async (filters) => {
    // FIX: 'isactive' -> 'is_active', 'createdat' -> 'created_at'
    let query = knex('users')
        .select('id', 'username', 'email', 'role', 'is_active', 'created_at')
        .where('is_active', true);

    if (filters.role) {
        query = query.where('role', filters.role);
    }

    if (filters.search) {
        query = query.where(function() {
            this.where('username', 'like', `%${filters.search}%`)
                .orWhere('email', 'like', `%${filters.search}%`);
        });
    }

    return await query.orderBy('created_at', 'desc');
};

exports.updateUser = async (id, data) => {
    await knex('users').where({ id }).update(data);
    return await knex('users').where({ id }).first();
};

exports.deleteUser = async (id) => {
    // FIX: 'isactive' -> 'is_active', 'deletedat' -> 'deleted_at'
    return await knex('users').where({ id }).update({
        is_active: false,
        deleted_at: knex.fn.now()
    });
};

// ========================================
// 7. HOTEL MANAGEMENT
// ========================================
exports.getAllHotelsForAdmin = async () => {
    return await knex('hotels')
        // FIX: 'managerid' -> 'manager_id', 'hotelid' -> 'hotel_id'
        .leftJoin('users', 'hotels.manager_id', 'users.id')
        .leftJoin('bookings', 'hotels.id', 'bookings.hotel_id')
        .select(
            'hotels.*',
            'users.username as manager_name',
            'users.email as manager_email'
        )
        .count('bookings.id as total_bookings')
        .groupBy('hotels.id')
        .orderBy('hotels.created_at', 'desc'); // FIX: 'createdat' -> 'created_at'
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
    // FIX: toggle 'is_active' instead of 'is_featured' based on your migration 05
    await knex('hotels').where({ id }).update({
        is_active: !hotel.is_active
    });
    return await knex('hotels').where({ id }).first();
};

// ========================================
// 8. BOOKING MANAGEMENT
// ========================================
exports.getAllBookingsForAdmin = async (filters) => {
    // FIX: All Join Keys
    let query = knex('bookings')
        .join('users', 'bookings.user_id', 'users.id')
        .join('hotels', 'bookings.hotel_id', 'hotels.id')
        .join('rooms', 'bookings.room_id', 'rooms.id')
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
    // FIX: 'datefrom' -> filters.date_from (passed from controller)
    if (filters.date_from) {
        query = query.where('bookings.check_in', '>=', filters.date_from);
    }
    if (filters.date_to) {
        query = query.where('bookings.check_out', '<=', filters.date_to);
    }

    return await query.orderBy('bookings.created_at', 'desc');
};

exports.updateBookingStatus = async (id, status) => {
    await knex('bookings').where({ id }).update({ status });
    return await knex('bookings').where({ id }).first();
};

// ========================================
// 9. REVIEWS MANAGEMENT
// ========================================
exports.getAllReviews = async (filters) => {
    // FIX: 'userid' -> 'user_id', 'hotelid' -> 'hotel_id'
    let query = knex('reviews')
        .join('users', 'reviews.user_id', 'users.id')
        .join('hotels', 'reviews.hotel_id', 'hotels.id')
        .select(
            'reviews.*',
            'users.username',
            'hotels.name as hotel_name'
        );

    // FIX: 'isapproved' -> 'is_approved'
    if (filters.is_approved !== undefined) {
        query = query.where('reviews.is_approved', filters.is_approved);
    }

    return await query.orderBy('reviews.created_at', 'desc');
};

exports.toggleReviewApproval = async (id) => {
    const review = await knex('reviews').where({ id }).first();
    // FIX: 'isapproved' -> 'is_approved'
    await knex('reviews').where({ id }).update({
        is_approved: !review.is_approved
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
    // FIX: 'totalprice' -> 'total_price'
    const total = await knex('bookings')
        .sum('total_price as gross_revenue')
        .where('status', 'completed')
        .first();

    const grossRevenue = parseFloat(total.gross_revenue || 0);
    const aureliaShare = grossRevenue * 0.15;
    const hotelShare = grossRevenue * 0.85;

    // FIX: 'totalprice' -> 'total_price'
    const pending = await knex('bookings')
        .sum('total_price as pending_revenue')
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