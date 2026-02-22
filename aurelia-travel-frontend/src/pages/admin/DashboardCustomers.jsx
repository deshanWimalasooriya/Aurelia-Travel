import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, User, Mail, MapPin, Calendar, DollarSign, 
  Award, Star, X, TrendingUp 
} from 'lucide-react';
import './styles/dashboard-customers.css';

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
      setCustomers([
          { id: 1, username: 'Alice Freeman', email: 'alice@example.com', total_spent: 2400, total_bookings: 5, city: 'New York', country: 'USA', last_visit: '2025-12-10' },
          { id: 2, username: 'Bob Smith', email: 'bob@test.com', total_spent: 800, total_bookings: 2, city: 'London', country: 'UK', last_visit: '2026-01-15' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getGuestTier = (spent, bookings) => {
    if (spent > 2000) return { label: 'VIP Gold', color: '#b45309', bg: '#fef3c7', icon: <Award size={14}/> }; 
    if (bookings > 3) return { label: 'Loyal', color: '#1d4ed8', bg: '#dbeafe', icon: <Star size={14}/> }; 
    return { label: 'Guest', color: '#475569', bg: '#f1f5f9', icon: <User size={14}/> }; 
  };

  const filteredCustomers = customers.filter(c => 
    c.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="customers-dashboard-wrapper">
      <div className="dashboard-header">
        <div>
           <h1 className="page-title">Guest Directory</h1>
           <p className="page-subtitle">Track your most valuable customers</p>
        </div>
        
        <div className="header-actions">
            <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search guests..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className="customer-grid">
        {loading ? <p className="empty-state-cell" style={{gridColumn: '1/-1'}}>Loading guests...</p> : 
         filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => {
                const tier = getGuestTier(customer.total_spent, customer.total_bookings);
                return (
                    <motion.div 
                        key={customer.id} 
                        className="customer-card"
                        whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                        onClick={() => setSelectedCustomer(customer)}
                    >
                        <div className="card-header-badge" style={{ background: tier.bg, color: tier.color, border:`1px solid ${tier.color}30` }}>
                            {tier.icon} {tier.label}
                        </div>
                        
                        <div className="customer-avatar-large">
                            {customer.profile_image ? <img src={customer.profile_image} alt="" /> : customer.username.charAt(0).toUpperCase()}
                        </div>
                        
                        <h3 className="customer-name">{customer.username}</h3>
                        <p className="customer-email">{customer.email}</p>
                        
                        <div className="customer-stats-bar">
                            <div className="stat-block">
                                <div className="stat-label">Bookings</div>
                                <div className="stat-num">{customer.total_bookings}</div>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-block">
                                <div className="stat-label">Spent</div>
                                <div className="stat-num text-success">${customer.total_spent?.toLocaleString() || 0}</div>
                            </div>
                        </div>
                    </motion.div>
                );
            })
        ) : (
            <div className="empty-state-cell" style={{gridColumn: '1/-1'}}>No guests found.</div>
        )}
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {selectedCustomer && (
            <motion.div 
                className="dh-modal-overlay"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedCustomer(null)}
            >
                <motion.div 
                    className="dh-modal-content" style={{maxWidth: '450px', textAlign: 'center', padding: '40px'}}
                    initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                    onClick={e => e.stopPropagation()}
                >
                    <button className="dh-btn-close" onClick={() => setSelectedCustomer(null)}><X size={20}/></button>
                    
                    <div className="customer-avatar-large" style={{width:90, height:90, fontSize:'2.5rem', margin:'0 auto 20px', border:'4px solid #f1f5f9'}}>
                        {selectedCustomer.profile_image ? <img src={selectedCustomer.profile_image} alt=""/> : selectedCustomer.username.charAt(0)}
                    </div>
                    
                    <h2 className="dh-modal-title" style={{margin:0}}>{selectedCustomer.username}</h2>
                    <p style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', color:'var(--dh-text-muted)', marginTop:'8px'}}>
                        <MapPin size={14}/> {selectedCustomer.city || 'Unknown Location'}, {selectedCustomer.country}
                    </p>

                    <div className="dh-grid-2" style={{marginTop:'30px', marginBottom:'30px'}}>
                        <div className="dh-info-box" style={{textAlign:'left'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px'}}>
                                <div style={{background:'#dbeafe', color:'#2563eb', padding:'6px', borderRadius:'8px'}}><TrendingUp size={16}/></div>
                                <span className="dh-section-label" style={{margin:0}}>LTV</span>
                            </div>
                            <div style={{fontSize:'1.3rem', fontWeight:800, color:'var(--dh-text-main)'}}>${selectedCustomer.total_spent?.toLocaleString()}</div>
                        </div>
                        <div className="dh-info-box" style={{textAlign:'left'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px'}}>
                                <div style={{background:'#dcfce7', color:'#16a34a', padding:'6px', borderRadius:'8px'}}><Calendar size={16}/></div>
                                <span className="dh-section-label" style={{margin:0}}>Visits</span>
                            </div>
                            <div style={{fontSize:'1.3rem', fontWeight:800, color:'var(--dh-text-main)'}}>{selectedCustomer.total_bookings}</div>
                        </div>
                    </div>

                    <a href={`mailto:${selectedCustomer.email}`} className="btn-primary-compact" style={{width:'100%', justifyContent:'center', height:'44px'}}>
                        <Mail size={18}/> Send Offer / Email
                    </a>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default DashboardCustomers;