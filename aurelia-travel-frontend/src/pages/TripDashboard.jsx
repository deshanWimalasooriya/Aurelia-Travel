import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, DollarSign, MapPin, MoreVertical, 
  Plus, Trash2, Save, X, Coffee, Home, Navigation, Car,
  Sparkles, CalendarPlus 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PlannerContainer from '../components/common/PlannerContainer'; // 1. IMPORT THE PLANNER
import './styles/tripDashboard.css';

// ... (Keep initialTripData & other constants same) ...
const initialTripData = {
    id: "AUR-8821",
    title: "Kandy to Ella: The Misty Train Route",
    startDate: "2026-01-12",
    totalBudget: 300000,
    days: [
      {
        id: "day-1",
        title: "Day 1: The Hill Capital",
        date: "Jan 12",
        items: [
          { id: "d1-1", type: "transport", title: "Private Van", time: "08:00 AM", cost: 3000, details: "Pickup from Colombo" },
          { id: "d1-2", type: "location", title: "Temple of Tooth", time: "10:30 AM", cost: 6000, details: "Cultural Visit" },
          { id: "d1-3", type: "food", title: "Empire Cafe", time: "01:00 PM", cost: 12000, details: "Lunch" },
          { id: "d1-4", type: "stay", title: "The Radh Hotel", time: "03:00 PM", cost: 45000, details: "Check-in" },
        ]
      },
      {
        id: "day-2",
        title: "Day 2: Scenic Train",
        date: "Jan 13",
        items: [
          { id: "d2-1", type: "transport", title: "Blue Train", time: "09:00 AM", cost: 4000, details: "First Class" },
          { id: "d2-2", type: "location", title: "Nine Arches", time: "03:00 PM", cost: 0, details: "Hike & Photos" },
          { id: "d2-3", type: "food", title: "Cafe Chill", time: "07:00 PM", cost: 15000, details: "Dinner Party" },
        ]
      },
      {
        id: "day-3",
        title: "Day 3: Waterfall Hunt",
        date: "Jan 14",
        items: [
          { id: "d3-1", type: "transport", title: "Tuk Tuk Safari", time: "08:00 AM", cost: 2500, details: "Local Travel" },
          { id: "d3-2", type: "location", title: "Ravana Falls", time: "10:00 AM", cost: 0, details: "Swimming" },
        ]
      }
    ]
  };

