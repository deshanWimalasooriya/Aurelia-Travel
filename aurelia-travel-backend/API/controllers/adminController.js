const knex = require('../../config/knex');

// ========================================
// 1. DASHBOARD STATS
// ========================================
exports.getGlobalStats = async () => {
    const [bookings] = await knex('bookings').count('* as total_bookings');
    const [revenue] = await knex('bookings')
        .sum('total_price as total_revenue')
        .where('status', 'completed');
    
    const [activeHotels] = await knex('hotels')
        .count('* as active_hotels')
        .where('is_active', true);
    
    const [activeUsers] = await knex('users')
        .count('* as active_users')
        .where('is_active', true);

    return {
        total_bookings: bookings.total_bookings || 0,
        total_revenue: parseFloat(revenue.total_revenue || 0),
        active_hotels: activeHotels.active_hotels || 0,
        active_users: activeUsers.active_users || 0
    };
};

// ========================================
// 2. RECENT ACTIVITY
// ========================================
exports.getRecentActivity = async (limit = 10) => {
    return await knex('bookings')
        .join('users', 'bookings.user_id', 'users.id')
        .join('hotels', 'bookings.hotel_id', 'hotels.id')
        .select(
            'bookings.id',
            'bookings.booking_reference',
            'bookings.check_in',
            'bookings.check_out',
            'bookings.total_price',
            'bookings.status',
            'users.username as guest',
            'users.email as guest_email',
            'hotels.name as hotel'
        )
        .orderBy('bookings.created_at', 'desc')
        .limit(limit);
};

// ========================================
// 3. MONTHLY REVENUE (for Charts)
// ========================================
exports.getMonthlyRevenue = async () => {
    const currentYear = new Date().getFullYear();
    
    return await knex('bookings')
        .select(
            knex.raw('DATE_FORMAT(check_in, "%b") as month'),
            knex.raw('SUM(total_price) as revenue'),
            knex.raw('COUNT(*) as bookings')
        )
        .whereRaw('YEAR(check_in) = ?', [currentYear])
        .groupByRaw('MONTH(check_in)')
        .orderByRaw('MONTH(check_in)');
};

// ========================================
// 4. BOOKING STATUS BREAKDOWN
// ========================================
exports.getBookingsByStatus = async () => {
    return await knex('bookings')
        .select('status')
        .count('* as count')
        .groupBy('status');
};

// ========================================
// 5. TOP PERFORMING HOTELS
// ========================================
exports.getTopHotels = async (limit = 5) => {
    return await knex('hotels')
        .join('bookings', 'hotels.id', 'bookings.hotel_id')
        .select(
            'hotels.id',
            'hotels.name',
            'hotels.city',
            'hotels.rating_average'
        )
        .count('bookings.id as total_bookings')
        .sum('bookings.total_price as revenue')
        .groupBy('hotels.id')
        .orderBy('revenue', 'desc')
        .limit(limit);
};

// ========================================
// 6. USER MANAGEMENT
// ========================================
exports.getAllUsers = async (filters = {}) => {
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
    // Soft delete
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
        .leftJoin('users', 'hotels.manager_id', 'users.id')
        .select(
            'hotels.*',
            'users.username as manager_name',
            'users.email as manager_email'
        )
        .count('bookings.id as total_bookings')
        .leftJoin('bookings', 'hotels.id', 'bookings.hotel_id')
        .groupBy('hotels.id')
        .orderBy('hotels.created_at', 'desc');
};

exports.updateHotel = async (id, data) => {
    await knex('hotels').where({ id }).update(data);
    return await knex('hotels').where({ id }).first();
};

exports.toggleHotelStatus = async (id) => {
    const hotel = await knex('hotels').where({ id }).first();
    await knex('hotels').where({ id }).update({ 
        is_active: !hotel.is_active 
    });
    return await knex('hotels').where({ id }).first();
};

// ========================================
// 8. BOOKING MANAGEMENT
// ========================================
exports.getAllBookingsForAdmin = async (filters = {}) => {
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
exports.getAllReviews = async (filters = {}) => {
    let query = knex('reviews')
        .join('users', 'reviews.user_id', 'users.id')
        .join('hotels', 'reviews.hotel_id', 'hotels.id')
        .select(
            'reviews.*',
            'users.username',
            'hotels.name as hotel_name'
        );
    
    if (filters.is_approved !== undefined) {
        query = query.where('reviews.is_approved', filters.is_approved);
    }
    
    return await query.orderBy('reviews.created_at', 'desc');
};

exports.toggleReviewApproval = async (id) => {
    const review = await knex('reviews').where({ id }).first();
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
    const [total] = await knex('bookings')
        .sum('total_price as gross_revenue')
        .where('status', 'completed');
    
    const grossRevenue = parseFloat(total.gross_revenue || 0);
    const aureliaShare = grossRevenue * 0.15; // 15% commission
    const hotelShare = grossRevenue * 0.85;
    
    const [pending] = await knex('bookings')
        .sum('total_price as pending_revenue')
        .whereIn('status', ['pending', 'confirmed']);
    
    return {
        gross_revenue: grossRevenue,
        aurelia_commission: aureliaShare,
        hotel_payouts: hotelShare,
        pending_revenue: parseFloat(pending.pending_revenue || 0)
    };
};

module.exports = exports;
