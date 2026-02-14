const knex = require('../../config/db');

// 1. Get Stats for Manager Dashboard (Aggregated for ALL their hotels)
exports.getHotelStats = async (managerId) => {
    // A. Find ALL hotels managed by this user
    const hotels = await knex('hotels').where({ manager_id: managerId }).select('id', 'commission_rate');
    
    // If manager has no hotels, return zeroed stats
    if (hotels.length === 0) {
        return { 
            total_revenue: 0, 
            unpaid_commission: 0, 
            pending_bookings_count: 0, 
            has_overdue: false 
        };
    }

    const hotelIds = hotels.map(h => h.id);

    // B. Calculate Total Revenue (Gross)
    // Includes both 'confirmed' and 'completed' so the dashboard updates immediately
    const revenueResult = await knex('bookings')
        .whereIn('hotel_id', hotelIds)
        .whereIn('status', ['confirmed', 'completed']) 
        .sum('total_price as total')
        .first();

    // C. Calculate Unpaid Commission
    // We calculate this by joining with the hotels table to respect specific commission rates per hotel
    const unpaidBookings = await knex('bookings')
        .join('hotels', 'bookings.hotel_id', 'hotels.id')
        .whereIn('bookings.hotel_id', hotelIds)
        .where('bookings.commission_status', 'pending') // Only unpaid ones
        .whereIn('bookings.status', ['confirmed', 'completed']) // Active bookings
        .select('bookings.total_price', 'hotels.commission_rate');

    let totalPendingCommission = 0;
    
    unpaidBookings.forEach(booking => {
        const rate = booking.commission_rate || 5.00;
        totalPendingCommission += parseFloat(booking.total_price || 0) * (rate / 100);
    });

    // D. Check for Overdue Payments (Older than 30 days)
    const overdueCheck = await knex('bookings')
        .whereIn('hotel_id', hotelIds)
        .where('commission_status', 'pending')
        .whereIn('status', ['confirmed', 'completed'])
        .andWhere('check_out', '<', knex.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
        .first();

    return {
        total_revenue: parseFloat(revenueResult.total || 0),
        unpaid_commission: totalPendingCommission,
        pending_bookings_count: unpaidBookings.length,
        has_overdue: !!overdueCheck
    };
};

// 2. Get Payment History
exports.getPaymentHistory = async (managerId) => {
    return knex('commission_payments')
        .where({ manager_id: managerId })
        .orderBy('paid_at', 'desc');
};

// 3. PROCESS PAYMENT (Atomic Transaction for ALL Hotels)
exports.payCommission = async (managerId, paymentDetails) => {
    return await knex.transaction(async (trx) => {
        // 1. Get all manager's hotels
        const hotels = await trx('hotels').where({ manager_id: managerId }).select('id', 'commission_rate');
        if (hotels.length === 0) throw new Error("No hotels found for this manager");
        
        const hotelIds = hotels.map(h => h.id);

        // 2. Find all eligible bookings across ALL hotels
        // Must be: Belonging to manager's hotels + Unpaid commission + Active status
        const eligibleBookings = await trx('bookings')
            .join('hotels', 'bookings.hotel_id', 'hotels.id')
            .whereIn('bookings.hotel_id', hotelIds)
            .where('bookings.commission_status', 'pending')
            .whereIn('bookings.status', ['confirmed', 'completed'])
            .select(
                'bookings.id', 
                'bookings.total_price', 
                'hotels.commission_rate', 
                'bookings.hotel_id'
            );

        if (eligibleBookings.length === 0) {
            throw new Error("No pending commissions to pay.");
        }

        // 3. Calculate Total Commission to be paid now
        let totalCommission = 0;
        eligibleBookings.forEach(b => {
            const rate = b.commission_rate || 5.00;
            totalCommission += parseFloat(b.total_price) * (rate / 100);
        });

        // 4. Create ONE Payment Record
        // We link it to the first hotel ID for reference, but it covers all bookings found.
        const [paymentId] = await trx('commission_payments').insert({
            hotel_id: hotelIds[0], 
            manager_id: managerId,
            amount_paid: totalCommission,
            bookings_count: eligibleBookings.length,
            transaction_id: paymentDetails.transaction_id || `MANUAL-${Date.now()}`
        });

        // 5. Update ALL these Bookings to 'paid'
        const bookingIds = eligibleBookings.map(b => b.id);
        await trx('bookings')
            .whereIn('id', bookingIds)
            .update({
                commission_status: 'paid',
                commission_payment_id: paymentId
            });

        return { 
            paymentId, 
            amount: totalCommission, 
            count: eligibleBookings.length 
        };
    });
};

// --- NEW ANALYTICS FUNCTIONS FOR MANAGER ---

// 1. Manager Revenue Trends (Last 6 Months)
exports.getManagerRevenueTrends = async (managerId) => {
    return knex('bookings')
        .join('hotels', 'bookings.hotel_id', 'hotels.id')
        .where('hotels.manager_id', managerId) // Filter by Manager
        .whereIn('bookings.status', ['confirmed', 'completed'])
        .where('bookings.check_in', '>=', knex.raw('DATE_SUB(NOW(), INTERVAL 6 MONTH)'))
        .select(
            knex.raw("DATE_FORMAT(bookings.check_in, '%b') as name"),
            knex.raw("DATE_FORMAT(bookings.check_in, '%Y-%m') as sort_date")
        )
        .sum('bookings.total_price as value')
        .groupBy('name', 'sort_date')
        .orderBy('sort_date', 'asc');
};

// 2. Manager's Hotels Breakdown
exports.getManagerHotelsBreakdown = async (managerId) => {
    return knex('bookings')
        .join('hotels', 'bookings.hotel_id', 'hotels.id')
        .where('hotels.manager_id', managerId)
        .select('hotels.name')
        .count('bookings.id as value')
        .groupBy('hotels.name')
        .orderBy('value', 'desc');
};

// 3. Manager's Booking Status
exports.getManagerBookingStatus = async (managerId) => {
    return knex('bookings')
        .join('hotels', 'bookings.hotel_id', 'hotels.id')
        .where('hotels.manager_id', managerId)
        .select('bookings.status as name')
        .count('bookings.id as value')
        .groupBy('bookings.status');
};

// 4. Manager's Financial Table
exports.getManagerFinancialTable = async (managerId) => {
    return knex('bookings')
        .join('hotels', 'bookings.hotel_id', 'hotels.id')
        .where('hotels.manager_id', managerId)
        .whereIn('bookings.status', ['confirmed', 'completed'])
        .select(
            'hotels.id',
            'hotels.name',
            'hotels.commission_rate'
        )
        .count('bookings.id as bookings')
        .sum('bookings.total_price as revenue')
        .groupBy('hotels.id', 'hotels.name', 'hotels.commission_rate')
        .orderBy('revenue', 'desc');
};

// Helper to get percentage change
const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
};

