import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, Scale, ChevronRight, Send, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import './styles/SafetyCenter.css'; // We can reuse the same layout CSS!

const DisputeResolution = () => {
  const [form, setForm] = useState({
    hotel_id: '', // Optional: If they have a specific booking to dispute
    booking_id: '',
    type: 'complaint', // default
    subject: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Sending the ticket to your crmController.js backend
      await axios.post('http://localhost:5000/api/support', form, {
        withCredentials: true
      });
      
      setMessage({ type: 'success', text: 'Your dispute ticket has been successfully submitted. Our team will contact you shortly.' });
      setForm({ hotel_id: '', booking_id: '', type: 'complaint', subject: '', description: '' }); // Reset form
      
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit ticket. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="safety-page-wrapper">

      <div className="safety-layout">

        {/* RIGHT MAIN CONTENT: The Dispute Form */}
        <main className="safety-main-content">
          <div className="safety-header">
            <h1>Dispute Resolution</h1>
            <p>If you experienced an issue with a booking, payment, or host, open a formal dispute ticket here.</p>
          </div>

          <div className="guidelines-box" style={{ marginTop: '0' }}>
            <form onSubmit={handleSubmit} className="modern-form">
              
              <div className="input-group">
                <label>Issue Type</label>
                <select 
                  className="modern-input" 
                  value={form.type} 
                  onChange={e => setForm({...form, type: e.target.value})}
                  required
                >
                  <option value="complaint">Complaint (Service/Host Issue)</option>
                  <option value="inquiry">Payment / Billing Dispute</option>
                  <option value="suggestion">General Platform Issue</option>
                </select>
              </div>

              <div className="input-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  className="modern-input" 
                  placeholder="Briefly describe the issue..."
                  value={form.subject}
                  onChange={e => setForm({...form, subject: e.target.value})}
                  required 
                />
              </div>

              {/* Optional Fields for specific bookings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="input-group">
                  <label>Hotel ID (Optional)</label>
                  <input 
                    type="number" 
                    className="modern-input" 
                    placeholder="e.g., 102"
                    value={form.hotel_id}
                    onChange={e => setForm({...form, hotel_id: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label>Booking ID (Optional)</label>
                  <input 
                    type="number" 
                    className="modern-input" 
                    placeholder="e.g., 405"
                    value={form.booking_id}
                    onChange={e => setForm({...form, booking_id: e.target.value})}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Detailed Description</label>
                <textarea 
                  className="modern-input" 
                  rows="5" 
                  placeholder="Please provide as much detail as possible so our moderation team can investigate..."
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  required 
                />
              </div>

              {/* Status Messages */}
              {message.text && (
                <div className={`error-banner ${message.type === 'success' ? 'success-banner' : ''}`} style={message.type === 'success' ? { backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' } : {}}>
                  {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  <span>{message.text}</span>
                </div>
              )}

              <button type="submit" className="submit-btn-animated" disabled={loading} style={{ maxWidth: '250px' }}>
                <span>{loading ? 'Submitting...' : 'Submit Ticket'}</span>
                {!loading && <Send size={18} />}
              </button>

            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DisputeResolution;