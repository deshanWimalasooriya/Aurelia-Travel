import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Eye, User, Mail, Calendar, MapPin, Filter } from 'lucide-react';
import './styles/dashboard-bookings.css';

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
      setHotels(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err) { console.error(err); }
  };

  const fetchBookings = async (hotelId) => {
    setLoading(true);
    try {
      let url = hotelId === 'all' ? '/bookings/manager/all' : `/bookings/hotel/${hotelId}`;
      const res = await api.get(url);
      setBookings(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err) { setBookings([]); } 
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    if(!window.confirm(`Mark this booking as ${newStatus}?`)) return;
    try {
      await api.put(`/bookings/${id}/status`, { status: newStatus });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      if (selectedBooking?.id === id) setSelectedBooking({ ...selectedBooking, status: newStatus });
    } catch (err) { alert("Failed to update status"); }
  };

  const filteredBookings = bookings.filter(b => filterStatus === 'all' ? true : b.status === filterStatus);

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: { bg: '#dcfce7', color: '#15803d' },
      pending: { bg: '#fef9c3', color: '#a16207' },
      cancelled: { bg: '#fee2e2', color: '#b91c1c' }
    };
    const style = styles[status] || styles.pending;
    return (
        <span style={{
            background: style.bg, color: style.color, 
            padding:'6px 12px', borderRadius:'20px', 
            fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px'
        }}>
            {status}
        </span>
    );
  };

  return (
    <div className="bookings-page">
      <div className="table-card">
        <div className="table-header-action" style={{flexDirection:'column', alignItems:'stretch', gap:'20px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                    <h1 style={{fontSize: '1.5rem', fontWeight: 800, margin:0, color:'#0f172a'}}>Reservations</h1>
                    <p style={{color: '#64748b', margin:'5px 0 0'}}>Manage guest bookings and requests</p>
                </div>
                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                    <Filter size={16} color="#64748b"/>
                    <select 
                        className="form-input" 
                        style={{width: '200px', padding:'10px'}}
                        value={selectedHotelFilter}
                        onChange={(e) => setSelectedHotelFilter(e.target.value)}
                    >
                        <option value="all">All Properties</option>
                        {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                </div>
            </div>

            <div style={{display:'flex', gap:'10px', borderBottom:'1px solid #f1f5f9', paddingBottom:'15px'}}>
               {['all', 'pending', 'confirmed', 'cancelled'].map(status => (
                 <button 
                   key={status}
                   onClick={() => setFilterStatus(status)}
                   style={{
                     padding: '8px 16px', borderRadius: '8px', border: 'none',
                     background: filterStatus === status ? '#0f172a' : 'transparent',
                     color: filterStatus === status ? '#fff' : '#64748b',
                     fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', transition:'all 0.2s'
                   }}
                 >
                   {status}
                 </button>
               ))}
            </div>
        </div>

        <table className="dashboard-table">
          <thead>
            <tr><th>Guest</th><th>Room Info</th><th>Stay Dates</th><th>Status</th><th>Total</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center p-8">Loading Bookings...</td></tr>
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map(booking => (
                <tr key={booking.id}>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                      <div className="table-img" style={{borderRadius:'50%'}}>
                        {booking.profile_image ? <img src={booking.profile_image} alt="" /> : <User size={20} color="#94a3b8"/>}
                      </div>
                      <span style={{fontWeight: 600, color:'#0f172a'}}>{booking.guest_name || booking.username || 'Guest'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{fontWeight:600, fontSize:'0.9rem'}}>{booking.room_title || 'Standard Room'}</div>
                    <div style={{fontSize:'0.8rem', color:'#64748b'}}>{booking.hotel_name}</div>
                  </td>
                  <td>
                    <div style={{display:'flex', flexDirection:'column', fontSize:'0.85rem'}}>
                       <span style={{color:'#0f172a'}}>{new Date(booking.check_in).toLocaleDateString()}</span>
                       <span style={{color:'#64748b', fontSize:'0.75rem'}}>to {new Date(booking.check_out).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td>{getStatusBadge(booking.status)}</td>
                  <td style={{fontWeight:700, color:'#0f172a'}}>${booking.total_price}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" onClick={() => setSelectedBooking(booking)} title="Details"><Eye size={18}/></button>
                      {booking.status === 'pending' && (
                        <>
                          <button className="btn-icon" style={{color:'#16a34a', background:'#f0fdf4', borderColor:'#bbf7d0'}} onClick={() => handleStatusUpdate(booking.id, 'confirmed')}><Check size={18} /></button>
                          <button className="btn-icon" style={{color:'#dc2626', background:'#fef2f2', borderColor:'#fecaca'}} onClick={() => handleStatusUpdate(booking.id, 'cancelled')}><X size={18} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
               <tr><td colSpan="6" className="text-center p-8 text-gray-500">No bookings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedBooking && (
          <motion.div 
            className="modal-overlay" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center'}}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div 
               className="form-container" style={{width:'500px', margin:0, position:'relative'}}
               initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
               onClick={e => e.stopPropagation()}
            >
               <button onClick={() => setSelectedBooking(null)} style={{position:'absolute', top:20, right:20, border:'none', background:'none', cursor:'pointer'}}><X size={20} color="#64748b"/></button>
               
               <h2 style={{marginTop:0, color:'#0f172a'}}>Booking Details</h2>
               <p style={{color:'#64748b', marginBottom:'20px'}}>Reference: #{selectedBooking.booking_reference || selectedBooking.id}</p>
               
               <div style={{background:'#f8fafc', padding:'20px', borderRadius:'12px', marginBottom:'20px'}}>
                   <h3 style={{fontSize:'0.9rem', color:'#64748b', textTransform:'uppercase', marginTop:0}}>Guest Information</h3>
                   <div style={{display:'flex', alignItems:'center', gap:'15px', marginTop:'15px'}}>
                        <div className="table-img" style={{width:60, height:60, borderRadius:'50%'}}>
                             {selectedBooking.profile_image ? <img src={selectedBooking.profile_image} /> : <User size={24}/>}
                        </div>
                        <div>
                            <div style={{fontWeight:700, fontSize:'1.1rem', color:'#0f172a'}}>{selectedBooking.guest_name || selectedBooking.username}</div>
                            <div style={{color:'#64748b', fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'5px'}}><Mail size={14}/> {selectedBooking.guest_email || selectedBooking.email}</div>
                        </div>
                   </div>
               </div>

               <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                   <div style={{background:'#f8fafc', padding:'15px', borderRadius:'12px'}}>
                       <div style={{color:'#64748b', fontSize:'0.8rem', fontWeight:600}}>CHECK-IN</div>
                       <div style={{color:'#0f172a', fontWeight:700, marginTop:'5px'}}>{new Date(selectedBooking.check_in).toDateString()}</div>
                   </div>
                   <div style={{background:'#f8fafc', padding:'15px', borderRadius:'12px'}}>
                       <div style={{color:'#64748b', fontSize:'0.8rem', fontWeight:600}}>CHECK-OUT</div>
                       <div style={{color:'#0f172a', fontWeight:700, marginTop:'5px'}}>{new Date(selectedBooking.check_out).toDateString()}</div>
                   </div>
               </div>

               <div style={{marginTop:'30px', display:'flex', gap:'10px'}}>
                   {selectedBooking.status === 'pending' && (
                       <button className="btn-primary" style={{flex:1, justifyContent:'center'}} onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}>Approve Request</button>
                   )}
                   <button className="btn-secondary" style={{flex:1, justifyContent:'center'}} onClick={() => setSelectedBooking(null)}>Close</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardBookings;