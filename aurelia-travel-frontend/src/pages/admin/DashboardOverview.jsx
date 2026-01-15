import axios from 'axios';
import { 
  DollarSign, Users, BedDouble, CalendarCheck, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './styles/dashboard.css';

// Mock Data for Chart
const data = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];

const DashboardOverview = () => {
  return (
    <div className="overview-container">
      <h1 className="page-title">Dashboard Overview</h1>
      
      {/* KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Revenue</span>
            <div className="icon-box green"><DollarSign size={20}/></div>
          </div>
          <div className="kpi-value">$12,450</div>
          <div className="kpi-trend positive">
            <ArrowUpRight size={16}/> +12.5% <span>from last month</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Bookings</span>
            <div className="icon-box blue"><CalendarCheck size={20}/></div>
          </div>
          <div className="kpi-value">145</div>
          <div className="kpi-trend positive">
            <ArrowUpRight size={16}/> +8.2% <span>from last month</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Occupancy Rate</span>
            <div className="icon-box purple"><BedDouble size={20}/></div>
          </div>
          <div className="kpi-value">78%</div>
          <div className="kpi-trend negative">
            <ArrowDownRight size={16}/> -2.1% <span>from last month</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">New Customers</span>
            <div className="icon-box orange"><Users size={20}/></div>
          </div>
          <div className="kpi-value">32</div>
          <div className="kpi-trend positive">
            <ArrowUpRight size={16}/> +4.5% <span>from last month</span>
          </div>
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="chart-section card">
        <h3>Revenue Analytics</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;