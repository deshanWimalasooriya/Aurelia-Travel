import { useState, useEffect } from 'react';
import api from '../../services/api';
import { DollarSign, Users, Building, Calendar } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import './styles/super-overview.css';

const SuperOverview = () => {
    const [stats, setStats] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const statsRes = await api.get('/admin/stats');
                if (statsRes.data.success) {
                    setStats(statsRes.data.stats);
                }

                const analyticsRes = await api.get('/admin/analytics');
                if (analyticsRes.data) {
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
        if (label.includes('Bookings')) return <Calendar size={24}/>;
        if (label.includes('Volume') || label.includes('Commission')) return <DollarSign size={24}/>;
        if (label.includes('Hotels')) return <Building size={24}/>;
        return <Users size={24}/>;
    };

    // Helper to determine card colors based on index or content
    const getCardColor = (index) => {
        const colors = [
            { bg: '#e0e7ff', text: '#4f46e5' }, // Indigo
            { bg: '#fee2e2', text: '#ef4444' }, // Red
            { bg: '#dbeafe', text: '#2563eb' }, // Blue
            { bg: '#dcfce7', text: '#16a34a' }  // Green
        ];
        return colors[index % colors.length];
    };

    if (loading) return (
        <div style={{ padding:'40px', display:'flex', justifyContent:'center', color:'#94a3b8' }}>
            Loading Dashboard...
        </div>
    );

    return (
        <div>
            <div style={{ marginBottom: '30px' }}>
                <h1 className="sa-page-title">Dashboard Overview</h1>
                <p className="sa-page-subtitle">Welcome back, Super Admin. Here's what's happening today.</p>
            </div>
            
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
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    borderRadius: '12px', 
                                    border: 'none', 
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                    padding: '12px 16px'
                                }}
                                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#f43f5e" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }}
                            />
                        </AreaChart>
                     </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default SuperOverview;