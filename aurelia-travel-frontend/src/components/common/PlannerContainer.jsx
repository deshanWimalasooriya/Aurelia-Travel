import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Wallet, Car, CloudRain, AlertTriangle, Clock } from 'lucide-react';
import './styles/plannerContainer.css';

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
        
        {/* Starting Location */}
        <div className="input-group">
          <label><MapPin size={16} /> Starting From</label>
          <input 
            type="text" 
            placeholder="e.g. Colombo, Sri Lanka" 
            value={formData.startLocation}
            onChange={(e) => setFormData({...formData, startLocation: e.target.value})}
            required
          />
        </div>

        {/* Date & Vehicle */}
        <div className="input-row">
          <div className="input-group">
            <label><Clock size={16} /> Start Date</label>
            <input 
              type="datetime-local" 
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              required
            />
          </div>

          <div className="input-group">
            <label><Car size={16} /> Transportation</label>
            <select 
              value={formData.hasVehicle}
              onChange={(e) => setFormData({...formData, hasVehicle: e.target.value})}
            >
              <option value="no">Need Vehicle Arranged</option>
              <option value="yes">Have Own Vehicle</option>
            </select>
          </div>
        </div>

        {/* Duration & Budget */}
        <div className="input-row">
          <div className="input-group">
            <label><Calendar size={16} /> Duration</label>
            <select 
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
            >
              <option value={1}>1 Day Break</option>
              <option value={2}>2 Days Weekend</option>
              <option value={3}>3 Days Extended</option>
            </select>
          </div>

          <div className="input-group">
            <label><Wallet size={16} /> Total Budget (LKR)</label>
            <input 
              type="number" 
              placeholder="e.g. 50000" 
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              required
            />
          </div>
        </div>

        {/* Pace Selection */}
        <div className="pace-selector">
          <label>Desired Trip Pace</label>
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
          {onSubmit ? "Add to Current Trip" : "Generate Itinerary"}
        </button>
      </form>

      {/* Sidebar - HIDDEN in Popup Mode to save space */}
      {!onSubmit && (
        <aside className="safety-sidebar">
          <h3><CloudRain size={20} className="icon-primary"/> Smart Insights</h3>
          <div className="insight-item">
            <AlertTriangle className="warning-icon" size={20} />
            <p><strong>Real-time Check:</strong> Weather patterns and road closures will be factored into your routing.</p>
          </div>
        </aside>
      )}
    </div>
  );
};

export default PlannerContainer;