// 5. MANAGER OVERVIEW (Real KPIs + Gap-Filled Chart)
exports.getManagerOverviewStats = async (managerId) => {
    const hotels = await knex('hotels').where({ manager_id: managerId }).select('id');
    const hotelIds = hotels.map(h => h.id);

    // Initial State if no hotels
    if (hotelIds.length === 0) {
        return {
            kpi: { 
                revenue: { value: 0, trend: 0 },
                bookings: { value: 0, trend: 0 },
                occupancy: { value: 0, trend: 0 },
                guests: { value: 0, trend: 0 }
            },
            chart: []
        };
    }

    // --- A. KPI CALCULATIONS (Current Month vs Last Month) ---
    
    // 1. Current Month Stats
    const currentMonth = await knex('bookings')
        .whereIn('hotel_id', hotelIds)
        .whereIn('status', ['confirmed', 'completed'])
        .whereRaw('MONTH(check_in) = MONTH(CURRENT_DATE())')
        .whereRaw('YEAR(check_in) = YEAR(CURRENT_DATE())')
        .select(
            knex.raw('COALESCE(SUM(total_price), 0) as revenue'),
            knex.raw('COUNT(id) as bookings'),
            knex.raw('COALESCE(SUM(adults + children), 0) as guests')
        ).first();

    // 2. Last Month Stats (For Trend Comparison)
    const lastMonth = await knex('bookings')
        .whereIn('hotel_id', hotelIds)
        .whereIn('status', ['confirmed', 'completed'])
        .whereRaw('MONTH(check_in) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))')
        .whereRaw('YEAR(check_in) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))')
        .select(
            knex.raw('COALESCE(SUM(total_price), 0) as revenue'),
            knex.raw('COUNT(id) as bookings'),
            knex.raw('COALESCE(SUM(adults + children), 0) as guests')
        ).first();

    // 3. Occupancy (Live)
    const inventory = await knex('rooms').whereIn('hotel_id', hotelIds).sum('total_quantity as total').first();
    const totalRooms = parseInt(inventory.total || 0);

    const occupiedToday = await knex('bookings')
        .whereIn('hotel_id', hotelIds)
        .whereIn('status', ['confirmed', 'active']) 
        .where('check_in', '<=', knex.raw('CURRENT_DATE()'))
        .where('check_out', '>', knex.raw('CURRENT_DATE()'))
        .count('id as count')
        .first();
    
    const occupiedCount = parseInt(occupiedToday.count || 0);
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

    // --- B. CHART DATA (Last 7 Days with 0-filling) ---
    
    // 1. Generate last 7 days array (dates)
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            date: d.toISOString().split('T')[0], // "2023-10-27"
            name: d.toLocaleDateString('en-US', { weekday: 'short' }), // "Fri"
            revenue: 0 // Default
        });
    }

    // 2. Fetch Actual Data
    const rawDailyRevenue = await knex('bookings')
        .whereIn('hotel_id', hotelIds)
        .whereIn('status', ['confirmed', 'completed'])
        .where('check_in', '>=', days[0].date) // Start from 7 days ago
        .select(
            knex.raw("DATE(check_in) as date"),
            knex.raw("SUM(total_price) as revenue")
        )
        .groupBy('date');

    // 3. Merge DB Data into the 7-Day Template
    rawDailyRevenue.forEach(record => {
        // Convert DB date string to YYYY-MM-DD
        const dbDate = new Date(record.date).toISOString().split('T')[0];
        const dayEntry = days.find(d => d.date === dbDate);
        if (dayEntry) {
            dayEntry.revenue = parseFloat(record.revenue);
        }
    });

    return {
        kpi: {
            revenue: { 
                value: parseFloat(currentMonth.revenue), 
                trend: calculateTrend(parseFloat(currentMonth.revenue), parseFloat(lastMonth.revenue)) 
            },
            bookings: { 
                value: parseInt(currentMonth.bookings), 
                trend: calculateTrend(parseInt(currentMonth.bookings), parseInt(lastMonth.bookings)) 
            },
            guests: { 
                value: parseInt(currentMonth.guests), 
                trend: calculateTrend(parseInt(currentMonth.guests), parseInt(lastMonth.guests)) 
            },
            occupancy: { 
                value: occupancyRate, 
                trend: 0 // Occupancy trend is complex, keeping 0 for now or remove trend UI
            }
        },
        chart: days // Returns clean array: [{name: 'Mon', revenue: 0}, {name: 'Tue', revenue: 500}...]
    };
};