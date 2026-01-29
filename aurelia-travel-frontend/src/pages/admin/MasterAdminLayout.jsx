import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, CalendarCheck, MessageSquare, DollarSign, LogOut } from 'lucide-react';
import '../styles/masterAdmin.css'; // Ensure you have the CSS from previous steps

const MasterAdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear tokens/cookies logic here
    navigate('/login');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { path: '/admin/users', label: 'Users', icon: <Users size={20} /> },
    { path: '/admin/hotels', label: 'Hotels', icon: <Building2 size={20} /> },
    { path: '/admin/bookings', label: 'Bookings', icon: <CalendarCheck size={20} /> },
    { path: '/admin/reviews', label: 'Reviews', icon: <MessageSquare size={20} /> },
    { path: '/admin/finance', label: 'Finance', icon: <DollarSign size={20} /> },
  ];

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Aurelia Admin</h2>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-item logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <Outlet /> 
      </main>
    </div>
  );
};

export default MasterAdminLayout;