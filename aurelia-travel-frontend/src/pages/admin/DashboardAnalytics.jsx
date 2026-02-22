import { useState, useEffect } from 'react';
import api from '../../services/api'; // ✅ Replaced axios with your configured API service
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

  // Use Premium colors for pie charts
  const COLORS = ['#0f172a', '#d97706', '#2563eb', '#10b981', '#64748b'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // ✅ Now uses the clean, centralized API call
      const res = await api.get('/finance/analytics');
      
      const responseData = res.data.data || res.data; // Handles different backend wrapping structures

      if (responseData) {
          setData({
              revenue: responseData.revenue || [],
              byHotel: responseData.byHotel || [],
              byStatus: responseData.byStatus || [],
              summary: responseData.summary || { totalBookings: 0, totalRevenue: 0, totalCommission: 0, netIncome: 0 },
              hotelFinancials: responseData.hotelFinancials || []
          });
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const SummaryCard = ({ title, value, subtext, icon, color, bg }) => (
    <div className="analytics-card kpi-layout">
        <div className="kpi-icon" style={{ background: bg, color: color }}>{icon}</div>
        <div>
            <p className="kpi-title">{title}</p>
            <h3 className="kpi-value">{value}</h3>
            {subtext && <p className="kpi-subtext" style={{ color: color }}>{subtext}</p>}
        </div>
    </div>
  );

  const ChartCard = ({ title, icon, children }) => (
    <div className="analytics-card flex-col">
      <div className="chart-header">
          <div className="chart-title-group">
              <div className="chart-icon-box">{icon}</div>
              <h3>{title}</h3>
          </div>
      </div>
      <div className="chart-render-area">
          {children}
      </div>
    </div>
  );

  if (loading) return <div className="analytics-loading">Loading Analytics...</div>;

  return (
    <div className="analytics-page">
      <div className="analytics-header-card">
        <div>
           <h1>Financial Reports</h1>
           <p>Revenue, commissions, and performance metrics</p>
        </div>
        <button className="btn-export">
            <Download size={18} /> Export PDF
        </button>
      </div>

      <div className="analytics-grid-4">
          <SummaryCard 
             title="Total Revenue" 
             value={`$${(data.summary.totalRevenue || 0).toLocaleString()}`} 
             subtext="Gross from Bookings"
             icon={<DollarSign size={28} />}
             color="var(--color-dark)" bg="#f1f5f9"
          />
          <SummaryCard 
             title="Aurelia Commission" 
             value={`$${(data.summary.totalCommission || 0).toLocaleString()}`} 
             subtext="Platform Earnings"
             icon={<CreditCard size={28} />}
             color="var(--color-accent)" bg="#fffbeb"
          />
          <SummaryCard 
             title="Net Income" 
             value={`$${(data.summary.netIncome || 0).toLocaleString()}`} 
             subtext="Hotel Payouts"
             icon={<Wallet size={28} />}
             color="#10b981" bg="#ecfdf5"
          />
          <SummaryCard 
             title="Total Bookings" 
             value={data.summary.totalBookings || 0} 
             subtext="Confirmed stays"
             icon={<Building2 size={28} />}
             color="var(--color-primary)" bg="#eff6ff"
          />
      </div>

      <div className="analytics-grid-2">
        {/* REVENUE CHART */}
        <ChartCard title="Revenue Trends (Last 6 Months)" icon={<BarChart3 size={20}/>}>
           {data.revenue.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data.revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize:12}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize:12}} tickFormatter={val => `$${val}`} />
                 <Tooltip cursor={{fill: 'var(--color-background)'}} contentStyle={{ borderRadius: '12px', border: 'none', background:'var(--color-dark)', color:'white' }} />
                 <Bar dataKey="value" fill="var(--color-dark)" radius={[6, 6, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
           ) : (
             <div className="empty-chart">No Revenue Data</div>
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
             <div className="empty-chart">No Hotel Data</div>
           )}
        </ChartCard>
      </div>

      <div className="analytics-grid-2">
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
                        if (entry.name === 'completed') color = '#2563eb';
                        return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="empty-chart">No Status Data</div>
            )}
         </ChartCard>

         <div className="analytics-card no-pad flex-col">
            <div className="prop-perf-header">
                <h3>Property Performance</h3>
                <p>Revenue breakdown per hotel</p>
            </div>
            <div className="table-responsive">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>PROPERTY</th>
                            <th>BOOKINGS</th>
                            <th>REVENUE</th>
                            <th>COMMISSION</th>
                            <th>NET</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.hotelFinancials.length > 0 ? (
                            data.hotelFinancials.map((hotel, index) => (
                                <tr key={index}>
                                    <td className="font-bold">{hotel.name}</td>
                                    <td>{hotel.bookings}</td>
                                    <td className="font-bold">${hotel.revenue.toLocaleString()}</td>
                                    <td className="text-warning">-${hotel.commission.toLocaleString()}</td>
                                    <td className="text-success font-bold">
                                        ${(hotel.revenue - hotel.commission).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="empty-chart">No data available</td></tr>
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