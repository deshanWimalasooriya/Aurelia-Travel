import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Wallet, Car, CloudRain, AlertTriangle, Clock } from 'lucide-react';
import './styles/plannerContainer.css'; // Ensure path is correct

// ACCEPT NEW PROP: onSubmit (Optional)
const PlannerContainer = ({ onSubmit }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    startLocation: '',
    startDate: '',
    hasVehicle: 'no',
    duration: 3,
    budget: '',
    pace: 'chill',
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    
    // LOGIC SPLIT:
    if (onSubmit) {
      // 1. If used as a Popup in Dashboard, send data back to parent
      onSubmit(formData); 
    } else {
      // 2. If used in Home Page, Navigate to Itinerary
      console.log("Navigating to Itinerary...");
      navigate('/travel-itinerary', { state: { formData } }); 
    }
  };

  return (
    <div className="planner-container">
      <form className="planner-card" onSubmit={handleGenerate}>
        {/* ... Inputs remain exactly the same ... */}
        
        {/* Starting Location */}
        <div className="input-group">
          <label><MapPin size={18} /> Starting From</label>
          <input 
            type="text" 
            placeholder="Enter City" 
            value={formData.startLocation}
            onChange={(e) => setFormData({...formData, startLocation: e.target.value})}
            required
          />
        </div>

        {/* Date & Vehicle */}
        <div className="input-row">
          <div className="input-group">
            <label><Clock size={18} /> Start Date</label>
            <input 
              type="datetime-local" 
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              required
            />
          </div>

          <div className="input-group">
            <label><Car size={18} /> Vehicle</label>
            <select 
              value={formData.hasVehicle}
              onChange={(e) => setFormData({...formData, hasVehicle: e.target.value})}
            >
              <option value="no">Need Vehicle</option>
              <option value="yes">Have Vehicle</option>
            </select>
          </div>
        </div>

        {/* Duration & Budget */}
        <div className="input-row">
          <div className="input-group">
            <label><Calendar size={18} /> Duration</label>
            <select 
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
            >
              <option value={1}>1 Day</option>
              <option value={2}>2 Days</option>
              <option value={3}>3 Days</option>
            </select>
          </div>

          <div className="input-group">
            <label><Wallet size={18} /> Budget</label>
            <input 
              type="number" 
              placeholder="LKR" 
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              required
            />
          </div>
        </div>

        {/* Pace Selection */}
        <div className="pace-selector">
          <label>Trip Pace</label>
          <div className="pace-options">
            {['Adrenaline', 'Chill', 'Cultural'].map(p => (
              <button 
                key={p} 
                type="button"
                className={formData.pace === p.toLowerCase() ? 'active' : ''}
                onClick={() => setFormData({...formData, pace: p.toLowerCase()})}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="generate-btn">
          {onSubmit ? "Add to Current Trip" : "Generate My Travel Plan"}
        </button>
      </form>

      {/* Sidebar - HIDDEN in Popup Mode to save space (Optional) */}
      {!onSubmit && (
        <aside className="safety-sidebar">
          <h3><CloudRain size={20} /> Smart Insights</h3>
          <div className="insight-item">
            <AlertTriangle className="warning-icon" />
            <p>Risk Check: Weather & Road Closures</p>
          </div>
        </aside>
      )}
    </div>
  );
};

export default PlannerContainer;