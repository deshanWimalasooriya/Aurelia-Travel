import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, MapPin, Phone, Mail } from 'lucide-react';
import api from '../../services/api'; 
import './styles/Footer.css';

const Footer = () => {
  const [siteInfo, setSiteInfo] = useState(null);

  useEffect(() => {
    // ✅ Now hits the public, unlocked endpoint
    api.get('/platform/settings/public')
      .then(res => {
        // Robust check for nested data
        const data = res.data.data || res.data;
        setSiteInfo(data);
      })
      .catch(err => {
        console.error("Failed to fetch footer settings:", err);
      });
  }, []);

  // Helper to ensure empty database strings don't break HTML links
  const getSocialLink = (url) => {
    return (url && url.trim() !== '') ? url : '#';
  };

  console.log("Footer siteInfo:", siteInfo); // Debug log to verify data structure

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
            <span>
              <MapPin size={16} /> 
              {siteInfo?.office_address}
            </span>
            <span>
              <Phone size={16} /> 
              {siteInfo?.contact_phone}
            </span>
            <span>
              <Mail size={16} /> 
              {siteInfo?.support_email}
            </span>
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
            <li><Link to="#" className="footer-link">Partner Program</Link></li>
            <li><Link to="#" className="footer-link">Careers</Link></li>
            <li><Link to="#" className="footer-link">Privacy Policy</Link></li>
            <li><Link to="#" className="footer-link">Terms of Service</Link></li>
          </ul>
        </div>
        
        {/* Social */}
        <div className="footer-section">
          <h4 className="footer-heading">Connect With Us</h4>
          <p className="footer-text" style={{ marginBottom: '15px' }}>
            Follow our journey and discover hidden gems around the world.
          </p>
          <div className="footer-social">
            <a 
              href={getSocialLink(siteInfo?.facebook_url)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-social-item"
            >
              <Facebook size={18} />
            </a>
            <a 
              href={getSocialLink(siteInfo?.twitter_url)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-social-item"
            >
              <Twitter size={18} />
            </a>
            <a 
              href={getSocialLink(siteInfo?.instagram_url)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-social-item"
            >
              <Instagram size={18} />
            </a>
            <a href="#" className="footer-social-item"><Linkedin size={18} /></a>
          </div>
        </div>
        
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Aurelia Travel Concierge. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;