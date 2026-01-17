import { motion } from 'framer-motion';
import { 
  DollarSign, Users, BedDouble, CalendarCheck, TrendingUp, TrendingDown 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './styles/dashboard.css';

const data = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 5000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 6890 },
  { name: 'Sat', revenue: 8390 },
  { name: 'Sun', revenue: 7490 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const DashboardOverview = () => {
  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={containerVariants}
    >
      {/* KPI GRID */}
      <div className="kpi-grid">
        <KPICard 
          title="Total Revenue" 
          value="$24,500" 
          icon={<DollarSign size={24}/>} 
          color="green" 
          trend="+12.5%" 
          isPositive={true}
        />
        <KPICard 
          title="Total Bookings" 
          value="1,245" 
          icon={<CalendarCheck size={24}/>} 
          color="blue" 
          trend="+8.2%" 
          isPositive={true}
        />
        <KPICard 
          title="Occupancy Rate" 
          value="78%" 
          icon={<BedDouble size={24}/>} 
          color="purple" 
          trend="-2.1%" 
          isPositive={false}
        />
        <KPICard 
          title="New Customers" 
          value="342" 
          icon={<Users size={24}/>} 
          color="orange" 
          trend="+4.5%" 
          isPositive={true}
        />
      </div>

      {/* CHART SECTION */}
      <motion.div className="table-card" variants={itemVariants} style={{padding: '30px'}}>
        <div style={{marginBottom: '20px'}}>
            <h3 style={{fontSize: '1.2rem', fontWeight: 700}}>Revenue Analytics</h3>
            <p style={{color: '#64748b'}}>Weekly performance overview</p>
        </div>
        <div style={{height: 350, width: '100%'}}>
          <ResponsiveContainer>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} dx={-10} tickFormatter={(value) => `$${value}`} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 8, strokeWidth: 0, fill: '#2563eb' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
};

const KPICard = ({ title, value, icon, color, trend, isPositive }) => {
    const bgColors = {
        green: '#dcfce7', blue: '#dbeafe', purple: '#f3e8ff', orange: '#ffedd5'
    };
    const textColors = {
        green: '#166534', blue: '#1e40af', purple: '#6b21a8', orange: '#9a3412'
    };

    return (
        <motion.div className="kpi-card" variants={itemVariants}>
            <div className="kpi-header">
                <div className="icon-box" style={{ background: bgColors[color], color: textColors[color] }}>
                    {icon}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '0.85rem', color: isPositive ? '#16a34a' : '#dc2626' }}>
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