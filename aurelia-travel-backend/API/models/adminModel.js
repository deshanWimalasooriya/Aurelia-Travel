// aurelia-travel-backend/API/models/adminModel.js
const knex = require('../../config/knex');

// Dashboard Statistics
exports.getStats = async () => {
  const bookings = await knex('bookings').count('* as count').first();
  const revenue = await knex('bookings').sum('total_price as total').first();
  const users = await knex('users').count('* as count').first();
  const hotels = await knex('hotels').count('* as count').first();
  const rooms = await knex('rooms').count('* as count').first();
  
  // Recent growth (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentBookings = await knex('bookings')
    .where('created_at', '>=', thirtyDaysAgo)
    .count('* as count').first();
  
  const recentRevenue = await knex('bookings')
    .where('created_at', '>=', thirtyDaysAgo)
    .sum('total_price as total').first();
  
  return {
    bookings: bookings.count,
    revenue: revenue.total || 0,
    users: users.count,
    hotels: hotels.count,
    rooms: rooms.count,
    recentBookings: recentBookings.count,
    recentRevenue: recentRevenue.total || 0
  };
};

// Recent Bookings with Details
exports.getRecentBookings = async (limit = 10) => {
  return await knex('bookings')
    .select(
      'bookings.*',
      'users.username as user_name',
      'users.email as user_email',
      'rooms.room_type',
      'hotels.name as hotel_name'
    )
    .leftJoin('users', 'bookings.user_id', 'users.id')
    .leftJoin('rooms', 'bookings.room_id', 'rooms.id')
    .leftJoin('hotels', 'rooms.hotel_id', 'hotels.id')
    .orderBy('bookings.created_at', 'desc')
    .limit(limit);
};

// Revenue Analytics (Last 7 days)
exports.getRevenueChart = async (days = 7) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await knex('bookings')
    .select(knex.raw('DATE(created_at) as date'))
    .sum('total_price as revenue')
    .count('* as bookings')
    .where('created_at', '>=', startDate)
    .groupBy(knex.raw('DATE(created_at)'))
    .orderBy('date', 'asc');
};

// Top Hotels by Revenue
exports.getTopHotels = async (limit = 5) => {
  return await knex('hotels')
    .select(
      'hotels.id',
      'hotels.name',
      'hotels.location',
      'hotels.image_url'
    )
    .sum('bookings.total_price as revenue')
    .count('bookings.id as booking_count')
    .leftJoin('rooms', 'hotels.id', 'rooms.hotel_id')
    .leftJoin('bookings', 'rooms.id', 'bookings.room_id')
    .groupBy('hotels.id')
    .orderBy('revenue', 'desc')
    .limit(limit);
};

// User Activity Analytics
exports.getUserActivity = async () => {
  const totalUsers = await knex('users').count('* as count').first();
  const activeUsers = await knex('users')
    .distinct('users.id')
    .leftJoin('bookings', 'users.id', 'bookings.user_id')
    .whereNotNull('bookings.id')
    .count('* as count').first();
  
  return {
    total: totalUsers.count,
    active: activeUsers.count,
    inactive: totalUsers.count - activeUsers.count
  };
};

// Booking Status Distribution
exports.getBookingStatus = async () => {
  return await knex('bookings')
    .select('status')
    .count('* as count')
    .groupBy('status');
};

// All Users with Pagination
exports.getAllUsers = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  const users = await knex('users')
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
  
  const total = await knex('users').count('* as count').first();
  
  return {
    users,
    total: total.count,
    page,
    totalPages: Math.ceil(total.count / limit)
  };
};

// Update User Role/Status
exports.updateUserStatus = async (userId, updates) => {
  return await knex('users')
    .where({ id: userId })
    .update(updates);
};

// Delete User
exports.deleteUser = async (userId) => {
  return await knex('users')
    .where({ id: userId })
    .del();
};

// All Bookings with Filters
exports.getAllBookingsWithFilters = async (filters = {}, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  let query = knex('bookings')
    .select(
      'bookings.*',
      'users.username as user_name',
      'rooms.room_type',
      'hotels.name as hotel_name'
    )
    .leftJoin('users', 'bookings.user_id', 'users.id')
    .leftJoin('rooms', 'bookings.room_id', 'rooms.id')
    .leftJoin('hotels', 'rooms.hotel_id', 'hotels.id');
  
  if (filters.status) {
    query = query.where('bookings.status', filters.status);
  }
  
  if (filters.startDate) {
    query = query.where('bookings.check_in', '>=', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.where('bookings.check_out', '<=', filters.endDate);
  }
  
  const bookings = await query
    .orderBy('bookings.created_at', 'desc')
    .limit(limit)
    .offset(offset);
  
  const total = await knex('bookings').count('* as count').first();
  
  return {
    bookings,
    total: total.count,
    page,
    totalPages: Math.ceil(total.count / limit)
  };
};

// Update Booking Status
exports.updateBookingStatus = async (bookingId, status) => {
  return await knex('bookings')
    .where({ id: bookingId })
    .update({ status, updated_at: knex.fn.now() });
};