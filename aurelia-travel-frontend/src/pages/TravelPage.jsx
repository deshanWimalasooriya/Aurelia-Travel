import React, { useState } from 'react';
import { MapPin, Calendar, Wallet, Car, CloudRain, AlertTriangle } from 'lucide-react';
import './styles/travelPage.css'; // Create this CSS file for styling

const TravelPage = () => {
  const [formData, setFormData] = useState({
    startLocation: '',
    duration: 3,
    budget: '',
    pace: 'chill',
    transport: 'own-vehicle'
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    console.log("Generating Roadmap for:", formData);
    // Logic to call your AI/Algorithm goes here
  };

  return (
    <div className="travel-page">
      <section className="travel-hero">
        <h1>Create Your <span>Aurelia Roadmap</span></h1>
        <p>Short break? We'll handle the logistics. You handle the memories.</p>
      </section>

      <div className="planner-container">
        <form className="planner-card" onSubmit={handleGenerate}>
          <div className="input-group">
            <label><MapPin size={18} /> Starting From</label>
            <input 
              type="text" 
              placeholder="Enter your current city" 
              value={formData.startLocation}
              onChange={(e) => setFormData({...formData, startLocation: e.target.value})}
            />
          </div>

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
              </select>
            </div>

            <div className="input-group">
              <label><Wallet size={18} /> Budget Cap ($)</label>
              <input 
                type="number" 
                placeholder="Total budget" 
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
              />
            </div>
          </div>

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

        <aside className="safety-sidebar">
          <h3><CloudRain size={20} /> Smart Insights</h3>
          <div className="insight-item">
            <AlertTriangle className="warning-icon" />
            <p><strong>Risk Check:</strong> Based on your dates, we'll monitor weather and road closures in real-time.</p>
          </div>
          <div className="insight-item">
            <Car size={20} />
            <p><strong>Transport:</strong> We optimize routes for fuel efficiency or public transport sync.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TravelPage;