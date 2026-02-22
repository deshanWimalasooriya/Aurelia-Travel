import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  DollarSign, Users, BedDouble, CalendarCheck, TrendingUp, TrendingDown 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './styles/dashboard-overview.css';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    kpi: { 
      revenue: { value: 0, trend: 0 }, 
      bookings: { value: 0, trend: 0 }, 
      occupancy: { value: 0, trend: 0 }, 
      guests: { value: 0, trend: 0 } 
    },
    chart: []
  });

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/finance/overview', {
          withCredentials: true,
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.data.success) {
            setStats(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch overview:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (loading) return <div className="loading-state">Loading Overview...</div>;

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants}>
      <div className="overview-header">
        <h1 className="page-title">Performance Overview</h1>
      </div>
      
      {/* KPI GRID */}
      <div className="kpi-grid">
        <KPICard 
            title="Revenue (Month)" 
            value={`$${stats.kpi.revenue.value.toLocaleString()}`} 
            icon={<DollarSign size={24}/>} 
            color="primary" 
            trend={`${stats.kpi.revenue.trend > 0 ? '+' : ''}${stats.kpi.revenue.trend}% vs last month`} 
            isPositive={stats.kpi.revenue.trend >= 0} 
        />
        <KPICard 
            title="Bookings (Month)" 
            value={stats.kpi.bookings.value} 
            icon={<CalendarCheck size={24}/>} 
            color="accent" 
            trend={`${stats.kpi.bookings.trend > 0 ? '+' : ''}${stats.kpi.bookings.trend}% vs last month`} 
            isPositive={stats.kpi.bookings.trend >= 0} 
        />
        <KPICard 
            title="Occupancy (Live)" 
            value={`${stats.kpi.occupancy.value}%`} 
            icon={<BedDouble size={24}/>} 
            color="dark" 
            trend="Real-time capacity" 
            isPositive={true} 
        />
        <KPICard 
            title="Guests (Month)" 
            value={stats.kpi.guests.value} 
            icon={<Users size={24}/>} 
            color="primary" 
            trend={`${stats.kpi.guests.trend > 0 ? '+' : ''}${stats.kpi.guests.trend}% vs last month`} 
            isPositive={stats.kpi.guests.trend >= 0} 
        />
      </div>

      {/* CHART SECTION */}
      <motion.div className="chart-card" variants={itemVariants}>
        <div className="chart-header">
            <div>
               <h3>Revenue Analytics</h3>
               <p>Performance over the last 7 days</p>
            </div>
            <select className="form-input" disabled>
                <option>Last 7 Days</option>
            </select>
        </div>
        
        <div className="chart-wrapper">
          {stats.chart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chart}>
                <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} dx={-10} tickFormatter={(value) => `$${value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                <Tooltip 
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                    itemStyle={{ color: '#fff' }} cursor={{stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '5 5'}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">
                No bookings in the last 7 days.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const KPICard = ({ title, value, icon, color, trend, isPositive }) => {
    // Premium Color Mapping based on our global vars
    const styles = {
        primary: { bg: '#eff6ff', text: 'var(--color-primary)' },
        accent: { bg: '#fffbeb', text: 'var(--color-accent)' },
        dark: { bg: '#f1f5f9', text: 'var(--color-dark)' }
    };
    const style = styles[color] || styles.primary;

    return (
        <motion.div className="kpi-card" variants={itemVariants}>
            <div className="kpi-header">
                <div className="kpi-icon-box" style={{ background: style.bg, color: style.text }}>{icon}</div>
                <div className={`kpi-trend ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                    {trend}
                </div>
            </div>
            <div className="kpi-value">{value}</div>
            <div className="kpi-label">{title}</div>
        </motion.div>
    );
}

export default DashboardOverview;