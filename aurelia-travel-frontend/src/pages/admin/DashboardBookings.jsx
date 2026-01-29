import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, Eye, User, Mail, Calendar, MapPin, Filter, 
  Building, MessageSquare, Ban, Clock, Hash, CreditCard, 
  Users, FileText, DollarSign 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; 
import './styles/dashboard-bookings.css';

const DashboardBookings = () => {
  const { checkAuth } = useAuth();
  const user = checkAuth(); 
  const isManager = user?.role === 'admin' || user?.role === 'manager';

  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedHotelFilter, setSelectedHotelFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  // --- 1. INITIAL FETCH ---
  useEffect(() => { 
    if (isManager) fetchHotels(); 
    fetchBookings(selectedHotelFilter); 
  }, [selectedHotelFilter, isManager]);

  const fetchHotels = async () => {
    try {
      const res = await api.get('/hotels/mine');
      setHotels(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err) { console.error(err); }
  };

  const fetchBookings = async (hotelId) => {
    setLoading(true);
    try {
      let url;
      if (isManager) {
        url = hotelId === 'all' ? '/bookings/manager/all' : `/bookings/hotel/${hotelId}`;
      } else {
        url = '/bookings/my-bookings'; 
      }
      
      const res = await api.get(url);
      setBookings(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err) { 
        console.error("Error fetching bookings:", err);
        setBookings([]); 
    } finally { 
        setLoading(false); 
    }
  };

  // --- 2. ACTIONS ---
  const handleStatusUpdate = async (id, newStatus) => {
    if(!window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;
    try {
      await api.put(`/bookings/${id}/status`, { status: newStatus });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      if (selectedBooking?.id === id) setSelectedBooking({ ...selectedBooking, status: newStatus });
    } catch (err) { alert("Failed to update status"); }
  };

  const filteredBookings = bookings.filter(b => filterStatus === 'all' ? true : b.status === filterStatus);

  // --- 3. BADGES ---
  const getStatusBadge = (status) => {
    const styles = {
      confirmed: { bg: '#dcfce7', color: '#15803d', icon: <Check size={12}/> },
      pending: { bg: '#fef9c3', color: '#a16207', icon: <Clock size={12}/> },
      cancelled: { bg: '#fee2e2', color: '#b91c1c', icon: <Ban size={12}/> },
      completed: { bg: '#f1f5f9', color: '#0f172a', icon: <Check size={12}/> }
    };
    const style = styles[status] || styles.pending;
    return (
        <span style={{
            background: style.bg, color: style.color, 
            padding:'4px 10px', borderRadius:'20px', 
            fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px',
            display: 'inline-flex', alignItems: 'center', gap: '4px'
        }}>
            {style.icon} {status}
        </span>
    );
  };

  const getPaymentBadge = (status) => {
    const styles = {
      paid: { bg: '#dcfce7', color: '#15803d' },
      pending: { bg: '#fef9c3', color: '#a16207' },
      partially_paid: { bg: '#e0f2fe', color: '#0369a1' },
      refunded: { bg: '#fee2e2', color: '#b91c1c' }
    };
    const style = styles[status] || styles.pending;
    return (
        <span style={{
            background: style.bg, color: style.color, 
            padding:'4px 8px', borderRadius:'6px', 
            fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase'
        }}>
            {status?.replace('_', ' ')}
        </span>
    );
  };

  return (
    <div className="bookings-page">
      <div className="table-card">
        {/* HEADER ACTIONS */}
        <div className="table-header-action" style={{flexDirection:'column', alignItems:'stretch', gap:'20px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                    <h1 style={{fontSize: '1.5rem', fontWeight: 800, margin:0, color:'#0f172a'}}>
                        {isManager ? 'Reservations' : 'My Trips'}
                    </h1>
                    <p style={{color: '#64748b', margin:'5px 0 0'}}>
                        {isManager ? 'Manage guest bookings and requests' : 'View and manage your upcoming stays'}
                    </p>
                </div>
                
                {isManager && (
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
                )}
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

        {/* BOOKINGS TABLE */}
        <table className="dashboard-table">
          <thead>
            <tr>
                <th>Ref #</th>
                <th>{isManager ? 'Guest' : 'Property'}</th>
                <th>Stay Info</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Total</th>
                <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center p-8">Loading Bookings...</td></tr>
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map(booking => (
                <tr key={booking.id}>
                  {/* 1. Reference ID */}
                  <td>
                      <div style={{display:'flex', alignItems:'center', gap:'4px', color:'#64748b', fontSize:'0.85rem', fontWeight:600}}>
                          <Hash size={12}/> {booking.booking_reference || booking.id}
                      </div>
                  </td>

                  {/* 2. Guest or Property */}
                  <td>
                    {isManager ? (
                        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                          <div className="table-img" style={{borderRadius:'50%'}}>
                            {booking.profile_image ? <img src={booking.profile_image} alt="" /> : <User size={20} color="#94a3b8"/>}
                          </div>
                          <div style={{display:'flex', flexDirection:'column'}}>
                              <span style={{fontWeight: 600, color:'#0f172a'}}>{booking.guest_name || booking.username || 'Guest'}</span>
                              <span style={{fontSize:'0.75rem', color:'#64748b'}}>{booking.guest_email}</span>
                          </div>
                        </div>
                    ) : (
                        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                          <div className="table-img" style={{borderRadius:'8px'}}>
                            {booking.hotel_image ? <img src={booking.hotel_image} alt="" /> : <Building size={20} color="#94a3b8"/>}
                          </div>
                          <span style={{fontWeight: 600, color:'#0f172a'}}>{booking.hotel_name || 'Unknown Hotel'}</span>
                        </div>
                    )}
                  </td>

                  {/* 3. Stay Info (Room + Dates + Guests) */}
                  <td>
                    <div style={{fontWeight:600, fontSize:'0.9rem'}}>{booking.room_title || 'Standard Room'}</div>
                    <div style={{fontSize:'0.8rem', color:'#64748b', display:'flex', alignItems:'center', gap:'6px', marginTop:'2px'}}>
                         <Calendar size={12}/> {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                    </div>
                    <div style={{fontSize:'0.75rem', color:'#94a3b8', marginTop:'2px'}}>
                        {booking.number_of_nights} Nights • {booking.adults} Adults, {booking.children} Kids
                    </div>
                  </td>

                  {/* 4. Payment Status */}
                  <td>{getPaymentBadge(booking.payment_status || 'pending')}</td>

                  {/* 5. Booking Status */}
                  <td>{getStatusBadge(booking.status)}</td>

                  {/* 6. Total Price */}
                  <td style={{fontWeight:700, color:'#0f172a'}}>${booking.total_price}</td>

                  {/* 7. Actions */}
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" onClick={() => setSelectedBooking(booking)} title="View Details"><Eye size={18}/></button>
                      
                      {isManager && booking.status === 'pending' && (
                        <>
                          <button className="btn-icon" style={{color:'#16a34a', background:'#f0fdf4', borderColor:'#bbf7d0'}} onClick={() => handleStatusUpdate(booking.id, 'confirmed')} title="Approve"><Check size={18} /></button>
                          <button className="btn-icon" style={{color:'#dc2626', background:'#fef2f2', borderColor:'#fecaca'}} onClick={() => handleStatusUpdate(booking.id, 'cancelled')} title="Reject"><X size={18} /></button>
                        </>
                      )}

                      {!isManager && booking.status === 'pending' && (
                          <button className="btn-icon danger" style={{color:'#dc2626', background:'#fef2f2', borderColor:'#fecaca'}} onClick={() => handleStatusUpdate(booking.id, 'cancelled')} title="Cancel Booking"><Ban size={18} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
               <tr><td colSpan="7" className="text-center p-8 text-gray-500">No bookings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div 
            className="modal-overlay" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center'}}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div 
               className="form-container" style={{width:'600px', margin:0, position:'relative', maxHeight:'90vh', overflowY:'auto'}}
               initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
               onClick={e => e.stopPropagation()}
            >
               <button onClick={() => setSelectedBooking(null)} style={{position:'absolute', top:20, right:20, border:'none', background:'none', cursor:'pointer'}}><X size={20} color="#64748b"/></button>
               
               <h2 style={{marginTop:0, color:'#0f172a', marginBottom:'4px'}}>Booking Details</h2>
               <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px'}}>
                   <span style={{color:'#64748b', fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'4px'}}><Hash size={14}/> {selectedBooking.booking_reference || selectedBooking.id}</span>
                   {getStatusBadge(selectedBooking.status)}
                   {getPaymentBadge(selectedBooking.payment_status || 'pending')}
               </div>
               
               {/* GUEST / PROPERTY HEADER */}
               <div style={{background:'#f8fafc', padding:'20px', borderRadius:'12px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'20px'}}>
                    <div className="table-img" style={{width:60, height:60, borderRadius:'50%'}}>
                         {isManager 
                            ? (selectedBooking.profile_image ? <img src={selectedBooking.profile_image} /> : <User size={24}/>)
                            : (selectedBooking.hotel_image ? <img src={selectedBooking.hotel_image} /> : <Building size={24}/>)
                         }
                    </div>
                    <div>
                        <div style={{color:'#64748b', fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase'}}>
                            {isManager ? 'Guest Information' : 'Property Information'}
                        </div>
                        <div style={{fontWeight:700, fontSize:'1.1rem', color:'#0f172a', marginTop:'4px'}}>
                            {isManager ? (selectedBooking.guest_name || selectedBooking.username) : selectedBooking.hotel_name}
                        </div>
                        <div style={{color:'#64748b', fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'5px', marginTop:'2px'}}>
                            {isManager 
                                ? <><Mail size={14}/> {selectedBooking.guest_email}</>
                                : <><MapPin size={14}/> {selectedBooking.hotel_city}</>
                            }
                        </div>
                    </div>
               </div>

               <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px'}}>
                   {/* STAY INFO */}
                   <div>
                       <h4 style={{fontSize:'0.85rem', color:'#64748b', textTransform:'uppercase', margin:'0 0 10px 0'}}>Stay Details</h4>
                       <div style={{background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'15px'}}>
                           <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                               <span style={{color:'#64748b', fontSize:'0.9rem'}}>Check-in</span>
                               <span style={{fontWeight:600, color:'#0f172a', fontSize:'0.9rem'}}>{new Date(selectedBooking.check_in).toLocaleDateString()}</span>
                           </div>
                           <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                               <span style={{color:'#64748b', fontSize:'0.9rem'}}>Check-out</span>
                               <span style={{fontWeight:600, color:'#0f172a', fontSize:'0.9rem'}}>{new Date(selectedBooking.check_out).toLocaleDateString()}</span>
                           </div>
                           <div style={{borderTop:'1px dashed #e2e8f0', margin:'10px 0'}}></div>
                           <div style={{display:'flex', justifyContent:'space-between'}}>
                               <span style={{color:'#64748b', fontSize:'0.9rem'}}>Duration</span>
                               <span style={{fontWeight:600, color:'#0f172a', fontSize:'0.9rem'}}>{selectedBooking.number_of_nights} Nights</span>
                           </div>
                           <div style={{display:'flex', justifyContent:'space-between', marginTop:'8px'}}>
                               <span style={{color:'#64748b', fontSize:'0.9rem'}}>Occupancy</span>
                               <span style={{fontWeight:600, color:'#0f172a', fontSize:'0.9rem'}}>{selectedBooking.adults} Ad, {selectedBooking.children} Ch</span>
                           </div>
                       </div>
                   </div>

                   {/* FINANCIALS */}
                   <div>
                       <h4 style={{fontSize:'0.85rem', color:'#64748b', textTransform:'uppercase', margin:'0 0 10px 0'}}>Payment Breakdown</h4>
                       <div style={{background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'15px'}}>
                           <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                               <span style={{color:'#64748b', fontSize:'0.9rem'}}>Room Price</span>
                               <span style={{color:'#0f172a', fontSize:'0.9rem'}}>${selectedBooking.room_price || 0}</span>
                           </div>
                           <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                               <span style={{color:'#64748b', fontSize:'0.9rem'}}>Tax</span>
                               <span style={{color:'#0f172a', fontSize:'0.9rem'}}>${selectedBooking.tax_amount || 0}</span>
                           </div>
                           <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                               <span style={{color:'#64748b', fontSize:'0.9rem'}}>Service Charge</span>
                               <span style={{color:'#0f172a', fontSize:'0.9rem'}}>${selectedBooking.service_charge || 0}</span>
                           </div>
                           <div style={{borderTop:'1px solid #e2e8f0', margin:'10px 0'}}></div>
                           <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                               <span style={{fontWeight:700, color:'#0f172a'}}>Total Amount</span>
                               <span style={{fontWeight:800, color:'#15803d', fontSize:'1.1rem'}}>${selectedBooking.total_price}</span>
                           </div>
                       </div>
                   </div>
               </div>

               {/* SPECIAL REQUESTS */}
               {selectedBooking.special_requests && (
                   <div style={{marginBottom:'20px'}}>
                       <h4 style={{fontSize:'0.85rem', color:'#64748b', textTransform:'uppercase', margin:'0 0 10px 0'}}>Special Requests</h4>
                       <div style={{background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'8px', padding:'12px', color:'#92400e', fontSize:'0.9rem', display:'flex', gap:'8px'}}>
                           <MessageSquare size={16} style={{marginTop:'3px', flexShrink:0}}/>
                           {selectedBooking.special_requests}
                       </div>
                   </div>
               )}

               <div style={{marginTop:'30px', display:'flex', gap:'10px'}}>
                   {isManager && selectedBooking.status === 'pending' && (
                       <button className="btn-primary" style={{flex:1, justifyContent:'center'}} onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}>Approve Request</button>
                   )}
                   {!isManager && selectedBooking.status === 'pending' && (
                       <button className="btn-primary" style={{flex:1, justifyContent:'center', background:'#ef4444'}} onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled')}>Cancel Booking</button>
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