import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, Calendar, Users, Settings, LogOut, 
  DollarSign, PieChart, TrendingUp, Search, Bell, 
  MoreVertical, CheckCircle, XCircle, Clock, Menu
} from "lucide-react";
import "./styles/AdminDashboard.css";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

// --- CUSTOM CHART COMPONENT (No extra libs required) ---
const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="no-data">No data available</div>;
  const max = Math.max(...data.map(d => d.value)) || 100;
  
  return (
    <div className="chart-container">
      <div className="chart-bars">
        {data.map((item, index) => (
          <div key={index} className="chart-column">
            <div 
              className="bar" 
              style={{ height: `${(item.value / max) * 100}%` }}
              title={`$${item.value}`}
            ></div>
            <span className="label">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { user, clearUser } = useUser();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, bookingsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/stats", { withCredentials: true }),
          axios.get("http://localhost:5000/api/admin/bookings", { withCredentials: true })
        ]);

        setStats(statsRes.data.stats);
        setRevenueData(statsRes.data.chartData);
        setBookings(bookingsRes.data);
      } catch (err) {
        console.error("Admin Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
      try {
        await axios.post('http://localhost:5000/api/auth/logout');
        clearUser();
        navigate('/auth');
      } catch (e) { console.error(e); }
  };

  // Icon Mapping
  const getIcon = (iconName) => {
    const icons = { DollarSign, Calendar, PieChart, Users };
    const IconComp = icons[iconName] || TrendingUp;
    return <IconComp size={24} />;
  };

  if (loading) return <div className="loading-screen">Loading Dashboard...</div>;

  return (
    <div className="admin-layout">
      {/* --- SIDEBAR --- */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="logo-area">
          <div className="logo-icon">A</div>
          {sidebarOpen && <h2>Aurelia<span className="dot">.</span></h2>}
        </div>

        <nav className="nav-menu">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} isOpen={sidebarOpen}/>
          <NavItem icon={<Calendar size={20}/>} label="Bookings" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} isOpen={sidebarOpen}/>
          <NavItem icon={<Users size={20}/>} label="Guests" active={activeTab === 'guests'} onClick={() => setActiveTab('guests')} isOpen={sidebarOpen}/>
          <div className="divider"></div>
          <NavItem icon={<Settings size={20}/>} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} isOpen={sidebarOpen}/>
        </nav>

        <div className="user-mini-profile">
            <img src={user?.profile_image || "https://ui-avatars.com/api/?name=Admin"} alt="Admin" />
            {sidebarOpen && (
                <div className="user-info">
                    <span className="name">{user?.username || "Admin"}</span>
                    <span className="role">Super Admin</span>
                </div>
            )}
            <button onClick={handleLogout} className="logout-mini"><LogOut size={16}/></button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="main-area">
        <header className="top-bar">
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24}/>
          </button>
          <div className="search-bar">
            <Search size={18} className="search-icon"/>
            <input type="text" placeholder="Search bookings, rooms, guests..." />
          </div>
          <div className="top-actions">
            <button className="icon-btn"><Bell size={20}/><span className="badge"></span></button>
          </div>
        </header>

        <div className="content-wrapper">
          {/* STATS ROW */}
          <section className="stats-grid">
            {stats.map((stat, idx) => (
              <motion.div 
                key={idx} 
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="stat-header">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-icon-bg" style={{color: stat.color, background: `${stat.color}20`}}>
                    {getIcon(stat.icon)}
                  </div>
                </div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-trend">
                    <span className={stat.trend.includes('+') ? 'positive' : 'negative'}>
                        {stat.trend}
                    </span> from last month
                </div>
              </motion.div>
            ))}
          </section>

          <div className="dashboard-split">
            {/* REVENUE CHART */}
            <motion.div className="card revenue-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <div className="card-header">
                    <h3>Revenue Overview</h3>
                    <select className="period-select">
                        <option>Last 6 Months</option>
                        <option>This Year</option>
                    </select>
                </div>
                <RevenueChart data={revenueData} />
            </motion.div>

            {/* RECENT ACTIVITY */}
            <motion.div className="card bookings-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <div className="card-header">
                    <h3>Recent Bookings</h3>
                    <button className="view-all">View All</button>
                </div>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Guest</th>
                                <th>Room</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((b) => (
                                <tr key={b.id}>
                                    <td>
                                        <div className="guest-cell">
                                            <div className="avatar-small">{b.guest.charAt(0)}</div>
                                            <span>{b.guest}</span>
                                        </div>
                                    </td>
                                    <td>{b.room}</td>
                                    <td>${b.total_price}</td>
                                    <td><StatusBadge status={b.status}/></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-components
const NavItem = ({ icon, label, active, onClick, isOpen }) => (
    <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
        {icon}
        {isOpen && <span>{label}</span>}
        {active && <div className="active-indicator"></div>}
    </div>
);

const StatusBadge = ({ status }) => {
    const config = {
        confirmed: { color: 'green', icon: CheckCircle },
        pending: { color: 'orange', icon: Clock },
        cancelled: { color: 'red', icon: XCircle }
    };
    const { color, icon: Icon } = config[status.toLowerCase()] || config.pending;
    
    return (
        <span className={`status-badge ${color}`}>
            <Icon size={12} /> {status}
        </span>
    );
};