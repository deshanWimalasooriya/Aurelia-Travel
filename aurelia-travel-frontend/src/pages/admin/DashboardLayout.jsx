import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, BedDouble, CalendarDays, BarChart3, 
  Users, LogOut, Menu, X, Building, ChevronRight 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; 
import './styles/dashboard-layout.css';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAuth } = useAuth(); 
  const user = checkAuth();

  const logout = () => {
    // Perform logout logic (clear tokens) here
    navigate('/profile');
  }

  const menuItems = [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/hotels', label: 'My Properties', icon: Building },
    { path: '/admin/rooms', label: 'Room Manager', icon: BedDouble },
    { path: '/admin/bookings', label: 'Reservations', icon: CalendarDays },
    { path: '/admin/customers', label: 'Guest List', icon: Users },
    { path: '/admin/analytics', label: 'Financials', icon: BarChart3 },
  ];

  return (
    <div className="dashboard-wrapper">
      {/* SIDEBAR */}
      <motion.aside 
        className={`dashboard-sidebar ${!sidebarOpen ? 'closed' : ''}`}
        animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ overflow: 'hidden' }}
      >
        <div className="sidebar-header">
          <div className="brand-logo">Aurelia<span>Manager</span></div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
                {isActive && <ChevronRight size={16} style={{marginLeft: 'auto', opacity: 0.8}} />}
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="logout-btn">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="flex-align">
             {!sidebarOpen && (
                 <button onClick={() => setSidebarOpen(true)} className="btn-icon">
                    <Menu size={20}/>
                 </button>
             )}
             <div className="page-title-box" style={{marginLeft: !sidebarOpen ? '20px' : '0'}}>
                 <h2>Dashboard</h2>
                 <p>Welcome back, {user?.username || 'Partner'}</p>
             </div>
          </div>
          
          <div className="admin-profile">
            <div className="admin-avatar">
               {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
            </div>
            <span style={{fontWeight: 600, fontSize: '0.9rem', color: '#0f172a'}}>
                {user?.username || 'Admin'}
            </span>
          </div>
        </header>

        <div className="dashboard-content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;