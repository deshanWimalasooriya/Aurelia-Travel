const knex = require('../../config/db');

// 1. Get Stats for Manager Dashboard
// 1. UPDATE: getHotelStats
exports.getHotelStats = async (managerId) => {
    const hotels = await knex('hotels').where({ manager_id: managerId }).select('id', 'commission_rate');
    if (hotels.length === 0) return { total_revenue: 0, unpaid_commission: 0, pending_bookings_count: 0, has_overdue: false, current_rate: 0 };

    const hotelIds = hotels.map(h => h.id);
    const revenueResult = await knex('bookings').whereIn('hotel_id', hotelIds).whereIn('status', ['confirmed', 'completed']).sum('total_price as total').first();
    
    // ✨ ADDED: 'hotels.commission_rate' to the select query
    const unpaidBookings = await knex('bookings').join('hotels', 'bookings.hotel_id', 'hotels.id').whereIn('bookings.hotel_id', hotelIds).where('bookings.commission_status', 'pending').whereIn('bookings.status', ['confirmed', 'completed']).select('bookings.total_price', 'hotels.commission_rate');

    // ✨ STRICT DB FETCH (No 5% default)
    const settings = await knex('platform_settings').first();
    const globalRate = settings && settings.commission_rate ? parseFloat(settings.commission_rate) : 0;

    let totalPendingCommission = 0;
    unpaidBookings.forEach(b => { 
        const actualRate = b.commission_rate ? parseFloat(b.commission_rate) : globalRate;
        totalPendingCommission += parseFloat(b.total_price || 0) * (actualRate / 100); 
    });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const overdueCheck = await knex('bookings').whereIn('hotel_id', hotelIds).where('commission_status', 'pending').whereIn('status', ['confirmed', 'completed']).andWhere('check_out', '<', thirtyDaysAgo).first();

    // ✨ ADDED: return current_rate so React can display it
    return { 
        total_revenue: parseFloat(revenueResult.total || 0), 
        unpaid_commission: totalPendingCommission, 
        pending_bookings_count: unpaidBookings.length, 
        has_overdue: !!overdueCheck,
        current_rate: globalRate 
    };
};

// 2. UPDATE: payCommission (inside the same file)
exports.payCommission = async (managerId, paymentDetails) => {
    return await knex.transaction(async (trx) => {
        const hotels = await trx('hotels').where({ manager_id: managerId }).select('id', 'commission_rate');
        if (hotels.length === 0) throw new Error("No hotels found");
        const hotelIds = hotels.map(h => h.id);

        const eligibleBookings = await trx('bookings').join('hotels', 'bookings.hotel_id', 'hotels.id').whereIn('bookings.hotel_id', hotelIds).where('bookings.commission_status', 'pending').whereIn('bookings.status', ['confirmed', 'completed']).select('bookings.id', 'bookings.total_price', 'hotels.commission_rate', 'bookings.hotel_id');
        if (eligibleBookings.length === 0) throw new Error("No pending commissions.");

        // ✨ STRICT DB FETCH (No 5% default)
        const settings = await trx('platform_settings').first();
        const globalRate = settings && settings.commission_rate ? parseFloat(settings.commission_rate) : 0;

        let totalCommission = 0;
        eligibleBookings.forEach(b => { 
            const actualRate = b.commission_rate ? parseFloat(b.commission_rate) : globalRate;
            totalCommission += parseFloat(b.total_price) * (actualRate / 100); 
        });
        
        const [paymentId] = await trx('commission_payments').insert({
            hotel_id: hotelIds[0], manager_id: managerId, amount_paid: totalCommission, bookings_count: eligibleBookings.length, transaction_id: paymentDetails.transaction_id || `MANUAL-${Date.now()}`
        });

        await trx('bookings').whereIn('id', eligibleBookings.map(b => b.id)).update({ commission_status: 'paid', commission_payment_id: paymentId });
        return { paymentId, amount: totalCommission, count: eligibleBookings.length };
    });
};

exports.getPaymentHistory = async (managerId) => {
    return knex('commission_payments').where({ manager_id: managerId }).orderBy('paid_at', 'desc');
};


// --- DB AGNOSTIC ANALYTICS FIXES ---
exports.getManagerRevenueTrends = async (managerId) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const bookings = await knex('bookings').join('hotels', 'bookings.hotel_id', 'hotels.id').where('hotels.manager_id', managerId).whereIn('bookings.status', ['confirmed', 'completed']).where('bookings.check_in', '>=', sixMonthsAgo).select('bookings.check_in', 'bookings.total_price');

    const grouped = {};
    bookings.forEach(b => {
        const d = new Date(b.check_in);
        const sortDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
        if(!grouped[sortDate]) grouped[sortDate] = { name: d.toLocaleString('en-US', {month: 'short'}), sort_date: sortDate, value: 0 };
        grouped[sortDate].value += parseFloat(b.total_price || 0);
    });
    return Object.values(grouped).sort((a, b) => a.sort_date.localeCompare(b.sort_date));
};

