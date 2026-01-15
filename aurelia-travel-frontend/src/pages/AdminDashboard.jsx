import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Hotel, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Menu,
  X,
  Search,
  ChevronDown,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import axios from 'axios';
import './styles/AdminDashboard.css';

const AdminDashboard = () => {
  // State Management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dashboard Data
  const [stats, setStats] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [topHotels, setTopHotels] = useState([]);
  const [bookingStatusDist, setBookingStatusDist] = useState([]);
  
  // Management Data
  const [users, setUsers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE = 'http://localhost:5000/api/admin';

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, bookingsRes, revenueRes, hotelsRes, statusRes] = await Promise.all([
        axios.get(`${API_BASE}/stats`, { withCredentials: true }),
        axios.get(`${API_BASE}/bookings?limit=5`, { withCredentials: true }),
        axios.get(`${API_BASE}/revenue/monthly`, { withCredentials: true }),
        axios.get(`${API_BASE}/hotels/top?limit=5`, { withCredentials: true }),
        axios.get(`${API_BASE}/bookings/status-distribution`, { withCredentials: true })
      ]);

      setStats(statsRes.data.data || []);
      setRecentBookings(bookingsRes.data.data || []);
      setMonthlyRevenue(revenueRes.data.data || []);
      setTopHotels(hotelsRes.data.data || []);
      setBookingStatusDist(statusRes.data.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch Users
  const fetchUsers = async (page = 1, search = '') => {
    try {
      const res = await axios.get(`${API_BASE}/users?page=${page}&limit=10&search=${search}`, {
        withCredentials: true
      });
      setUsers(res.data.users || []);
      setUserPagination({
        page: res.data.page,
        totalPages: res.data.totalPages
      });
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Fetch Hotels
  const fetchHotels = async () => {
    try {
      const res = await axios.get(`${API_BASE}/hotels`, { withCredentials: true });
      setHotels(res.data.data || []);
    } catch (err) {
      console.error('Error fetching hotels:', err);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1, searchTerm);
    } else if (activeTab === 'hotels') {
      fetchHotels();
    }
  }, [activeTab]);

  // Handle Search
  const handleSearch = (e) => {
    e.preventDefault();
    if (activeTab === 'users') {
      fetchUsers(1, searchTerm);
    }
  };

  // Update Booking Status
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE}/bookings/${bookingId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      fetchDashboardData(); // Refresh data
      alert('Booking status updated successfully!');
    } catch (err) {
      console.error('Error updating booking status:', err);
      alert('Failed to update booking status');
    }
  };

  // Get Status Badge Style
  const getStatusBadge = (status) => {
    const badges = {
      confirmed: { class: 'badge-success', icon: <CheckCircle size={14} /> },
      pending: { class: 'badge-warning', icon: <Clock size={14} /> },
      cancelled: { class: 'badge-danger', icon: <XCircle size={14} /> },
      completed: { class: 'badge-info', icon: <CheckCircle size={14} /> }
    };
    return badges[status] || badges.pending;
  };

  // Format Currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format Date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <RefreshCw className="animate-spin" size={48} />
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <LayoutDashboard size={28} />
            {sidebarOpen && <h2>Admin Panel</h2>}
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={20} />
            {sidebarOpen && <span>Dashboard</span>}
          </button>

          <button
            className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <Calendar size={20} />
            {sidebarOpen && <span>Bookings</span>}
          </button>

          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} />
            {sidebarOpen && <span>Users</span>}
          </button>

          <button
            className={`nav-item ${activeTab === 'hotels' ? 'active' : ''}`}
            onClick={() => setActiveTab('hotels')}
          >
            <Hotel size={20} />
            {sidebarOpen && <span>Hotels</span>}
          </button>

          <button
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <PieChart size={20} />
            {sidebarOpen && <span>Analytics</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Bar */}
        <div className="admin-topbar">
          <div className="topbar-left">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="page-title">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
          </div>

          <div className="topbar-right">
            <button
              className="refresh-btn"
              onClick={fetchDashboardData}
              disabled={refreshing}
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="admin-content">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="stats-grid">
                {stats.map((stat, index) => (
                  <div key={index} className={`stat-card ${stat.type}`}>
                    <div className="stat-content">
                      <div className="stat-info">
                        <p className="stat-label">{stat.label}</p>
                        <h3 className="stat-value">{stat.value}</h3>
                        <div className="stat-change">
                          {stat.trend === 'up' && <ArrowUpRight size={16} className="trend-up" />}
                          {stat.trend === 'down' && <ArrowDownRight size={16} className="trend-down" />}
                          <span className={stat.trend === 'up' ? 'positive' : stat.trend === 'down' ? 'negative' : ''}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className="stat-icon">{stat.icon}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="dashboard-grid">
                {/* Recent Bookings */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3>Recent Bookings</h3>
                    <button className="btn-icon">
                      <Download size={18} />
                    </button>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Guest</th>
                          <th>Hotel</th>
                          <th>Check-in</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentBookings.map((booking) => {
                          const badge = getStatusBadge(booking.status);
                          return (
                            <tr key={booking.id}>
                              <td className="booking-id">#{booking.id}</td>
                              <td>
                                <div className="user-info">
                                  <strong>{booking.user_name}</strong>
                                  <small>{booking.user_email}</small>
                                </div>
                              </td>
                              <td>{booking.hotel_name}</td>
                              <td>{formatDate(booking.check_in)}</td>
                              <td className="amount">{formatCurrency(booking.total_price)}</td>
                              <td>
                                <span className={`badge ${badge.class}`}>
                                  {badge.icon}
                                  {booking.status}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button className="btn-icon" title="View">
                                    <Eye size={16} />
                                  </button>
                                  <select
                                    className="status-select"
                                    value={booking.status}
                                    onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Hotels */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <h3>Top Performing Hotels</h3>
                  </div>
                  <div className="top-hotels-list">
                    {topHotels.map((hotel, index) => (
                      <div key={hotel.id} className="hotel-item">
                        <div className="hotel-rank">#{index + 1}</div>
                        <div className="hotel-details">
                          <h4>{hotel.name}</h4>
                          <p className="hotel-location">{hotel.location}</p>
                          <div className="hotel-stats">
                            <span>{hotel.booking_count} Bookings</span>
                            <span>{formatCurrency(hotel.total_revenue || 0)}</span>
                          </div>
                        </div>
                        <div className="hotel-rating">⭐ {hotel.rating}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="dashboard-card full-width">
              <div className="card-header">
                <h3>All Bookings</h3>
                <div className="header-actions">
                  <button className="btn-secondary">
                    <Filter size={18} />
                    Filter
                  </button>
                  <button className="btn-secondary">
                    <Download size={18} />
                    Export
                  </button>
                </div>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Guest</th>
                      <th>Hotel</th>
                      <th>Room Type</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => {
                      const badge = getStatusBadge(booking.status);
                      return (
                        <tr key={booking.id}>
                          <td>#{booking.id}</td>
                          <td>{booking.user_name}</td>
                          <td>{booking.hotel_name}</td>
                          <td>{booking.room_type}</td>
                          <td>{formatDate(booking.check_in)}</td>
                          <td>{formatDate(booking.check_out)}</td>
                          <td>{formatCurrency(booking.total_price)}</td>
                          <td>
                            <span className={`badge ${badge.class}`}>
                              {badge.icon}
                              {booking.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-icon" title="View">
                                <Eye size={16} />
                              </button>
                              <button className="btn-icon" title="Edit">
                                <Edit size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="dashboard-card full-width">
              <div className="card-header">
                <h3>User Management</h3>
                <form onSubmit={handleSearch} className="search-form">
                  <div className="search-input-group">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-primary">Search</button>
                </form>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>#{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{formatDate(user.created_at)}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-icon" title="View">
                              <Eye size={16} />
                            </button>
                            <button className="btn-icon" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button className="btn-icon danger" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="pagination">
                <button
                  disabled={userPagination.page === 1}
                  onClick={() => fetchUsers(userPagination.page - 1, searchTerm)}
                >
                  Previous
                </button>
                <span>Page {userPagination.page} of {userPagination.totalPages}</span>
                <button
                  disabled={userPagination.page === userPagination.totalPages}
                  onClick={() => fetchUsers(userPagination.page + 1, searchTerm)}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Hotels Tab */}
          {activeTab === 'hotels' && (
            <div className="dashboard-card full-width">
              <div className="card-header">
                <h3>Hotel Management</h3>
                <button className="btn-primary">Add New Hotel</button>
              </div>
              <div className="hotels-grid">
                {hotels.map((hotel) => (
                  <div key={hotel.id} className="hotel-card">
                    <img src={hotel.image || 'https://via.placeholder.com/400x250'} alt={hotel.name} />
                    <div className="hotel-card-content">
                      <h4>{hotel.name}</h4>
                      <p className="location">{hotel.location}</p>
                      <div className="hotel-meta">
                        <span>⭐ {hotel.rating}</span>
                        <span>{hotel.room_count} Rooms</span>
                        <span className="available">{hotel.available_rooms} Available</span>
                      </div>
                      <div className="hotel-actions">
                        <button className="btn-secondary">
                          <Eye size={16} />
                          View
                        </button>
                        <button className="btn-secondary">
                          <Edit size={16} />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="analytics-section">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Revenue Trends (Last 6 Months)</h3>
                </div>
                <div className="chart-placeholder">
                  <BarChart3 size={48} />
                  <p>Chart visualization showing monthly revenue</p>
                  {monthlyRevenue.map((item) => (
                    <div key={item.month}>
                      {item.month}: {formatCurrency(item.revenue)} ({item.booking_count} bookings)
                    </div>
                  ))}
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Booking Status Distribution</h3>
                </div>
                <div className="chart-placeholder">
                  <PieChart size={48} />
                  {bookingStatusDist.map((item) => (
                    <div key={item.status}>
                      {item.status}: {item.count}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
