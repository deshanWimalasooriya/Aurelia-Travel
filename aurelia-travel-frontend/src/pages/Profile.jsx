// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './styles/profile.css';

const Profile = () => {
  const { user, logout, token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    city: '',
    country: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        addressLine1: user.addressLine1 || '',
        addressLine2: user.addressLine2 || '',
        addressLine3: user.addressLine3 || '',
        city: user.city || '',
        country: user.country || ''
      });
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data.data || []);
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await axios.put('http://localhost:5000/api/users/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditing(false);
      alert('✅ Profile updated successfully!');
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleResetPassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('❌ Passwords do not match');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/users/reset-password', passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('✅ Password reset successfully!');
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        addressLine1: user.addressLine1 || '',
        addressLine2: user.addressLine2 || '',
        addressLine3: user.addressLine3 || '',
        city: user.city || '',
        country: user.country || ''
      });
    }
  };

  if (!user) {
    return <div className="profile-empty-state">Please login to view profile.</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {profileData.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{profileData.name || 'User'}</h1>
            <div className="profile-meta">
              <span className="profile-email">{profileData.email}</span>
              <span className="profile-phone">{profileData.phone || 'No phone'}</span>
            </div>
          </div>
          <div className="profile-actions">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="btn btn-edit">
                  Edit Profile
                </button>
                <button onClick={() => setShowPasswordModal(true)} className="btn btn-password">
                  Reset Password
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSaveProfile} className="btn btn-save">Save Changes</button>
                <button onClick={handleCancelEdit} className="btn btn-cancel">Cancel</button>
              </>
            )}
            <button onClick={logout} className="btn btn-logout">Logout</button>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <div className="profile-edit-section">
            <div className="edit-card">
              <h2 className="section-title">Edit Profile Information</h2>
              <div className="edit-form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input name="name" value={profileData.name} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="email" type="email" value={profileData.email} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" type="tel" value={profileData.phone} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group full-width">
                  <label>Address Line 1</label>
                  <input name="addressLine1" value={profileData.addressLine1} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group full-width">
                  <label>Address Line 2</label>
                  <input name="addressLine2" value={profileData.addressLine2} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group full-width">
                  <label>Address Line 3</label>
                  <input name="addressLine3" value={profileData.addressLine3} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input name="city" value={profileData.city} onChange={handleInputChange} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input name="country" value={profileData.country} onChange={handleInputChange} className="form-input" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Reset Password</h3>
                <button onClick={() => setShowPasswordModal(false)} className="modal-close">&times;</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    name="currentPassword" 
                    type="password" 
                    value={passwordData.currentPassword} 
                    onChange={handlePasswordChange} 
                    className="form-input" 
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    name="newPassword" 
                    type="password" 
                    value={passwordData.newPassword} 
                    onChange={handlePasswordChange} 
                    className="form-input" 
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    name="confirmPassword" 
                    type="password" 
                    value={passwordData.confirmPassword} 
                    onChange={handlePasswordChange} 
                    className="form-input" 
                  />
                </div>
                <button onClick={handleResetPassword} className="btn btn-primary full-width">Update Password</button>
              </div>
            </div>
          </div>
        )}

        {/* Bookings */}
        <div className="profile-bookings-section">
          <div className="bookings-card">
            <div className="bookings-header">
              <h2 className="section-title">Recent Bookings ({bookings.length})</h2>
              <button onClick={fetchBookings} disabled={loading} className="btn-refresh">
                {loading ? '⟳ Loading...' : '⟳ Refresh'}
              </button>
            </div>
            {error && <div className="error-alert">{error}</div>}
            {loading ? (
              <div className="loading-state">Loading your bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No bookings yet</h3>
                <p>Make your first reservation to see it here</p>
              </div>
            ) : (
              <div className="bookings-grid">
                {bookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-content">
                      <h4>{booking.hotel_name || 'Hotel'}</h4>
                      <p>{booking.check_in} - {booking.check_out}</p>
                      <div className="booking-price">${parseFloat(booking.total_amount || 0).toFixed(2)}</div>
                    </div>
                    <span className={`status-badge status-${booking.status || 'confirmed'}`}>
                      {booking.status?.toUpperCase() || 'CONFIRMED'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
