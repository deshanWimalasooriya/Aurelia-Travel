import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Users, DollarSign, 
  MessageSquare, Settings, LogOut, ShieldCheck, Search, ClipboardList
} from 'lucide-react';
import NotificationBell from '../../components/ui/NotificationBell'; // ✅ Import Bell
import { useUser } from '../../context/userContext'; // ✅ Import User Context
import './styles/super-admin.css';

const SuperAdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUser(); // Get current admin info

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
    };

    const isActive = (path) => {
        if (path === '/superAdmin') return location.pathname === '/superAdmin';
        return location.pathname.includes(path);
    };

    // Helper to get page title based on route
    const getPageTitle = () => {
        if(location.pathname.includes('hotels')) return 'Hotel Management';
        if(location.pathname.includes('users')) return 'User Base';
        if(location.pathname.includes('finance')) return 'Financial Overview';
        if(location.pathname.includes('reviews')) return 'Moderation';
        if(location.pathname.includes('logs')) return 'System Logs'; // <--- NEW TITLE
        if(location.pathname.includes('settings')) return 'Platform Settings';
        return 'Dashboard Overview';
    };

    return (
        <div className="super-dashboard-wrapper">
            {/* SIDEBAR */}
            <aside className="sa-sidebar">
                <div className="sa-brand">
                    <ShieldCheck size={28} style={{ color: '#f43f5e' }} />
                    Aurelia <span>Admin</span>
                </div>
                
                <nav className="sa-nav-container">
                    <div className="sa-nav-label">Main Menu</div>
                    <Link to="/superAdmin" className={`sa-nav-item ${isActive('/superAdmin') ? 'active' : ''}`}>
                        <LayoutDashboard size={20}/> Overview
                    </Link>
                    <Link to="/superAdmin/hotels" className={`sa-nav-item ${isActive('hotels') ? 'active' : ''}`}>
                        <Building2 size={20}/> Manage Hotels
                    </Link>
                    <Link to="/superAdmin/users" className={`sa-nav-item ${isActive('users') ? 'active' : ''}`}>
                        <Users size={20}/> User Base
                    </Link>

                    <div className="sa-nav-label" style={{ marginTop: '20px' }}>Management</div>
                    <Link to="/superAdmin/finance" className={`sa-nav-item ${isActive('finance') ? 'active' : ''}`}>
                        <DollarSign size={20}/> Financials
                    </Link>
                    <Link to="/superAdmin/reviews" className={`sa-nav-item ${isActive('reviews') ? 'active' : ''}`}>
                        <MessageSquare size={20}/> Moderation
                    </Link>

                    {/* --- NEW LOGS LINK --- */}
                    <Link to="/superAdmin/logs" className={`sa-nav-item ${isActive('logs') ? 'active' : ''}`}>
                        <ClipboardList size={20}/> Activity Logs
                    </Link>
                    <Link to="/superAdmin/settings" className={`sa-nav-item ${isActive('settings') ? 'active' : ''}`}>
                        <Settings size={20}/> Platform Settings
                    </Link>
                </nav>

                <div className="sa-sidebar-footer">
                    <button onClick={handleLogout} className="sa-logout-btn">
                        <LogOut size={20}/> Sign Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="sa-main">
                {/* ✅ NEW: ADMIN TOP HEADER */}
                <header className="sa-topbar">
                    <h2 className="sa-topbar-title">{getPageTitle()}</h2>
                    
                    <div className="sa-topbar-actions">
                        {/* 1. Global Search (Optional visual placeholder) */}
                        <div className="sa-global-search">
                            <Search size={16} />
                            <input type="text" placeholder="Quick search..." />
                        </div>

                        {/* 2. NOTIFICATION BELL */}
                        <div className="sa-action-item">
                            <NotificationBell /> 
                        </div>

                        {/* 3. Admin Profile */}
                        <div className="sa-admin-profile">
                            <div className="sa-avatar">
                                {user?.username?.charAt(0) || 'A'}
                            </div>
                            <span className="sa-admin-name">{user?.username || 'Super Admin'}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="sa-content-scrollable">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default SuperAdminLayout;