const TripDashboard = () => {
  const navigate = useNavigate();
  const [trip, setTrip] = useState(initialTripData);
  const [editingItem, setEditingItem] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // 2. NEW STATE FOR POPUP
  const [showPlannerPopup, setShowPlannerPopup] = useState(false);

  const budgetStats = useMemo(() => {
    let spent = 0;
    trip.days.forEach(day => day.items.forEach(item => spent += Number(item.cost)));
    return { spent, remaining: trip.totalBudget - spent };
  }, [trip]);

  // ... (Keep handleDelete, handleSaveEdit, openEditor, getIcon, handleAddDay) ...
  const handleDelete = (dayId, itemId) => {
    const updatedDays = trip.days.map(day => {
      if (day.id === dayId) {
        return { ...day, items: day.items.filter(i => i.id !== itemId) };
      }
      return day;
    });
    setTrip({ ...trip, days: updatedDays });
    setSidebarOpen(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const updatedDays = trip.days.map(day => {
      if (day.id === editingItem.dayId) {
        const updatedItems = day.items.map(item => 
          item.id === editingItem.item.id ? editingItem.item : item
        );
        return { ...day, items: updatedItems };
      }
      return day;
    });
    setTrip({ ...trip, days: updatedDays });
    setSidebarOpen(false);
  };

  const openEditor = (dayId, item) => {
    setEditingItem({ dayId, item });
    setSidebarOpen(true);
  };
  
  const handleAddDay = () => {
    const dayCount = trip.days.length + 1;
    const newDay = {
      id: `day-${dayCount}`,
      title: `Day ${dayCount}: Free Day`,
      date: "Date TBD", // logic to calc date can be added here
      items: [] // Empty list
    };
    setTrip({ ...trip, days: [...trip.days, newDay] });
  };

  const getIcon = (type) => {
    switch(type) {
      case 'food': return <Coffee size={16}/>;
      case 'stay': return <Home size={16}/>;
      case 'transport': return <Car size={16}/>;
      default: return <MapPin size={16}/>;
    }
  };

  // 3. HANDLE POPUP SUBMIT (Simulate adding generated data)
  const handlePlannerSubmit = (formData) => {
    console.log("Adding new leg based on:", formData);
    setShowPlannerPopup(false); // Close popup

    // Simulate appending new generated days based on form inputs
    const nextDayCount = trip.days.length + 1;
    const newExtension = {
        id: `day-${nextDayCount}`,
        title: `Day ${nextDayCount}: Extended to ${formData.startLocation}`,
        date: "Jan 15",
        items: [
            { id: `d${nextDayCount}-1`, type: "transport", title: "Transfer Vehicle", time: "10:00 AM", cost: 5000, details: "Generated Transfer" },
            { id: `d${nextDayCount}-2`, type: "location", title: "New Adventure", time: "02:00 PM", cost: 2000, details: `Based on ${formData.pace} pace` }
        ]
    };

    setTrip({
        ...trip,
        days: [...trip.days, newExtension],
        totalBudget: trip.totalBudget + Number(formData.budget) // Add new budget to total
    });
  };

  return (
    <div className="dashboard-container">
      {/* ... Header ... */}
      <header className="dash-header">
        <div className="header-left">
          <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
          <div>
            <h1>{trip.title}</h1>
            <p className="subtitle">{trip.days.length} Days • {trip.days.reduce((acc, d) => acc + d.items.length, 0)} Activities</p>
          </div>
        </div>

        <div className="header-right">
          <div className="stat-pill">
            <span className="label">Total Budget</span>
            <span className="value">{trip.totalBudget.toLocaleString()}</span>
          </div>
          <div className={`stat-pill ${budgetStats.remaining < 0 ? 'danger' : 'success'}`}>
            <span className="label">Remaining</span>
            <span className="value">{budgetStats.remaining.toLocaleString()}</span>
          </div>
          <button className="btn-primary-sm">Publish Trip</button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="kanban-board">
        {trip.days.map((day) => (
          <div key={day.id} className="kanban-column">
             {/* ... Day Column Content (Same as before) ... */}
            <div className="column-header">
              <h3>{day.title}</h3>
              <span className="date-badge">{day.date}</span>
            </div>

            <div className="column-content">
              {day.items.map((item) => (
                <div 
                  key={item.id} 
                  className={`kanban-card ${item.type}`}
                  onClick={() => openEditor(day.id, item)}
                >
                  <div className="card-icon">{getIcon(item.type)}</div>
                  <div className="card-info">
                    <h4>{item.title}</h4>
                    <div className="card-meta">
                      <span><Clock size={12}/> {item.time}</span>
                      {item.cost > 0 && <span><DollarSign size={12}/> {item.cost}</span>}
                    </div>
                  </div>
                  <MoreVertical size={14} className="edit-trigger"/>
                </div>
              ))}
              <button className="add-card-btn"><Plus size={16} /> Add Activity</button>
            </div>
          </div>
        ))}

        {/* 4. EXTENSION COLUMN with POPUP TRIGGER */}
        <div className="kanban-actions-column">
          <h3>Extend Your Trip</h3>
          <p>Plan the next leg of your journey</p>
          
          <button className="btn-extend-manual" onClick={handleAddDay}>
            <CalendarPlus size={20} />
            <span>Add Day Manually</span>
          </button>

          <div className="divider">OR</div>

          {/* OPEN POPUP ON CLICK */}
          <button 
            className="btn-extend-ai" 
            onClick={() => setShowPlannerPopup(true)}
          >
            <Sparkles size={20} />
            <span>Generate Next Leg</span>
          </button>
          
          <p className="hint-text">
            Open the planner to define requirements for your trip extension.
          </p>
        </div>
      </div>

      {/* ... Edit Sidebar ... */}
      <div className={`edit-sidebar ${isSidebarOpen ? 'open' : ''}`}>
           {/* ... (Keep form logic same) ... */}
           {editingItem && (
          <form onSubmit={handleSaveEdit} className="sidebar-content">
             {/* ... existing form inputs ... */}
             <div className="sidebar-header">
              <h2>Edit Activity</h2>
              <button type="button" onClick={() => setSidebarOpen(false)}><X size={20}/></button>
            </div>

            <div className="form-group">
              <label>Title</label>
              <input type="text" value={editingItem.item.title} onChange={(e) => setEditingItem({...editingItem, item: { ...editingItem.item, title: e.target.value }})} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Time</label>
                <input type="text" value={editingItem.item.time} onChange={(e) => setEditingItem({...editingItem, item: { ...editingItem.item, time: e.target.value }})} />
              </div>
              <div className="form-group">
                <label>Cost (LKR)</label>
                <input type="number" value={editingItem.item.cost} onChange={(e) => setEditingItem({...editingItem, item: { ...editingItem.item, cost: parseInt(e.target.value) || 0 }})} />
              </div>
            </div>

            <div className="form-group">
              <label>Details / Notes</label>
              <textarea rows="4" value={editingItem.item.details} onChange={(e) => setEditingItem({...editingItem, item: { ...editingItem.item, details: e.target.value }})} />
            </div>

            <div className="sidebar-actions">
              <button type="button" className="btn-delete" onClick={() => handleDelete(editingItem.dayId, editingItem.item.id)}>
                <Trash2 size={18}/> Delete
              </button>
              <button type="submit" className="btn-save">
                <Save size={18}/> Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* 5. NEW: PLANNER POPUP MODAL */}
      {showPlannerPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h2>Extend Your Trip</h2>
              <button onClick={() => setShowPlannerPopup(false)} className="close-popup-btn">
                <X size={24} />
              </button>
            </div>
            <p className="popup-subtitle">Define parameters for the next part of your journey.</p>
            
            {/* CALLING THE PLANNER CONTAINER */}
            <PlannerContainer onSubmit={handlePlannerSubmit} />
            
          </div>
        </div>
      )}

    </div>
  );
};

export default TripDashboard;