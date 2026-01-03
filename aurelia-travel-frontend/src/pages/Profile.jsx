import { useState } from 'react'
import { useUser } from '../context/UserContext'
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; // Animation library
import { CreditCard, MapPin, Mail, User, Package, Trash2, Edit2, Save, X } from 'lucide-react'; // Icons
import './styles/profile.css'

export default function Profile() {
  const { user, refreshUser } = useUser()
  
  // User Details State
  const [editingProfile, setEditingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    profile_image: user?.profile_image || '',
    address_line_1: user?.address_line_1 || '',
    address_line_2: user?.address_line_2 || '',
    address_line_3: user?.address_line_3 || '',
    city: user?.city || '',
    postal_code: user?.postal_code || '',
    country: user?.country || ''
  });

  const [picPreview, setPicPreview] = useState(user?.profile_image || '');
  const [profileImageFile, setProfileImageFile] = useState(null);

  // Payment Method State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false); // New state for animation

  const [paymentData, setPaymentData] = useState({
    card_type: '',
    card_number: '',
    cvv: '',
    expiry_date: ''
  });

  if (!user) return <div className="profile-not-logged-in">Please sign in to view your profile.</div>

  // ========== PROFILE SECTION HANDLERS ==========
  
  const onFile = (f) => {
    setProfileImageFile(f);
    const fr = new FileReader()
    fr.onload = () => setPicPreview(fr.result)
    fr.readAsDataURL(f)
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  }

  const handleEditProfile = () => {
    if (editingProfile) {
      // Cancel logic
      setProfileData({
        username: user?.username || '',
        email: user?.email || '',
        password: '',
        profile_image: user?.profile_image || '',
        address_line_1: user?.address_line_1 || '',
        address_line_2: user?.address_line_2 || '',
        address_line_3: user?.address_line_3 || '',
        city: user?.city || '',
        postal_code: user?.postal_code || '',
        country: user?.country || ''
      });
      setPicPreview(user?.profile_image || '');
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
      const updateData = {};
      
      // Basic field checks
      if (profileData.username !== user.username) updateData.username = profileData.username;
      if (profileData.email !== user.email) updateData.email = profileData.email;
      if (profileData.password) updateData.password = profileData.password;
      if (profileData.address_line_1 !== user.address_line_1) updateData.address_line_1 = profileData.address_line_1;
      if (profileData.address_line_2 !== user.address_line_2) updateData.address_line_2 = profileData.address_line_2;
      if (profileData.address_line_3 !== user.address_line_3) updateData.address_line_3 = profileData.address_line_3;
      if (profileData.city !== user.city) updateData.city = profileData.city;
      if (profileData.postal_code !== user.postal_code) updateData.postal_code = profileData.postal_code;
      if (profileData.country !== user.country) updateData.country = profileData.country;

      // Image Upload
      if (profileImageFile) {
        const imageFormData = new FormData();
        imageFormData.append('profile_image', profileImageFile);
        const imageResponse = await axios.post(
          `http://localhost:5000/api/users/${user.id}/upload-image`,
          imageFormData,
          { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
        );
        if (imageResponse.data.imageUrl) updateData.profile_image = imageResponse.data.imageUrl;
      }

      if (Object.keys(updateData).length === 0) {
        setProfileError('No changes to update');
        setLoadingProfile(false);
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/users/${user.id}`,
        updateData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setProfileSuccess(true);
        setEditingProfile(false);
        await refreshUser();
        // Removed hard reload for better UX, just refresh context
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  // ========== PAYMENT METHOD HANDLERS ==========

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'card_number') {
      const cleanValue = value.replace(/\s/g, '');
      if (cleanValue.length <= 16 && /^\d*$/.test(cleanValue)) {
        const formatted = cleanValue.match(/.{1,4}/g)?.join(' ') || cleanValue;
        setPaymentData(prev => ({ ...prev, [name]: formatted }));
      }
      return;
    }
    
    if (name === 'expiry_date') {
      let cleanValue = value.replace(/\D/g, '');
      if (cleanValue.length >= 2) {
        cleanValue = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4);
      }
      setPaymentData(prev => ({ ...prev, [name]: cleanValue }));
      return;
    }
    
    if (name === 'cvv') {
      if (value.length <= 4 && /^\d*$/.test(value)) {
        setPaymentData(prev => ({ ...prev, [name]: value }));
      }
      return;
    }
    
    setPaymentData(prev => ({ ...prev, [name]: value }));
  }

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setPaymentError(null);
    setPaymentSuccess(false);
    setLoadingPayment(true);

    try {
      if (!paymentData.card_type || !paymentData.card_number || !paymentData.cvv || !paymentData.expiry_date) {
        setPaymentError('Please fill in all card details');
        setLoadingPayment(false);
        return;
      }

      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(paymentData.expiry_date)) {
        setPaymentError('Invalid expiry date format. Use MM/YY');
        setLoadingPayment(false);
        return;
      }

      const cardNumberClean = paymentData.card_number.replace(/\s/g, '');

      const response = await axios.put(
        `http://localhost:5000/api/users/${user.id}`,
        {
          card_type: paymentData.card_type,
          card_number: cardNumberClean,
          cvv: null, 
          expiry_date: paymentData.expiry_date
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setPaymentSuccess(true);
        await refreshUser();
        setTimeout(() => {
          setShowPaymentModal(false);
        }, 1500);
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to save payment method');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleRemovePayment = async () => {
    if (!window.confirm('Are you sure you want to remove this payment method?')) return;
    setLoadingPayment(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${user.id}`,
        { card_type: null, card_number: null, cvv: null, expiry_date: null },
        { withCredentials: true }
      );
      if (response.data.success) await refreshUser();
    } catch (err) {
      alert('Failed to remove payment method');
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <motion.div 
      className="profile-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setShowPaymentModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content" 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}><X size={24} /></button>
              
              <h2 className="modal-title">Add Payment Method</h2>
              
              {paymentError && <div className="message error-message">{paymentError}</div>}
              {paymentSuccess && <div className="message success-message">Card saved successfully!</div>}

              {/* 3D CARD ANIMATION WRAPPER */}
              <div className="card-scene">
                <div className={`card-object ${isCardFlipped ? 'is-flipped' : ''}`}>
                  
                  {/* CARD FRONT */}
                  <div className={`card-face card-front ${paymentData.card_type.toLowerCase().replace(' ', '')}`}>
                    <div className="card-chip"></div>
                    <div className="card-brand-logo">{paymentData.card_type || 'BANK'}</div>
                    <div className="card-number-display">
                      {paymentData.card_number || '•••• •••• •••• ••••'}
                    </div>
                    <div className="card-details-row">
                      <div className="card-holder">
                        <span>Card Holder</span>
                        <div>{user.username?.toUpperCase() || 'YOUR NAME'}</div>
                      </div>
                      <div className="card-expiry-display">
                        <span>Expires</span>
                        <div>{paymentData.expiry_date || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  {/* CARD BACK */}
                  <div className={`card-face card-back ${paymentData.card_type.toLowerCase().replace(' ', '')}`}>
                    <div className="card-magnetic-strip"></div>
                    <div className="card-signature-row">
                      <div className="card-signature">Authorized Signature</div>
                      <div className="card-cvv-display">{paymentData.cvv || '123'}</div>
                    </div>
                    <div className="card-back-text">
                      For customer service call +1 123-456-7890.
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSavePayment} className="payment-modal-form">
                <div className="form-group">
                  <label>Card Type</label>
                  <select 
                    name="card_type"
                    value={paymentData.card_type} 
                    onChange={handlePaymentChange} 
                    className="form-input"
                    required
                  >
                    <option value="">Select Card Type</option>
                    <option value="Visa">Visa</option>
                    <option value="MasterCard">MasterCard</option>
                    <option value="American Express">American Express</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Card Number</label>
                  <input 
                    name="card_number"
                    value={paymentData.card_number} 
                    onChange={handlePaymentChange} 
                    className="form-input"
                    placeholder="0000 0000 0000 0000"
                    maxLength="19"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input 
                      name="expiry_date"
                      value={paymentData.expiry_date} 
                      onChange={handlePaymentChange} 
                      className="form-input"
                      placeholder="MM/YY"
                      maxLength="5"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input 
                      name="cvv"
                      type="password"
                      value={paymentData.cvv} 
                      onChange={handlePaymentChange}
                      onFocus={() => setIsCardFlipped(true)} // FLIP CARD ON FOCUS
                      onBlur={() => setIsCardFlipped(false)}  // UNFLIP ON BLUR
                      className="form-input"
                      placeholder="123"
                      maxLength="4"
                      required
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={loadingPayment}>
                    {loadingPayment ? 'Saving...' : 'Save Card'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="profile-sidebar">
        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            {picPreview ? (
              <img src={picPreview} alt="avatar" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder-pic">
                {(user.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            {editingProfile && <div className="avatar-overlay"><Edit2 size={20}/></div>}
          </div>
          <div className="profile-user-info">
            <h2 className="profile-user-name">{user.username}</h2>
            <p className="profile-user-email">{user.email}</p>
          </div>
        </div>

        <div className="payment-methods-section">
          <h4 className="section-header"><CreditCard size={18} /> Payment Method</h4>

          {!user.card_type ? (
            <div className="empty-state">No payment method added</div>
          ) : (
            <div className="payment-mini-card">
              <div className="payment-info">
                <span className="brand">{user.card_type}</span>
                <span className="digits">•••• {user.card_number.slice(-4)}</span>
              </div>
              <button className="icon-btn danger" onClick={handleRemovePayment} disabled={loadingPayment}>
                <Trash2 size={16} />
              </button>
            </div>
          )}

          <button className="btn-outline full-width" onClick={() => setShowPaymentModal(true)}>
            {user.card_type ? 'Update Card' : 'Add New Card'}
          </button>
        </div>
      </div>

      <div className="profile-main">
        <motion.div className="card profile-info-card" layout>
          <div className="card-header">
            <h3><User size={20} /> Personal Information</h3>
            <button 
              className={`btn-icon ${editingProfile ? 'active' : ''}`} 
              onClick={handleEditProfile}
            >
              {editingProfile ? <X size={20} /> : <Edit2 size={20} />}
            </button>
          </div>

          {profileError && <div className="message error-message">{profileError}</div>}
          {profileSuccess && <div className="message success-message">Profile updated successfully!</div>}

          <form onSubmit={handleSaveProfile} className={editingProfile ? 'edit-mode' : 'view-mode'}>
             {/* EDIT MODE FORM */}
             {editingProfile ? (
               <div className="form-grid">
                 <div className="form-group">
                   <label>Username</label>
                   <input name="username" value={profileData.username} onChange={handleProfileChange} className="form-input" />
                 </div>
                 <div className="form-group">
                   <label>Email</label>
                   <input name="email" value={profileData.email} onChange={handleProfileChange} className="form-input" disabled />
                 </div>
                 <div className="form-group span-2">
                   <label>New Password (Optional)</label>
                   <input name="password" type="password" placeholder="Leave blank to keep current" value={profileData.password} onChange={handleProfileChange} className="form-input" />
                 </div>
                 <div className="form-group span-2">
                   <label>Profile Picture</label>
                   <input type="file" accept="image/*" onChange={e => onFile(e.target.files[0])} className="form-input file-input" />
                 </div>
                 
                 <div className="divider span-2"><span>Address Details</span></div>
                 
                 <div className="form-group span-2">
                   <label>Address Line 1</label>
                   <input name="address_line_1" value={profileData.address_line_1} onChange={handleProfileChange} className="form-input" />
                 </div>
                 <div className="form-group">
                   <label>City</label>
                   <input name="city" value={profileData.city} onChange={handleProfileChange} className="form-input" />
                 </div>
                 <div className="form-group">
                   <label>Postal Code</label>
                   <input name="postal_code" value={profileData.postal_code} onChange={handleProfileChange} className="form-input" />
                 </div>
                 <div className="form-group span-2">
                    <button type="submit" className="btn-primary full-width" disabled={loadingProfile}>
                      <Save size={18} /> Save Changes
                    </button>
                 </div>
               </div>
             ) : (
               /* VIEW MODE */
               <div className="details-grid">
                  <div className="detail-item">
                    <span className="label">Username</span>
                    <span className="value">{user.username}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email</span>
                    <span className="value">{user.email}</span>
                  </div>
                  <div className="detail-item span-2">
                    <span className="label">Address</span>
                    <span className="value">
                      <MapPin size={14} style={{display:'inline', marginRight:4}}/>
                      {[user.address_line_1, user.city, user.country].filter(Boolean).join(', ') || 'No address set'}
                    </span>
                  </div>
               </div>
             )}
          </form>
        </motion.div>

        <div className="card orders-card">
          <div className="card-header">
            <h3><Package size={20} /> Order History</h3>
          </div>
          <div className="orders-list">
            {(user.orders || []).length === 0 ? (
              <div className="empty-state">No orders found.</div>
            ) : (
              user.orders.map(o => (
                <div key={o.id} className="order-item">
                   <div className="order-left">
                     <span className="order-id">#{o.id}</span>
                     <span className="order-date">{o.date}</span>
                   </div>
                   <div className="order-right">
                      <span className={`status-badge ${o.status?.toLowerCase()}`}>{o.status}</span>
                      <span className="order-total">${Number(o.total).toFixed(2)}</span>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}