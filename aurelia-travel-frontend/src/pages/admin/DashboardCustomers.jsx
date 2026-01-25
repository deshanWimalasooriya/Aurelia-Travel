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
      // Use your configured api client instead of axios directly if possible
      const res = await axios.get('http://localhost:5000/api/users/my-customers', { withCredentials: true });
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
      // Fallback data for preview if API fails
      setCustomers([
          { id: 1, username: 'Alice Freeman', email: 'alice@example.com', total_spent: 2400, total_bookings: 5, city: 'New York', country: 'USA', last_visit: '2025-12-10' },
          { id: 2, username: 'Bob Smith', email: 'bob@test.com', total_spent: 800, total_bookings: 2, city: 'London', country: 'UK', last_visit: '2026-01-15' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getGuestTier = (spent, bookings) => {
    if (spent > 2000) return { label: 'VIP Gold', color: '#d97706', bg: '#fffbeb', icon: <Award size={14}/> }; 
    if (bookings > 3) return { label: 'Loyal', color: '#0f172a', bg: '#f1f5f9', icon: <Star size={14}/> }; 
    return { label: 'Guest', color: '#64748b', bg: '#ffffff', icon: <User size={14}/> }; 
  };

  const filteredCustomers = customers.filter(c => 
    c.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="customers-page">
      <div className="table-header-action table-card" style={{marginBottom: '30px', justifyContent:'space-between'}}>
        <div>
           <h1 style={{fontSize: '1.5rem', fontWeight: 800, margin:0, color:'#0f172a'}}>Guest List</h1>
           <p style={{color: '#64748b', margin:'5px 0 0'}}>Track your most valuable customers</p>
        </div>
        
        <div style={{position:'relative', width:'300px'}}>
            <Search size={18} style={{position:'absolute', left:14, top:12, color:'#94a3b8'}} />
            <input 
              type="text" 
              placeholder="Search guests..." 
              className="form-input"
              style={{paddingLeft:'40px', borderRadius:'20px'}}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="customer-grid">
        {loading ? <p style={{gridColumn: '1/-1', textAlign:'center'}}>Loading...</p> : 
         filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => {
                const tier = getGuestTier(customer.total_spent, customer.total_bookings);
                return (
                    <motion.div 
                        key={customer.id} 
                        className="customer-card"
                        whileHover={{ y: -6 }}
                        onClick={() => setSelectedCustomer(customer)}
                    >
                        <div className="card-header-badge" style={{ background: tier.bg, color: tier.color, border:`1px solid ${tier.color}20` }}>
                            {tier.icon} {tier.label}
                        </div>
                        
                        <div className="customer-avatar-large" style={{borderColor: tier.color}}>
                            {customer.profile_image ? <img src={customer.profile_image} alt="" /> : customer.username.charAt(0).toUpperCase()}
                        </div>
                        
                        <h3 style={{margin:'0 0 5px', fontSize:'1.1rem', color:'#0f172a'}}>{customer.username}</h3>
                        <p style={{margin:'0 0 20px', color:'#64748b', fontSize:'0.9rem'}}>{customer.email}</p>
                        
                        <div style={{display:'flex', justifyContent:'space-between', background:'#f8fafc', padding:'12px', borderRadius:'12px'}}>
                            <div style={{textAlign:'center', flex:1}}>
                                <div style={{fontSize:'0.75rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase'}}>Bookings</div>
                                <div style={{fontSize:'1rem', fontWeight:800, color:'#0f172a'}}>{customer.total_bookings}</div>
                            </div>
                            <div style={{width:1, background:'#e2e8f0'}}></div>
                            <div style={{textAlign:'center', flex:1}}>
                                <div style={{fontSize:'0.75rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase'}}>Spent</div>
                                <div style={{fontSize:'1rem', fontWeight:800, color:'#059669'}}>${customer.total_spent?.toLocaleString() || 0}</div>
                            </div>
                        </div>
                    </motion.div>
                );
            })
        ) : (
            <div style={{gridColumn: '1/-1', textAlign:'center', color:'#94a3b8', padding:'40px'}}>No guests found.</div>
        )}
      </div>

      <AnimatePresence>
        {selectedCustomer && (
            <motion.div 
                className="modal-overlay" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center'}}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedCustomer(null)}
            >
                <motion.div 
                    className="form-container" style={{width:'400px', margin:0, textAlign:'center', position:'relative'}}
                    initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={() => setSelectedCustomer(null)} style={{position:'absolute', top:20, right:20, border:'none', background:'none', cursor:'pointer'}}><X size={20} color="#64748b"/></button>
                    
                    <div className="customer-avatar-large" style={{width:100, height:100, fontSize:'2.5rem', margin:'0 auto 20px', background:'#0f172a', color:'#f59e0b', borderColor:'#f59e0b'}}>
                        {selectedCustomer.profile_image ? <img src={selectedCustomer.profile_image} /> : selectedCustomer.username.charAt(0)}
                    </div>
                    
                    <h2 style={{margin:0, color:'#0f172a'}}>{selectedCustomer.username}</h2>
                    <p style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', color:'#64748b', marginTop:'5px'}}>
                        <MapPin size={14}/> {selectedCustomer.city || 'Unknown'}, {selectedCustomer.country}
                    </p>

                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginTop:'30px', marginBottom:'30px'}}>
                        <div style={{background:'#f8fafc', padding:'15px', borderRadius:'12px', textAlign:'left'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px'}}>
                                <div style={{background:'#dbeafe', color:'#2563eb', padding:'6px', borderRadius:'8px'}}><TrendingUp size={16}/></div>
                                <span style={{fontSize:'0.8rem', fontWeight:600, color:'#64748b'}}>LTV</span>
                            </div>
                            <div style={{fontSize:'1.2rem', fontWeight:800, color:'#0f172a'}}>${selectedCustomer.total_spent?.toLocaleString()}</div>
                        </div>
                        <div style={{background:'#f8fafc', padding:'15px', borderRadius:'12px', textAlign:'left'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px'}}>
                                <div style={{background:'#dcfce7', color:'#059669', padding:'6px', borderRadius:'8px'}}><Calendar size={16}/></div>
                                <span style={{fontSize:'0.8rem', fontWeight:600, color:'#64748b'}}>VISITS</span>
                            </div>
                            <div style={{fontSize:'1.2rem', fontWeight:800, color:'#0f172a'}}>{selectedCustomer.total_bookings}</div>
                        </div>
                    </div>

                    <a href={`mailto:${selectedCustomer.email}`} className="btn-primary" style={{width:'100%', justifyContent:'center'}}>
                        <Mail size={18}/> Send Offer
                    </a>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default DashboardCustomers;