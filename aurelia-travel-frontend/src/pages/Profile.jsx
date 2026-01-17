import { useState, useEffect } from 'react'
import { useUser } from '../context/userContext' // ✅ Fixed import casing
import { useNavigate } from 'react-router-dom'
import api from '../services/api' // ✅ Use configured API for cookies
import { motion, AnimatePresence } from 'framer-motion'; 
import { CreditCard, MapPin, Calendar, Trash2, Edit2, Save, X, Camera, ShieldCheck, Clock, Plane, AlertCircle, Briefcase } from 'lucide-react'; 
import './styles/profile.css'

export default function Profile() {
  const { user, refreshUser } = useUser()
  const navigate = useNavigate()
  
  // --- STATE MANAGEMENT ---
  const [editingProfile, setEditingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // --- BOOKINGS STATE ---
  const [bookings, setBookings] = useState([]); // ✅ Init as empty array
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

  const [picPreview, setPicPreview] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);

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
            username: user.username || '',
            email: user.email || '',
            password: '', 
            address_line_1: user.address_line_1 || '',
            address_line_2: user.address_line_2 || '',
            address_line_3: user.address_line_3 || '',
            city: user.city || '',
            postal_code: user.postal_code || '',
            country: user.country || ''
        });
        setPicPreview(user.profile_image || '');
    }
  }, [user]);

  // --- 2. FETCH BOOKINGS (FIXED) ---
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        setLoadingBookings(true);
        // ✅ Use 'api' client (handles base URL + credentials)
        const response = await api.get('/bookings/my-bookings');
        
        // ✅ CRITICAL FIX: Extract array from response object
        let data = [];
        if (Array.isArray(response.data)) {
            data = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
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

  if (!user) return <div className="profile-not-logged-in">Please sign in to view your profile.</div>


  // --- HANDLERS (Profile & Payment) ---
  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      const fr = new FileReader();
      fr.onload = () => setPicPreview(fr.result);
      fr.readAsDataURL(file);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  }

  const handleEditToggle = () => {
    if (editingProfile) {
        // Reset if cancelling
        setProfileData({
            username: user.username || '',
            email: user.email || '',
            password: '',
            address_line_1: user.address_line_1 || '',
            address_line_2: user.address_line_2 || '',
            address_line_3: user.address_line_3 || '',
            city: user.city || '',
            postal_code: user.postal_code || '',
            country: user.country || ''
        });
        setPicPreview(user.profile_image || '');
        setProfileImageFile(null);
        setProfileError(null);
    }
    setEditingProfile(!editingProfile);
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setLoadingProfile(true);

    try {
      let imageUrlToSave = user.profile_image;

      if (profileImageFile) {
        const imageFormData = new FormData();
        imageFormData.append('profile_image', profileImageFile);
        
        try {
            // ✅ Use api client
            const imageResponse = await api.post(
              `/users/${user.id}/upload-image`,
              imageFormData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            
            if (imageResponse.data.imageUrl) {
                imageUrlToSave = imageResponse.data.imageUrl;
            }
        } catch (uploadErr) {
            console.warn("Image upload skipped:", uploadErr);
        }
      }

      const payload = {
          ...profileData,
          profile_image: imageUrlToSave
      };
      
      // Remove empty password so it doesn't overwrite
      if (!payload.password) delete payload.password;

      // ✅ Use api client
      const response = await api.put(`/users/${user.id}`, payload);

      if (response.status === 200 || response.data.success) {
        setProfileSuccess(true);
        await refreshUser(); 
        setEditingProfile(false);
        setProfileImageFile(null); 
      }
    } catch (err) {
      console.error('Update failed:', err);
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePaymentInput = (e) => {
    const { name, value } = e.target;
    if (name === 'card_number') {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
        const parts = []
        for (let i = 0; i < v.length; i += 4) parts.push(v.substr(i, 4))
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
        // ✅ Use api client
        await api.put(`/users/${user.id}`, { 
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
        // ✅ Use api client
        await api.put(`/users/${user.id}`, { 
            card_type: null, 
            card_number: null, 
            cvv: null, 
            expiry_date: null 
        });
        await refreshUser();
    } catch(err) {
        alert("Could not remove card");
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
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
          // ✅ Use api client
          const res = await api.put('/users/upgrade-to-manager', {});
          
          if(res.data.success) {
              await refreshUser(); 
              alert("🎉 Congratulations! You are now a Partner.");
              window.location.href = '/admin'; 
          }
      } catch (err) {
          console.error(err);
          alert("Failed to upgrade: " + (err.response?.data?.message || "Server Error"));
      } finally {
          setIsUpgrading(false);
      }
  };

  // --- RENDER ---
  return (
    <div className="profile-page-wrapper">
      <div className="area">
        <ul className="circles">
          <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
        </ul>
      </div>

      <motion.div 
        className="profile-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <AnimatePresence>
          {showPaymentModal && (
            <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
              <motion.div 
                className="modal-content" 
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <button className="modal-close" onClick={() => setShowPaymentModal(false)}><X /></button>
                <h2 className="modal-title">Add Payment Method</h2>
                {paymentSuccess ? (
                  <div className="message success-message">Card Saved Successfully!</div>
                ) : (
                  <>
                    <div className="card-scene">
                      <div className={`card-object ${isCardFlipped ? 'is-flipped' : ''}`}>
                        <div className={`card-face card-front ${paymentData.card_type ? paymentData.card_type.toLowerCase() : ''}`}>
                           <div className="card-chip"></div>
                           <div className="card-number-display">{paymentData.card_number || '•••• •••• •••• ••••'}</div>
                           <div className="card-details-row">
                             <div>{user.username}</div>
                             <div>{paymentData.expiry_date || 'MM/YY'}</div>
                           </div>
                        </div>
                        <div className={`card-face card-back ${paymentData.card_type ? paymentData.card_type.toLowerCase() : ''}`}>
                           <div className="card-magnetic-strip"></div>
                           <div className="card-cvv-display">{paymentData.cvv}</div>
                        </div>
                      </div>
                    </div>
                    <form onSubmit={handleSavePayment} className="payment-modal-form">
                      <select name="card_type" value={paymentData.card_type} onChange={handlePaymentInput} className="form-input" required>
                          <option value="">Select Card Brand</option>
                          <option value="Visa">Visa</option>
                          <option value="MasterCard">MasterCard</option>
                      </select>
                      <input name="card_number" value={paymentData.card_number} onChange={handlePaymentInput} placeholder="Card Number" className="form-input" required maxLength={19}/>
                      <div className="form-row">
                          <input name="expiry_date" value={paymentData.expiry_date} onChange={handlePaymentInput} placeholder="MM/YY" className="form-input" required maxLength={5}/>
                          <input 
                              name="cvv" 
                              type="password"
                              value={paymentData.cvv} 
                              onChange={handlePaymentInput} 
                              onFocus={() => setIsCardFlipped(true)}
                              onBlur={() => setIsCardFlipped(false)}
                              placeholder="CVV" 
                              className="form-input" 
                              required maxLength={4}
                          />
                      </div>
                      {paymentError && <div className="message error-message">{paymentError}</div>}
                      <button type="submit" className="btn-primary full-width" disabled={loadingPayment}>
                          {loadingPayment ? 'Processing...' : 'Save Payment Method'}
                      </button>
                    </form>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- LEFT SIDEBAR --- */}
        <motion.div className="profile-sidebar">
          <div className="profile-avatar-section card">
              <div className="avatar-wrapper">
                  {picPreview ? (
                      <img src={picPreview} alt="Avatar" className="profile-avatar-img" />
                  ) : (
                      <div className="profile-avatar-placeholder-pic">{user.username?.charAt(0).toUpperCase()}</div>
                  )}
                  {editingProfile && (
                      <label className="avatar-upload-btn">
                          <Camera size={16} />
                          <input type="file" hidden accept="image/*" onChange={onFileChange} />
                      </label>
                  )}
              </div>
              <h2 className="profile-user-name">
                  {getGreeting()}, <br/>
                  <span className="highlight-name">{user.username}</span>
              </h2>
              <p className="profile-user-email">{user.email}</p>
              
              <div className="member-stats">
                  <div className="stat-item">
                      <span className="stat-val">{bookings ? bookings.length : 0}</span>
                      <span className="stat-label">Trips</span>
                  </div>
                  <div className="stat-line"></div>
                  <div className="stat-item">
                      <span className="stat-val">
                          {user.role === 'HotelManager' ? 'Manager' : (user.role === 'admin' ? 'Admin' : 'Member')}
                      </span>
                      <span className="stat-label">Status</span>
                  </div>
              </div>
          </div>

          <div className="payment-methods-section card">
              <h4 className="section-header"><CreditCard size={18}/> Wallet</h4>
              {user.card_type ? (
                  <div className="payment-mini-card">
                    <div className="card-text-group">
                        <div className="brand">{user.card_type}</div>
                        <div className="digits">
                            ••••  ••••  ••••  {user.card_number?.slice(-4) || "0000"}
                        </div>
                    </div>
                    <button className="icon-btn danger" onClick={handleRemovePayment} title="Remove"><Trash2 size={16}/></button>
                </div>
              ) : (
                  <div className="empty-state-small">No payment method added</div>
              )}
              <button className="btn-outline full-width" onClick={() => setShowPaymentModal(true)}>
                  {user.card_type ? 'Update Card' : 'Add New Card'}
              </button>
          </div>

          {/* --- PARTNER SECTION --- */}
          {user.role !== 'HotelManager' && user.role !== 'admin' && (
              <div className="card partner-card">
                  <div className="partner-content">
                      <div className="partner-icon-bg">
                          <Briefcase size={24} color="white" />
                      </div>
                      <h4>Become a Partner</h4>
                      <p>Manage your own hotel and reach millions of travelers.</p>
                      <button 
                          className="btn-partner full-width" 
                          onClick={handleBecomeManager}
                          disabled={isUpgrading}
                      >
                          {isUpgrading ? 'Registering...' : 'Register as Hotel Manager'}
                      </button>
                  </div>
              </div>
          )}

        </motion.div>

        {/* --- MAIN CONTENT --- */}
        <motion.div className="profile-main">
          
          <motion.div className="card details-card" layout>
              <div className="card-header">
                  <h3><ShieldCheck size={20} className="icon-blue"/> Account Details</h3>
                  <button className={`btn-edit-toggle ${editingProfile ? 'active' : ''}`} onClick={handleEditToggle}>
                      {editingProfile ? <><X size={16}/> Cancel</> : <><Edit2 size={16}/> Edit Profile</>}
                  </button>
              </div>

              {profileError && (
                <div className="message error-message">
                  <AlertCircle size={16} style={{display:'inline', marginRight:'5px'}}/>
                  {profileError}
                </div>
              )}
              
              {profileSuccess && <div className="message success-message">Profile Updated Successfully!</div>}

              <form onSubmit={handleSaveProfile} className={editingProfile ? 'form-grid' : 'details-grid'}>
                  {editingProfile ? (
                      /* EDIT MODE */
                      <>
                          <div className="form-group">
                              <label>Username</label>
                              <input name="username" value={profileData.username} onChange={handleInputChange} className="form-input"/>
                          </div>
                          <div className="form-group">
                              <label>Email Address</label>
                              <input name="email" value={profileData.email} onChange={handleInputChange} className="form-input"/>
                          </div>
                          <div className="form-group span-2">
                              <label>New Password <span className="optional">(Leave blank to keep current)</span></label>
                              <input name="password" type="password" value={profileData.password} onChange={handleInputChange} className="form-input" placeholder="••••••" />
                          </div>
                          <div className="divider span-2">Shipping / Billing Address</div>
                          <div className="form-group span-2">
                              <label>Address Line 1</label>
                              <input name="address_line_1" value={profileData.address_line_1} onChange={handleInputChange} className="form-input"/>
                          </div>
                          <div className="form-group">
                              <label>City</label>
                              <input name="city" value={profileData.city} onChange={handleInputChange} className="form-input"/>
                          </div>
                          <div className="form-group">
                              <label>Country</label>
                              <input name="country" value={profileData.country} onChange={handleInputChange} className="form-input"/>
                          </div>
                          <div className="form-group span-2">
                              <button type="submit" className="btn-primary full-width" disabled={loadingProfile}>
                                  {loadingProfile ? 'Saving...' : <><Save size={18}/> Save Changes</>}
                              </button>
                          </div>
                      </>
                  ) : (
                      /* VIEW MODE */
                      <>
                          <div className="detail-item">
                              <span className="label">Full Name</span>
                              <span className="value">{user.username}</span>
                          </div>
                          <div className="detail-item">
                              <span className="label">Email Address</span>
                              <span className="value">{user.email}</span>
                          </div>
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

          {/* BOOKINGS LIST */}
          <div className="bookings-section">
              <h3 className="section-title"><Plane size={22}/> Your Journeys</h3>
              
              <div className="orders-list">
                  {loadingBookings ? (
                    <div className="empty-state">Loading your trips...</div>
                  ) : (!Array.isArray(bookings) || bookings.length === 0) ? (
                      <div className="empty-state">
                          <Calendar size={40} className="empty-icon"/>
                          <p>You haven't booked any trips yet.</p>
                          <span className="sub-empty">Your next adventure is just a click away.</span>
                      </div>
                  ) : (
                      // ✅ Safe Map
                      bookings.map(booking => (
                          <div key={booking._id || booking.id} className="booking-ticket">
                              <div className="ticket-left">
                                  <div className="ticket-date-box">
                                      <span className="month">{new Date(booking.checkIn || booking.check_in).toLocaleString('default', { month: 'short' })}</span>
                                      <span className="day">{new Date(booking.checkIn || booking.check_in).getDate()}</span>
                                  </div>
                              </div>
                              <div className="ticket-center">
                                  <h4 className="booking-hotel-name">{booking.hotel?.name || booking.hotel_name || "Hotel Reservation"}</h4>
                                  <div className="booking-meta">
                                      <span className="meta-item"><Clock size={14}/> {calculateNights(booking.checkIn || booking.check_in, booking.checkOut || booking.check_out)} Nights</span>
                                      <span className="meta-item">• {booking.room?.title || booking.room_title || "Standard Room"}</span>
                                  </div>
                                  <div className="booking-dates-text">
                                      {formatDate(booking.checkIn || booking.check_in)} — {formatDate(booking.checkOut || booking.check_out)}
                                  </div>
                              </div>
                              <div className="ticket-right">
                                  <span className={`ticket-status ${booking.status?.toLowerCase()}`}>{booking.status}</span>
                                  <div className="ticket-price">${Number(booking.totalPrice || booking.total_price).toFixed(0)}</div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

        </motion.div>
      </motion.div>
    </div>
  )
}