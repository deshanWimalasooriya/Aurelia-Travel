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

  if (loading) return <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>Loading Overview...</div>;

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants}>
      <h1 style={{fontSize:'1.8rem', fontWeight:800, marginBottom:'30px', color:'#0f172a'}}>Performance Overview</h1>
      
      {/* KPI GRID */}
      <div className="kpi-grid">
        <KPICard 
            title="Revenue (Month)" 
            value={`$${stats.kpi.revenue.value.toLocaleString()}`} 
            icon={<DollarSign size={24}/>} 
            color="gold" 
            trend={`${stats.kpi.revenue.trend > 0 ? '+' : ''}${stats.kpi.revenue.trend}% vs last month`} 
            isPositive={stats.kpi.revenue.trend >= 0} 
        />
        <KPICard 
            title="Bookings (Month)" 
            value={stats.kpi.bookings.value} 
            icon={<CalendarCheck size={24}/>} 
            color="blue" 
            trend={`${stats.kpi.bookings.trend > 0 ? '+' : ''}${stats.kpi.bookings.trend}% vs last month`} 
            isPositive={stats.kpi.bookings.trend >= 0} 
        />
        <KPICard 
            title="Occupancy (Live)" 
            value={`${stats.kpi.occupancy.value}%`} 
            icon={<BedDouble size={24}/>} 
            color="navy" 
            trend="Real-time" 
            isPositive={true} 
        />
        <KPICard 
            title="Guests (Month)" 
            value={stats.kpi.guests.value} 
            icon={<Users size={24}/>} 
            color="blue" 
            trend={`${stats.kpi.guests.trend > 0 ? '+' : ''}${stats.kpi.guests.trend}% vs last month`} 
            isPositive={stats.kpi.guests.trend >= 0} 
        />
      </div>

      {/* CHART SECTION */}
      <motion.div className="table-card" variants={itemVariants} style={{padding: '30px', display:'flex', flexDirection:'column'}}>
        <div style={{marginBottom: '20px', display:'flex', justifyContent:'space-between'}}>
            <div>
               <h3 style={{fontSize: '1.2rem', fontWeight: 700, margin:0}}>Revenue Analytics</h3>
               <p style={{color: '#64748b', margin:0}}>Performance over the last 7 days</p>
            </div>
            <select className="form-input" style={{width:'150px'}} disabled>
                <option>Last 7 Days</option>
            </select>
        </div>
        
        <div style={{height: 350, width: '100%', minHeight: 350}}>
          {stats.chart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chart}>
                <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} dx={-10} tickFormatter={(value) => `$${value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <Tooltip 
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                    itemStyle={{ color: '#fff' }} cursor={{stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '5 5'}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8'}}>
                No bookings in the last 7 days.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const KPICard = ({ title, value, icon, color, trend, isPositive }) => {
    // Premium Colors
    const styles = {
        gold: { bg: '#fffbeb', text: '#d97706' },
        blue: { bg: '#eff6ff', text: '#2563eb' },
        navy: { bg: '#f1f5f9', text: '#0f172a' }
    };
    const style = styles[color] || styles.blue;

    return (
        <motion.div className="kpi-card" variants={itemVariants}>
            <div className="kpi-header">
                <div className="icon-box" style={{ background: style.bg, color: style.text }}>{icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '0.85rem', color: isPositive ? '#16a34a' : '#ef4444' }}>
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