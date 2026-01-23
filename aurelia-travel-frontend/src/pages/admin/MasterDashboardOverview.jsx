import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  ShoppingCart, Hotel, ArrowUpRight, Download,
  Calendar, Filter
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import './styles/masterAdmin.css';

const MasterDashboardOverview = () => {
  const [stats, setStats] = useState([
    {
      id: 1,
      title: 'Total Revenue',
      value: '$284,592',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 2,
      title: 'Total Bookings',
      value: '1,847',
      change: '+8.2%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
    },
    {
      id: 3,
      title: 'Active Users',
      value: '12,458',
      change: '+15.3%',
      trend: 'up',
      icon: Users,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 4,
      title: 'Active Hotels',
      value: '342',
      change: '-2.1%',
      trend: 'down',
      icon: Hotel,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ]);

  const revenueData = [
    { month: 'Jan', revenue: 45000, bookings: 320 },
    { month: 'Feb', revenue: 52000, bookings: 380 },
    { month: 'Mar', revenue: 61000, bookings: 420 },
    { month: 'Apr', revenue: 58000, bookings: 390 },
    { month: 'May', revenue: 72000, bookings: 480 },
    { month: 'Jun', revenue: 85000, bookings: 540 },
  ];

  const bookingStatus = [
    { name: 'Confirmed', value: 68, color: '#38ef7d' },
    { name: 'Pending', value: 22, color: '#f093fb' },
    { name: 'Cancelled', value: 10, color: '#ee0979' },
  ];

  const recentBookings = [
    { id: 'BKG-2026-001', guest: 'John Doe', hotel: 'Sunset Resort', date: '2026-01-25', amount: '$450', status: 'confirmed' },
    { id: 'BKG-2026-002', guest: 'Sarah Smith', hotel: 'Ocean View', date: '2026-01-26', amount: '$680', status: 'pending' },
    { id: 'BKG-2026-003', guest: 'Mike Johnson', hotel: 'Mountain Lodge', date: '2026-01-27', amount: '$320', status: 'confirmed' },
    { id: 'BKG-2026-004', guest: 'Emma Wilson', hotel: 'City Center', date: '2026-01-28', amount: '$890', status: 'completed' },
    { id: 'BKG-2026-005', guest: 'David Brown', hotel: 'Beach Paradise', date: '2026-01-29', amount: '$550', status: 'cancelled' },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="content-header">
        <div className="content-header-top">
          <div className="content-title">
            <h1>Master Dashboard</h1>
            <p>Welcome back, Admin! Here's what's happening today.</p>
          </div>
          <div className="header-actions">
            <button className="action-btn">
              <Calendar size={18} />
              Last 30 Days
            </button>
            <button className="action-btn primary">
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              className="stat-card fade-in"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="stat-card-header">
                <div className="stat-icon" style={{ background: stat.color }}>
                  <Icon size={28} color="white" />
                </div>
                <div className={`stat-trend ${stat.trend}`}>
                  {stat.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {stat.change}
                </div>
              </div>
              <div className="stat-content">
                <h3>{stat.title}</h3>
                <p className="stat-value">{stat.value}</p>
              </div>
              <div className="stat-footer">
                Compared to last month
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Revenue Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Revenue Overview</h3>
            <p>Monthly revenue and booking trends</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }} 
              />
              <Area type="monotone" dataKey="revenue" stroke="#667eea" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Pie Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Booking Status</h3>
            <p>Distribution by status</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={bookingStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {bookingStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="data-table-container">
        <div className="table-header">
          <h2>Recent Bookings</h2>
          <div className="table-filters">
            <input 
              type="text" 
              placeholder="Search bookings..." 
              className="filter-input"
            />
            <button className="action-btn">
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Guest Name</th>
              <th>Hotel</th>
              <th>Check-in Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentBookings.map((booking, index) => (
              <motion.tr
                key={booking.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <td><strong>{booking.id}</strong></td>
                <td>{booking.guest}</td>
                <td>{booking.hotel}</td>
                <td>{booking.date}</td>
                <td><strong>{booking.amount}</strong></td>
                <td>
                  <span className={`status-badge ${booking.status}`}>
                    {booking.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="table-action-btn">View</button>
                    <button className="table-action-btn">Edit</button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterDashboardOverview;
