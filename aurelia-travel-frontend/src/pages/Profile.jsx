import { useState, useEffect } from 'react';
import { useUser } from '../context/userContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  Star, CreditCard, MapPin, Calendar, Trash2, Edit2, Save, X, 
  ShieldCheck, Clock, Plane, AlertCircle, Briefcase, MessageSquare 
} from 'lucide-react'; 
import './styles/profile.css';

export default function Profile() {
  const { user, refreshUser } = useUser();
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [editingProfile, setEditingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // --- REVIEW MODAL STATE ---
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null); // { bookingId, hotelId, hotelName }
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

  // --- BOOKINGS STATE ---
  const [bookings, setBookings] = useState([]); 
  const [loadingBookings, setLoadingBookings] = useState(true);
  
  // --- MANAGER UPGRADE STATE ---
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Form State
  const [profileData, setProfileData] = useState({
    username: '', 
    email: '',
    password: '',
    address_line_1: '',
    address_line_2: '',
    address_line_3: '',
    city: '',
    postal_code: '',
    country: ''
  });

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const [paymentData, setPaymentData] = useState({
    card_type: '',
    card_number: '',
    cvv: '',
    expiry_date: ''
  });

  // --- 1. SYNC STATE WHEN USER LOADS ---
  useEffect(() => {
    if (user) {
        setProfileData({
            username: user.username || user.first_name || '', 
            email: user.email || '',
            password: '', 
            address_line_1: user.address_line_1 || '',
            address_line_2: user.address_line_2 || '',
            address_line_3: user.address_line_3 || '',
            city: user.city || '',
            postal_code: user.postal_code || '',
            country: user.country || ''
        });
    }
  }, [user]);

  // --- 2. FETCH BOOKINGS ---
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        setLoadingBookings(true);
        const response = await api.get('/bookings/my-bookings');
        
        let data = [];
        if (Array.isArray(response.data)) {
            data = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
            data = response.data.data;
        } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
            data = response.data.data;
        }
        setBookings(data);
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
        setBookings([]); 
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
  }, [user]);

  // --- REVIEW HANDLERS ---
  const handleOpenReview = (booking) => {
    // 1. Safely extract ID (Checking both possible structures)
    const targetHotelId = booking.hotel?.id || booking.hotel_id;
    const targetHotelName = booking.hotel?.name || booking.hotel_name || "Hotel";

    // 2. Validate
    if (!targetHotelId) {
        console.error("Booking data missing hotel_id. Backend response:", booking);
        alert("Unable to load hotel details for this review. Please ensure backend sends 'hotel.id'.");
        return;
    }

    setReviewTarget({ 
        bookingId: booking.id, 
        hotelId: targetHotelId, 
        hotelName: targetHotelName 
    });
    setReviewForm({ rating: 5, title: '', comment: '' });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewTarget?.hotelId) return;

    try {
        await api.post('/reviews', {
            ...reviewForm,
            booking_id: reviewTarget.bookingId,
            hotel_id: reviewTarget.hotelId
        });
        alert("Thank you for your review!");
        setShowReviewModal(false);
    } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to submit review.");
    }
  };

  // --- PROFILE HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  }

  const handleEditToggle = () => {
    if (editingProfile) {
        // Reset if cancelling
        setProfileData({
            username: user.username || user.first_name || '',
            email: user.email || '',
            password: '',
            address_line_1: user.address_line_1 || '',
            address_line_2: user.address_line_2 || '',
            address_line_3: user.address_line_3 || '',
            city: user.city || '',
            postal_code: user.postal_code || '',
            country: user.country || ''
        });
        setProfileError(null);
    }
    setEditingProfile(!editingProfile);
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setLoadingProfile(true);

    const userId = user.id || user._id;
    if (!userId) {
        setProfileError("User ID missing. Please login again.");
        setLoadingProfile(false);
        return;
    }

    try {
      const payload = { ...profileData };
      // Clean up empty password so we don't send it
      if (!payload.password || payload.password.trim() === '') delete payload.password;
      
      // Map username to first_name if needed by backend
      if (payload.username && !payload.first_name) payload.first_name = payload.username;

      const response = await api.put(
          `/users/${userId}`, 
          payload,
          { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (response.status === 200 || response.data.success) {
        await refreshUser(); 
        setProfileSuccess(true);
        setEditingProfile(false);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  // --- PAYMENT HANDLERS ---
  const handlePaymentInput = (e) => {
    const { name, value } = e.target;
    if (name === 'card_number') {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
        const parts = [];
        for (let i = 0; i < v.length; i += 4) parts.push(v.substr(i, 4));
        setPaymentData(prev => ({ ...prev, [name]: parts.length > 1 ? parts.join(' ') : value }));
    } else {
        setPaymentData(prev => ({ ...prev, [name]: value }));
    }
  }

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setLoadingPayment(true);
    setPaymentError(null);
    try {
        const cleanNumber = paymentData.card_number.replace(/\s/g, '');
        await api.put(`/users/${user.id || user._id}`, { 
            card_type: paymentData.card_type, 
            card_number: cleanNumber, 
            cvv: paymentData.cvv, 
            expiry_date: paymentData.expiry_date 
        });
        setPaymentSuccess(true);
        await refreshUser();
        setTimeout(() => setShowPaymentModal(false), 1500);
    } catch (err) {
        setPaymentError(err.response?.data?.message || "Failed to save card");
    } finally {
        setLoadingPayment(false);
    }
  }

  const handleRemovePayment = async () => {
    if(!window.confirm("Remove this card?")) return;
    try {
        await api.put(`/users/${user.id || user._id}`, { 
            card_type: null, card_number: null, cvv: null, expiry_date: null 
        });
        await refreshUser();
    } catch(err) {
        alert("Could not remove card");
    }
  }

  // --- UTILS ---
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateNights = (start, end) => {
    if(!start || !end) return 1;
    const s = new Date(start); const e = new Date(end);
    return Math.max(1, Math.ceil(Math.abs(e-s)/(1000*60*60*24)));
  }

  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
  }

  const handleBecomeManager = async () => {
      if(!window.confirm("Confirm registration as a Hotel Manager?")) return;
      setIsUpgrading(true);
      try {
          const res = await api.put('/users/upgrade-to-manager', {});
          if(res.data.success) {
              await refreshUser(); 
              alert("🎉 Congratulations! You are now a Partner.");
              window.location.href = '/admin'; 
          }
      } catch (err) {
          alert("Failed to upgrade: " + (err.response?.data?.message || "Server Error"));
      } finally {
          setIsUpgrading(false);
      }
  };

  const getBookingDate = (booking) => {
      const dateStr = booking.checkIn || booking.check_in;
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
  };


  // --- RENDER ---
  if (!user) return <div className="profile-not-logged-in">Please sign in to view your profile.</div>;

  return (
    <div className="profile-page-wrapper">
      <div className="area">
        <ul className="circles"><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>
      </div>

      <motion.div 
        className="profile-container"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
      >
        <AnimatePresence>
          {showPaymentModal && (
            <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
              <motion.div className="modal-content" onClick={e => e.stopPropagation()} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                <button className="modal-close" onClick={() => setShowPaymentModal(false)}><X /></button>
                <h2 className="modal-title">Add Payment Method</h2>
                {paymentSuccess ? (
                  <div className="message success-message">Card Saved Successfully!</div>
                ) : (
                  <form onSubmit={handleSavePayment} className="payment-modal-form">
                      {/* ... Payment Form ... */}
                      <select name="card_type" value={paymentData.card_type} onChange={handlePaymentInput} className="form-input" required>
                          <option value="">Select Card Brand</option><option value="Visa">Visa</option><option value="MasterCard">MasterCard</option>
                      </select>
                      <input name="card_number" value={paymentData.card_number} onChange={handlePaymentInput} placeholder="Card Number" className="form-input" required maxLength={19}/>
                      <div className="form-row">
                          <input name="expiry_date" value={paymentData.expiry_date} onChange={handlePaymentInput} placeholder="MM/YY" className="form-input" required maxLength={5}/>
                          <input name="cvv" type="password" value={paymentData.cvv} onChange={handlePaymentInput} placeholder="CVV" className="form-input" required maxLength={4}/>
                      </div>
                      <button type="submit" className="btn-primary full-width" disabled={loadingPayment}>Save Payment Method</button>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- LEFT SIDEBAR --- */}
        <motion.div className="profile-sidebar">
          <div className="profile-avatar-section card">
              <div className="avatar-wrapper">
                  {user.profile_image ? <img src={user.profile_image} className="profile-avatar-img" alt="User"/> : <div className="profile-avatar-placeholder-pic">{user.username?.charAt(0).toUpperCase()}</div>}
              </div>
              <h2 className="profile-user-name">{getGreeting()}, <br/><span className="highlight-name">{user.username}</span></h2>
              <p className="profile-user-email">{user.email}</p>
          </div>

          <div className="payment-methods-section card">
              <h4 className="section-header"><CreditCard size={18}/> Wallet</h4>
              {user.card_type ? (
                  <div className="payment-mini-card">
                    <div className="card-text-group"><div className="brand">{user.card_type}</div><div className="digits">•••• •••• •••• {user.card_number?.slice(-4) || "0000"}</div></div>
                    <button className="icon-btn danger" onClick={handleRemovePayment}><Trash2 size={16}/></button>
                </div>
              ) : <div className="empty-state-small">No payment method</div>}
              <button className="btn-outline full-width" onClick={() => setShowPaymentModal(true)}>{user.card_type ? 'Update Card' : 'Add New Card'}</button>
          </div>

          {user.role !== 'HotelManager' && user.role !== 'admin' && (
              <div className="card partner-card">
                  <div className="partner-content">
                      <div className="partner-icon-bg"><Briefcase size={24} color="white" /></div>
                      <h4>Become a Partner</h4>
                      <button className="btn-partner full-width" onClick={handleBecomeManager} disabled={isUpgrading}>{isUpgrading ? 'Registering...' : 'Register as Hotel Manager'}</button>
                  </div>
              </div>
          )}
        </motion.div>

        {/* --- MAIN CONTENT --- */}
        <motion.div className="profile-main">
          
          {/* USER DETAILS CARD (Restored) */}
          <motion.div className="card details-card">
              <div className="card-header">
                  <h3><ShieldCheck size={20} className="icon-blue"/> Account Details</h3>
                  <button className={`btn-edit-toggle ${editingProfile ? 'active' : ''}`} onClick={handleEditToggle}>{editingProfile ? 'Cancel' : 'Edit Profile'}</button>
              </div>
              {profileError && <div className="message error-message">{profileError}</div>}
              {profileSuccess && <div className="message success-message">Updated!</div>}

              <form onSubmit={handleSaveProfile} className={editingProfile ? 'form-grid' : 'details-grid'}>
                  {editingProfile ? (
                      /* EDIT MODE */
                      <>
                          <div className="form-group"><label>Username</label><input name="username" value={profileData.username} onChange={handleInputChange} className="form-input"/></div>
                          <div className="form-group"><label>Email Address</label><input name="email" value={profileData.email} onChange={handleInputChange} className="form-input"/></div>
                          <div className="form-group span-2"><label>New Password (Optional)</label><input name="password" type="password" value={profileData.password} onChange={handleInputChange} className="form-input" placeholder="••••••" /></div>
                          <div className="divider span-2">Address</div>
                          <div className="form-group span-2"><label>Address Line 1</label><input name="address_line_1" value={profileData.address_line_1} onChange={handleInputChange} className="form-input"/></div>
                          <div className="form-group"><label>City</label><input name="city" value={profileData.city} onChange={handleInputChange} className="form-input"/></div>
                          <div className="form-group"><label>Country</label><input name="country" value={profileData.country} onChange={handleInputChange} className="form-input"/></div>
                          <div className="form-group span-2"><button type="submit" className="btn-primary full-width" disabled={loadingProfile}>Save Changes</button></div>
                      </>
                  ) : (
                      /* VIEW MODE */
                      <>
                          <div className="detail-item"><span className="label">Full Name</span><span className="value">{user.username}</span></div>
                          <div className="detail-item"><span className="label">Email Address</span><span className="value">{user.email}</span></div>
                          <div className="detail-item span-2">
                              <span className="label">Address</span>
                              <span className="value flex-align">
                                  <MapPin size={16} className="icon-gray"/>
                                  {[user.address_line_1, user.city, user.country].filter(Boolean).join(', ') || 'No address set'}
                              </span>
                          </div>
                      </>
                  )}
              </form>
          </motion.div>

          {/* BOOKINGS SECTION */}
          <div className="bookings-section">
              <h3 className="section-title"><Plane size={22}/> Your Journeys</h3>
              <div className="orders-list">
                  {loadingBookings ? <div className="empty-state">Loading...</div> : 
                   (!bookings || bookings.length === 0) ? <div className="empty-state"><Calendar size={40}/><p>No bookings yet.</p></div> : 
                   (bookings.map(booking => {
                        const dateStr = booking.checkIn || booking.check_in;
                        const dateObj = dateStr ? new Date(dateStr) : null;
                        const totalPrice = Number(booking.totalPrice || booking.total_price || 0);
                        
                        return (
                          <div key={booking._id || booking.id} className="booking-ticket">
                              <div className="ticket-left">
                                  <div className="ticket-date-box">
                                      <span className="month">{dateObj ? dateObj.toLocaleString('default', { month: 'short' }) : '--'}</span>
                                      <span className="day">{dateObj ? dateObj.getDate() : '--'}</span>
                                  </div>
                              </div>
                              <div className="ticket-center">
                                  <h4 className="booking-hotel-name">{booking.hotel?.name || booking.hotel_name || "Hotel Reservation"}</h4>
                                  <div className="booking-meta"><span><Clock size={14}/> {calculateNights(booking.checkIn || booking.check_in, booking.checkOut || booking.check_out)} Nights</span></div>
                                  <div className="booking-dates-text">{formatDate(booking.checkIn || booking.check_in)} — {formatDate(booking.checkOut || booking.check_out)}</div>
                              </div>
                              <div className="ticket-right">
                                  <span className={`ticket-status ${booking.status?.toLowerCase()}`}>{booking.status}</span>
                                  <div className="ticket-price">${totalPrice.toFixed(0)}</div>
                                  
                                  {/* REVIEW BUTTON */}
                                  {(booking.status === 'completed' || booking.status === 'confirmed') && (
                                      <button 
                                          className="btn-text-action" 
                                          style={{marginTop: '10px', fontSize: '0.8rem', color: '#3b82f6', background:'none', border:'none', cursor:'pointer', textDecoration:'underline'}}
                                          onClick={() => handleOpenReview(booking)}
                                      >
                                          <MessageSquare size={14} style={{marginRight:4, display:'inline'}}/> Write a Review
                                      </button>
                                  )}
                              </div>
                          </div>
                        );
                   }))
                  }
              </div>
          </div>
        </motion.div>

        {/* REVIEW MODAL */}
        {showReviewModal && (
            <div className="modal-overlay" style={{zIndex:200}}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h3>Review: {reviewTarget?.hotelName}</h3>
                        <button className="modal-close" onClick={() => setShowReviewModal(false)}><X size={20}/></button>
                    </div>
                    <form onSubmit={handleSubmitReview} style={{padding: '20px'}}>
                        <div className="form-group">
                            <label>Rating</label>
                            <div style={{display:'flex', gap:'5px'}}>
                                {[1,2,3,4,5].map(star => (
                                    <Star 
                                        key={star} 
                                        size={28} 
                                        fill={star <= reviewForm.rating ? "#f59e0b" : "none"} 
                                        color={star <= reviewForm.rating ? "#f59e0b" : "#cbd5e1"}
                                        style={{cursor:'pointer', transition:'all 0.2s'}}
                                        onClick={() => setReviewForm({...reviewForm, rating: star})}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Title</label>
                            <input className="form-input" placeholder="Summary" value={reviewForm.title} onChange={e => setReviewForm({...reviewForm, title: e.target.value})} required />
                        </div>
                        <div className="form-group">
                            <label>Details</label>
                            <textarea className="form-input" placeholder="What was your experience?" rows="4" value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} required />
                        </div>
                        <button type="submit" className="btn-primary full-width">Submit Review</button>
                    </form>
                </div>
            </div>
        )}

      </motion.div>
    </div>
  );
}