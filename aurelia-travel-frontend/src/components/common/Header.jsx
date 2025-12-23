import { Link, useLocation } from 'react-router-dom'
import { Search, Heart, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './styles/header.css'

const Header = () => {
  const location = useLocation()
  const { user, logout } = useAuth()
  
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
          {user ? (
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <button onClick={logout} className="btn btn-primary">Logout</button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary">Login</Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
