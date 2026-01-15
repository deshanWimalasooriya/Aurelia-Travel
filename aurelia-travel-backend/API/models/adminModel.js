const knex = require('../../config/knex');

// Get Dashboard Statistics
exports.getStats = async () => {
  try {
    // Total Bookings
    const bookingsCount = await knex('bookings').count('* as count').first();
    
    // Total Revenue
    const revenue = await knex('bookings')
      .where('status', 'confirmed')
      .orWhere('status', 'completed')
      .sum('total_price as total')
      .first();
    
    // Total Users
    const usersCount = await knex('users')
      .where('role', 'user')
      .count('* as count')
      .first();
    
    // Total Hotels
    const hotelsCount = await knex('hotels').count('* as count').first();
    
    // Available Rooms
    const availableRooms = await knex('rooms')
      .where('is_available', true)
      .count('* as count')
      .first();
    
    // Pending Bookings
    const pendingBookings = await knex('bookings')
      .where('status', 'pending')
      .count('* as count')
      .first();

    // Revenue This Month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyRevenue = await knex('bookings')
      .where('status', 'confirmed')
      .andWhere('created_at', '>=', startOfMonth)
      .sum('total_price as total')
      .first();

    // Last Month Revenue for comparison
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const lastMonthEnd = startOfMonth;
    const lastMonthRevenue = await knex('bookings')
      .where('status', 'confirmed')
      .whereBetween('created_at', [lastMonthStart, lastMonthEnd])
      .sum('total_price as total')
      .first();

    // Calculate percentage change
    const revenueChange = lastMonthRevenue?.total 
      ? (((monthlyRevenue?.total || 0) - lastMonthRevenue.total) / lastMonthRevenue.total * 100).toFixed(1)
      : 0;

    return {
      bookings: parseInt(bookingsCount.count) || 0,
      revenue: parseFloat(revenue?.total) || 0,
      users: parseInt(usersCount.count) || 0,
      hotels: parseInt(hotelsCount.count) || 0,
      availableRooms: parseInt(availableRooms.count) || 0,
      pendingBookings: parseInt(pendingBookings.count) || 0,
      monthlyRevenue: parseFloat(monthlyRevenue?.total) || 0,
      revenueChange: parseFloat(revenueChange)
    };
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    throw err;
  }
};

// Get Recent Bookings with User and Room Details
exports.getRecentBookings = async (limit = 10) => {
  try {
    return await knex('bookings')
      .select(
        'bookings.*',
        'users.username as user_name',
        'users.email as user_email',
        'rooms.room_type',
        'rooms.price_per_night',
        'hotels.name as hotel_name'
      )
      .leftJoin('users', 'bookings.user_id', 'users.id')
      .leftJoin('rooms', 'bookings.room_id', 'rooms.id')
      .leftJoin('hotels', 'rooms.hotel_id', 'hotels.id')
      .orderBy('bookings.created_at', 'desc')
      .limit(limit);
  } catch (err) {
    console.error('Error fetching recent bookings:', err);
    throw err;
  }
};

// Get Revenue by Month (Last 6 Months)
exports.getMonthlyRevenue = async () => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const data = await knex('bookings')
      .select(
        knex.raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
        knex.raw('SUM(total_price) as revenue'),
        knex.raw('COUNT(*) as booking_count')
      )
      .where('created_at', '>=', sixMonthsAgo)
      .whereIn('status', ['confirmed', 'completed'])
      .groupBy('month')
      .orderBy('month', 'asc');

    return data;
  } catch (err) {
    console.error('Error fetching monthly revenue:', err);
    throw err;
  }
};

// Get Top Hotels by Bookings
exports.getTopHotels = async (limit = 5) => {
  try {
    return await knex('hotels')
      .select(
        'hotels.id',
        'hotels.name',
        'hotels.location',
        'hotels.rating',
        knex.raw('COUNT(bookings.id) as booking_count'),
        knex.raw('SUM(bookings.total_price) as total_revenue')
      )
      .leftJoin('rooms', 'hotels.id', 'rooms.hotel_id')
      .leftJoin('bookings', 'rooms.id', 'bookings.room_id')
      .groupBy('hotels.id', 'hotels.name', 'hotels.location', 'hotels.rating')
      .orderBy('booking_count', 'desc')
      .limit(limit);
  } catch (err) {
    console.error('Error fetching top hotels:', err);
    throw err;
  }
};

// Get User Growth Data
exports.getUserGrowth = async () => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return await knex('users')
      .select(
        knex.raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
        knex.raw('COUNT(*) as new_users')
      )
      .where('created_at', '>=', sixMonthsAgo)
      .groupBy('month')
      .orderBy('month', 'asc');
  } catch (err) {
    console.error('Error fetching user growth:', err);
    throw err;
  }
};

// Get Booking Status Distribution
exports.getBookingStatusDistribution = async () => {
  try {
    return await knex('bookings')
      .select('status')
      .count('* as count')
      .groupBy('status');
  } catch (err) {
    console.error('Error fetching booking status distribution:', err);
    throw err;
  }
};

// Get All Users with Pagination
exports.getAllUsersWithPagination = async (page = 1, limit = 10, search = '') => {
  try {
    const offset = (page - 1) * limit;
    
    let query = knex('users')
      .select('id', 'username', 'email', 'role', 'created_at')
      .orderBy('created_at', 'desc');

    if (search) {
      query = query.where(function() {
        this.where('username', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`);
      });
    }

    const users = await query.limit(limit).offset(offset);
    const totalCount = await knex('users').count('* as count').first();

    return {
      users,
      total: parseInt(totalCount.count),
      page,
      totalPages: Math.ceil(parseInt(totalCount.count) / limit)
    };
  } catch (err) {
    console.error('Error fetching users with pagination:', err);
    throw err;
  }
};

// Get All Hotels with Room Count
exports.getAllHotelsWithRooms = async () => {
  try {
    return await knex('hotels')
      .select(
        'hotels.*',
        knex.raw('COUNT(rooms.id) as room_count'),
        knex.raw('SUM(CASE WHEN rooms.is_available = 1 THEN 1 ELSE 0 END) as available_rooms')
      )
      .leftJoin('rooms', 'hotels.id', 'rooms.hotel_id')
      .groupBy('hotels.id')
      .orderBy('hotels.created_at', 'desc');
  } catch (err) {
    console.error('Error fetching hotels with rooms:', err);
    throw err;
  }
};
