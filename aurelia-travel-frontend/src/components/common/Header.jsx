import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Heart, User, LogOut, Settings } from 'lucide-react'
import { useUser } from '../../context/UserContext'
import axios from 'axios'
import './styles/header.css'

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearUser } = useUser()
  
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

  // Helper function for Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 18) return 'Good Afternoon!';
    return 'Good Evening!';
  }

  // Helper to get First Name
  const getFirstName = () => {
    if (!user) return '';
    const name = user.username || user.name || 'Traveler';
    return name.split(' ')[0]; 
  }

  // Logout Function
  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, {
        withCredentials: true
      });
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      clearUser();
      navigate('/auth');
    } catch (err) {
      console.error('Logout error:', err);
      clearUser();
      navigate('/auth');
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">Aurelia Travel</Link>
        <nav className="header-nav">
          <Link to="/" className={`header-nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link 
            to="/travel-plan" 
            className={`header-nav-link ${location.pathname === '/travel-plan' ? 'active' : ''}`}
          >
            Travel Plan
          </Link>
          <Link to="/hotels" className="header-nav-link">Hotels</Link>
          <Link to="/vehicles" className="header-nav-link">Vehicles</Link>
          <Link to="/about" className="header-nav-link">About</Link>
          <Link to="/contact" className="header-nav-link">Contact</Link>
        </nav>
        <div className="header-actions">
          <button className="header-action">
            <Heart className="header-icon" />
          </button>
          
          {user ? (
            <>
              {/* --- UPDATED: Greeting Stacked --- */}
              <div className="header-greeting-wrapper">
                <span className="greeting-time">{getGreeting()}</span>
                <span className="greeting-name">{getFirstName()}</span>
              </div>
              {/* --------------------------------- */}

              <div className="header-profile-container" ref={dropdownRef}>
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

                {dropdownOpen && (
                  <div className="header-dropdown">
                    <div className="dropdown-user-details">
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
                      onClick={handleLogout} 
                      className="dropdown-item dropdown-logout"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary">Login</Link>
          )}
          
        </div>
      </div>
    </header>
  )
}

export default Header