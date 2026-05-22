import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Wallet, Car, CloudRain, AlertTriangle, Clock, Map, Sparkles } from 'lucide-react';
import './styles/plannerContainer.css';

const PlannerContainer = ({ onSubmit }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    startLocation: '',
    endLocation: '',
    startDate: '',
    hasVehicle: 'no',
    duration: 3,
    budget: '',
    description: '', // Replaces the old 'pace' option
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    
    // Create a copy of the data to apply defaults before submitting
    const finalData = { ...formData };

    // Default End Location = Start Location if left empty
    if (!finalData.endLocation.trim()) {
      finalData.endLocation = finalData.startLocation;
    }

    // Default Description = Surprise trip if left empty
    if (!finalData.description.trim()) {
      finalData.description = "Surprise me with a random, amazing trip!";
    }
    
    // LOGIC SPLIT:
    if (onSubmit) {
      // 1. If used as a Popup in Dashboard, send data back to parent
      onSubmit(finalData); 
    } else {
      // 2. If used in Home Page, Navigate to Itinerary
      console.log("Navigating to Itinerary with data:", finalData);
      navigate('/travel-itinerary', { state: { formData: finalData } }); 
    }
  };

  return (
    <div className="planner-container">
      <form className="planner-card" onSubmit={handleGenerate}>
        
        {/* Locations Row */}
        <div className="input-row">
          <div className="input-group">
            <label><MapPin size={16} /> Starting From</label>
            <input 
              type="text" 
              placeholder="e.g. Colombo" 
              value={formData.startLocation}
              onChange={(e) => setFormData({...formData, startLocation: e.target.value})}
              required
            />
          </div>

          <div className="input-group">
            <label><Map size={16} /> Ending At</label>
            <input 
              type="text" 
              placeholder="Leave blank for round-trip" 
              value={formData.endLocation}
              onChange={(e) => setFormData({...formData, endLocation: e.target.value})}
            />
          </div>
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

        {/* Trip Description / AI Prompt */}
        <div className="input-group description-group">
          <label><Sparkles size={16} /> Describe Your Perfect Trip</label>
          <textarea 
            placeholder="e.g. A relaxing beach getaway with seafood, or a cultural mountain tour..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows="3"
            /* Add these to block the misaligned overlay */
            data-gramm="false"
            data-gramm_editor="false"
          />
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