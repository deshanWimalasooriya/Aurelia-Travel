import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext'; // ✅ Import Hook
import { DollarSign, Users, Building, Calendar, Bell } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import './styles/super-overview.css';

const SuperOverview = () => {
    const [stats, setStats] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // ✅ Get real-time notifications from Context
    const { notifications } = useNotifications();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const statsRes = await api.get('/admin/stats');
                if (statsRes.data.success) setStats(statsRes.data.stats);

                const analyticsRes = await api.get('/admin/analytics');
                if (analyticsRes.data) setChartData(analyticsRes.data.revenue || []);
            } catch (err) {
                console.error("Dashboard Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const getIcon = (label) => {
        if (label.includes('Bookings')) return <Calendar size={24}/>;
        if (label.includes('Volume') || label.includes('Commission')) return <DollarSign size={24}/>;
        if (label.includes('Hotels')) return <Building size={24}/>;
        return <Users size={24}/>;
    };

    const getCardColor = (index) => {
        const colors = [{ bg: '#e0e7ff', text: '#4f46e5' }, { bg: '#fee2e2', text: '#ef4444' }, { bg: '#dbeafe', text: '#2563eb' }, { bg: '#dcfce7', text: '#16a34a' }];
        return colors[index % colors.length];
    };

    return (
        <div>
            {/* Header omitted (handled by Layout now) */}
            
            <div className="sa-overview-grid">
                {/* LEFT COLUMN: Stats & Charts */}
                <div className="sa-main-column">
                    {/* Stats Cards */}
                    <div className="sa-stats-grid">
                        {stats.map((stat, index) => {
                            const style = getCardColor(index);
                            return (
                                <div key={index} className="sa-stat-card">
                                    <div className="sa-stat-icon-wrapper" style={{ background: style.bg, color: style.text }}>
                                        {getIcon(stat.label)}
                                    </div>
                                    <div className="sa-stat-content">
                                        <p className="sa-stat-label">{stat.label}</p>
                                        <h3 className="sa-stat-value">{stat.value}</h3>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Chart */}
                    <div className="sa-chart-section">
                        <div className="sa-chart-header">
                            <h3 className="sa-chart-title">Revenue Analytics</h3>
                            <span className="sa-chart-badge">Last 6 Months</span>
                        </div>
                        <div className="sa-chart-container" style={{ height: 350 }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', padding: '12px 16px' }} />
                                    <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                             </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Notifications Feed */}
                <div className="sa-side-column">
                    <div className="sa-feed-card">
                        <div className="sa-feed-header">
                            <h3><Bell size={18}/> Recent Alerts</h3>
                        </div>
                        <div className="sa-feed-list">
                            {notifications.length === 0 ? (
                                <p className="sa-empty-feed">No recent alerts.</p>
                            ) : (
                                notifications.slice(0, 6).map((notif) => (
                                    <div key={notif.id} className={`sa-feed-item ${!notif.is_read ? 'unread' : ''}`}>
                                        <div className={`sa-feed-dot ${notif.type}`}></div>
                                        <div>
                                            <div className="sa-feed-title">{notif.title}</div>
                                            <div className="sa-feed-msg">{notif.message}</div>
                                            <div className="sa-feed-time">{new Date(notif.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperOverview;