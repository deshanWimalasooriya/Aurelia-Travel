import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { MapPin, Power, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/masterAdmin.css';

const MasterDashboardHotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const res = await adminAPI.getAllHotels();
      if (res.data.success) {
        setHotels(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const action = currentStatus ? "deactivate" : "activate";
    if(!window.confirm(`Are you sure you want to ${action} this hotel?`)) return;

    try {
      const res = await adminAPI.toggleHotelStatus(id);
      if (res.data.success) {
        toast.success(`Hotel ${action}d successfully`);
        // Update local state to avoid full reload
        setHotels(hotels.map(h => h.id === id ? { ...h, is_active: !currentStatus } : h));
      }
    } catch (err) {
      toast.error('Update failed');
    }
  };

  return (
    <div className="fade-in">
      <div className="content-header">
        <div className="content-title">
          <h1>Hotel Portfolio</h1>
          <p>Monitor hotel partners and listing status</p>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Location</th>
              <th>Manager</th>
              <th>Performance</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="text-center p-8">Loading...</td></tr> : 
             hotels.map(hotel => (
              <tr key={hotel.id}>
                <td>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    {hotel.main_image && (
                      <img src={hotel.main_image} alt="" style={{width:40, height:40, borderRadius:6, objectFit:'cover'}}/>
                    )}
                    <span style={{fontWeight:600}}>{hotel.name}</span>
                  </div>
                </td>
                <td><MapPin size={14} style={{marginRight:4}}/> {hotel.city}</td>
                <td>
                  <div>{hotel.manager_name || 'N/A'}</div>
                  <small style={{color:'#64748b'}}>{hotel.manager_email}</small>
                </td>
                <td>
                  <div style={{display:'flex', gap:10, fontSize:'0.85rem'}}>
                    <span title="Rating">⭐ {hotel.rating_average || 0}</span>
                    <span title="Total Bookings">📅 {hotel.total_bookings}</span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${hotel.is_active ? 'confirmed' : 'cancelled'}`}>
                    {hotel.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button 
                    className="table-action-btn" 
                    onClick={() => handleToggleStatus(hotel.id, hotel.is_active)}
                    title={hotel.is_active ? "Deactivate" : "Activate"}
                    style={{color: hotel.is_active ? '#ef4444' : '#10b981'}}
                  >
                    <Power size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterDashboardHotels;