import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Linkedin, MapPin, Phone, Mail } from 'lucide-react'
import './styles/Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* Brand Section */}
        <div className="footer-section brand-section">
          <Link to="/" className="footer-logo">Aurelia<span>Travel</span></Link>
          <p className="footer-text">
            The world's first AI-powered travel concierge. We handle the logistics, you handle the memories.
          </p>
          <div className="footer-contact-info">
            <span><MapPin size={16} /> Colombo, Sri Lanka</span>
            <span><Phone size={16} /> +94 11 234 5678</span>
            <span><Mail size={16} /> concierge@aureliatravel.com</span>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="footer-section">
          <h4 className="footer-heading">Discover</h4>
          <ul className="footer-links">
            <li><Link to="/travel-plan" className="footer-link">Smart Planner</Link></li>
            <li><Link to="/hotel-showcase" className="footer-link">Luxury Stays</Link></li>
            <li><Link to="/about" className="footer-link">Our Story</Link></li>
            <li><Link to="/contact" className="footer-link">Contact Support</Link></li>
          </ul>
        </div>
        
        {/* Company */}
        <div className="footer-section">
          <h4 className="footer-heading">Company</h4>
          <ul className="footer-links">
            <li><a href="#" className="footer-link">Partner Program</a></li>
            <li><a href="#" className="footer-link">Careers</a></li>
            <li><a href="#" className="footer-link">Privacy Policy</a></li>
            <li><a href="#" className="footer-link">Terms of Service</a></li>
          </ul>
        </div>
        
        {/* Social */}
        <div className="footer-section">
          <h4 className="footer-heading">Connect With Us</h4>
          <p className="footer-text" style={{ marginBottom: '15px' }}>
            Follow our journey and discover hidden gems around the world.
          </p>
          <div className="footer-social">
            <a href="#" className="footer-social-item"><Facebook size={18} /></a>
            <a href="#" className="footer-social-item"><Twitter size={18} /></a>
            <a href="#" className="footer-social-item"><Instagram size={18} /></a>
            <a href="#" className="footer-social-item"><Linkedin size={18} /></a>
          </div>
        </div>
        
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Aurelia Travel Concierge. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer