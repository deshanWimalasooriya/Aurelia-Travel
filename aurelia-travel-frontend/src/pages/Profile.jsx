// src/pages/Profile.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import './styles/profile.css';

const Profile = () => {
  const { user, logout } = useAuth();

  if (!user) return <div className="profile-container">Please login to view profile.</div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <div className="profile-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-welcome">
            <h1>Welcome, {user.name}!</h1>
            <p>{user.email}</p>
          </div>
          <button className="btn-logout" onClick={logout}>Logout</button>
        </header>

        <section className="profile-content">
          <div className="profile-card">
            <h3>Recent Bookings</h3>
            <div className="booking-list">
              {/* Dummy booking for now */}
              <div className="booking-item">
                <div className="booking-info">
                  <p className="hotel-name">Grand Royal Hotel</p>
                  <p className="booking-date">Dec 25 - Dec 28, 2025</p>
                </div>
                <span className="status confirmed">Confirmed</span>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <h3>Account Settings</h3>
            <button className="btn-outline">Edit Profile</button>
            <button className="btn-outline">Change Password</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
