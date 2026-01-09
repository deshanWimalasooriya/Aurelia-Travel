const knex = require('../../config/knex');

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Basic Counts
        const [bookingsCount] = await knex('bookings').count('id as count');
        const [usersCount] = await knex('users').count('id as count');
        const [roomsCount] = await knex('rooms').count('id as count');
        
        // 2. Total Revenue
        const [revenueData] = await knex('bookings')
            .sum('total_price as total')
            .where('status', 'confirmed')
            .orWhere('status', 'completed');

        // 3. Occupancy Rate Calculation (Simplified: Booked Days / Total Possible Days in last 30 days)
        // For this demo, we'll use a snapshot: Active Bookings / Total Rooms
        const [activeBookings] = await knex('bookings')
            .count('id as count')
            .where('check_in', '<=', new Date())
            .andWhere('check_out', '>=', new Date());
        
        const occupancyRate = roomsCount.count > 0 
            ? Math.round((activeBookings.count / roomsCount.count) * 100) 
            : 0;

        // 4. Monthly Revenue Data (for Chart)
        // Note: Raw queries vary by SQL dialect. This is for MySQL.
        const monthlyRevenue = await knex.raw(`
            SELECT DATE_FORMAT(created_at, '%b') as name, SUM(total_price) as value
            FROM bookings
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
            ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC
        `);

        // Format Stats for Frontend
        const stats = [
            { 
                label: 'Total Revenue', 
                value: `$${(revenueData.total || 0).toLocaleString()}`, 
                icon: 'DollarSign', 
                trend: '+12.5%', 
                color: '#10b981' // Green
            },
            { 
                label: 'Active Bookings', 
                value: bookingsCount.count, 
                icon: 'Calendar', 
                trend: '+5.2%', 
                color: '#3b82f6' // Blue
            },
            { 
                label: 'Occupancy Rate', 
                value: `${occupancyRate}%`, 
                icon: 'PieChart', 
                trend: occupancyRate > 70 ? '+High' : '-Low', 
                color: '#f59e0b' // Orange
            },
            { 
                label: 'Registered Users', 
                value: usersCount.count, 
                icon: 'Users', 
                trend: '+8.1%', 
                color: '#8b5cf6' // Purple
            }
        ];

        res.json({
            stats,
            chartData: monthlyRevenue[0] // knex.raw returns [rows, fields]
        });

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getRecentBookings = async (req, res) => {
    try {
        const bookings = await knex('bookings')
            .join('users', 'bookings.user_id', 'users.id')
            .join('rooms', 'bookings.room_id', 'rooms.id')
            .select(
                'bookings.id',
                'users.username as guest', // or users.full_name if you add it
                'users.profile_image',
                'rooms.room_type as room',
                'bookings.check_in',
                'bookings.check_out',
                'bookings.total_price',
                'bookings.status'
            )
            .orderBy('bookings.created_at', 'desc')
            .limit(10);

        res.json(bookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};