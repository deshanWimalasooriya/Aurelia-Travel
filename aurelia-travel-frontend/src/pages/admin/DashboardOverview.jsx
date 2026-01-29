import { motion } from 'framer-motion';
import { 
  DollarSign, Users, BedDouble, CalendarCheck, TrendingUp, TrendingDown 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './styles/dashboard-overview.css';

const data = [
  { name: 'Mon', revenue: 4000 }, { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 5000 }, { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 6890 }, { name: 'Sat', revenue: 8390 }, { name: 'Sun', revenue: 7490 },
];

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const DashboardOverview = () => {
  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants}>
      <h1 style={{fontSize:'1.8rem', fontWeight:800, marginBottom:'30px', color:'#0f172a'}}>Performance Overview</h1>
      
      {/* KPI GRID */}
      <div className="kpi-grid">
        <KPICard title="Revenue" value="$24,500" icon={<DollarSign size={24}/>} color="gold" trend="+12.5%" isPositive={true} />
        <KPICard title="Bookings" value="1,245" icon={<CalendarCheck size={24}/>} color="blue" trend="+8.2%" isPositive={true} />
        <KPICard title="Occupancy" value="78%" icon={<BedDouble size={24}/>} color="navy" trend="-2.1%" isPositive={false} />
        <KPICard title="Guests" value="342" icon={<Users size={24}/>} color="blue" trend="+4.5%" isPositive={true} />
      </div>

      {/* CHART SECTION */}
      <motion.div className="table-card" variants={itemVariants} style={{padding: '30px', height:'450px'}}>
        <div style={{marginBottom: '20px', display:'flex', justifyContent:'space-between'}}>
            <div>
               <h3 style={{fontSize: '1.2rem', fontWeight: 700, margin:0}}>Revenue Analytics</h3>
               <p style={{color: '#64748b', margin:0}}>Performance over the last 7 days</p>
            </div>
            <select className="form-input" style={{width:'150px'}}><option>Last 7 Days</option><option>Last Month</option></select>
        </div>
        <div style={{height: 350, width: '100%'}}>
          <ResponsiveContainer>
            <AreaChart data={data}>
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