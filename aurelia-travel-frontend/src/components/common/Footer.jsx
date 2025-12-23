import './styles/Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-title">Aurelia Travel</h3>
          <p className="footer-text">Your journey starts here. Book the perfect stay with ease.</p>
        </div>
        
        <div className="footer-section">
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-links">
            <li><a href="#" className="footer-link">Hotels</a></li>
            <li><a href="#" className="footer-link">About</a></li>
            <li><a href="#" className="footer-link">Contact</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4 className="footer-heading">Company</h4>
          <ul className="footer-links">
            <li><a href="#" className="footer-link">Careers</a></li>
            <li><a href="#" className="footer-link">Privacy</a></li>
            <li><a href="#" className="footer-link">Terms</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4 className="footer-heading">Follow Us</h4>
          <div className="footer-social">
            <a href="#" className="footer-social-item">f</a>
            <a href="#" className="footer-social-item">t</a>
            <a href="#" className="footer-social-item">i</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 Aurelia Travel. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
