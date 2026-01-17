import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, User, Mail, MapPin, Calendar, DollarSign, 
  Award, Star, ExternalLink, X, TrendingUp 
} from 'lucide-react';
import './styles/dashboard.css';

const DashboardCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users/my-customers', { withCredentials: true });
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Logic to determine Guest Tier
  const getGuestTier = (spent, bookings) => {
    if (spent > 2000) return { label: 'VIP', color: '#7c3aed', bg: '#f3e8ff', icon: <Award size={14}/> }; // Purple
    if (bookings > 3) return { label: 'Loyal', color: '#059669', bg: '#d1fae5', icon: <Star size={14}/> }; // Green
    return { label: 'Guest', color: '#64748b', bg: '#f1f5f9', icon: <User size={14}/> }; // Grey
  };

  const filteredCustomers = customers.filter(c => 
    c.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="customers-page">
      {/* HEADER SECTION */}
      <div className="table-header-action table-card" style={{marginBottom: '30px'}}>
        <div>
           <h1 style={{fontSize: '1.5rem', fontWeight: 800}}>Customer Relationship</h1>
           <p style={{color: '#64748b'}}>Track your most valuable guests</p>
        </div>
        
        <div className="search-box-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* CUSTOMER GRID */}
      <div className="customer-grid">
        {loading ? (
            <p style={{gridColumn: '1/-1', textAlign:'center', padding:'40px'}}>Loading Customers...</p>
        ) : filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => {
                const tier = getGuestTier(customer.total_spent, customer.total_bookings);
                return (
                    <motion.div 
                        key={customer.id} 
                        className="customer-card"
                        whileHover={{ y: -5 }}
                        onClick={() => setSelectedCustomer(customer)}
                    >
                        <div className="card-header-badge" style={{ background: tier.bg, color: tier.color }}>
                            {tier.icon} {tier.label}
                        </div>
                        
                        <div className="customer-avatar-large">
                            {customer.profile_image ? (
                                <img src={customer.profile_image} alt={customer.username} />
                            ) : (
                                <span>{customer.username.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        
                        <h3 className="customer-name">{customer.username}</h3>
                        <p className="customer-email">{customer.email}</p>
                        
                        <div className="customer-stats-row">
                            <div className="stat-item">
                                <span className="label">Bookings</span>
                                <span className="value">{customer.total_bookings}</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="label">Spent</span>
                                <span className="value text-green">${customer.total_spent?.toLocaleString() || 0}</span>
                            </div>
                        </div>

                        <div className="last-seen">
                            <Calendar size={12}/> 
                            Last visit: {new Date(customer.last_visit).toLocaleDateString()}
                        </div>
                    </motion.div>
                );
            })
        ) : (
            <div style={{gridColumn: '1/-1', textAlign:'center', color:'#94a3b8', padding:'40px'}}>
                No customers found matching "{searchTerm}"
            </div>
        )}
      </div>

      {/* CUSTOMER DETAIL MODAL */}
      <AnimatePresence>
        {selectedCustomer && (
            <motion.div 
                className="modal-overlay"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedCustomer(null)}
            >
                <motion.div 
                    className="modal-content profile-modal"
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                >
                    <button className="close-btn" onClick={() => setSelectedCustomer(null)}><X size={24}/></button>
                    
                    <div className="modal-profile-header">
                        <div className="profile-img-xl">
                            {selectedCustomer.profile_image ? <img src={selectedCustomer.profile_image} /> : selectedCustomer.username.charAt(0)}
                        </div>
                        <div>
                            <h2>{selectedCustomer.username}</h2>
                            <p className="flex-center"><MapPin size={14}/> {selectedCustomer.city || 'Unknown City'}, {selectedCustomer.country || 'International'}</p>
                        </div>
                    </div>

                    <div className="modal-stats-grid">
                        <div className="modal-stat-box">
                            <div className="icon bg-blue"><TrendingUp size={20}/></div>
                            <div>
                                <h3>Total Value</h3>
                                <p>${selectedCustomer.total_spent?.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="modal-stat-box">
                            <div className="icon bg-green"><Calendar size={20}/></div>
                            <div>
                                <h3>Total Stays</h3>
                                <p>{selectedCustomer.total_bookings} Bookings</p>
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <a href={`mailto:${selectedCustomer.email}`} className="btn-primary full-width">
                            <Mail size={18}/> Send Email Offer
                        </a>
                        <button className="btn-secondary full-width">
                            View Booking History
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardCustomers;