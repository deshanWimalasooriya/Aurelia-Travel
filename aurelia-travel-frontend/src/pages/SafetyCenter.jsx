import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Scale, ChevronRight } from 'lucide-react';
import './styles/SafetyCenter.css';

const SafetyCenter = () => {
  // Function to handle the Aurelia Safety Line click
  const handleSafetyLineClick = () => {
    // This could either dial a number OR open an urgent chat/ticket modal
    // For now, it dials your platform's emergency support number
    window.location.href = "tel:+94112345678"; // Replace with your actual support number
  };

  return (
    <div className="safety-page-wrapper">
      {/* Breadcrumbs */}
      <div className="safety-breadcrumbs">
        <span className="breadcrumb-link">My Account</span>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-current">Safety Resource Center</span>
      </div>

      <div className="safety-layout">
        {/* LEFT SIDEBAR: Help & Support Navigation */}
        <aside className="safety-sidebar">
          <div className="sidebar-card">
            <h3>Help and support</h3>
            <nav className="sidebar-nav">
              {/* Using NavLink so it highlights when active */}
              <NavLink to="/profile/safety" className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}>
                <div className="sidebar-item-left">
                  <ShieldCheck size={18} className="sidebar-icon" />
                  <span>Safety resource center</span>
                </div>
                <ChevronRight size={16} className="sidebar-arrow" />
              </NavLink>

              <NavLink to="/profile/disputes" className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}>
                <div className="sidebar-item-left">
                  <Scale size={18} className="sidebar-icon" />
                  <span>Dispute resolution</span>
                </div>
                <ChevronRight size={16} className="sidebar-arrow" />
              </NavLink>
            </nav>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <main className="safety-main-content">
          <div className="safety-header">
            <h1>Safety Resource Center</h1>
            <p>Your safety is our top priority. Access emergency resources and safety guidelines.</p>
          </div>

          {/* EMERGENCY RED BOX */}
          <div className="emergency-alert-box">
            <div className="emergency-alert-header">
              <div className="alert-icon-wrapper">
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <h2>In an Emergency</h2>
            </div>
            <p className="emergency-text">
              If you or someone else is in immediate physical danger, or if there is a medical emergency, please contact local emergency services (police, fire, or ambulance) immediately.
            </p>
            <div className="emergency-actions">
              {/* tel: prefix automatically opens the phone dialer */}
              <a href="tel:119" className="btn-emergency-solid">
                Call Local Authorities
              </a>
              <button onClick={handleSafetyLineClick} className="btn-emergency-outline">
                Aurelia Trust & Safety Line
              </button>
            </div>
          </div>

          {/* SAFETY GUIDELINES BOX */}
          <div className="guidelines-box">
            <div className="guidelines-header">
              <ShieldCheck size={20} color="#3b82f6" />
              <h2>Travel Safety Guidelines</h2>
            </div>
            <ul className="guidelines-list">
              <li>
                <strong>Verify your communications:</strong> Always communicate and pay directly through the Aurelia platform. Never wire money or pay outside the app.
              </li>
              <li>
                <strong>Share your itinerary:</strong> Let a trusted friend or family member know your travel plans, accommodation details, and contact numbers.
              </li>
              <li>
                <strong>Research your destination:</strong> Familiarize yourself with the neighborhood and local emergency numbers before you arrive.
              </li>
              <li>
                <strong>Trust your instincts:</strong> If a situation feels unsafe, leave immediately and contact our 24/7 support team.
              </li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SafetyCenter;