import { useState, useEffect } from 'react';
import { useUser } from '../context/userContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  Star, CreditCard, MapPin, Calendar, Trash2, Edit2, Save, X, 
  ShieldCheck, Clock, Plane, Briefcase, MessageSquare, User, Mail, Loader2
} from 'lucide-react'; 
import './styles/profile.css';

export default function Profile() {
  const { user, refreshUser } = useUser();
  const navigate = useNavigate();
  
  const [editingProfile, setEditingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null); 
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

  const [bookings, setBookings] = useState([]); 
  const [loadingBookings, setLoadingBookings] = useState(true);
  
  const [isUpgrading, setIsUpgrading] = useState(false);

  const [profileData, setProfileData] = useState({
    username: '', email: '', password: '', address_line_1: '', address_line_2: '',
    address_line_3: '', city: '', postal_code: '', country: ''
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [paymentData, setPaymentData] = useState({
    card_type: '', card_number: '', cvv: '', expiry_date: ''
  });

  useEffect(() => {
    if (user) {
        setProfileData({
            username: user.username || user.first_name || '', email: user.email || '',
            password: '', address_line_1: user.address_line_1 || '', address_line_2: user.address_line_2 || '',
            address_line_3: user.address_line_3 || '', city: user.city || '', postal_code: user.postal_code || '',
            country: user.country || ''
        });
    }
  }, [user]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        setLoadingBookings(true);
        const response = await api.get('/bookings/my-bookings');
        let data = [];
        if (Array.isArray(response.data)) data = response.data;
        else if (response.data && Array.isArray(response.data.data)) data = response.data.data;
        else if (response.data && response.data.success && Array.isArray(response.data.data)) data = response.data.data;
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

  const handleOpenReview = (booking) => {
    const targetHotelId = booking.hotel?.id || booking.hotel_id;
    const targetHotelName = booking.hotel?.name || booking.hotel_name || "Hotel";
    if (!targetHotelId) {
        alert("Unable to load hotel details for this review."); return;
    }
    setReviewTarget({ bookingId: booking.id, hotelId: targetHotelId, hotelName: targetHotelName });
    setReviewForm({ rating: 5, title: '', comment: '' });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewTarget?.hotelId) return;
    try {
        await api.post('/reviews', { ...reviewForm, booking_id: reviewTarget.bookingId, hotel_id: reviewTarget.hotelId });
        alert("Thank you for your review!");
        setShowReviewModal(false);
    } catch (err) { alert(err.response?.data?.message || "Failed to submit review."); }
  };

  // --- IMAGE UPLOAD HANDLER ---
  const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      try {
          // 1. Send the file to Cloudinary via your backend upload route
          const uploadRes = await api.post('/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (uploadRes.data.success) {
              const newImageUrl = uploadRes.data.url;
              const userId = user.id || user._id;

              // 2. Update the user's database record with the new URL
              await api.put(`/users/${userId}`, { profile_image: newImageUrl }, { 
                  headers: { 'Content-Type': 'application/json' } 
              });

              // 3. Refresh global state (This instantly updates the Header and Profile page!)
              await refreshUser();
          }
      } catch (err) {
          alert("Failed to upload image. " + (err.response?.data?.message || err.message));
      } finally {
          setUploadingImage(false);
      }
  };

  // --- PROFILE HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  }

  const handleEditToggle = () => {
    if (editingProfile) {
        setProfileData({
            username: user.username || user.first_name || '', email: user.email || '', password: '',
            address_line_1: user.address_line_1 || '', address_line_2: user.address_line_2 || '',
            address_line_3: user.address_line_3 || '', city: user.city || '', postal_code: user.postal_code || '',
            country: user.country || ''
        });
        setProfileError(null);
    }
    setEditingProfile(!editingProfile);
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError(null); setProfileSuccess(false); setLoadingProfile(true);

    const userId = user.id || user._id;
    if (!userId) { setProfileError("User ID missing."); setLoadingProfile(false); return; }

    try {
      const payload = { ...profileData };
      if (!payload.password || payload.password.trim() === '') delete payload.password;
      if (payload.username && !payload.first_name) payload.first_name = payload.username;

      const response = await api.put(`/users/${userId}`, payload, { headers: { 'Content-Type': 'application/json' } });
      if (response.status === 200 || response.data.success) {
        await refreshUser(); setProfileSuccess(true); setEditingProfile(false);
      }
    } catch (err) { setProfileError(err.response?.data?.message || "Failed to update profile."); } 
    finally { setLoadingProfile(false); }
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
    setLoadingPayment(true); setPaymentError(null);
    try {
        const cleanNumber = paymentData.card_number.replace(/\s/g, '');
        await api.put(`/users/${user.id || user._id}`, { 
            card_type: paymentData.card_type, card_number: cleanNumber, cvv: paymentData.cvv, expiry_date: paymentData.expiry_date 
        });
        setPaymentSuccess(true); await refreshUser();
        setTimeout(() => setShowPaymentModal(false), 1500);
    } catch (err) { setPaymentError(err.response?.data?.message || "Failed to save card"); } 
    finally { setLoadingPayment(false); }
  }

  const handleRemovePayment = async () => {
    if(!window.confirm("Remove this card?")) return;
    try {
        await api.put(`/users/${user.id || user._id}`, { card_type: null, card_number: null, cvv: null, expiry_date: null });
        await refreshUser();
    } catch(err) { alert("Could not remove card"); }
  }

  const calculateNights = (start, end) => {
    if(!start || !end) return 1;
    const s = new Date(start); const e = new Date(end);
    return Math.max(1, Math.ceil(Math.abs(e-s)/(1000*60*60*24)));
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
      } catch (err) { alert("Failed to upgrade."); } 
      finally { setIsUpgrading(false); }
  };

  if (!user) return <div className="profile-not-logged-in">Please sign in to view your profile.</div>;

  return (
    <div className="profile-page-wrapper">
      <motion.div 
        className="profile-container container"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        {/* --- LEFT SIDEBAR --- */}
        <div className="profile-sidebar">
          
          {/* User Card */}
          <div className="profile-card user-card">
              <div 
                  className="avatar-wrapper" 
                  style={{ position: 'relative', cursor: uploadingImage ? 'not-allowed' : 'pointer', overflow: 'hidden' }}
                  title="Click to change profile picture"
              >
                  {uploadingImage ? (
                      <div className="profile-avatar-placeholder-pic" style={{ opacity: 0.8 }}>
                          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                      </div>
                  ) : user.profile_image ? (
                      <img src={user.profile_image} className="profile-avatar-img" alt="User"/> 
                  ) : (
                      <div className="profile-avatar-placeholder-pic"><User size={40} /></div>
                  )}

                  {/* Hidden File Input covering the avatar */}
                  <input 
                      type="file" 
                      accept="image/*"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                  />
                  
                  {/* Small Edit Icon Badge */}
                  {!uploadingImage && (
                      <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', padding: '6px', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          <Edit2 size={12} />
                      </div>
                  )}
              </div>
              <h2 className="profile-user-name">{user.username}</h2>
              <p className="profile-user-email"><Mail size={14}/> {user.email}</p>
          </div>

          {/* Wallet Card */}
          <div className="profile-card payment-card">
              <h4 className="card-header-small"><CreditCard size={18}/> Digital Wallet</h4>
              {user.card_type ? (
                  <div className="payment-mini-card">
                    <div className="card-text-group">
                        <div className="brand">{user.card_type}</div>
                        <div className="digits">•••• {user.card_number?.slice(-4) || "0000"}</div>
                    </div>
                    <button className="icon-btn danger" onClick={handleRemovePayment} title="Remove Card">
                        <Trash2 size={16}/>
                    </button>
                  </div>
              ) : (
                  <div className="empty-state-small">No payment method saved.</div>
              )}
              <button className="btn-outline full-width" onClick={() => setShowPaymentModal(true)}>
                  {user.card_type ? 'Update Card' : 'Add New Card'}
              </button>
          </div>

          {/* Partner Card */}
          {user.role !== 'HotelManager' && user.role !== 'admin' && (
              <div className="profile-card partner-card">
                  <div className="partner-content">
                      <div className="partner-icon-bg"><Briefcase size={24} /></div>
                      <h4>Become a Partner</h4>
                      <p>List your property and reach global travelers.</p>
                      <button className="btn-partner full-width" onClick={handleBecomeManager} disabled={isUpgrading}>
                          {isUpgrading ? 'Registering...' : 'Register Property'}
                      </button>
                  </div>
              </div>
          )}
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="profile-main">
          
          {/* Account Details */}
          <div className="profile-card details-card">
              <div className="card-header-main">
                  <h3><ShieldCheck size={22} className="icon-primary"/> Account Details</h3>
                  <button className={`btn-edit-toggle ${editingProfile ? 'active' : ''}`} onClick={handleEditToggle}>
                      {editingProfile ? 'Cancel' : <><Edit2 size={16}/> Edit Profile</>}
                  </button>
              </div>
              
              {profileError && <div className="message error-message">{profileError}</div>}
              {profileSuccess && <div className="message success-message">Profile updated successfully!</div>}

              <form onSubmit={handleSaveProfile} className={editingProfile ? 'form-grid' : 'details-grid'}>
                  {editingProfile ? (
                      <>
                          <div className="form-group"><label>Full Name</label><input name="username" value={profileData.username} onChange={handleInputChange} className="form-input"/></div>
                          <div className="form-group"><label>Email Address</label><input name="email" value={profileData.email} onChange={handleInputChange} className="form-input"/></div>
                          <div className="form-group span-2"><label>New Password (Optional)</label><input name="password" type="password" value={profileData.password} onChange={handleInputChange} className="form-input" placeholder="••••••••" /></div>
                          <div className="form-group span-2"><label>Address Line 1</label><input name="address_line_1" value={profileData.address_line_1} onChange={handleInputChange} className="form-input"/></div>
                          <div className="form-group"><label>City</label><input name="city" value={profileData.city} onChange={handleInputChange} className="form-input"/></div>
                          <div className="form-group"><label>Country</label><input name="country" value={profileData.country} onChange={handleInputChange} className="form-input"/></div>
                          <div className="form-group span-2"><button type="submit" className="btn-primary full-width" disabled={loadingProfile}>Save Changes</button></div>
                      </>
                  ) : (
                      <>
                          <div className="detail-item"><span className="label">Full Name</span><span className="value">{user.username}</span></div>
                          <div className="detail-item"><span className="label">Email Address</span><span className="value">{user.email}</span></div>
                          <div className="detail-item span-2">
                              <span className="label">Address</span>
                              <span className="value flex-align">
                                  <MapPin size={16} className="icon-muted"/>
                                  {[user.address_line_1, user.city, user.country].filter(Boolean).join(', ') || 'No address provided'}
                              </span>
                          </div>
                      </>
                  )}
              </form>
          </div>

          {/* Bookings Section */}
          <div className="bookings-section">
              <h3 className="section-title"><Plane size={24} className="icon-primary"/> Your Journeys</h3>
              <div className="orders-list">
                  {loadingBookings ? (
                      <div className="empty-state">Loading your trips...</div>
                  ) : (!bookings || bookings.length === 0) ? (
                      <div className="empty-state">
                          <Calendar size={40} className="icon-muted"/>
                          <p>No bookings yet. Time to plan your next escape!</p>
                          <button className="btn-primary" onClick={() => navigate('/travel-plan')} style={{marginTop: '15px'}}>Plan a Trip</button>
                      </div>
                  ) : (
                      bookings.map(booking => {
                          const dateObj = new Date(booking.checkIn || booking.check_in);
                          const totalPrice = Number(booking.totalPrice || booking.total_price || 0);
                          
                          return (
                            <div key={booking._id || booking.id} className="booking-ticket">
                                <div className="ticket-date-box">
                                    <span className="month">{dateObj ? dateObj.toLocaleString('default', { month: 'short' }) : '--'}</span>
                                    <span className="day">{dateObj ? dateObj.getDate() : '--'}</span>
                                </div>
                                <div className="ticket-center">
                                    <h4 className="booking-hotel-name">{booking.hotel?.name || booking.hotel_name || "Hotel Reservation"}</h4>
                                    <div className="booking-meta">
                                        <span><Clock size={14}/> {calculateNights(booking.checkIn || booking.check_in, booking.checkOut || booking.check_out)} Nights</span>
                                    </div>
                                </div>
                                <div className="ticket-right">
                                    <span className={`ticket-status ${booking.status?.toLowerCase()}`}>{booking.status}</span>
                                    <div className="ticket-price">${totalPrice.toFixed(0)}</div>
                                    {(booking.status === 'completed' || booking.status === 'confirmed') && (
                                        <button className="btn-review-link" onClick={() => handleOpenReview(booking)}>
                                            <MessageSquare size={14} /> Write a Review
                                        </button>
                                    )}
                                </div>
                            </div>
                          );
                      })
                  )}
              </div>
          </div>
        </div>

        {/* PAYMENT MODAL */}
        <AnimatePresence>
          {showPaymentModal && (
            <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
              <motion.div className="modal-content" onClick={e => e.stopPropagation()} initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
                <button className="modal-close" onClick={() => setShowPaymentModal(false)}><X /></button>
                <h2 className="modal-title">Add Payment Method</h2>
                {paymentSuccess ? (
                  <div className="message success-message">Card Saved Successfully!</div>
                ) : (
                  <form onSubmit={handleSavePayment} className="payment-modal-form">
                      <div className="form-group">
                          <label>Card Type</label>
                          <select name="card_type" value={paymentData.card_type} onChange={handlePaymentInput} className="form-input" required>
                              <option value="">Select Brand</option><option value="Visa">Visa</option><option value="MasterCard">MasterCard</option>
                          </select>
                      </div>
                      <div className="form-group">
                          <label>Card Number</label>
                          <input name="card_number" value={paymentData.card_number} onChange={handlePaymentInput} placeholder="0000 0000 0000 0000" className="form-input" required maxLength={19}/>
                      </div>
                      <div className="form-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                          <div className="form-group"><label>Expiry</label><input name="expiry_date" value={paymentData.expiry_date} onChange={handlePaymentInput} placeholder="MM/YY" className="form-input" required maxLength={5}/></div>
                          <div className="form-group"><label>CVV</label><input name="cvv" type="password" value={paymentData.cvv} onChange={handlePaymentInput} placeholder="123" className="form-input" required maxLength={4}/></div>
                      </div>
                      <button type="submit" className="btn-primary full-width" style={{marginTop:'15px'}} disabled={loadingPayment}>Save Securely</button>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* REVIEW MODAL */}
        <AnimatePresence>
            {showReviewModal && (
                <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
                    <motion.div className="modal-content" onClick={e => e.stopPropagation()} initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
                        <div className="modal-header-row">
                            <h3>Review: {reviewTarget?.hotelName}</h3>
                            <button className="modal-close-icon" onClick={() => setShowReviewModal(false)}><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSubmitReview} className="payment-modal-form">
                            <div className="form-group">
                                <label>Your Rating</label>
                                <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                                    {[1,2,3,4,5].map(star => (
                                        <Star 
                                            key={star} size={28} 
                                            fill={star <= reviewForm.rating ? "#d97706" : "none"} 
                                            color={star <= reviewForm.rating ? "#d97706" : "#cbd5e1"}
                                            style={{cursor:'pointer', transition:'all 0.2s'}}
                                            onClick={() => setReviewForm({...reviewForm, rating: star})}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Summary</label>
                                <input className="form-input" placeholder="e.g., Amazing stay!" value={reviewForm.title} onChange={e => setReviewForm({...reviewForm, title: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Details</label>
                                <textarea className="form-input" placeholder="Tell others about your experience..." rows="4" value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} required />
                            </div>
                            <button type="submit" className="btn-primary full-width" style={{marginTop:'15px'}}>Submit Review</button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}