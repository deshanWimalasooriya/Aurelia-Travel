import { useState, useEffect, useCallback } from 'react'; 
import api from '../../services/api'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Image as ImageIcon, Loader2, MapPin, Clock, Phone } from 'lucide-react';
import './styles/dashboard.css';

const DashboardHotels = () => {
  const [view, setView] = useState('list');
  const [hotels, setHotels] = useState([]);
  const [editingHotel, setEditingHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // ✅ Expanded State to match your Database Schema
  const [formData, setFormData] = useState({
    name: '', 
    description: '', 
    address: '', 
    city: '', 
    province: '', 
    postalCode: '',
    country: '', 
    latitude: '', 
    longitude: '',
    email: '',
    phone: '',
    website: '',
    checkIn: '14:00', // Default DB value
    checkOut: '11:00', // Default DB value
    cancellationPolicy: '24', // Default DB value
    imageUrl: '', 
    facilities: ''
  });

  const fetchHotels = useCallback(async () => {
    try {
      const res = await api.get('/hotels/mine');
      
      const hotelList = Array.isArray(res.data) 
        ? res.data 
        : (res.data.data || []);

      setHotels(hotelList);
      console.log("Fetched hotels:", hotelList);

    } catch (err) {
      console.error("Fetch hotels failed", err);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  // ✅ Populate form with all existing data when editing
  const handleSwitchToForm = (hotel = null) => {
    setEditingHotel(hotel);
    if (hotel) {
        setFormData({
            name: hotel.name || '',
            description: hotel.description || '',
            address: hotel.address_line_1 || '',
            city: hotel.city || '',
            province: hotel.state || '', 
            postalCode: hotel.postal_code || '',
            country: hotel.country || '',
            latitude: hotel.latitude || '',
            longitude: hotel.longitude || '',
            email: hotel.email || '',
            phone: hotel.phone || '',
            website: hotel.website || '',
            checkIn: hotel.check_in_time || '14:00',
            checkOut: hotel.check_out_time || '11:00',
            cancellationPolicy: hotel.cancellation_policy_hours || '24',
            imageUrl: hotel.main_image || '', 
            // Handle amenities array -> string conversion
            facilities: Array.isArray(hotel.amenities) 
                ? hotel.amenities.map(a => typeof a === 'string' ? a : a.name).join(', ') 
                : ''
        });
    } else {
        // Reset to empty/defaults
        setFormData({ 
            name: '', description: '', address: '', city: '', province: '', 
            postalCode: '', country: '', latitude: '', longitude: '',
            email: '', phone: '', website: '', checkIn: '14:00', checkOut: '11:00', 
            cancellationPolicy: '24', imageUrl: '', facilities: '' 
        });
    }
    setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // ✅ Prepare Payload matching your Backend Controller & DB Schema
    const payload = {
      name: formData.name,
      description: formData.description,
      address_line_1: formData.address, // Matches Controller
      city: formData.city,
      state: formData.province,
      postal_code: formData.postalCode || '00000',
      country: formData.country,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      
      // Contact Info
      email: formData.email,
      phone: formData.phone,
      website: formData.website,

      // Policy Info
      check_in_time: formData.checkIn,
      check_out_time: formData.checkOut,
      cancellation_policy_hours: parseInt(formData.cancellationPolicy) || 24,

      // Images & Amenities
      main_image: formData.imageUrl,
      // Convert comma string back to array for Backend
      amenities: formData.facilities.split(',').map(f => f.trim()).filter(Boolean)
    };

    try {
      if (editingHotel) {
        await api.put(`/hotels/${editingHotel.id}`, payload);
      } else {
        await api.post('/hotels', payload);
      }
      
      await fetchHotels(); 
      setView('list');
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure? This will delete all rooms and bookings for this hotel.")) return;
    try {
        await api.delete(`/hotels/${id}`);
        setHotels(prev => prev.filter(h => h.id !== id));
    } catch(err) { 
        alert("Failed to delete hotel."); 
        console.error(err); 
    }
  };

  return (
    <div className="hotels-page">
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="table-header-action table-card" style={{marginBottom: '30px'}}>
              <div>
                  <h1 style={{fontSize: '1.5rem', fontWeight: 800}}>My Hotels</h1>
                  <p style={{color: '#64748b'}}>Manage your properties</p>
              </div>
              <button className="btn-primary" onClick={() => handleSwitchToForm()}>
                <Plus size={18} /> Add Property
              </button>
            </div>
            <div className="table-card">
              <table className="dashboard-table">
                <thead><tr><th>Property</th><th>Location</th><th>Rating</th><th>Actions</th></tr></thead>
                <tbody>
                  {hotels.length > 0 ? hotels.map(hotel => (
                    <tr key={hotel.id}>
                      <td>
                          <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                              <div className="table-img">
                                 {hotel.main_image ? <img src={hotel.main_image} alt=""/> : <ImageIcon size={20}/>}
                              </div>
                              <span style={{fontWeight: 700}}>{hotel.name}</span>
                          </div>
                      </td>
                      <td>{hotel.city}, {hotel.country}</td>
                      <td>{hotel.rating_average || 0} ⭐</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon" onClick={() => handleSwitchToForm(hotel)}><Edit3 size={16}/></button>
                          <button className="btn-icon danger" onClick={() => handleDelete(hotel.id)}><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="text-center p-8 text-gray-500">No hotels found. Add one to get started!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        
        {/* --- FORM VIEW --- */}
        {view === 'form' && (
          <motion.div key="form" className="form-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="form-header-row">
                <h2>{editingHotel ? 'Update Hotel' : 'Add New Hotel'}</h2>
                <button type="button" className="btn-secondary" onClick={() => setView('list')}>Cancel</button>
            </div>
            
            <form onSubmit={handleSubmit} className="hotel-form">
                
                {/* 1. Basic Details */}
                <div className="form-section-title">Basic Details</div>
                <div className="form-group">
                    <label>Hotel Name</label>
                    <input className="form-input" required value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea className="form-input" rows="3" value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})}/>
                </div>

                {/* 2. Location Details */}
                <div className="form-section-title"><MapPin size={16} /> Location</div>
                <div className="form-grid-row">
                    <div className="form-group"><label>Address Line 1</label><input className="form-input" required value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})}/></div>
                    <div className="form-group"><label>City</label><input className="form-input" required value={formData.city} onChange={e=>setFormData({...formData, city:e.target.value})}/></div>
                </div>
                <div className="form-grid-row">
                    <div className="form-group"><label>Province/State</label><input className="form-input" value={formData.province} onChange={e=>setFormData({...formData, province:e.target.value})}/></div>
                    <div className="form-group"><label>Postal Code</label><input className="form-input" value={formData.postalCode} onChange={e=>setFormData({...formData, postalCode:e.target.value})}/></div>
                    <div className="form-group"><label>Country</label><input className="form-input" required value={formData.country} onChange={e=>setFormData({...formData, country:e.target.value})}/></div>
                </div>
                <div className="form-grid-row">
                    <div className="form-group"><label>Latitude (Optional)</label><input type="number" step="any" className="form-input" value={formData.latitude} onChange={e=>setFormData({...formData, latitude:e.target.value})}/></div>
                    <div className="form-group"><label>Longitude (Optional)</label><input type="number" step="any" className="form-input" value={formData.longitude} onChange={e=>setFormData({...formData, longitude:e.target.value})}/></div>
                </div>

                {/* 3. Contact Details */}
                <div className="form-section-title"><Phone size={16} /> Contact Info</div>
                <div className="form-grid-row">
                    <div className="form-group"><label>Email</label><input type="email" className="form-input" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})}/></div>
                    <div className="form-group"><label>Phone</label><input className="form-input" value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})}/></div>
                    <div className="form-group"><label>Website</label><input className="form-input" value={formData.website} onChange={e=>setFormData({...formData, website:e.target.value})}/></div>
                </div>

                {/* 4. Policies */}
                <div className="form-section-title"><Clock size={16} /> Policies</div>
                <div className="form-grid-row">
                    <div className="form-group"><label>Check-in Time</label><input type="time" className="form-input" value={formData.checkIn} onChange={e=>setFormData({...formData, checkIn:e.target.value})}/></div>
                    <div className="form-group"><label>Check-out Time</label><input type="time" className="form-input" value={formData.checkOut} onChange={e=>setFormData({...formData, checkOut:e.target.value})}/></div>
                    <div className="form-group"><label>Cancellation Policy (Hours)</label><input type="number" className="form-input" value={formData.cancellationPolicy} onChange={e=>setFormData({...formData, cancellationPolicy:e.target.value})}/></div>
                </div>

                {/* 5. Media & Amenities */}
                <div className="form-section-title">Media & Amenities</div>
                <div className="form-group">
                    <label>Main Image URL</label>
                    <input className="form-input" value={formData.imageUrl} onChange={e=>setFormData({...formData, imageUrl:e.target.value})}/>
                </div>
                <div className="form-group">
                    <label>Amenities (Comma separated, e.g. WiFi, Pool, Gym)</label>
                    <input className="form-input" value={formData.facilities} onChange={e=>setFormData({...formData, facilities:e.target.value})}/>
                </div>
                
                <button type="submit" className="btn-primary" disabled={loading} style={{marginTop:'20px'}}>
                    {loading ? <Loader2 className="animate-spin" /> : (editingHotel ? 'Update Hotel' : 'Create Hotel')}
                </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardHotels;