// aurelia-travel-backend/API/controllers/adminController.js
const adminModel = require('../models/adminModel');

// Dashboard Overview Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await adminModel.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Recent Bookings
exports.getRecentBookings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const bookings = await adminModel.getRecentBookings(limit);
    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Revenue Chart Data
exports.getRevenueChart = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = await adminModel.getRevenueChart(days);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Top Hotels
exports.getTopHotels = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const hotels = await adminModel.getTopHotels(limit);
    res.json({ success: true, data: hotels });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// User Activity
exports.getUserActivity = async (req, res) => {
  try {
    const activity = await adminModel.getUserActivity();
    res.json({ success: true, data: activity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Booking Status Distribution
exports.getBookingStatus = async (req, res) => {
  try {
    const status = await adminModel.getBookingStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get All Users with Pagination
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await adminModel.getAllUsers(page, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update User Status/Role
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    await adminModel.updateUserStatus(userId, updates);
    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await adminModel.deleteUser(userId);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get All Bookings with Filters
exports.getAllBookings = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const filters = { status, startDate, endDate };
    const result = await adminModel.getAllBookingsWithFilters(
      filters,
      parseInt(page),
      parseInt(limit)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update Booking Status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    await adminModel.updateBookingStatus(bookingId, status);
    res.json({ success: true, message: 'Booking status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};