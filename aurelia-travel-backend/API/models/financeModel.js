const knex = require('../../config/knex');

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
            transaction_reference: paymentDetails.transaction_id || `MANUAL-${Date.now()}`
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