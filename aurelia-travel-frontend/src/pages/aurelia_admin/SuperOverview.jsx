import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext'; 
import { DollarSign, Users, Building, Calendar, Bell } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import './styles/super-overview.css';

const SuperOverview = () => {
    const [stats, setStats] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Get real-time notifications from Context
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
        const colors = [
            { bg: '#eff6ff', text: 'var(--color-primary)' }, 
            { bg: '#fffbeb', text: 'var(--color-accent)' }, 
            { bg: '#f1f5f9', text: 'var(--color-dark)' }, 
            { bg: '#ecfdf5', text: '#10b981' }
        ];
        return colors[index % colors.length];
    };

    if (loading) {
        return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Overview...</div>;
    }

    return (
        <div>
            <div className="sa-header-row" style={{marginBottom: '20px'}}>
                <div>
                    <h1 className="sa-page-title" style={{marginBottom: 0}}>Dashboard Overview</h1>
                    <p className="sa-page-subtitle" style={{marginTop: '4px'}}>Real-time platform metrics and alerts</p>
                </div>
            </div>
            
            <div className="sa-overview-grid">
                {/* LEFT COLUMN: Stats & Charts */}
                <div className="sa-main-column" style={{ minWidth: 0 }}>
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
                        <div className="sa-chart-container" style={{ height: 350, minWidth: 0 }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', background: 'var(--color-dark)', color: 'white' }} 
                                        itemStyle={{ color: 'white' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
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
                                notifications.slice(0, 8).map((notif) => (
                                    <div key={notif.id} className={`sa-feed-item ${!notif.is_read ? 'unread' : ''}`}>
                                        <div className={`sa-feed-dot ${notif.type}`}></div>
                                        <div>
                                            <div className="sa-feed-title">{notif.title}</div>
                                            <div className="sa-feed-msg">{notif.message}</div>
                                            <div className="sa-feed-time">{new Date(notif.created_at).toLocaleString()}</div>
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