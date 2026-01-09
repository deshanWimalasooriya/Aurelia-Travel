// aurelia-travel-frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Calendar, 
  Hotel, UserCheck, Activity, Search, Filter, MoreVertical,
  Download, RefreshCw, ChevronLeft, ChevronRight, Eye, Edit, Trash2
} from 'lucide-react';
import './styles/AdminDashboard.css';

const API_URL = 'http://localhost:5000/api/admin';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Dashboard Data
  const [stats, setStats] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [topHotels, setTopHotels] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [userActivity, setUserActivity] = useState(null);
  const [bookingStatus, setBookingStatus] = useState([]);
  
  // Management Data
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch Dashboard Data
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab, currentPage]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, chartRes, hotelsRes, bookingsRes, activityRes, statusRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`, { withCredentials: true }),
        axios.get(`${API_URL}/dashboard/revenue-chart?days=7`, { withCredentials: true }),
        axios.get(`${API_URL}/dashboard/top-hotels`, { withCredentials: true }),
        axios.get(`${API_URL}/bookings/recent?limit=5`, { withCredentials: true }),
        axios.get(`${API_URL}/dashboard/user-activity`, { withCredentials: true }),
        axios.get(`${API_URL}/dashboard/booking-status`, { withCredentials: true })
      ]);
      
      setStats(statsRes.data.data);
      setRevenueChart(chartRes.data.data);
      setTopHotels(hotelsRes.data.data);
      setRecentBookings(bookingsRes.data.data);
      setUserActivity(activityRes.data.data);
      setBookingStatus(statusRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/users?page=${currentPage}&limit=10`, {
        withCredentials: true
      });
      setUsers(res.data.data.users);
      setTotalPages(res.data.data.totalPages);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const res = await axios.get(
        `${API_URL}/bookings?page=${currentPage}&limit=10${statusParam}`,
        { withCredentials: true }
      );
      setBookings(res.data.data.bookings);
      setTotalPages(res.data.data.totalPages);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${API_URL}/users/${userId}`, { withCredentials: true });
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/bookings/${bookingId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      fetchBookings();
    } catch (err) {
      console.error('Error updating booking:', err);
      alert('Failed to update booking status');
    }
  };

  if (loading && activeTab === 'dashboard') {
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo">🏨</div>
          <h2>Aurelia Admin</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={20} />
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <Calendar size={20} />
            <span>Bookings</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} />
            <span>Users</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'hotels' ? 'active' : ''}`}
            onClick={() => setActiveTab('hotels')}
          >
            <Hotel size={20} />
            <span>Hotels</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="page-title">
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <button className="refresh-btn" onClick={() => {
              if (activeTab === 'dashboard') fetchDashboardData();
              else if (activeTab === 'users') fetchUsers();
              else if (activeTab === 'bookings') fetchBookings();
            }}>
              <RefreshCw size={18} />
            </button>
          </div>
          <div className="top-bar-actions">
            <button className="export-btn">
              <Download size={18} />
              <span>Export</span>
            </button>
          </div>
        </header>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && stats && (
          <div className="dashboard-content">
            {/* Stats Grid */}
            <div className="stats-grid">
              <StatCard
                title="Total Revenue"
                value={`$${stats.revenue.toLocaleString()}`}
                change="+12.5%"
                trend="up"
                icon={<DollarSign />}
              />
              <StatCard
                title="Total Bookings"
                value={stats.bookings}
                change="+8.2%"
                trend="up"
                icon={<Calendar />}
              />
              <StatCard
                title="Active Users"
                value={stats.users}
                change="+5.1%"
                trend="up"
                icon={<Users />}
              />
              <StatCard
                title="Hotels Listed"
                value={stats.hotels}
                change="+2.3%"
                trend="up"
                icon={<Hotel />}
              />
            </div>

            {/* Charts & Tables */}
            <div className="content-grid">
              <div className="card large">
                <div className="card-header">
                  <h3>Revenue Overview (Last 7 Days)</h3>
                </div>
                <div className="chart-container">
                  <SimpleBarChart data={revenueChart} />
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>User Activity</h3>
                </div>
                {userActivity && (
                  <div className="activity-stats">
                    <div className="activity-item">
                      <span className="label">Total Users</span>
                      <span className="value">{userActivity.total}</span>
                    </div>
                    <div className="activity-item">
                      <span className="label">Active Users</span>
                      <span className="value success">{userActivity.active}</span>
                    </div>
                    <div className="activity-item">
                      <span className="label">Inactive Users</span>
                      <span className="value muted">{userActivity.inactive}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="card large">
                <div className="card-header">
                  <h3>Top Hotels by Revenue</h3>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Hotel</th>
                        <th>Location</th>
                        <th>Bookings</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topHotels.map(hotel => (
                        <tr key={hotel.id}>
                          <td>
                            <div className="hotel-cell">
                              <img src={hotel.image_url} alt={hotel.name} />
                              <span>{hotel.name}</span>
                            </div>
                          </td>
                          <td>{hotel.location}</td>
                          <td>{hotel.booking_count || 0}</td>
                          <td className="revenue">${(hotel.revenue || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Recent Bookings</h3>
                </div>
                <div className="booking-list">
                  {recentBookings.map(booking => (
                    <div key={booking.id} className="booking-item">
                      <div className="booking-info">
                        <strong>{booking.user_name}</strong>
                        <span className="booking-hotel">{booking.hotel_name}</span>
                      </div>
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Management View */}
        {activeTab === 'users' && (
          <div className="management-content">
            <div className="filters-bar">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="card">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(user => 
                      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <div className="avatar">{user.username.charAt(0)}</div>
                            <span>{user.username}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>{user.role}</span>
                        </td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="action-btn view" title="View">
                              <Eye size={16} />
                            </button>
                            <button className="action-btn edit" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button 
                              className="action-btn delete" 
                              title="Delete"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}

        {/* Bookings Management View */}
        {activeTab === 'bookings' && (
          <div className="management-content">
            <div className="filters-bar">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="status-filter"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="card">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Guest</th>
                      <th>Hotel</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => (
                      <tr key={booking.id}>
                        <td>#{booking.id}</td>
                        <td>{booking.user_name}</td>
                        <td>{booking.hotel_name}</td>
                        <td>{new Date(booking.check_in).toLocaleDateString()}</td>
                        <td>{new Date(booking.check_out).toLocaleDateString()}</td>
                        <td className="amount">${booking.total_price}</td>
                        <td>
                          <select
                            value={booking.status}
                            onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                            className={`status-select ${booking.status}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="action-btn view" title="View Details">
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, change, trend, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <span className="stat-label">{title}</span>
        <div className="stat-value-row">
          <h3 className="stat-value">{value}</h3>
          <span className={`stat-change ${trend}`}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {change}
          </span>
        </div>
      </div>
    </div>
  );
}

// Simple Bar Chart Component
function SimpleBarChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="no-data">No data available</div>;
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue || 0));

  return (
    <div className="bar-chart">
      {data.map((item, index) => {
        const height = ((item.revenue || 0) / maxRevenue) * 100;
        return (
          <div key={index} className="bar-item">
            <div className="bar-wrapper">
              <div className="bar" style={{ height: `${height}%` }}>
                <span className="bar-value">${(item.revenue || 0).toLocaleString()}</span>
              </div>
            </div>
            <span className="bar-label">
              {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft size={18} />
      </button>
      <span className="pagination-info">
        Page {currentPage} of {totalPages}
      </span>
      <button
        className="pagination-btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}