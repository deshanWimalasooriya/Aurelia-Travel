import { useState, useEffect, useCallback } from 'react'; 
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, Eye, User, Mail, Calendar, MapPin, Filter, 
  Building, MessageSquare, Ban, Clock, Hash
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; 
import './styles/dashboard-bookings.css';

const DashboardBookings = () => {
  const { user, loading: authLoading } = useAuth(); 
  
  const isManager = user?.role === 'admin' || user?.role === 'hotel_manager';
  const userId = user?.id; 

  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedHotelFilter, setSelectedHotelFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchHotels = useCallback(async () => {
    try {
      const res = await api.get('/hotels/mine');
      setHotels(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err) { console.error(err); }
  }, []); 

  const fetchBookings = useCallback(async (hotelId) => {
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
  }, [isManager]); 

  useEffect(() => { 
    if (userId) { 
        if (isManager) fetchHotels(); 
        fetchBookings(selectedHotelFilter); 
    }
  }, [selectedHotelFilter, isManager, userId, fetchHotels, fetchBookings]); 

  const handleStatusUpdate = async (id, newStatus) => {
    if(!window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;
    try {
      await api.put(`/bookings/${id}/status`, { status: newStatus });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      if (selectedBooking?.id === id) setSelectedBooking({ ...selectedBooking, status: newStatus });
    } catch (err) { alert("Failed to update status"); }
  };

  const filteredBookings = bookings.filter(b => filterStatus === 'all' ? true : b.status === filterStatus);

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: { bg: '#dcfce7', color: '#166534', icon: <Check size={12}/> },
      pending: { bg: '#fef9c3', color: '#854d0e', icon: <Clock size={12}/> },
      cancelled: { bg: '#fee2e2', color: '#b91c1c', icon: <Ban size={12}/> },
      completed: { bg: '#f1f5f9', color: '#0f172a', icon: <Check size={12}/> }
    };
    const style = styles[status] || styles.pending;
    return (
        <span className="status-badge" style={{ background: style.bg, color: style.color }}>
            {style.icon} {status}
        </span>
    );
  };

  const getPaymentBadge = (status) => {
    const styles = {
      paid: { bg: '#dcfce7', color: '#166534' },
      pending: { bg: '#fef9c3', color: '#854d0e' },
      partially_paid: { bg: '#e0f2fe', color: '#0369a1' },
      refunded: { bg: '#fee2e2', color: '#b91c1c' }
    };
    const style = styles[status] || styles.pending;
    return (
        <span className="payment-badge" style={{ background: style.bg, color: style.color }}>
            {status?.replace('_', ' ')}
        </span>
    );
  };

  if (authLoading) return <div className="loading-state">Loading profile...</div>;

  return (
    <div className="bookings-dashboard-wrapper">
        
        {/* HEADER */}
        <div className="dashboard-header">
            <div>
                <h1 className="page-title">{isManager ? 'Reservations' : 'My Trips'}</h1>
                <p className="page-subtitle">{isManager ? 'Manage guest bookings and requests' : 'View and manage your upcoming stays'}</p>
            </div>
            
            <div className="header-actions">
                {isManager && (
                    <div className="search-bar" style={{width: 'auto'}}>
                        <Filter size={16} className="search-icon"/>
                        <select 
                            className="header-select" 
                            style={{paddingLeft: '36px', width: '220px'}}
                            value={selectedHotelFilter}
                            onChange={(e) => setSelectedHotelFilter(e.target.value)}
                        >
                            <option value="all">All Properties</option>
                            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                    </div>
                )}
            </div>
        </div>

        {/* TABS */}
        <div className="status-tabs">
            {['all', 'pending', 'confirmed', 'cancelled'].map(status => (
                <button 
                    key={status}
                    className={`tab-btn ${filterStatus === status ? 'active' : ''}`}
                    onClick={() => setFilterStatus(status)}
                >
                    {status}
                </button>
            ))}
        </div>

        {/* TABLE */}
        <div className="table-container">
            <table className="modern-table">
            <thead>
                <tr>
                    <th>Ref #</th>
                    <th>{isManager ? 'Guest' : 'Property'}</th>
                    <th>Stay Info</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th className="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                <tr><td colSpan="7" className="empty-state-cell">Loading Bookings...</td></tr>
                ) : filteredBookings.length > 0 ? (
                filteredBookings.map(booking => (
                    <tr key={booking.id}>
                        <td>
                            <div className="ref-cell"><Hash size={12}/> {booking.booking_reference || booking.id}</div>
                        </td>
                        <td>
                            {isManager ? (
                                <div className="cell-main">
                                    <div className="cell-thumbnail rounded-circle">
                                        {booking.profile_image ? <img src={booking.profile_image} alt="" /> : <User size={20} className="placeholder-icon"/>}
                                    </div>
                                    <div className="cell-meta">
                                        <span className="cell-title">{booking.guest_name || booking.username || 'Guest'}</span>
                                        <span className="cell-sub">{booking.guest_email}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="cell-main">
                                    <div className="cell-thumbnail">
                                        {booking.hotel_image ? <img src={booking.hotel_image} alt="" /> : <Building size={20} className="placeholder-icon"/>}
                                    </div>
                                    <span className="cell-title">{booking.hotel_name || 'Unknown Hotel'}</span>
                                </div>
                            )}
                        </td>
                        <td>
                            <div className="cell-title" style={{fontSize: '0.9rem'}}>{booking.room_title || 'Standard Room'}</div>
                            <div className="cell-sub flex-align mt-1">
                                <Calendar size={12}/> {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                            </div>
                            <div className="cell-sub mt-1">
                                {booking.number_of_nights} Nights • {booking.adults} Adults, {booking.children} Kids
                            </div>
                        </td>
                        <td>{getPaymentBadge(booking.payment_status || 'pending')}</td>
                        <td>{getStatusBadge(booking.status)}</td>
                        <td><div className="price-tag">${booking.total_price}</div></td>
                        <td className="text-right">
                            <div className="action-row">
                                <button className="icon-btn" onClick={() => setSelectedBooking(booking)} title="View Details"><Eye size={16}/></button>
                                
                                {isManager && booking.status === 'pending' && (
                                    <>
                                    <button className="icon-btn success" onClick={() => handleStatusUpdate(booking.id, 'confirmed')} title="Approve"><Check size={16} /></button>
                                    <button className="icon-btn delete" onClick={() => handleStatusUpdate(booking.id, 'cancelled')} title="Reject"><X size={16} /></button>
                                    </>
                                )}

                                {!isManager && booking.status === 'pending' && (
                                    <button className="icon-btn delete" onClick={() => handleStatusUpdate(booking.id, 'cancelled')} title="Cancel Booking"><Ban size={16} /></button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))
                ) : (
                <tr><td colSpan="7" className="empty-state-cell">No bookings found in this category.</td></tr>
                )}
            </tbody>
            </table>
        </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div 
            className="dh-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div 
               className="dh-modal-content"
               initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
               onClick={e => e.stopPropagation()}
            >
               <button className="dh-btn-close" onClick={() => setSelectedBooking(null)}><X size={20}/></button>
               
               <h2 className="dh-modal-title">Booking Details</h2>
               <div className="dh-modal-badges">
                   <span className="ref-badge"><Hash size={14}/> {selectedBooking.booking_reference || selectedBooking.id}</span>
                   {getStatusBadge(selectedBooking.status)}
                   {getPaymentBadge(selectedBooking.payment_status || 'pending')}
               </div>
               
               {/* GUEST / PROPERTY HEADER */}
               <div className="dh-modal-hero-card">
                    <div className={`cell-thumbnail large ${isManager ? 'rounded-circle' : ''}`}>
                         {isManager 
                            ? (selectedBooking.profile_image ? <img src={selectedBooking.profile_image} alt=""/> : <User size={24}/>)
                            : (selectedBooking.hotel_image ? <img src={selectedBooking.hotel_image} alt=""/> : <Building size={24}/>)
                         }
                    </div>
                    <div>
                        <div className="dh-hero-label">{isManager ? 'Guest Information' : 'Property Information'}</div>
                        <div className="dh-hero-title">{isManager ? (selectedBooking.guest_name || selectedBooking.username) : selectedBooking.hotel_name}</div>
                        <div className="dh-hero-sub">
                            {isManager 
                                ? <><Mail size={14}/> {selectedBooking.guest_email}</>
                                : <><MapPin size={14}/> {selectedBooking.hotel_city}</>
                            }
                        </div>
                    </div>
               </div>

               <div className="dh-grid-2">
                   {/* STAY INFO */}
                   <div>
                       <h4 className="dh-section-label">Stay Details</h4>
                       <div className="dh-info-box">
                           <div className="dh-info-row"><span>Check-in</span><strong>{new Date(selectedBooking.check_in).toLocaleDateString()}</strong></div>
                           <div className="dh-info-row"><span>Check-out</span><strong>{new Date(selectedBooking.check_out).toLocaleDateString()}</strong></div>
                           <hr className="dh-divider"/>
                           <div className="dh-info-row"><span>Duration</span><strong>{selectedBooking.number_of_nights} Nights</strong></div>
                           <div className="dh-info-row"><span>Occupancy</span><strong>{selectedBooking.adults} Ad, {selectedBooking.children} Ch</strong></div>
                       </div>
                   </div>

                   {/* FINANCIALS */}
                   <div>
                       <h4 className="dh-section-label">Payment Breakdown</h4>
                       <div className="dh-info-box">
                           <div className="dh-info-row"><span>Room Price</span><strong>${selectedBooking.room_price || 0}</strong></div>
                           <div className="dh-info-row"><span>Tax</span><strong>${selectedBooking.tax_amount || 0}</strong></div>
                           <div className="dh-info-row"><span>Service Charge</span><strong>${selectedBooking.service_charge || 0}</strong></div>
                           <hr className="dh-divider"/>
                           <div className="dh-info-row total"><span>Total Amount</span><strong>${selectedBooking.total_price}</strong></div>
                       </div>
                   </div>
               </div>

               {/* SPECIAL REQUESTS */}
               {selectedBooking.special_requests && (
                   <div className="mt-4">
                       <h4 className="dh-section-label">Special Requests</h4>
                       <div className="dh-request-box">
                           <MessageSquare size={16} className="shrink-0 mt-1"/>
                           {selectedBooking.special_requests}
                       </div>
                   </div>
               )}

               <div className="dh-modal-actions">
                   {isManager && selectedBooking.status === 'pending' && (
                       <button className="btn-primary-compact" onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}>Approve Request</button>
                   )}
                   {!isManager && selectedBooking.status === 'pending' && (
                       <button className="btn-primary-compact danger-bg" onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled')}>Cancel Booking</button>
                   )}
                   <button className="btn-ghost" onClick={() => setSelectedBooking(null)}>Close</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardBookings;