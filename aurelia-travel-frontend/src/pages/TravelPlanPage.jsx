import React, { useState, useMemo } from 'react';
import { 
  MapPin, Navigation, Coffee, Home, Flag, 
  Clock, DollarSign, Calendar, Train, Car, 
  Wallet, RefreshCw, Bus, Bike, Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './styles/travelPlanPage.css';

// ==========================================
// 1. CONSTANTS: VEHICLE OPTIONS & COSTS
// ==========================================
const VEHICLE_RATES = {
  'van': { label: 'Private Van', rate: 1.0, icon: <Car size={16}/> },   
  'tuktuk': { label: 'Tuk-Tuk', rate: 0.4, icon: <Bike size={16}/> },   
  'bus': { label: 'Public Bus', rate: 0.1, icon: <Bus size={16}/> },    
  'walk': { label: 'Walking', rate: 0, icon: <Navigation size={16}/> }  
};

// ==========================================
// 2. MOCK DATA (Interleaved Transport)
// ==========================================
const mockTripData = {
  tripId: "AUR-8821",
  initialBudget: 300000,
  duration: "3 Days",
  route: [
    { type: 'start', label: 'Start Journey', location: 'Kandy, Sri Lanka', time: '08:00 AM', icon: <Navigation size={20} /> },
    {
      day: 1,
      title: "Day 1: The Hill Capital",
      activities: [
        { id: 't-1-1', type: 'transport', defaultVehicle: 'van', baseCost: 3000, from: 'Hotel', to: 'Temple of Tooth', time: '15 mins' },
        { type: 'location', label: 'Temple of the Tooth', detail: 'Cultural Visit', time: '09:30 AM', cost: 6000, icon: <MapPin size={18} /> },
        { id: 't-1-2', type: 'transport', defaultVehicle: 'tuktuk', baseCost: 800, from: 'Temple', to: 'Empire Cafe', time: '10 mins' },
        { type: 'food', label: 'Empire Cafe', detail: 'Brunch Platter', time: '12:00 PM', cost: 12000, icon: <Coffee size={18} /> },
        { id: 't-1-3', type: 'transport', defaultVehicle: 'van', baseCost: 2000, from: 'Cafe', to: 'The Radh', time: '20 mins' },
        { type: 'stay', label: 'The Radh Hotel', detail: 'Luxury Triple Room', time: '02:00 PM', cost: 45000, icon: <Home size={18} /> }
      ]
    },
    {
      day: 2,
      title: "Day 2: The Scenic Train",
      activities: [
        { id: 't-2-1', type: 'transport', defaultVehicle: 'van', baseCost: 1500, from: 'Hotel', to: 'Kandy Station', time: '15 mins' },
        { type: 'transport-highlight', label: 'The Blue Train', detail: 'Kandy to Ella (Scenic)', time: '08:45 AM', cost: 4000, icon: <Train size={18} /> },
        { id: 't-2-2', type: 'transport', defaultVehicle: 'tuktuk', baseCost: 1200, from: 'Ella Station', to: '9 Arch Bridge', time: '20 mins' },
        { type: 'location', label: 'Nine Arches Bridge', detail: 'Sightseeing', time: '03:00 PM', cost: 0, icon: <MapPin size={18} /> },
        { id: 't-2-3', type: 'transport', defaultVehicle: 'walk', baseCost: 0, from: 'Bridge', to: 'Cafe Chill', time: '30 mins' },
        { type: 'food', label: 'Cafe Chill', detail: 'Dinner', time: '07:00 PM', cost: 18000, icon: <Coffee size={18} /> }
      ]
    },
    { type: 'end', label: 'Trip Complete', location: 'Ella', time: 'Day 3', icon: <Flag size={20} /> }
  ]
};

const TravelPlanPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(null);
  const [transportChoices, setTransportChoices] = useState({});

  const getTransportCost = (item) => {
    if (item.type !== 'transport') return item.cost || 0;
    const choice = transportChoices[item.id] || item.defaultVehicle;
    if(item.type === 'transport-highlight') return item.cost;
    return item.baseCost * VEHICLE_RATES[choice].rate;
  };

  const { totalSpent, remainingBudget } = useMemo(() => {
    let spent = 0;
    mockTripData.route.forEach(node => {
      if (node.activities) {
        node.activities.forEach(act => {
          spent += getTransportCost(act);
        });
      }
    });
    return { 
      totalSpent: spent, 
      remainingBudget: mockTripData.initialBudget - spent 
    };
  }, [transportChoices]);

  const handleVehicleChange = (id, newVehicle) => {
    setTransportChoices(prev => ({ ...prev, [id]: newVehicle }));
  };

  return (
    <div className="travel-plan-page">
      <div className="flow-sidebar">
        
        {/* HEADER */}
        <header className="plan-header">
          <button onClick={() => navigate(-1)} className="back-link">← Back to Plans</button>
          <div className="budget-widget">
            <div className="budget-row">
              <span className="label"><Wallet size={16}/> Remaining Budget</span>
              <span className={`value ${remainingBudget < 50000 ? 'low' : ''}`}>
                {remainingBudget.toLocaleString()} <span className="currency">LKR</span>
              </span>
            </div>
            <div className="budget-details-row">
              <span>Estimated Cost:</span>
              <span className="expense-value">{totalSpent.toLocaleString()} LKR</span>
            </div>
          </div>
        </header>

        {/* ACTION BUTTONS */}
        <div className="plan-actions">
          <button className="btn-secondary" onClick={() => navigate('/trip-dashboard')} title="Edit time, costs, and details">
            <Edit3 size={16} /> Customize
          </button>
          <button className="btn-primary">Confirm Itinerary</button>
        </div>

        {/* TIMELINE */}
        <div className="timeline-container">
          {mockTripData.route.map((node, index) => {
            if (node.type === 'start' || node.type === 'end') {
              return (
                <div key={index} className={`timeline-node special-node ${node.type}`}>
                  <div className="node-icon">{node.icon}</div>
                  <div className="node-content"><h3>{node.label}</h3><p>{node.location}</p></div>
                </div>
              );
            }

            return (
              <div key={index} className="day-group">
                <div className="day-header"><h2>{node.title}</h2></div>
                <div className="activities-list">
                  {node.activities.map((act, i) => {
                    const uniqueId = act.id || `${index}-${i}`;
                    const isTransport = act.type === 'transport';
                    const currentCost = getTransportCost(act);
                    
                    if (isTransport) {
                      const currentVehicle = transportChoices[act.id] || act.defaultVehicle;
                      return (
                        <div key={i} className="activity-card transport" onMouseEnter={() => setActiveStep(uniqueId)}>
                          <div className="act-icon">{VEHICLE_RATES[currentVehicle].icon}</div>
                          <div className="act-details">
                            <div className="transport-row">
                              <h4>{act.from} <span className="arrow">→</span> {act.to}</h4>
                              <span className="cost-tag">-{currentCost.toLocaleString()}</span>
                            </div>
                            <div className="vehicle-selector">
                              <select value={currentVehicle} onChange={(e) => handleVehicleChange(act.id, e.target.value)}>
                                {Object.entries(VEHICLE_RATES).map(([key, data]) => (
                                  <option key={key} value={key}>{data.label} {key === 'walk' ? '(Free)' : ''}</option>
                                ))}
                              </select>
                              <span className="time-est"><Clock size={12} /> {act.time}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={i} className={`activity-card ${act.type}`} onMouseEnter={() => setActiveStep(uniqueId)}>
                        <div className="act-connector"></div>
                        <div className="act-icon">{act.icon}</div>
                        <div className="act-details">
                          <div className="act-top">
                            <h4>{act.label}</h4>
                            {currentCost > 0 && <span className="cost-tag">-{currentCost.toLocaleString()}</span>}
                          </div>
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
      </div>

      {/* MAP SECTION */}
      <div className="map-section">
        <div className="map-placeholder">
           <div className="map-overlay">
            <MapPin size={48} className="floating-pin" />
            <h3>Interactive Routing</h3>
            <p>Routes update dynamically based on your vehicle choice.</p>
          </div>
           {/* Clean map placeholder image */}
           <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" alt="map" className="map-image"/>
        </div>
      </div>
    </div>
  );
};

export default TravelPlanPage;