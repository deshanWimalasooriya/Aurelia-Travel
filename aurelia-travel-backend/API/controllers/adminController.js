const adminModel = require('../models/adminModel');

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await adminModel.getStats();
    
    // Format data for the Frontend
    const formattedStats = [
      { 
        label: 'Total Revenue', 
        value: `$${stats.revenue.toLocaleString()}`, 
        rawValue: stats.revenue,
        icon: '💰', 
        change: `${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}%`,
        trend: stats.revenueChange >= 0 ? 'up' : 'down',
        type: 'success'
      },
      { 
        label: 'Total Bookings', 
        value: stats.bookings, 
        icon: '📅', 
        change: `${stats.pendingBookings} Pending`,
        type: 'info'
      },
      { 
        label: 'Registered Users', 
        value: stats.users, 
        icon: '👤', 
        change: 'Active',
        type: 'primary'
      },
      { 
        label: 'Available Rooms', 
        value: stats.availableRooms, 
        icon: '🏨', 
        change: `${stats.hotels} Hotels`,
        type: 'warning'
      }
    ];

    res.json({
      success: true,
      data: formattedStats,
      raw: stats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get Recent Bookings
exports.getRecentBookings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const bookings = await adminModel.getRecentBookings(limit);
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get Monthly Revenue Chart Data
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const data = await adminModel.getMonthlyRevenue();
    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get Top Hotels
exports.getTopHotels = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const hotels = await adminModel.getTopHotels(limit);
    
    res.json({
      success: true,
      data: hotels
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get User Growth Data
exports.getUserGrowth = async (req, res) => {
  try {
    const data = await adminModel.getUserGrowth();
    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get Booking Status Distribution
exports.getBookingStatusDistribution = async (req, res) => {
  try {
    const data = await adminModel.getBookingStatusDistribution();
    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get All Users with Pagination
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const result = await adminModel.getAllUsersWithPagination(page, limit, search);
    
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get All Hotels with Room Count
exports.getAllHotels = async (req, res) => {
  try {
    const hotels = await adminModel.getAllHotelsWithRooms();
    
    res.json({
      success: true,
      data: hotels
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Update Booking Status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await require('../models/bookingModel').updateBooking(id, { status });
    
    res.json({
      success: true,
      message: 'Booking status updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};
