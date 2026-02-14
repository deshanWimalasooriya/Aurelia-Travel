import { useState, useEffect } from 'react';
import platformService from '../../services/platformService';
import { DollarSign, Users, Building } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './styles/super-overview.css';

const SuperOverview = () => {
    const [stats, setStats] = useState({ totalRevenue: 0, totalUsers: 0, totalHotels: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await platformService.getOverview();
                if(data.success) setStats(data.stats);
            } catch (err) { 
                console.error("Failed to fetch overview:", err); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchData();
    }, []);

    const Card = ({ title, value, icon, color }) => (
        <div className="sa-stat-card">
            <div className="sa-stat-icon-wrapper" style={{ background: `${color}20`, color: color }}>
                {icon}
            </div>
            <div className="sa-stat-content">
                <p className="sa-stat-label">{title}</p>
                <h3 className="sa-stat-value">{value}</h3>
            </div>
        </div>
    );

    if (loading) return <div style={{padding: '40px', color: '#64748b'}}>Loading Dashboard...</div>;

    return (
        <div>
            <h1 className="sa-page-title">Platform Performance</h1>
            
            <div className="sa-stats-grid">
                <Card 
                    title="Platform Revenue (5%)" 
                    value={`$${Number(stats.totalRevenue || 0).toLocaleString()}`} 
                    icon={<DollarSign size={28}/>} 
                    color="#f43f5e" 
                />
                <Card 
                    title="Registered Hotels" 
                    value={stats.totalHotels || 0} 
                    icon={<Building size={28}/>} 
                    color="#3b82f6" 
                />
                <Card 
                    title="Total Travelers" 
                    value={Number(stats.totalUsers || 0).toLocaleString()} 
                    icon={<Users size={28}/>} 
                    color="#10b981" 
                />
            </div>

            <div className="sa-chart-section">
                <h3 className="sa-chart-title">Revenue Growth</h3>
                
                {/* FIX: Added inline style to guarantee height for Recharts */}
                <div className="sa-chart-container" style={{ width: '100%', height: 300, minHeight: 300 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                            {name: 'Jan', val: 4000}, 
                            {name: 'Feb', val: 3000}, 
                            {name: 'Mar', val: 5000},
                            {name: 'Apr', val: 2780},
                            {name: 'May', val: 1890},
                            {name: 'Jun', val: 2390},
                        ]}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="val" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                        </AreaChart>
                     </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
export default SuperOverview;