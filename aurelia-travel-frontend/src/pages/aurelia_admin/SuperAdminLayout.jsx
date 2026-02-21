import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Users, DollarSign, 
  MessageSquare, Settings, LogOut, ShieldCheck, Search, ClipboardList, Inbox 
} from 'lucide-react';
import NotificationBell from '../../components/ui/NotificationBell'; 
import { useAuth } from '../../context/AuthContext'; 
import api from '../../services/api'; // ✅ Import API to fetch messages
import './styles/super-admin.css';

const SuperAdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth(); 
    
    // ✅ State for Inbox Badge
    const [unreadMessages, setUnreadMessages] = useState(0);

    // ✅ Fetch Unread Messages Count
    useEffect(() => {
        const fetchMessageCount = async () => {
            try {
                const res = await api.get('/platform/messages');
                if (res.data.success) {
                    const count = res.data.data.filter(m => m.status === 'unread').length;
                    setUnreadMessages(count);
                }
            } catch (err) {
                console.error("Failed to fetch message count", err);
            }
        };
        fetchMessageCount();
        
        // Auto-refresh the count every 30 seconds
        const interval = setInterval(fetchMessageCount, 30000);
        return () => clearInterval(interval);
    }, [location.pathname]); // Re-fetches when changing pages

    const handleLogout = async () => {
        navigate('/profile');
    };

    const isActive = (path) => {
        if (path === '/superAdmin') return location.pathname === '/superAdmin';
        return location.pathname.includes(path);
    };

    const getPageTitle = () => {
        if(location.pathname.includes('hotels')) return 'Hotel Management';
        if(location.pathname.includes('users')) return 'User Base';
        if(location.pathname.includes('finance')) return 'Financial Overview';
        if(location.pathname.includes('reviews')) return 'Moderation';
        if(location.pathname.includes('logs')) return 'System Logs'; 
        if(location.pathname.includes('settings')) return 'Platform Settings';
        if(location.pathname.includes('messages')) return 'Support Inbox';
        return 'Dashboard Overview';
    };

    const displayCount = unreadMessages > 99 ? '99+' : unreadMessages;

    return (
        <div className="super-dashboard-wrapper">
            {/* SIDEBAR */}
            <aside className="sa-sidebar">
                <div className="sa-brand">
                    <ShieldCheck size={28} className="brand-icon" />
                    Aurelia <span>Admin</span>
                </div>
                
                <nav className="sa-nav-container">
                    <div className="sa-nav-label">Main Menu</div>
                    <Link to="/superAdmin" className={`sa-nav-item ${isActive('/superAdmin') ? 'active' : ''}`}>
                        <LayoutDashboard size={20}/> Overview
                    </Link>
                    
                    {/* ✅ INBOX TAB WITH BADGE */}
                    <Link to="/superAdmin/messages" className={`sa-nav-item ${isActive('messages') ? 'active' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Inbox size={20}/> Inbox
                        </div>
                        {unreadMessages > 0 && (
                            <span className="sa-nav-badge">{displayCount}</span>
                        )}
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
                <header className="sa-topbar">
                    <h2 className="sa-topbar-title">{getPageTitle()}</h2>
                    
                    <div className="sa-topbar-actions">
                        <div className="sa-global-search">
                            <Search size={16} />
                            <input type="text" placeholder="Quick search..." />
                        </div>

                        <div className="sa-action-item">
                            <NotificationBell /> 
                        </div>

                        <div className="sa-admin-profile">
                            <div className="sa-avatar">
                                {user?.username?.charAt(0).toUpperCase() || 'A'}
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