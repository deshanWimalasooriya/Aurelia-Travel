import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, PieChart as PieIcon, BarChart3, Download, 
  DollarSign, CreditCard, Wallet, Building2 
} from 'lucide-react';
import './styles/dashboard-analytics.css';

const DashboardAnalytics = () => {
  const [data, setData] = useState({ 
    revenue: [], 
    byHotel: [], 
    byStatus: [],
    summary: { totalBookings: 0, totalRevenue: 0, totalCommission: 0, netIncome: 0 },
    hotelFinancials: []
  });
  const [loading, setLoading] = useState(true);

  const COLORS = ['#0f172a', '#f59e0b', '#3b82f6', '#10b981', '#64748b'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // FIX 1: URL Changed to '/api/finance/analytics' (Manager Endpoint)
      const res = await axios.get('http://localhost:5000/api/finance/analytics', { 
          withCredentials: true,
          headers: {
              'Authorization': `Bearer ${token}`
          }
      });
      
      if (res.data) {
          setData({
              revenue: res.data.revenue || [],
              byHotel: res.data.byHotel || [],
              byStatus: res.data.byStatus || [],
              summary: res.data.summary || { totalBookings: 0, totalRevenue: 0, totalCommission: 0, netIncome: 0 },
              hotelFinancials: res.data.hotelFinancials || []
          });
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const SummaryCard = ({ title, value, subtext, icon, color, bg }) => (
    <div className="table-card" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ background: bg, padding: '15px', borderRadius: '12px', color: color }}>
            {icon}
        </div>
        <div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>{title}</p>
            <h3 style={{ margin: '5px 0', fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{value}</h3>
            {subtext && <p style={{ margin: 0, fontSize: '0.8rem', color: color, fontWeight: 600 }}>{subtext}</p>}
        </div>
    </div>
  );

  // FIX 2: Removed 'motion.div' animation on the container to prevent Ref issues with Recharts
  // FIX 3: Added explicit inline style={{ width: '100%', height: '300px' }} for the wrapper
  const ChartCard = ({ title, icon, children }) => (
    <div 
      className="table-card"
      style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', color: '#0f172a' }}>
                  {icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color:'#0f172a' }}>{title}</h3>
          </div>
      </div>
      
      {/* EXPLICIT HEIGHT CONTAINER FOR RECHARTS */}
      <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
          {children}
      </div>
    </div>
  );

  if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Loading Analytics...</div>;

  return (
    <div className="analytics-page">
      <div className="table-header-action table-card" style={{marginBottom: '30px'}}>
        <div>
           <h1 style={{fontSize: '1.5rem', fontWeight: 800, margin:0, color:'#0f172a'}}>Financial Reports</h1>
           <p style={{color: '#64748b', margin:'5px 0 0'}}>Revenue, commissions, and performance metrics</p>
        </div>
        <button className="btn-secondary">
            <Download size={18} /> Export PDF
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <SummaryCard 
             title="Total Revenue" 
             value={`$${(data.summary.totalRevenue || 0).toLocaleString()}`} 
             subtext="Gross from Bookings"
             icon={<DollarSign size={28} />}
             color="#0f172a"
             bg="#f1f5f9"
          />
          <SummaryCard 
             title="Aurelia Commission" 
             value={`$${(data.summary.totalCommission || 0).toLocaleString()}`} 
             subtext="Platform Earnings"
             icon={<CreditCard size={28} />}
             color="#f59e0b"
             bg="#fffbeb"
          />
          <SummaryCard 
             title="Net Income" 
             value={`$${(data.summary.netIncome || 0).toLocaleString()}`} 
             subtext="Hotel Payouts"
             icon={<Wallet size={28} />}
             color="#10b981"
             bg="#ecfdf5"
          />
          <SummaryCard 
             title="Total Bookings" 
             value={data.summary.totalBookings || 0} 
             subtext="Confirmed stays"
             icon={<Building2 size={28} />}
             color="#3b82f6"
             bg="#eff6ff"
          />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px', marginBottom: '30px' }}>
        
        {/* REVENUE CHART */}
        <ChartCard title="Revenue Trends (Last 6 Months)" icon={<BarChart3 size={20}/>}>
           {data.revenue.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data.revenue}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize:12}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize:12}} tickFormatter={val => `$${val}`} />
                 <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', background:'#0f172a', color:'#fff' }} />
                 <Bar dataKey="value" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
           ) : (
             <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8'}}>No Revenue Data</div>
           )}
        </ChartCard>

        {/* PIE CHART */}
        <ChartCard title="Top Hotels by Bookings" icon={<PieIcon size={20}/>}>
           {data.byHotel.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={data.byHotel} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                   {data.byHotel.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                 <Legend verticalAlign="bottom" height={36} iconType="circle"/>
               </PieChart>
             </ResponsiveContainer>
           ) : (
             <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8'}}>No Hotel Data</div>
           )}
        </ChartCard>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px' }}>
         
         {/* STATUS PIE CHART */}
         <ChartCard title="Booking Status" icon={<TrendingUp size={20}/>}>
            {data.byStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data.byStatus} cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} dataKey="value">
                    {data.byStatus.map((entry, index) => {
                        let color = '#94a3b8';
                        if (entry.name === 'confirmed') color = '#10b981';
                        if (entry.name === 'pending') color = '#f59e0b';
                        if (entry.name === 'cancelled') color = '#ef4444';
                        if (entry.name === 'completed') color = '#3b82f6';
                        return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8'}}>No Status Data</div>
            )}
         </ChartCard>

         <div className="table-card" style={{ padding: '0', overflow: 'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding: '25px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color:'#0f172a' }}>Property Performance</h3>
                <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Revenue breakdown per hotel</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className="dashboard-table" style={{ width: '100%' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                            <th style={{ padding: '15px 25px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>PROPERTY</th>
                            <th style={{ padding: '15px 25px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>BOOKINGS</th>
                            <th style={{ padding: '15px 25px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>REVENUE</th>
                            <th style={{ padding: '15px 25px', fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>COMMISSION</th>
                            <th style={{ padding: '15px 25px', fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>NET</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.hotelFinancials.length > 0 ? (
                            data.hotelFinancials.map((hotel, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '20px 25px', fontWeight: 600, color: '#0f172a' }}>{hotel.name}</td>
                                    <td style={{ padding: '20px 25px', color: '#64748b' }}>{hotel.bookings}</td>
                                    <td style={{ padding: '20px 25px', fontWeight: 700, color: '#0f172a' }}>${hotel.revenue.toLocaleString()}</td>
                                    <td style={{ padding: '20px 25px', fontWeight: 600, color: '#f59e0b' }}>-${hotel.commission.toLocaleString()}</td>
                                    <td style={{ padding: '20px 25px', fontWeight: 700, color: '#10b981' }}>
                                        ${(hotel.revenue - hotel.commission).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No data available</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
         </div>

      </div>
    </div>
  );
};
export default DashboardAnalytics;