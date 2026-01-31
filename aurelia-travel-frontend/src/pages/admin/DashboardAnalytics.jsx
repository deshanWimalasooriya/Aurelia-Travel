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
  // Added 'summary' and 'hotelFinancials' to state
  const [data, setData] = useState({ 
    revenue: [], 
    byHotel: [], 
    byStatus: [],
    summary: { totalBookings: 0, totalRevenue: 0, totalCommission: 0, netIncome: 0 },
    hotelFinancials: []
  });
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
      // --- DEMO DATA ---
      // I have updated this to include the financial breakdown you requested
      setData({
          revenue: [
            {name: 'Jan', value: 14000}, {name: 'Feb', value: 13000}, {name: 'Mar', value: 15000},
            {name: 'Apr', value: 18500}, {name: 'May', value: 26000}, {name: 'Jun', value: 37500}
          ],
          byHotel: [
            {name: 'Ocean View', value: 45}, {name: 'City Lights', value: 30}, {name: 'Mountain Retreat', value: 25}
          ],
          byStatus: [
            {name: 'confirmed', value: 65}, {name: 'pending', value: 20}, {name: 'cancelled', value: 15}
          ],
          // New Summary Data
          summary: {
              totalBookings: 1240,
              totalRevenue: 124000,    // Total amount guests paid
              totalCommission: 12400,  // 10% to Aurelia Travel
              netIncome: 111600        // What the manager keeps
          },
          // New Hotel-wise Financial Table Data
          hotelFinancials: [
              { id: 1, name: 'Ocean View Resort', bookings: 540, revenue: 54000, commission: 5400 },
              { id: 2, name: 'City Lights Hotel', bookings: 400, revenue: 45000, commission: 4500 },
              { id: 3, name: 'Mountain Retreat', bookings: 300, revenue: 25000, commission: 2500 },
          ]
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper component for the Top Summary Cards
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
           <p style={{color: '#64748b', margin:'5px 0 0'}}>Revenue, commissions, and performance metrics</p>
        </div>
        <button className="btn-secondary">
            <Download size={18} /> Export PDF
        </button>
      </div>

      {/* --- 1. NEW FINANCIAL SUMMARY CARDS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <SummaryCard 
             title="Total Revenue" 
             value={`$${data.summary.totalRevenue.toLocaleString()}`} 
             subtext="+12% from last month"
             icon={<DollarSign size={28} />}
             color="#0f172a"
             bg="#f1f5f9"
          />
          <SummaryCard 
             title="Aurelia Commission" 
             value={`$${data.summary.totalCommission.toLocaleString()}`} 
             subtext="Paid to Platform"
             icon={<CreditCard size={28} />}
             color="#f59e0b"
             bg="#fffbeb"
          />
          <SummaryCard 
             title="Net Income" 
             value={`$${data.summary.netIncome.toLocaleString()}`} 
             subtext="Available for payout"
             icon={<Wallet size={28} />}
             color="#10b981"
             bg="#ecfdf5"
          />
          <SummaryCard 
             title="Total Bookings" 
             value={data.summary.totalBookings} 
             subtext="Confirmed stays"
             icon={<Building2 size={28} />}
             color="#3b82f6"
             bg="#eff6ff"
          />
      </div>

      {/* --- 2. EXISTING CHARTS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px', marginBottom: '30px' }}>
        
        {/* MONTHLY REVENUE */}
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
               <Bar dataKey="value" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={40} />
             </BarChart>
           </ResponsiveContainer>
        </ChartCard>

        {/* BOOKINGS BY HOTEL */}
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

      {/* --- 3. EXISTING PIE CHART & NEW FINANCIAL TABLE --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px' }}>
         
         {/* BOOKING STATUS */}
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

         {/* --- 4. NEW HOTEL-WISE FINANCIAL TABLE --- */}
         <div className="table-card" style={{ padding: '0', overflow: 'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding: '25px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color:'#0f172a' }}>Property Performance</h3>
                <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Breakdown of revenue and commissions</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className="dashboard-table" style={{ width: '100%' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                            <th style={{ padding: '15px 25px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>PROPERTY</th>
                            <th style={{ padding: '15px 25px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>BOOKINGS</th>
                            <th style={{ padding: '15px 25px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>GROSS REVENUE</th>
                            <th style={{ padding: '15px 25px', fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>COMMISSION</th>
                            <th style={{ padding: '15px 25px', fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>NET INCOME</th>
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