exports.getManagerHotelsBreakdown = async (managerId) => {
    return knex('bookings').join('hotels', 'bookings.hotel_id', 'hotels.id').where('hotels.manager_id', managerId).select('hotels.name').count('bookings.id as value').groupBy('hotels.name').orderBy('value', 'desc');
};

exports.getManagerBookingStatus = async (managerId) => {
    return knex('bookings').join('hotels', 'bookings.hotel_id', 'hotels.id').where('hotels.manager_id', managerId).select('bookings.status as name').count('bookings.id as value').groupBy('bookings.status');
};

exports.getManagerFinancialTable = async (managerId) => {
    return knex('bookings')
    .join('hotels', 'bookings.hotel_id', 'hotels.id')
    .where('hotels.manager_id', managerId)
    .whereIn('bookings.status', ['confirmed', 'completed'])
    .select('hotels.id', 'hotels.name', 'hotels.commission_rate')
    .count('bookings.id as bookings')
    .sum('bookings.total_price as revenue')
    .groupBy('hotels.id', 'hotels.name', 'hotels.commission_rate')
    .orderBy('revenue', 'desc');
};

const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
};

exports.getManagerOverviewStats = async (managerId) => {
    const hotels = await knex('hotels').where({ manager_id: managerId }).select('id');
    const hotelIds = hotels.map(h => h.id);
    if (hotelIds.length === 0) return { kpi: { revenue: {value:0, trend:0}, bookings: {value:0, trend:0}, occupancy: {value:0, trend:0}, guests: {value:0, trend:0} }, chart: [] };

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const currentMonth = await knex('bookings').whereIn('hotel_id', hotelIds).whereIn('status', ['confirmed', 'completed']).where('check_in', '>=', startOfThisMonth).select(knex.raw('COALESCE(SUM(total_price), 0) as revenue'), knex.raw('COUNT(id) as bookings'), knex.raw('COALESCE(SUM(adults + children), 0) as guests')).first();
    const lastMonth = await knex('bookings').whereIn('hotel_id', hotelIds).whereIn('status', ['confirmed', 'completed']).whereBetween('check_in', [startOfLastMonth, endOfLastMonth]).select(knex.raw('COALESCE(SUM(total_price), 0) as revenue'), knex.raw('COUNT(id) as bookings'), knex.raw('COALESCE(SUM(adults + children), 0) as guests')).first();

    const inventory = await knex('rooms').whereIn('hotel_id', hotelIds).sum('total_quantity as total').first();
    const occupiedToday = await knex('bookings').whereIn('hotel_id', hotelIds).whereIn('status', ['confirmed', 'active']).where('check_in', '<=', now).where('check_out', '>', now).count('id as count').first();
    
    const occupancyRate = parseInt(inventory.total || 0) > 0 ? Math.round((parseInt(occupiedToday.count || 0) / parseInt(inventory.total)) * 100) : 0;

    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        days.push({ date: d.toISOString().split('T')[0], name: d.toLocaleDateString('en-US', { weekday: 'short' }), revenue: 0 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const rawDaily = await knex('bookings').whereIn('hotel_id', hotelIds).whereIn('status', ['confirmed', 'completed']).where('check_in', '>=', sevenDaysAgo).select('check_in', 'total_price');

    rawDaily.forEach(record => {
        const dbDate = new Date(record.check_in).toISOString().split('T')[0];
        const dayEntry = days.find(d => d.date === dbDate);
        if (dayEntry) dayEntry.revenue += parseFloat(record.total_price || 0);
    });

    return {
        kpi: {
            revenue: { value: parseFloat(currentMonth.revenue), trend: calculateTrend(parseFloat(currentMonth.revenue), parseFloat(lastMonth.revenue)) },
            bookings: { value: parseInt(currentMonth.bookings), trend: calculateTrend(parseInt(currentMonth.bookings), parseInt(lastMonth.bookings)) },
            guests: { value: parseInt(currentMonth.guests), trend: calculateTrend(parseInt(currentMonth.guests), parseInt(lastMonth.guests)) },
            occupancy: { value: occupancyRate, trend: 0 }
        },
        chart: days
    };
};