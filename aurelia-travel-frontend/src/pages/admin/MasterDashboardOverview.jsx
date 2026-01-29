import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Download, Filter, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { adminAPI } from '../../services/api'; // Import from your api.js
import toast from 'react-hot-toast';
import '../styles/masterAdmin.css';

const MasterDashboardOverview = () => {
  const [stats, setStats] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({ revenue_chart: [], status_breakdown: [] });
  const [loading, setLoading] = useState(true);

  const COLORS = ['#667eea', '#11998e', '#f093fb', '#4facfe'];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [statsRes, bookingsRes, analyticsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRecentBookings(10),
        adminAPI.getAnalytics()
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (bookingsRes.data.success) setRecentBookings(bookingsRes.data.data);
      if (analyticsRes.data.success) setAnalyticsData(analyticsRes.data);

    } catch (err) {
      console.error("Dashboard Error:", err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-container">Loading Dashboard...</div>;

  return (
    <div className="fade-in">
      {/* --- HEADER --- */}
      <div className="content-header">
        <div className="content-header-top">
          <div className="content-title">
            <h1>Master Dashboard</h1>
            <p>Real-time overview of platform performance.</p>
          </div>
          <div className="header-actions">
            <button className="action-btn" onClick={fetchAllData}><Filter size={18} /> Refresh</button>
            <button className="action-btn primary"><Download size={18} /> Export</button>
          </div>
        </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="kpi-grid">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            className="kpi-card"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
          >
            <div className="kpi-header">
              <div className="icon-box" style={{fontSize: '1.5rem'}}>{stat.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <TrendingUp size={16} color="#16a34a" />
                <span style={{ color: '#16a34a', fontWeight: 600 }}>{stat.change}</span>
              </div>
            </div>
            <div className="kpi-value">{stat.value}</div>
            <div className="kpi-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* --- CHARTS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginTop: 32 }}>
        {/* Revenue Line Chart */}
        <div className="table-card" style={{ padding: 24 }}>
          <h3>Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.revenue_chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#667eea" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie Chart */}
        <div className="table-card" style={{ padding: 24 }}>
          <h3>Booking Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie 
                data={analyticsData.status_breakdown} 
                cx="50%" cy="50%" 
                outerRadius={80} 
                dataKey="count"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {analyticsData.status_breakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- RECENT BOOKINGS TABLE --- */}
      <div className="data-table-container" style={{ marginTop: 32 }}>
        <div className="table-header"><h2>Recent Activity</h2></div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ref #</th>
              <th>Guest</th>
              <th>Hotel</th>
              <th>Check-in</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentBookings.map((booking) => (
              <tr key={booking.id}>
                <td><strong>{booking.booking_reference}</strong></td>
                <td>
                  <div>{booking.guest}</div>
                  <small style={{color:'#64748b'}}>{booking.guest_email}</small>
                </td>
                <td>{booking.hotel}</td>
                <td>{new Date(booking.check_in).toLocaleDateString()}</td>
                <td><strong>${booking.total_price}</strong></td>
                <td>
                  <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterDashboardOverview;