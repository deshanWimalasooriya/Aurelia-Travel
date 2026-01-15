
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, BedDouble, CalendarDays, BarChart3, 
  Users, MessageSquare, LogOut, Menu, X 
} from 'lucide-react';

// ✅ FIX: Import useAuth from AuthContext (because it has the 'logout' function)
import { useAuth } from '../../context/AuthContext'; 
import './styles/dashboard.css';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  
  // ✅ FIX: Use the hook that actually contains 'logout'
  const { user, logout } = useAuth(); 

  const menuItems = [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
    { path: '/admin/rooms', label: 'Room Management', icon: BedDouble },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/customers', label: 'Customers', icon: Users },
    { path: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  ];

  return (
    <div className="dashboard-wrapper">
      {/* SIDEBAR */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="brand-logo">Aurelia<span>Admin</span></div>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)}><X size={20}/></button>
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
                <span className="nav-label">{item.label}</span>
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
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          
          <div className="topbar-right">
            <div className="admin-profile">
              <div className="admin-info">
                <span className="name">{user?.username || 'Admin User'}</span>
                <span className="role">{user?.role || 'Manager'}</span>
              </div>
              <div className="admin-avatar">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
              </div>
            </div>
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