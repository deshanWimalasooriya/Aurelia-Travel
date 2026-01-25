import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, Download } from 'lucide-react';
import './styles/dashboard-analytics.css';

const DashboardAnalytics = () => {
  const [data, setData] = useState({ revenue: [], byHotel: [], byStatus: [] });
  const [loading, setLoading] = useState(true);

  // PREMIUM THEME COLORS
  const COLORS = ['#0f172a', '#f59e0b', '#3b82f6', '#10b981', '#64748b'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/analytics', { withCredentials: true });
      setData(res.data);
    } catch (err) {
      // Demo Data matching new theme
      setData({
          revenue: [
            {name: 'Jan', value: 4000}, {name: 'Feb', value: 3000}, {name: 'Mar', value: 5000},
            {name: 'Apr', value: 4500}, {name: 'May', value: 6000}, {name: 'Jun', value: 7500}
          ],
          byHotel: [
            {name: 'Ocean View', value: 12}, {name: 'City Lights', value: 8}, {name: 'Mountain Retreat', value: 4}
          ],
          byStatus: [
            {name: 'confirmed', value: 65}, {name: 'pending', value: 20}, {name: 'cancelled', value: 15}
          ]
      });
    } finally {
      setLoading(false);
    }
  };

  const ChartCard = ({ title, icon, children }) => (
    <motion.div 
      className="table-card"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      style={{ padding: '30px', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', color: '#0f172a' }}>
                  {icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color:'#0f172a' }}>{title}</h3>
          </div>
      </div>
      <div style={{ flex: 1, minHeight: '300px' }}>
          {children}
      </div>
    </motion.div>
  );

  return (
    <div className="analytics-page">
      <div className="table-header-action table-card" style={{marginBottom: '30px'}}>
        <div>
           <h1 style={{fontSize: '1.5rem', fontWeight: 800, margin:0, color:'#0f172a'}}>Financial Reports</h1>
           <p style={{color: '#64748b', margin:'5px 0 0'}}>Performance metrics and KPIs</p>
        </div>
        <button className="btn-secondary">
            <Download size={18} /> Export PDF
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px', marginBottom: '30px' }}>
        
        {/* 1. MONTHLY REVENUE */}
        <ChartCard title="Revenue Trends" icon={<BarChart3 size={20}/>}>
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={data.revenue}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize:12}} dy={10} />
               <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize:12}} tickFormatter={val => `$${val}`} />
               <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', background:'#0f172a', color:'#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
               />
               {/* Gold Bars */}
               <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={40} />
             </BarChart>
           </ResponsiveContainer>
        </ChartCard>

        {/* 2. BOOKINGS BY HOTEL */}
        <ChartCard title="Bookings by Property" icon={<PieIcon size={20}/>}>
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={data.byHotel}
                 cx="50%" cy="50%"
                 innerRadius={80}
                 outerRadius={110}
                 paddingAngle={5}
                 dataKey="value"
               >
                 {data.byHotel.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                 ))}
               </Pie>
               <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
               <Legend verticalAlign="bottom" height={36} iconType="circle"/>
             </PieChart>
           </ResponsiveContainer>
        </ChartCard>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px' }}>
         {/* 3. BOOKING STATUS */}
         <ChartCard title="Booking Status Distribution" icon={<TrendingUp size={20}/>}>
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                    data={data.byStatus}
                    cx="50%" cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    dataKey="value"
                 >
                    {data.byStatus.map((entry, index) => {
                        let color = '#94a3b8';
                        if (entry.name === 'confirmed') color = '#10b981'; // Green
                        if (entry.name === 'pending') color = '#f59e0b';   // Gold
                        if (entry.name === 'cancelled') color = '#ef4444'; // Red
                        return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                 </Pie>
                 <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
               </PieChart>
            </ResponsiveContainer>
         </ChartCard>
      </div>
    </div>
  );
};
export default DashboardAnalytics;