import { useState } from 'react'
import { useUser } from '../context/UserContext'
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; 
import { CreditCard, MapPin, User, Package, Trash2, Edit2, Save, X, Camera } from 'lucide-react';
import './styles/profile.css'

export default function Profile() {
  const { user, refreshUser } = useUser()
  
  // --- STATE MANAGEMENT ---
  const [editingProfile, setEditingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  // Initialize form with current user data
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    address_line_1: user?.address_line_1 || '',
    address_line_2: user?.address_line_2 || '',
    address_line_3: user?.address_line_3 || '',
    city: user?.city || '',
    postal_code: user?.postal_code || '',
    country: user?.country || ''
  });

  const [picPreview, setPicPreview] = useState(user?.profile_image || '');
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

  if (!user) return <div className="profile-not-logged-in">Please sign in to view your profile.</div>

  // --- HANDLERS ---
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
      setProfileData({
        username: user?.username || '',
        email: user?.email || '',
        password: '',
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
      if (profileData.username !== user.username) updateData.username = profileData.username;
      if (profileData.email !== user.email) updateData.email = profileData.email;
      if (profileData.password) updateData.password = profileData.password;
      if (profileData.address_line_1 !== user.address_line_1) updateData.address_line_1 = profileData.address_line_1;
      if (profileData.address_line_2 !== user.address_line_2) updateData.address_line_2 = profileData.address_line_2;
      if (profileData.address_line_3 !== user.address_line_3) updateData.address_line_3 = profileData.address_line_3;
      if (profileData.city !== user.city) updateData.city = profileData.city;
      if (profileData.postal_code !== user.postal_code) updateData.postal_code = profileData.postal_code;
      if (profileData.country !== user.country) updateData.country = profileData.country;

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
        setProfileError('No changes detected.');
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
        await axios.put(
            `http://localhost:5000/api/users/${user.id}`,
            { card_type: paymentData.card_type, card_number: cleanNumber, cvv: null, expiry_date: paymentData.expiry_date },
            { withCredentials: true }
        );
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
        await axios.put(
            `http://localhost:5000/api/users/${user.id}`,
            { card_type: null, card_number: null, cvv: null, expiry_date: null },
            { withCredentials: true }
        );
        await refreshUser();
    } catch(err) {
        alert("Could not remove card");
    }
  }

  return (
    <div className="profile-page-wrapper">
      {/* Background Animation Elements */}
      <div className="area">
        <ul className="circles">
          <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
        </ul>
      </div>

      <motion.div 
        className="profile-container"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <AnimatePresence>
          {showPaymentModal && (
            <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
              <motion.div 
                className="modal-content" 
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <button className="modal-close" onClick={() => setShowPaymentModal(false)}><X /></button>
                <h2 className="modal-title">Add Payment Method</h2>
                
                {paymentSuccess ? (
                  <div className="message success-message">Card Saved!</div>
                ) : (
                  <>
                    <div className="card-scene">
                      <div className={`card-object ${isCardFlipped ? 'is-flipped' : ''}`}>
                        <div className={`card-face card-front ${paymentData.card_type.toLowerCase()}`}>
                           <div className="card-chip"></div>
                           <div className="card-number-display">{paymentData.card_number || '•••• •••• •••• ••••'}</div>
                           <div className="card-details-row">
                             <div>{user.username}</div>
                             <div>{paymentData.expiry_date || 'MM/YY'}</div>
                           </div>
                        </div>
                        <div className={`card-face card-back ${paymentData.card_type.toLowerCase()}`}>
                           <div className="card-magnetic-strip"></div>
                           <div className="card-cvv-display">{paymentData.cvv}</div>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSavePayment} className="payment-modal-form">
                      <select name="card_type" value={paymentData.card_type} onChange={handlePaymentInput} className="form-input" required>
                          <option value="">Select Brand</option>
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
                      <button type="submit" className="btn-primary full-width" disabled={loadingPayment}>Save Card</button>
                    </form>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SIDEBAR */}
        <motion.div 
          className="profile-sidebar"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="profile-avatar-section card">
              <div className="avatar-wrapper">
                  {picPreview ? (
                      <img src={picPreview} alt="Avatar" className="profile-avatar-img" />
                  ) : (
                      <div className="profile-avatar-placeholder-pic">{user.username?.charAt(0)}</div>
                  )}
                  {editingProfile && (
                      <label className="avatar-upload-btn">
                          <Camera size={16} />
                          <input type="file" hidden accept="image/*" onChange={onFileChange} />
                      </label>
                  )}
              </div>
              <h2 className="profile-user-name">{user.username}</h2>
              <p className="profile-user-email">{user.email}</p>
          </div>

          <div className="payment-methods-section card">
              <h4 className="section-header"><CreditCard size={18}/> Payment Method</h4>
              {user.card_type ? (
                  <div className="payment-mini-card">
                      <div>
                          <div className="brand">{user.card_type}</div>
                          <div className="digits">•••• {user.card_number?.slice(-4)}</div>
                      </div>
                      <button className="icon-btn danger" onClick={handleRemovePayment}><Trash2 size={16}/></button>
                  </div>
              ) : (
                  <div className="empty-state">No card added</div>
              )}
              <button className="btn-outline full-width" onClick={() => setShowPaymentModal(true)}>
                  {user.card_type ? 'Change Card' : 'Add Card'}
              </button>
          </div>
        </motion.div>

        {/* MAIN CONTENT */}
        <motion.div 
          className="profile-main"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div className="card" layout>
              <div className="card-header">
                  <h3><User size={20}/> User Details</h3>
                  <button className={`btn-icon ${editingProfile ? 'active' : ''}`} onClick={handleEditToggle}>
                      {editingProfile ? <X size={20}/> : <Edit2 size={20}/>}
                  </button>
              </div>

              {profileError && <div className="message error-message">{profileError}</div>}
              {profileSuccess && <div className="message success-message">Profile Updated!</div>}

              <form onSubmit={handleSaveProfile} className={editingProfile ? 'form-grid' : 'details-grid'}>
                  {editingProfile ? (
                      <>
                          <div className="form-group">
                              <label>Username</label>
                              <input name="username" value={profileData.username} onChange={handleInputChange} className="form-input"/>
                          </div>
                          <div className="form-group">
                              <label>Email</label>
                              <input name="email" value={profileData.email} onChange={handleInputChange} className="form-input"/>
                          </div>
                          <div className="form-group span-2">
                              <label>New Password (Optional)</label>
                              <input name="password" type="password" value={profileData.password} onChange={handleInputChange} className="form-input" placeholder="Leave blank to keep current"/>
                          </div>
                          <div className="divider span-2">Address</div>
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
                      <>
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
                                  <MapPin size={14} style={{display:'inline', marginRight:5}}/>
                                  {[user.address_line_1, user.city, user.country].filter(Boolean).join(', ') || 'No address set'}
                              </span>
                          </div>
                      </>
                  )}
              </form>
          </motion.div>

          {/* ORDERS CARD */}
          <div className="card">
              <div className="card-header">
                  <h3><Package size={20}/> Orders</h3>
              </div>
              <div className="orders-list">
                  {(!user.orders || user.orders.length === 0) ? (
                      <div className="empty-state">No orders found</div>
                  ) : (
                      user.orders.map(order => (
                          <div key={order.id} className="order-item">
                              <div>
                                  <span className="order-id">#{order.id}</span>
                                  <div className="order-date">{order.date}</div>
                              </div>
                              <div className="order-right">
                                  <span className={`status-badge ${order.status?.toLowerCase()}`}>{order.status}</span>
                                  <div className="order-total">${Number(order.total).toFixed(2)}</div>
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