import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, Eye, Calendar, User, Mail, Phone, MapPin, 
  Clock, CreditCard, Search, Filter 
} from 'lucide-react';
import './styles/dashboard.css';

const DashboardBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]); // Store hotels for filter
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedHotelFilter, setSelectedHotelFilter] = useState('all'); // Hotel Filter

  const [selectedBooking, setSelectedBooking] = useState(null);

  // 1. Fetch Hotels on Mount
  useEffect(() => {
      fetchHotels();
  }, []);

  // 2. Fetch Bookings when Hotel Filter Changes
  useEffect(() => {
      fetchBookings(selectedHotelFilter);
  }, [selectedHotelFilter]);

  const fetchHotels = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/hotels/mine', { withCredentials: true });
      setHotels(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) { console.error("Error fetching hotels", err); }
  };

  const fetchBookings = async (hotelId) => {
    setLoading(true);
    try {
      let url;
      // Decide URL based on filter
      if (hotelId === 'all') {
          url = 'http://localhost:5000/api/bookings/mine';
      } else {
          url = `http://localhost:5000/api/bookings/hotel/${hotelId}`;
      }

      const res = await axios.get(url, { withCredentials: true });
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Status Change (Approve/Reject)
  const handleStatusUpdate = async (id, newStatus) => {
    if(!window.confirm(`Mark this booking as ${newStatus}?`)) return;
    try {
      await axios.put(`http://localhost:5000/api/bookings/${id}`, 
        { status: newStatus }, 
        { withCredentials: true }
      );
      // Optimistic UI Update
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      if (selectedBooking && selectedBooking.id === id) {
          setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  // Filter Logic (Status Filter)
  const filteredBookings = bookings.filter(b => 
    filterStatus === 'all' ? true : b.status === filterStatus
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bookings-page">
      <div className="table-header-action table-card" style={{marginBottom: '30px', flexDirection: 'column', alignItems: 'flex-start', gap:'20px'}}>
        <div style={{width: '100%', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
           <div>
               <h1 style={{fontSize: '1.5rem', fontWeight: 800}}>Booking Management</h1>
               <p style={{color: '#64748b'}}>Approve requests to reveal customer details</p>
           </div>
           
           {/* HOTEL FILTER DROPDOWN */}
           <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
               <label style={{fontWeight:600, color:'#64748b'}}>Filter by Hotel:</label>
               <select 
                  className="form-input" 
                  style={{width: '200px', padding:'8px'}}
                  value={selectedHotelFilter}
                  onChange={(e) => setSelectedHotelFilter(e.target.value)}
               >
                   <option value="all">All My Hotels</option>
                   {hotels.map(h => (
                       <option key={h.id} value={h.id}>{h.name}</option>
                   ))}
               </select>
           </div>
        </div>

        {/* Status Tabs */}
        <div className="tabs-container" style={{display:'flex', gap:'10px', borderBottom:'1px solid #e2e8f0', width:'100%', paddingBottom:'10px'}}>
           {['all', 'pending', 'confirmed', 'cancelled'].map(status => (
             <button 
               key={status}
               onClick={() => setFilterStatus(status)}
               style={{
                 padding: '8px 16px',
                 borderRadius: '20px',
                 border: 'none',
                 background: filterStatus === status ? '#3b82f6' : 'transparent',
                 color: filterStatus === status ? 'white' : '#64748b',
                 fontWeight: 600,
                 textTransform: 'capitalize',
                 cursor: 'pointer',
                 transition: 'all 0.2s'
               }}
             >
               {status}
             </button>
           ))}
        </div>
      </div>

      <div className="table-card">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Room & Hotel</th>
              <th>Check-in / Out</th>
              <th>Status</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign:'center', padding:'20px'}}>Loading Bookings...</td></tr>
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map(booking => (
                <tr key={booking.id}>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <div className="table-img" style={{borderRadius:'50%'}}>
                        {booking.profile_image ? <img src={booking.profile_image} alt="user" /> : <User size={20}/>}
                      </div>
                      <span style={{fontWeight: 600}}>{booking.username || 'Guest'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{fontSize:'0.9rem', fontWeight:600}}>{booking.room_title || 'Room'}</div>
                    <div style={{fontSize:'0.8rem', color:'#64748b'}}>{booking.hotel_name || 'Hotel'}</div>
                  </td>
                  <td>
                    <div style={{display:'flex', flexDirection:'column', fontSize:'0.85rem'}}>
                       <span>In: {new Date(booking.check_in).toLocaleDateString()}</span>
                       <span style={{color:'#64748b'}}>Out: {new Date(booking.check_out).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusColor(booking.status)}`} 
                          style={{padding:'4px 12px', borderRadius:'12px', fontSize:'0.8rem', fontWeight:700, textTransform:'uppercase'}}>
                      {booking.status}
                    </span>
                  </td>
                  <td style={{fontWeight:700}}>${booking.total_price}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" onClick={() => setSelectedBooking(booking)} title="View Details">
                        <Eye size={18} />
                      </button>
                      
                      {booking.status === 'pending' && (
                        <>
                          <button className="btn-icon" style={{color:'#16a34a', background:'#dcfce7', borderColor:'#16a34a'}} 
                                  onClick={() => handleStatusUpdate(booking.id, 'confirmed')} title="Approve">
                            <Check size={18} />
                          </button>
                          <button className="btn-icon" style={{color:'#dc2626', background:'#fee2e2', borderColor:'#dc2626'}} 
                                  onClick={() => handleStatusUpdate(booking.id, 'cancelled')} title="Reject">
                            <X size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
               <tr><td colSpan="6" style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>No bookings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Booking Detail Modal - Same as before */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedBooking(null)}
            style={{
                position: 'fixed', top:0, left:0, right:0, bottom:0, 
                background: 'rgba(0,0,0,0.5)', zIndex: 1000, 
                display:'flex', justifyContent:'center', alignItems:'center'
            }}
          >
            <motion.div 
               className="modal-content"
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               onClick={e => e.stopPropagation()}
               style={{
                   background: 'white', padding: '30px', borderRadius: '16px', 
                   width: '500px', maxWidth: '90%', position:'relative'
               }}
            >
               <button onClick={() => setSelectedBooking(null)} style={{position:'absolute', right:'20px', top:'20px', border:'none', background:'none', cursor:'pointer'}}><X size={24}/></button>
               
               <h2 style={{fontSize:'1.4rem', fontWeight:800, marginBottom:'5px'}}>Booking #{selectedBooking.id}</h2>
               <p className={`status-text ${selectedBooking.status}`} style={{
                   textTransform:'uppercase', fontWeight:700, fontSize:'0.85rem', color: selectedBooking.status === 'confirmed' ? '#16a34a' : '#f59e0b'
               }}>Status: {selectedBooking.status}</p>

               <div style={{marginTop:'25px', display:'flex', flexDirection:'column', gap:'15px'}}>
                   
                   {/* Guest Details Section - BLURRED IF NOT CONFIRMED */}
                   <div style={{background: '#f8fafc', padding:'15px', borderRadius:'10px', border:'1px solid #e2e8f0'}}>
                       <h3 style={{fontSize:'1rem', fontWeight:700, marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px'}}>
                           <User size={18}/> Customer Details
                       </h3>
                       {selectedBooking.status === 'confirmed' ? (
                           <div style={{fontSize:'0.9rem', display:'flex', flexDirection:'column', gap:'8px'}}>
                               <div style={{display:'flex', alignItems:'center', gap:'10px'}}><User size={16} color="#64748b"/> <strong>{selectedBooking.username}</strong></div>
                               <div style={{display:'flex', alignItems:'center', gap:'10px'}}><Mail size={16} color="#64748b"/> {selectedBooking.email}</div>
                               <div style={{display:'flex', alignItems:'center', gap:'10px'}}><Phone size={16} color="#64748b"/> {selectedBooking.phone || 'No phone provided'}</div>
                           </div>
                       ) : (
                           <div style={{filter: 'blur(4px)', userSelect:'none', opacity: 0.5}}>
                               <div style={{marginBottom:'5px'}}>John Doe</div>
                               <div style={{marginBottom:'5px'}}>johndoe@example.com</div>
                               <div>+1 234 567 8900</div>
                           </div>
                       )}
                       {selectedBooking.status !== 'confirmed' && (
                           <div style={{marginTop:'-50px', position:'relative', textAlign:'center', background:'rgba(255,255,255,0.9)', padding:'5px', borderRadius:'8px', fontSize:'0.8rem', fontWeight:600, color:'#dc2626'}}>
                               ⚠ Approve booking to view contacts
                           </div>
                       )}
                   </div>

                   {/* Room Details */}
                   <div style={{background: '#f8fafc', padding:'15px', borderRadius:'10px', border:'1px solid #e2e8f0'}}>
                        <h3 style={{fontSize:'1rem', fontWeight:700, marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px'}}>
                           <MapPin size={18}/> Reservation Info
                       </h3>
                       <p><strong>Hotel:</strong> {selectedBooking.hotel_name}</p>
                       <p><strong>Room:</strong> {selectedBooking.room_title}</p>
                       <div style={{display:'flex', gap:'20px', marginTop:'10px'}}>
                           <div>
                               <span style={{fontSize:'0.8rem', color:'#64748b', display:'block'}}>Check In</span>
                               <strong style={{fontSize:'1rem'}}>{new Date(selectedBooking.check_in).toDateString()}</strong>
                           </div>
                           <div style={{borderLeft:'1px solid #ccc', paddingLeft:'20px'}}>
                               <span style={{fontSize:'0.8rem', color:'#64748b', display:'block'}}>Check Out</span>
                               <strong style={{fontSize:'1rem'}}>{new Date(selectedBooking.check_out).toDateString()}</strong>
                           </div>
                       </div>
                   </div>
               </div>

               <div style={{marginTop:'30px', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                   {selectedBooking.status === 'pending' && (
                       <button className="btn-primary" onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}>Approve Booking</button>
                   )}
                   <button className="btn-secondary" onClick={() => setSelectedBooking(null)}>Close</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardBookings;