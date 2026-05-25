import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Wallet, Car, CloudRain, AlertTriangle, Clock, Map, Sparkles, LocateFixed, X, Crosshair } from 'lucide-react';
import './styles/plannerContainer.css';

// Change this line:
const PlannerContainer = ({ onSubmit, mapStart = null, mapEnd = null }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    startLocation: '',
    endLocation: '',
    startDate: '',
    hasVehicle: 'no',
    duration: 3,
    budget: '',
    description: '', 
  });

  // 2. Add this useEffect to listen to the background map!
  React.useEffect(() => {
    if (mapStart) setFormData(prev => ({ ...prev, startLocation: mapStart }));
    if (mapEnd) setFormData(prev => ({ ...prev, endLocation: mapEnd }));
  }, [mapStart, mapEnd]);

  // --- MAP MODAL STATE ---
  const [mapModal, setMapModal] = useState({ isOpen: false, targetField: null });

  // --- MAP HANDLERS ---
  const openMap = (field) => setMapModal({ isOpen: true, targetField: field });
  const closeMap = () => setMapModal({ isOpen: false, targetField: null });

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Grabs exact GPS coordinates from the device
          const coords = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
          setFormData({ ...formData, [mapModal.targetField]: coords });
          closeMap();
        },
        (error) => {
          alert("Unable to retrieve your location. Please check your browser permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleConfirmMapPin = () => {
    // In a full Google Maps integration, you would reverse-geocode the map's center coordinates here.
    // For now, we simulate grabbing a location from the map center.
    setFormData({ ...formData, [mapModal.targetField]: "Selected Map Location" });
    closeMap();
  };

  // --- SUBMIT HANDLER ---
  const handleGenerate = (e) => {
    e.preventDefault();
    const finalData = { ...formData };

    if (!finalData.endLocation.trim()) {
      finalData.endLocation = finalData.startLocation;
    }
    if (!finalData.description.trim()) {
      finalData.description = "Surprise me with a random, amazing trip!";
    }
    
    if (onSubmit) {
      onSubmit(finalData); 
    } else {
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
            <div className="location-input-wrapper">
              <input 
                type="text" 
                placeholder="e.g. Colombo" 
                value={formData.startLocation}
                onChange={(e) => setFormData({...formData, startLocation: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label><Map size={16} /> Ending At</label>
            <div className="location-input-wrapper">
              <input 
                type="text" 
                placeholder="Leave blank for round-trip" 
                value={formData.endLocation}
                onChange={(e) => setFormData({...formData, endLocation: e.target.value})}
              />
            </div>
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
            placeholder="e.g. A relaxing beach getaway with seafood... (Leave blank for a surprise trip!)"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows="3"
            data-gramm="false"
            data-gramm_editor="false"
          />
        </div>

        <button type="submit" className="generate-btn">
          {onSubmit ? "Add to Current Trip" : "Generate Itinerary"}
        </button>
      </form>

      {/* --- MAP SELECTION MODAL --- */}
      {mapModal.isOpen && (
        <div className="map-modal-overlay" onClick={closeMap}>
          <div className="map-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="map-modal-header">
              <h3>Select Location</h3>
              <button className="close-modal-btn" onClick={closeMap}><X size={20} /></button>
            </div>
            
            <div className="map-modal-body">
              <button className="btn-use-location" onClick={handleUseCurrentLocation}>
                <LocateFixed size={18} /> Use My Current Location
              </button>
              
              <div className="divider"><span>OR PIN ON MAP</span></div>

              {/* Simulated Map View */}
              <div className="map-frame">
                <div className="map-pin-center">
                  <MapPin size={32} color="#ef4444" fill="#fecaca" />
                  <div className="pin-shadow"></div>
                </div>
              </div>
            </div>

            <div className="map-modal-footer">
              <button className="btn-ghost" onClick={closeMap}>Cancel</button>
              <button className="btn-primary" onClick={handleConfirmMapPin}>Confirm Location</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerContainer;