import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, TrendingDown, DollarSign, Users, 
    ShoppingCart, Hotel, Download, Filter, Eye, Edit, Trash2 
} from 'lucide-react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import '../styles/masterAdmin.css';

const MasterDashboardOverview = () => {
    const [stats, setStats] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);
    const [analyticsData, setAnalyticsData] = useState({
        revenue_chart: [],
        status_breakdown: [],
        top_hotels: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [statsRes, bookingsRes, analyticsRes] = await Promise.all([
                adminAPI.getStats(),
                adminAPI.getRecentBookings(10),
                adminAPI.getAnalytics()
            ]);

            setStats(statsRes.data.stats);
            setRecentBookings(bookingsRes.data.data);
            setAnalyticsData(analyticsRes.data);
        } catch (err) {
            toast.error('Failed to fetch dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#667eea', '#11998e', '#f093fb', '#4facfe'];

    if (loading) {
        return <div className="loading-container">Loading dashboard...</div>;
    }

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="content-header">
                <div className="content-header-top">
                    <div className="content-title">
                        <h1>Master Dashboard</h1>
                        <p>Welcome back! Here's what's happening with Aurelia Travel.</p>
                    </div>
                    <div className="header-actions">
                        <button className="action-btn" onClick={fetchAllData}>
                            <Filter size={18} /> Refresh
                        </button>
                        <button className="action-btn primary">
                            <Download size={18} /> Export Report
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
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
                            <div className="icon-box">{stat.icon}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <TrendingUp size={16} color="#16a34a" />
                                <span style={{ color: '#16a34a', fontWeight: 600 }}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                        <div className="kpi-value">{stat.value}</div>
                        <div className="kpi-label">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginTop: 32 }}>
                {/* Revenue Chart */}
                <div className="table-card" style={{ padding: 24 }}>
                    <h3 style={{ marginBottom: 20 }}>Revenue Trend</h3>
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

                {/* Booking Status */}
                <div className="table-card" style={{ padding: 24 }}>
                    <h3 style={{ marginBottom: 20 }}>Booking Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analyticsData.status_breakdown}
                                cx="50%"
                                cy="50%"
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

            {/* Recent Bookings Table */}
            <div className="data-table-container" style={{ marginTop: 32 }}>
                <div className="table-header">
                    <h2>Recent Bookings</h2>
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
                        {recentBookings.map((booking) => (
                            <tr key={booking.id}>
                                <td><strong>{booking.booking_reference}</strong></td>
                                <td>{booking.guest}</td>
                                <td>{booking.hotel}</td>
                                <td>{new Date(booking.check_in).toLocaleDateString()}</td>
                                <td><strong>${booking.total_price}</strong></td>
                                <td>
                                    <span className={`status-badge ${booking.status}`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="table-actions">
                                        <button className="table-action-btn">
                                            <Eye size={16} />
                                        </button>
                                    </div>
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
