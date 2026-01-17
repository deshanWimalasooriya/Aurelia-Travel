import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Eye, User, Mail, Phone, MapPin } from 'lucide-react';
import './styles/dashboard.css';

const DashboardBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedHotelFilter, setSelectedHotelFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => { fetchHotels(); }, []);
  useEffect(() => { fetchBookings(selectedHotelFilter); }, [selectedHotelFilter]);

  const fetchHotels = async () => {
    try {
      const res = await api.get('/hotels/mine');
      setHotels(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) { console.error("Error fetching hotels", err); }
  };

  const fetchBookings = async (hotelId) => {
    setLoading(true);
    try {
      // ✅ Correct endpoint: /bookings/manager/all (from bookingRoutes.js Phase 3)
      // Note: If you want specific hotel filtering on backend, the route was /bookings/hotel/:id
      let url = hotelId === 'all' ? '/bookings/manager/all' : `/bookings/hotel/${hotelId}`;
      const res = await api.get(url);
      setBookings(Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      console.error("Failed to fetch bookings", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    if(!window.confirm(`Mark this booking as ${newStatus}?`)) return;
    try {
      await api.put(`/bookings/${id}/status`, { status: newStatus });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      if (selectedBooking?.id === id) setSelectedBooking({ ...selectedBooking, status: newStatus });
    } catch (err) {
      alert("Failed to update status");
    }
  };

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
           <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
               <label style={{fontWeight:600, color:'#64748b'}}>Filter by Hotel:</label>
               <select 
                  className="form-input" 
                  style={{width: '200px', padding:'8px'}}
                  value={selectedHotelFilter}
                  onChange={(e) => setSelectedHotelFilter(e.target.value)}
               >
                   <option value="all">All My Hotels</option>
                   {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
               </select>
           </div>
        </div>

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
            <tr><th>Guest</th><th>Room & Hotel</th><th>Dates</th><th>Status</th><th>Total</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center p-8">Loading Bookings...</td></tr>
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map(booking => (
                <tr key={booking.id}>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <div className="table-img" style={{borderRadius:'50%'}}>
                        {booking.profile_image ? <img src={booking.profile_image} alt="user" /> : <User size={20}/>}
                      </div>
                      <span style={{fontWeight: 600}}>{booking.guest_name || booking.username || 'Guest'}</span>
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
                      <button className="btn-icon" onClick={() => setSelectedBooking(booking)} title="View Details"><Eye size={18} /></button>
                      {booking.status === 'pending' && (
                        <>
                          <button className="btn-icon" style={{color:'#16a34a', background:'#dcfce7'}} onClick={() => handleStatusUpdate(booking.id, 'confirmed')}><Check size={18} /></button>
                          <button className="btn-icon" style={{color:'#dc2626', background:'#fee2e2'}} onClick={() => handleStatusUpdate(booking.id, 'cancelled')}><X size={18} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
               <tr><td colSpan="6" className="text-center p-8 text-gray-500">No bookings found for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedBooking && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div 
               className="modal-content"
               initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
               onClick={e => e.stopPropagation()}
            >
               <button className="modal-close" onClick={() => setSelectedBooking(null)}><X size={24}/></button>
               <h2>Booking #{selectedBooking.booking_reference || selectedBooking.id}</h2>
               
               <div style={{marginTop:'20px', padding:'15px', background:'#f8fafc', borderRadius:'10px'}}>
                   <h3><User size={18}/> Guest Details</h3>
                   <div style={{marginTop:'10px'}}>
                       <p><strong>Name:</strong> {selectedBooking.guest_name || selectedBooking.username}</p>
                       <p><strong>Email:</strong> {selectedBooking.guest_email || selectedBooking.email}</p>
                   </div>
               </div>

               <div style={{marginTop:'15px', padding:'15px', background:'#f8fafc', borderRadius:'10px'}}>
                   <h3><MapPin size={18}/> Stay Details</h3>
                   <p><strong>Hotel:</strong> {selectedBooking.hotel_name}</p>
                   <p><strong>Room:</strong> {selectedBooking.room_title}</p>
                   <p><strong>Check-In:</strong> {new Date(selectedBooking.check_in).toDateString()}</p>
                   <p><strong>Check-Out:</strong> {new Date(selectedBooking.check_out).toDateString()}</p>
               </div>

               <div style={{marginTop:'20px', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                   {selectedBooking.status === 'pending' && (
                       <button className="btn-primary" onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}>Approve</button>
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