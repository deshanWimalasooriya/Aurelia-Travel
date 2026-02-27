import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
// ✅ Imported MessageSquare for the new Reviews Tab
import { Search, Heart, User, LogOut, Settings, LayoutDashboard, Building2, Menu, X, MessageSquare, Plane, Ticket } from 'lucide-react' 
import { useUser } from '../../context/userContext'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import NotificationBell from '../ui/NotificationBell'
import axios from 'axios'
import './styles/Header.css'
import { useWishlist } from '../../context/WishlistContext';

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  const { user, clearUser, isAdmin, isManager } = useUser()
  const { checkAuth } = useAuth();
  const { wishlist } = useWishlist();
  
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false) 
  const dropdownRef = useRef(null)

  // Close profile dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-close mobile menu when changing pages
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 18) return 'Good Afternoon,';
    return 'Good Evening,';
  }

  const getFirstName = () => {
    if (!user) return '';
    const name = user.username || user.name || 'Traveler';
    return name.split(' ')[0]; 
  }

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, {
        withCredentials: true
      });
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      clearUser();
      await checkAuth();
      navigate('/auth');
    } catch (err) {
      console.error('Logout error:', err);
      clearUser();
      await checkAuth();
      navigate('/auth');
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Brand Logo */}
        <Link to="/" className="header-logo">
          Aurelia<span>Travel</span>
        </Link>

        {/* Center Navigation (Hidden on Mobile) */}
        <nav className="header-nav">
          <Link to="/" className={`header-nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/travel-plan" className={`header-nav-link ${location.pathname === '/travel-plan' ? 'active' : ''}`}>Smart Plan</Link>
          <Link to="/hotel-showcase" className={`header-nav-link ${location.pathname.includes('/hotel') ? 'active' : ''}`}>Hotels</Link>
          <Link to="/about" className={`header-nav-link ${location.pathname === '/about' ? 'active' : ''}`}>About</Link>
          <Link to="/contact" className={`header-nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
        </nav>

        {/* Right Actions */}
        <div className="header-actions">
          
          <Link to="/profile" state={{ view: 'saved_lists' }} className="header-icon">
              <Heart size={24} />
              {/* your badge logic here if you have one */}
          </Link>

          <div className="header-action-btn">
            <NotificationBell />
          </div>
          
          {user ? (
            <div className="header-user-section">
              <div className="header-greeting-wrapper">
                <span className="greeting-time">{getGreeting()}</span>
                <span className="greeting-name">{getFirstName()}</span>
              </div>

              <div className="header-profile-container" ref={dropdownRef}>
                <button 
                  className="header-profile-btn" 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {user.profile_image ? (
                    <img src={user.profile_image} alt="Profile" className="header-profile-img" />
                  ) : (
                    <div className="header-profile-placeholder">
                      <User size={18} className="header-profile-icon-default" />
                    </div>
                  )}
                </button>

                {/* Desktop Profile Dropdown */}
                <div className={`header-dropdown ${dropdownOpen ? 'open' : ''}`}>
                  <div className="dropdown-user-details">
                    <span className="dropdown-username">{user.name || user.username || 'User'}</span>
                    <span className="dropdown-email">{user.email}</span>
                    <span className={`dropdown-role-badge ${isManager ? 'manager' : isAdmin ? 'admin' : ''}`}>
                      {isManager ? 'Hotel Partner' : (isAdmin ? 'Admin' : 'Traveler')}
                    </span>
                  </div>
                  
                  <div className="dropdown-divider"></div>

                  {/* ✅ UPDATED: Changed text to "My Account" */}
                  <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <User size={16} /> My Account
                  </Link>

                  {/* ✅ NEW: Reviews Tab */}
                  <Link to="/my-reviews" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <MessageSquare size={16} /> My Reviews
                  </Link>

                  {/* ✅ NEW: My Bookings Tab */}
                  <Link to="/my-bookings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <Ticket size={16} /> My Bookings
                  </Link>

                  <Link to="/wishlist" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <Heart size={16} /> Saved Properties
                  </Link>
                  
                  {(isManager || isAdmin) && (
                    <Link to="/admin" className="dropdown-item highlight-item" onClick={() => setDropdownOpen(false)}>
                      <Building2 size={16} /> Manager Dashboard
                    </Link>
                  )}
                  
                  {isAdmin && (
                    <Link to="/superAdmin" className="dropdown-item admin-item" onClick={() => setDropdownOpen(false)}>
                      <LayoutDashboard size={16} /> System Admin
                    </Link>
                  )}
                  
                  <div className="dropdown-divider"></div>

                  <button onClick={handleLogout} className="dropdown-item dropdown-logout">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/auth" className="btn-auth-login desktop-auth-btn">Sign In</Link>
          )}
          
          {/* Mobile Menu Toggle Button */}
          <button 
             className="mobile-menu-btn" 
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
             aria-label="Toggle Menu"
          >
             {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>

        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      <div className={`mobile-nav-overlay ${mobileMenuOpen ? 'open' : ''}`}>
        <nav className="mobile-nav-links">
          <Link to="/" className={`mobile-nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/travel-plan" className={`mobile-nav-link ${location.pathname === '/travel-plan' ? 'active' : ''}`}>Smart Plan</Link>
          <Link to="/hotel-showcase" className={`mobile-nav-link ${location.pathname.includes('/hotel') ? 'active' : ''}`}>Hotels</Link>
          <Link to="/about" className={`mobile-nav-link ${location.pathname === '/about' ? 'active' : ''}`}>About</Link>
          <Link to="/contact" className={`mobile-nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
          
          {/* If logged out, show Sign In button in the mobile menu */}
          {!user && (
            <Link to="/auth" className="btn-auth-login mobile-auth-btn">Sign In</Link>
          )}
        </nav>
      </div>

    </header>
  )
}

export default Header