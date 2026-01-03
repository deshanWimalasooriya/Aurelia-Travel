import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import './styles/contact.css';

const Contact = () => {
  const [status, setStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');
    // Simulate API call
    setTimeout(() => {
      setStatus('sent');
      alert("Thank you! We will get back to you shortly.");
    }, 1500);
  };

  return (
    <motion.div 
      className="contact-page container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="contact-header">
        <h1>Get in Touch</h1>
        <p>Have a question about your itinerary or need technical support?</p>
      </div>

      <div className="contact-grid">
        {/* Contact Info Card */}
        <div className="contact-info-card">
          <h3>Contact Information</h3>
          <div className="info-item">
            <Mail className="info-icon" />
            <div>
              <span className="label">Email</span>
              <p>support@aureliatravel.com</p>
            </div>
          </div>
          <div className="info-item">
            <Phone className="info-icon" />
            <div>
              <span className="label">Phone</span>
              <p>+94 11 234 5678</p>
            </div>
          </div>
          <div className="info-item">
            <MapPin className="info-icon" />
            <div>
              <span className="label">Office</span>
              <p>Colombo, Sri Lanka</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" required className="form-input" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="john@example.com" required className="form-input" />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea placeholder="How can we help you?" rows="5" required className="form-input"></textarea>
            </div>
            <button type="submit" className="btn-primary full-width" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending...' : <><Send size={18} /> Send Message</>}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default Contact;