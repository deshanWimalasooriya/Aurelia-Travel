import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  DollarSign, 
  MessageSquare, 
  Settings, 
  LogOut, 
  ShieldCheck 
} from 'lucide-react';
import './styles/super-admin.css';

const SuperAdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear auth data (adjust key names based on your AuthContext)
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login
        navigate('/login');
    };

    // Helper to check active state
    const isActive = (path) => {
        if (path === '/superAdmin') {
            return location.pathname === '/superAdmin';
        }
        return location.pathname.includes(path);
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
                    
                    <Link to="/superAdmin/settings" className={`sa-nav-item ${isActive('settings') ? 'active' : ''}`}>
                        <Settings size={20}/> Platform Settings
                    </Link>
                </nav>

                <div className="sa-sidebar-footer" style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button onClick={handleLogout} className="sa-logout-btn">
                        <LogOut size={20}/> Sign Out
                    </button>
                    <div style={{ marginTop: '15px', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                        Super Admin v1.0
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="sa-main">
                {/* You can add a top header here if needed, but for now we render the page directly */}
                <Outlet />
            </main>
        </div>
    );
};

export default SuperAdminLayout;