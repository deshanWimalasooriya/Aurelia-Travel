import { useState, useEffect } from 'react';
import api from '../../services/api';
import { DollarSign, Users, Building, Calendar, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './styles/super-overview.css';

const SuperOverview = () => {
    const [stats, setStats] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                // 1. Fetch Stats (uses adminController.getDashboardStats)
                const statsRes = await api.get('/admin/stats');
                if (statsRes.data.success) {
                    setStats(statsRes.data.stats);
                }

                // 2. Fetch Analytics (uses adminController.getAnalyticsData)
                const analyticsRes = await api.get('/admin/analytics');
                if (analyticsRes.data) {
                    // Backend returns { revenue: [...], ... }
                    setChartData(analyticsRes.data.revenue || []);
                }
            } catch (err) {
                console.error("Dashboard Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const getIcon = (label) => {
        if (label.includes('Bookings')) return <Calendar size={28}/>;
        if (label.includes('Volume') || label.includes('Commission')) return <DollarSign size={28}/>;
        if (label.includes('Hotels')) return <Building size={28}/>;
        return <Users size={28}/>;
    };

    const Card = ({ stat, index }) => (
        <div className="sa-stat-card">
            <div className="sa-stat-icon-wrapper" style={{ 
                background: index === 1 ? '#fecaca' : (index === 3 ? '#bbf7d0' : '#bfdbfe'), 
                color: index === 1 ? '#ef4444' : (index === 3 ? '#16a34a' : '#2563eb') 
            }}>
                {getIcon(stat.label)}
            </div>
            <div className="sa-stat-content">
                <p className="sa-stat-label">{stat.label}</p>
                <h3 className="sa-stat-value">{stat.value}</h3>
            </div>
        </div>
    );

    if (loading) return <div style={{padding:'40px', color:'#64748b'}}>Loading Dashboard...</div>;

    return (
        <div>
            <h1 className="sa-page-title">Platform Performance</h1>
            
            <div className="sa-stats-grid">
                {stats.map((stat, index) => (
                    <Card key={index} stat={stat} index={index} />
                ))}
            </div>

            <div className="sa-chart-section">
                <h3 className="sa-chart-title">Revenue Trends (6 Months)</h3>
                <div className="sa-chart-container" style={{ width: '100%', height: 300, minHeight: 300 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                        </AreaChart>
                     </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
export default SuperOverview;