import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BedDouble, CalendarDays, BarChart3, 
  Users, MessageSquare, LogOut, Menu, X, Building 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; 
import './styles/dashboard.css';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { checkAuth } = useAuth(); 
  const user = checkAuth();

  const logout = () => {
    useNavigate('/profile');
  }

  const menuItems = [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/hotels', label: 'My Hotels', icon: Building },
    { path: '/admin/rooms', label: 'Room Management', icon: BedDouble },
    { path: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/customers', label: 'Customers', icon: Users },
  ];

  return (
    <div className="dashboard-wrapper">
      {/* SIDEBAR */}
      <motion.aside 
        className="dashboard-sidebar"
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-header">
          <div className="brand-logo">Aurelia<span>Manager</span></div>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)}>
             <X size={20} color="white"/>
          </button>
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
                <Icon size={20} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill" 
                    className="active-indicator"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
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
      <motion.main 
        className="dashboard-main"
        animate={{ marginLeft: sidebarOpen ? "280px" : "0px" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <header className="dashboard-topbar">
          <div className="flex-align">
             {!sidebarOpen && (
                 <button onClick={() => setSidebarOpen(true)} className="btn-icon">
                    <Menu size={20}/>
                 </button>
             )}
             <div className="page-title-box" style={{marginLeft: !sidebarOpen ? '20px' : '0'}}>
                 <h2>Dashboard</h2>
                 <p>Welcome back, {user?.username}</p>
             </div>
          </div>
          
          <div className="admin-profile">
            <div className="admin-avatar">
               {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
            </div>
            <span style={{fontWeight: 600, fontSize: '0.9rem'}}>{user?.username}</span>
          </div>
        </header>

        <div className="dashboard-content-area">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
};

export default DashboardLayout;