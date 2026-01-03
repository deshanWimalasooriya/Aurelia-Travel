import { useState } from 'react'
import { useUser } from '../context/UserContext'
import axios from 'axios';
import './styles/profile.css'

export default function Profile(){
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
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  const handleEditProfile = () => {
    if (editingProfile) {
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
      setProfileSuccess(false);
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
      
      // Compare all text fields properly
if (profileData.username !== user.username) {
  updateData.username = profileData.username;
}
if (profileData.email !== user.email) {
  updateData.email = profileData.email;
}
if (profileData.password) {
  updateData.password = profileData.password;
}
if (profileData.address_line_1 !== user.address_line_1) {
  updateData.address_line_1 = profileData.address_line_1;
}
if (profileData.address_line_2 !== user.address_line_2) {
  updateData.address_line_2 = profileData.address_line_2;
}
if (profileData.address_line_3 !== user.address_line_3) {
  updateData.address_line_3 = profileData.address_line_3;
}
if (profileData.city !== user.city) {
  updateData.city = profileData.city;
}
if (profileData.postal_code !== user.postal_code) {
  updateData.postal_code = profileData.postal_code;
}
if (profileData.country !== user.country) {
  updateData.country = profileData.country;
}

// Handle profile image upload
if (profileImageFile) {
  const imageFormData = new FormData();
  imageFormData.append('profile_image', profileImageFile);

  const imageResponse = await axios.post(
    `http://localhost:5000/api/users/${user.id}/upload-image`,
    imageFormData,
    {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );

  if (imageResponse.data.imageUrl) {
    updateData.profile_image = imageResponse.data.imageUrl;
  }
}

// No changes check
if (Object.keys(updateData).length === 0) {
  setProfileError('No changes to update');
  setLoadingProfile(false);
  return;
}

console.log('Updating with data:', updateData); // helpful debug

// Send update request
const response = await axios.put(
  `http://localhost:5000/api/users/${user.id}`,
  updateData,
  { withCredentials: true }
);

if (response.data.success) {
  setProfileSuccess(true);
  setEditingProfile(false);
  await refreshUser();

  setTimeout(() => {
    window.location.reload();
  }, 1500);
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
    
    // Format card number with spaces
    if (name === 'card_number') {
      const cleanValue = value.replace(/\s/g, '');
      if (cleanValue.length <= 16 && /^\d*$/.test(cleanValue)) {
        const formatted = cleanValue.match(/.{1,4}/g)?.join(' ') || cleanValue;
        setPaymentData(prev => ({ ...prev, [name]: formatted }));
      }
      return;
    }
    
    // Format expiry date
    if (name === 'expiry_date') {
      let cleanValue = value.replace(/\D/g, '');
      if (cleanValue.length >= 2) {
        cleanValue = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4);
      }
      setPaymentData(prev => ({ ...prev, [name]: cleanValue }));
      return;
    }
    
    // CVV validation
    if (name === 'cvv') {
      if (value.length <= 4 && /^\d*$/.test(value)) {
        setPaymentData(prev => ({ ...prev, [name]: value }));
      }
      return;
    }
    
    setPaymentData(prev => ({ ...prev, [name]: value }));
  }

  const handleOpenPaymentModal = () => {
    setShowPaymentModal(true);
    setPaymentError(null);
    setPaymentSuccess(false);
    setPaymentData({
      card_type: '',
      card_number: '',
      cvv: '',
      expiry_date: ''
    });
  }

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentData({
      card_type: '',
      card_number: '',
      cvv: '',
      expiry_date: ''
    });
    setPaymentError(null);
    setPaymentSuccess(false);
  }

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setPaymentError(null);
    setPaymentSuccess(false);
    setLoadingPayment(true);

    try {
      // Validate card data
      if (!paymentData.card_type || !paymentData.card_number || !paymentData.cvv || !paymentData.expiry_date) {
        setPaymentError('Please fill in all card details');
        setLoadingPayment(false);
        return;
      }

      // Validate expiry format
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(paymentData.expiry_date)) {
        setPaymentError('Invalid expiry date format. Use MM/YY');
        setLoadingPayment(false);
        return;
      }

      // Get last 4 digits
      const cardNumberClean = paymentData.card_number.replace(/\s/g, '');

      console.log('Saving payment method...');

      const response = await axios.put(
        `http://localhost:5000/api/users/${user.id}`,
        {
          card_type: paymentData.card_type,
          card_number: cardNumberClean, // Only save last 4 digits
          cvv: null, // Don't store CVV
          expiry_date: paymentData.expiry_date
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setPaymentSuccess(true);
        await refreshUser();
        
        setTimeout(() => {
          setShowPaymentModal(false);
          window.location.reload();
        }, 1500);
      }

    } catch (err) {
      console.error('Payment save error:', err);
      setPaymentError(err.response?.data?.message || 'Failed to save payment method');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleRemovePayment = async () => {
    if (!window.confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    setLoadingPayment(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${user.id}`,
        {
          card_type: null,
          card_number: null,
          cvv: null,
          expiry_date: null
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        await refreshUser();
        window.location.reload();
      }
    } catch (err) {
      console.error('Payment remove error:', err);
      alert('Failed to remove payment method');
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <div className="profile-container">
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={handleClosePaymentModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleClosePaymentModal}>×</button>
            
            <h2 className="modal-title">Add Payment Card</h2>
            
            {paymentError && <div className="error-message">{paymentError}</div>}
            {paymentSuccess && <div className="success-message">Card saved successfully!</div>}

            <div className="card-preview-container">
              <div className={`card-preview ${paymentData.card_type.toLowerCase()}`}>
                <div className="card-chip"></div>
                <div className="card-number">
                  {paymentData.card_number || '•••• •••• •••• ••••'}
                </div>
                <div className="card-footer">
                  <div className="card-holder">
                    <div className="card-label">CARD HOLDER</div>
                    <div className="card-name">{user.username?.toUpperCase() || 'YOUR NAME'}</div>
                  </div>
                  <div className="card-expiry">
                    <div className="card-label">EXPIRES</div>
                    <div className="card-exp-value">{paymentData.expiry_date || 'MM/YY'}</div>
                  </div>
                </div>
                {paymentData.card_type && (
                  <div className="card-brand-logo">{paymentData.card_type}</div>
                )}
              </div>
            </div>

              {/* PAYMENT FORM */}
            <form onSubmit={handleSavePayment} className="payment-modal-form">
              <div className="form-group">
                <label className="form-label">Card Type</label>
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
                  <option value="Discover">Discover</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input 
                  name="card_number"
                  value={paymentData.card_number} 
                  onChange={handlePaymentChange} 
                  className="form-input"
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input 
                    name="cvv"
                    type="password"
                    value={paymentData.cvv} 
                    onChange={handlePaymentChange} 
                    className="form-input"
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
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
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleClosePaymentModal}
                  disabled={loadingPayment}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loadingPayment}
                >
                  {loadingPayment ? 'Saving...' : 'Save Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="profile-sidebar">
        <div className="profile-avatar-section">
          {picPreview ? (
            <img src={picPreview} alt="avatar" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-placeholder-pic">
              {(user.username || user.email || 'U').slice(0,1).toUpperCase()}
            </div>
          )}
          <div className="profile-user-info">
            <div className="profile-user-name">{user.username}</div>
            <div className="profile-user-email">{user.email}</div>
          </div>
        </div>

        {/* PAYMENT METHODS SECTION */}
        <div className="payment-methods-section">
          <h4 className="payment-methods-title">Payment Method</h4>

          <div className="payment-methods-list">
            {!user.card_type ? (
              <div className="payment-methods-empty">No payment method added</div>
            ) : (
              <div className="payment-method-item">
                <div>
                  <div className="payment-method-brand">{user.card_type}</div>
                  <div className="payment-method-details">•••• {user.card_number.slice(-4)}</div>
                  <div className="payment-method-exp">Expires: {user.expiry_date}</div>
                </div>
                <div className="payment-method-actions">
                  <button 
                    className="pill pill-danger" 
                    onClick={handleRemovePayment}
                    disabled={loadingPayment}
                  >
                    {loadingPayment ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            )}

            <div className="add-card-btn-wrapper">
              <button className="btn-primary add-card-btn" onClick={handleOpenPaymentModal}>
                {user.card_type ? 'Update Card' : 'Add Card'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* REST OF THE PROFILE CODE (User Details and Orders sections remain the same) */}
      <div className="profile-main">
        <div className="profile-info-card">
          <div className="profile-header">
            <h3 className="profile-section-title">User Details</h3>
            <div className="profile-edit-actions">
              <button className="pill" onClick={handleEditProfile}>
                {editingProfile ? 'Cancel' : 'Edit'}
              </button>
              {editingProfile && (
                <button 
                  className="btn-primary profile-save-btn" 
                  onClick={handleSaveProfile}
                  disabled={loadingProfile}
                >
                  {loadingProfile ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>

          {profileError && <div className="error-message">{profileError}</div>}
          {profileSuccess && <div className="success-message">Profile updated successfully!</div>}

          {/* PROFILE VIEW / EDIT SECTION */}
          {!editingProfile ? (
            <div className="profile-view-grid">
              <div className="profile-field">
                <div className="profile-field-label">Username</div>
                <div className="profile-field-value">{user.username}</div>
              </div>
              <div className="profile-field">
                <div className="profile-field-label">Email</div>
                <div className="profile-field-value">{user.email}</div>
              </div>
              <div className="profile-field">
                <div className="profile-field-label">Address Line 1</div>
                <div className="profile-field-value">{user.address_line_1 || '—'}</div>
              </div>
              <div className="profile-field">
                <div className="profile-field-label">Address Line 2</div>
                <div className="profile-field-value">{user.address_line_2 || '—'}</div>
              </div>
              <div className="profile-field">
                <div className="profile-field-label">Address Line 3</div>
                <div className="profile-field-value">{user.address_line_3 || '—'}</div>
              </div>
              <div className="profile-field">
                <div className="profile-field-label">City</div>
                <div className="profile-field-value">{user.city || '—'}</div>
              </div>
              <div className="profile-field">
                <div className="profile-field-label">Postal Code</div>
                <div className="profile-field-value">{user.postal_code || '—'}</div>
              </div>
              <div className="profile-field">
                <div className="profile-field-label">Country</div>
                <div className="profile-field-value">{user.country || '—'}</div>
              </div>
            </div>
          ) : (
            /* PROFILE EDIT FORM */
            <form onSubmit={handleSaveProfile} className="profile-edit-grid">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  name="username"
                  value={profileData.username} 
                  onChange={handleProfileChange} 
                  className="form-input" 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  name="email"
                  type="email"
                  value={profileData.email} 
                  onChange={handleProfileChange} 
                  className="form-input" 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Password (leave empty to keep current)</label>
                <input 
                  name="password"
                  type="password"
                  value={profileData.password} 
                  onChange={handleProfileChange} 
                  className="form-input"
                  placeholder="Enter new password"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Profile Picture</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => onFile(e.target.files[0])} 
                  className="form-file-input" 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Address Line 1</label>
                <input 
                  name="address_line_1"
                  value={profileData.address_line_1} 
                  onChange={handleProfileChange} 
                  className="form-input"
                  placeholder="Street address, P.O. box"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Address Line 2</label>
                <input 
                  name="address_line_2"
                  value={profileData.address_line_2} 
                  onChange={handleProfileChange} 
                  className="form-input"
                  placeholder="Apartment, suite, unit"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Address Line 3</label>
                <input 
                  name="address_line_3"
                  value={profileData.address_line_3} 
                  onChange={handleProfileChange} 
                  className="form-input"
                  placeholder="Additional details"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">City</label>
                <input 
                  name="city"
                  value={profileData.city} 
                  onChange={handleProfileChange} 
                  className="form-input" 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Postal Code</label>
                <input 
                  name="postal_code"
                  value={profileData.postal_code} 
                  onChange={handleProfileChange} 
                  className="form-input" 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Country</label>
                <input 
                  name="country"
                  value={profileData.country} 
                  onChange={handleProfileChange} 
                  className="form-input" 
                />
              </div>
            </form>
          )}
        </div>

          {/* ORDERS CARD SECTION */}
        <div className="orders-card">
          <h3 className="orders-title">Orders</h3>
          <div className="orders-list">
            {(user.orders || []).length === 0 ? (
              <div className="orders-empty">No orders yet.</div>
            ) : (
              (user.orders || []).map(o => (
                <div key={o.id} className="order-item">
                  <div>
                    <div className="order-header">
                      {o.id} <span className="order-date">{o.date}</span>
                    </div>
                    <div className="order-total">Total: ${Number(o.total || 0).toFixed(2)}</div>
                    <div className="order-items">
                      {(o.items || []).map(it => <div key={it.id}>{it.qty}× {it.name} — ${it.price}</div>)}
                    </div>
                  </div>
                  <div className="order-status">Status: <strong>{o.status || 'pending'}</strong></div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}