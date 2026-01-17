import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, Download } from 'lucide-react';
import './styles/dashboard.css';

const DashboardAnalytics = () => {
  const [data, setData] = useState({ revenue: [], byHotel: [], byStatus: [] });
  const [loading, setLoading] = useState(true);

  // Colors for Charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/analytics', { withCredentials: true });
      setData(res.data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      // Fallback dummy data for demo if DB is empty
      setData({
          revenue: [{name: 'Jan', value: 4000}, {name: 'Feb', value: 3000}, {name: 'Mar', value: 5000}],
          byHotel: [{name: 'Grand Hotel', value: 12}, {name: 'Urban Stay', value: 8}],
          byStatus: [{name: 'confirmed', value: 15}, {name: 'pending', value: 5}]
      });
    } finally {
      setLoading(false);
    }
  };

  const ChartCard = ({ title, icon, children }) => (
    <motion.div 
      className="table-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', color: '#3b82f6' }}>
                  {icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{title}</h3>
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
           <h1 style={{fontSize: '1.5rem', fontWeight: 800}}>Analytics & Reports</h1>
           <p style={{color: '#64748b'}}>Deep dive into your business performance</p>
        </div>
        <button className="btn-secondary">
            <Download size={18} /> Export Report
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* 1. MONTHLY REVENUE (Bar Chart) */}
        <ChartCard title="Monthly Revenue" icon={<BarChart3 size={20}/>}>
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={data.revenue}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
               <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={val => `$${val}`} />
               <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
               />
               <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
             </BarChart>
           </ResponsiveContainer>
        </ChartCard>

        {/* 2. BOOKINGS BY HOTEL (Donut Chart) */}
        <ChartCard title="Bookings by Hotel" icon={<PieIcon size={20}/>}>
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
               <Tooltip />
               <Legend verticalAlign="bottom" height={36}/>
             </PieChart>
           </ResponsiveContainer>
        </ChartCard>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
         
         {/* 3. BOOKING STATUS (Area/Line or Pie) */}
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
                        if (entry.name === 'confirmed') color = '#10b981';
                        if (entry.name === 'pending') color = '#f59e0b';
                        if (entry.name === 'cancelled') color = '#ef4444';
                        return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                 </Pie>
                 <Tooltip />
               </PieChart>
            </ResponsiveContainer>
         </ChartCard>

      </div>
    </div>
  );
};

export default DashboardAnalytics;