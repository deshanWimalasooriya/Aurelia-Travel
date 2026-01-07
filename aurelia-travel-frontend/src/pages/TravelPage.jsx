import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { MapPin, Calendar, Wallet, Car, CloudRain, AlertTriangle, Clock } from 'lucide-react';
import './styles/travelPage.css';

const TravelPage = () => {
  const navigate = useNavigate(); // 2. Initialize hook

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
    console.log("Generating Roadmap for:", formData);
    
    // 3. Navigate to the Itinerary Page
    // You can pass the formData via state if you want to use it on the next page
    navigate('/travel-itinerary', { state: { formData } }); 
  };

  return (
    <div className="travel-page">
      <section className="travel-hero">
        <h1>Create Your <span>Aurelia Roadmap</span></h1>
        <p>Short break? We'll handle the logistics. You handle the memories.</p>
      </section>

      <div className="planner-container">
        <form className="planner-card" onSubmit={handleGenerate}>
          
          {/* Starting Location */}
          <div className="input-group">
            <label><MapPin size={18} /> Starting From</label>
            <input 
              type="text" 
              placeholder="Enter your current city (e.g., Kandy)" 
              value={formData.startLocation}
              onChange={(e) => setFormData({...formData, startLocation: e.target.value})}
              required
            />
          </div>

          {/* Date & Vehicle */}
          <div className="input-row">
            <div className="input-group">
              <label><Clock size={18} /> Start Date & Time</label>
              <input 
                type="datetime-local" 
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                required
              />
            </div>

            <div className="input-group">
              <label><Car size={18} /> Vehicle Availability</label>
              <select 
                value={formData.hasVehicle}
                onChange={(e) => setFormData({...formData, hasVehicle: e.target.value})}
              >
                <option value="no">I need a vehicle</option>
                <option value="yes">I have my own vehicle</option>
              </select>
            </div>
          </div>

          {/* Duration & Budget */}
          <div className="input-row">
            <div className="input-group">
              <label><Calendar size={18} /> Duration (Days)</label>
              <select 
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
              >
                <option value={1}>1 Day</option>
                <option value={2}>2 Days</option>
                <option value={3}>3 Days (Weekend)</option>
                <option value={4}>4 Days</option>
                <option value={5}>5+ Days</option>
              </select>
            </div>

            <div className="input-group">
              <label><Wallet size={18} /> Budget Cap (LKR)</label>
              <input 
                type="number" 
                placeholder="Total budget" 
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
            Generate My Travel Plan
          </button>
        </form>

        {/* Sidebar */}
        <aside className="safety-sidebar">
          <h3><CloudRain size={20} /> Smart Insights</h3>
          <div className="insight-item">
            <AlertTriangle className="warning-icon" />
            <p><strong>Risk Check:</strong> We monitor real-time weather and road closures for your selected dates.</p>
          </div>
          <div className="insight-item">
            <Car size={20} />
            <p><strong>Transport:</strong> {formData.hasVehicle === 'yes' ? 'We will optimize routes for fuel efficiency.' : 'We will book top-rated drivers for you.'}</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TravelPage;