import { useState, useRef, useEffect } from 'react' // Added hooks
import { Link, useLocation } from 'react-router-dom'
import { Search, Heart, User, LogOut, Settings } from 'lucide-react' // Added LogOut & Settings
import { useAuth } from '../../context/AuthContext'
import './styles/header.css'

const Header = () => {
  const location = useLocation()
  const { user, logout } = useAuth()
  
  // State for Dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">Aurelia Travel</Link>
        <nav className="header-nav">
          <Link to="/" className={`header-nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/hotels" className="header-nav-link">Hotels</Link>
          <Link to="/vehicles" className="header-nav-link">Vehicles</Link>
          <Link to="/about" className="header-nav-link">About</Link>
          <Link to="/contact" className="header-nav-link">Contact</Link>
        </nav>
        <div className="header-actions">
          <button className="header-action">
            <Heart className="header-icon" />
          </button>
          <button className="header-action">
            <Search className="header-icon" />
          </button>
          
          {/* --- UPDATED SECTION START --- */}
          {user ? (
            <div className="header-profile-container" ref={dropdownRef}>
              {/* Profile Icon Button */}
              <button 
                className="header-profile-btn" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {user.profile_image ? (
                  <img 
                    src={user.profile_image} 
                    alt="Profile" 
                    className="header-profile-img" 
                  />
                ) : (
                  <div className="header-profile-placeholder">
                    <User className="header-profile-icon-default" />
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="header-dropdown">
                  <div className="dropdown-user-details">
                    {/* Fallback to 'User' if name is missing */}
                    <span className="dropdown-username">{user.name || user.username || 'User'}</span>
                    <span className="dropdown-email">{user.email}</span>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <Link 
                    to="/profile" 
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={16} />
                    Profile
                  </Link>
                  
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }} 
                    className="dropdown-item dropdown-logout"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary">Login</Link>
          )}
          {/* --- UPDATED SECTION END --- */}
          
        </div>
      </div>
    </header>
  )
}

export default Header