import React, { useState } from 'react';
import { 
  MapPin, Navigation, Coffee, Home, Flag, 
  ArrowRight, Clock, DollarSign, Star, Calendar 
} from 'lucide-react';
import './styles/travelPlanPage.css'; // Make sure this path matches your folder structure

// ==========================================
// 1. MOCK DATA (Simulating AI Response)
// ==========================================
const mockTripData = {
  tripId: "AUR-8821",
  title: "Kandy to Ella: The Misty Train Route",
  totalBudget: 280000,
  duration: "3 Days",
  route: [
    {
      type: 'start',
      label: 'Start Journey',
      location: 'Kandy, Sri Lanka',
      time: '08:00 AM',
      description: 'Driver arrives at your location.',
      icon: <Navigation size={20} />
    },
    {
      day: 1,
      title: "Day 1: The Hill Capital",
      activities: [
        { type: 'transport', label: 'Private Van', detail: 'Luxury A/C Van (3 Pax)', time: '08:30 AM', icon: <Navigation size={16} /> },
        { type: 'location', label: 'Temple of the Tooth', detail: 'Cultural Visit', time: '09:30 AM', icon: <MapPin size={16} /> },
        { type: 'food', label: 'Empire Cafe', detail: 'Brunch & Coffee', time: '12:00 PM', icon: <Coffee size={16} /> },
        { type: 'stay', label: 'The Radh Hotel', detail: 'Check-in & Relax', time: '02:00 PM', icon: <Home size={16} /> }
      ]
    },
    {
      day: 2,
      title: "Day 2: The Scenic Train",
      activities: [
        { type: 'transport', label: 'Kandy Railway Station', detail: 'Blue Train to Ella', time: '08:45 AM', icon: <Navigation size={16} /> },
        { type: 'location', label: 'Nine Arches Bridge', detail: 'Sightseeing', time: '03:00 PM', icon: <MapPin size={16} /> },
        { type: 'food', label: 'Cafe Chill', detail: 'Dinner & Vibes', time: '07:00 PM', icon: <Coffee size={16} /> }
      ]
    },
    {
      type: 'end',
      label: 'Trip Complete',
      location: 'Ella, Sri Lanka',
      time: 'Day 3 - 05:00 PM',
      description: 'Drop off at hotel or station.',
      icon: <Flag size={20} />
    }
  ]
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
const TravelPlanPage = () => {
  // State to track which item is being hovered (to highlight on map)
  const [activeStep, setActiveStep] = useState(null);

  return (
    <div className="travel-plan-page">
      
      {/* --------------------------------------
          LEFT SIDE: Interactive Timeline Flow 
         -------------------------------------- */}
      <div className="flow-sidebar">
        
        {/* Header Area */}
        <header className="plan-header">
          <h1>Your <span>Aurelia</span> Journey</h1>
          <div className="trip-meta">
            <span><Clock size={14}/> {mockTripData.duration}</span>
            <span><DollarSign size={14}/> {mockTripData.totalBudget.toLocaleString()} LKR</span>
            <span><Calendar size={14}/> Jan 12 - Jan 14</span>
          </div>
        </header>

        {/* Scrollable Timeline */}
        <div className="timeline-container">
          {mockTripData.route.map((node, index) => {
            
            // RENDER LOGIC 1: Start and End Nodes (Single Items)
            if (node.type === 'start' || node.type === 'end') {
              return (
                <div 
                  key={index} 
                  className={`timeline-node special-node ${node.type} ${activeStep === index ? 'active' : ''}`}
                  onMouseEnter={() => setActiveStep(index)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  <div className="node-icon">{node.icon}</div>
                  <div className="node-content">
                    <h3>{node.label}</h3>
                    <p>{node.location}</p>
                    <span className="time-badge">{node.time}</span>
                  </div>
                </div>
              );
            }

            // RENDER LOGIC 2: Day Groups (Nested Activities)
            return (
              <div key={index} className="day-group">
                <div className="day-header">
                  <h2>{node.title}</h2>
                </div>
                
                <div className="activities-list">
                  {node.activities.map((act, i) => {
                    const uniqueId = `${index}-${i}`; // Create unique ID for sub-items
                    return (
                      <div 
                        key={i} 
                        className={`activity-card ${activeStep === uniqueId ? 'active' : ''}`}
                        onMouseEnter={() => setActiveStep(uniqueId)}
                        onMouseLeave={() => setActiveStep(null)}
                      >
                        {/* The little line connecting to the main timeline */}
                        <div className="act-connector"></div>
                        
                        <div className="act-icon">{act.icon}</div>
                        <div className="act-details">
                          <h4>{act.label}</h4>
                          <p>{act.detail}</p>
                        </div>
                        <span className="act-time">{act.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Action Buttons */}
        <div className="plan-actions">
          <button className="btn-secondary">Download PDF</button>
          <button className="btn-primary">Confirm & Book Trip</button>
        </div>
      </div>

      {/* --------------------------------------
          RIGHT SIDE: Real-Time Map
         -------------------------------------- */}
      <div className="map-section">
        {/* This container mimics a map. In production, replace with <GoogleMap> */}
        <div className="map-placeholder">
          
          {/* Overlay Info that appears over the map */}
          <div className="map-overlay">
            <MapPin size={48} className="floating-pin" />
            <h3>Interactive Map View</h3>
            <p>
              {activeStep 
                ? "Viewing location details..." 
                : "Hover over the timeline to see locations on the map."
              }
            </p>
          </div>

          {/* Static Background Image for Demo */}
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Transportation_Map_of_Sri_Lanka.png/603px-Transportation_Map_of_Sri_Lanka.png" 
            alt="Map Preview" 
            className="map-image"
          />
          {/* NOTE: I used a Wikipedia map for the demo. 
              For the 'Dark Mode' look, use Mapbox or Google Maps API with a dark style. */}
        </div>
      </div>
    </div>
  );
};

export default TravelPlanPage;