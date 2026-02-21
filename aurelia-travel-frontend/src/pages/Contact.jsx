import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useUser } from '../context/userContext'; 
import api from '../services/api'; // ✅ Imported your API service
import './styles/contact.css';

const Contact = () => {
  const { user } = useUser(); 
  const [status, setStatus] = useState('');
  
  // ✅ State to hold company contact info from backend
  const [siteInfo, setSiteInfo] = useState(null);

  // Controlled form state for the user messaging
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    api.get('/platform/settings/public')
      .then(res => {
         const data = res.data.data || res.data;
         setSiteInfo(data);
      })
      .catch(err => console.error("Failed to fetch site contact info:", err));
  }, []);

  // Populate the form fields once the logged-in user data is available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.username || user.first_name || '', 
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    
    try {
      // ✅ Call the new API endpoint
      const response = await api.post('/platform/contact', {
        name: formData.fullName,
        email: formData.email,
        message: formData.message
      });

      if (response.data.success) {
        setStatus('sent');
        alert("Thank you! Your message has been sent to our team.");
        setFormData(prev => ({ ...prev, message: '' })); // Clear message input
      }
    } catch (err) {
      console.error("Message Error:", err);
      alert("Failed to send message. Please try again later.");
    } finally {
      setStatus('');
    }
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
            <div className="info-icon"><Mail size={24} /></div>
            <div>
              <span className="label">Email</span>
              {/* ✅ Dynamic Email */}
              <p>{siteInfo?.support_email}</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon"><Phone size={24} /></div>
            <div>
              <span className="label">Phone</span>
              {/* ✅ Dynamic Phone */}
              <p>{siteInfo?.contact_phone}</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon"><MapPin size={24} /></div>
            <div>
              <span className="label">Office</span>
              {/* ✅ Dynamic Address */}
              <p>{siteInfo?.office_address}</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe" 
                required 
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com" 
                required 
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea 
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="How can we help you?" 
                rows="5" 
                required 
                className="form-input"
              ></textarea>
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