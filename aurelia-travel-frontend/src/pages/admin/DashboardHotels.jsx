import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import api from '../../services/api'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import './styles/dashboard.css';

const DashboardHotels = () => {
  const [view, setView] = useState('list');
  const [hotels, setHotels] = useState([]);
  const [editingHotel, setEditingHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', address: '', city: '', province: '', postalCode: '',
    country: '', description: '', imageUrl: '', facilities: ''
  });

  // ✅ FIX: Define this outside useEffect so handleSubmit can call it too
  // Wrapped in useCallback to prevent infinite loops if added to dependencies later
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

  // ✅ FIX: Now we just call the external function here
  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const handleSwitchToForm = (hotel = null) => {
    setEditingHotel(hotel);
    if (hotel) {
        setFormData({
            name: hotel.name || '',
            address: hotel.address_line_1 || '',
            city: hotel.city || '',
            province: hotel.state || '', 
            postalCode: hotel.postal_code || '',
            country: hotel.country || '',
            description: hotel.description || '',
            imageUrl: hotel.main_image || '', 
            facilities: Array.isArray(hotel.amenities) ? hotel.amenities.map(a => a.name).join(', ') : ''
        });
    } else {
        setFormData({ name: '', address: '', city: '', province: '', postalCode: '', country: '', description: '', imageUrl: '', facilities: '' });
    }
    setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      name: formData.name,
      address_line_1: formData.address,
      city: formData.city,
      state: formData.province,
      postal_code: formData.postalCode || '00000',
      country: formData.country,
      description: formData.description,
      main_image: formData.imageUrl,
      facilities: formData.facilities.split(',').map(f => f.trim()).filter(Boolean)
    };

    try {
      if (editingHotel) {
        await api.put(`/hotels/${editingHotel.id}`, payload);
      } else {
        await api.post('/hotels', payload);
      }
      
      // ✅ FIX: This now works because fetchHotels is defined in the component scope
      await fetchHotels(); 
      
      setView('list');
    } catch (err) {
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
                      <td>{hotel.rating_average || 'N/A'} ⭐</td>
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
        {view === 'form' && (
          <motion.div key="form" className="form-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="form-header-row">
                <h2>{editingHotel ? 'Update Hotel' : 'Add New Hotel'}</h2>
                <button type="button" className="btn-secondary" onClick={() => setView('list')}>Cancel</button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-group"><label>Hotel Name</label><input className="form-input" required value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/></div>
                <div className="form-grid-row">
                    <div className="form-group"><label>Address</label><input className="form-input" required value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})}/></div>
                    <div className="form-group"><label>City</label><input className="form-input" required value={formData.city} onChange={e=>setFormData({...formData, city:e.target.value})}/></div>
                </div>
                <div className="form-grid-row">
                    <div className="form-group"><label>Province/State</label><input className="form-input" required value={formData.province} onChange={e=>setFormData({...formData, province:e.target.value})}/></div>
                    <div className="form-group"><label>Postal Code</label><input className="form-input" required value={formData.postalCode} onChange={e=>setFormData({...formData, postalCode:e.target.value})}/></div>
                </div>
                <div className="form-group"><label>Country</label><input className="form-input" required value={formData.country} onChange={e=>setFormData({...formData, country:e.target.value})}/></div>
                <div className="form-group"><label>Description</label><textarea className="form-input" rows="3" value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})}/></div>
                <div className="form-group"><label>Image URL</label><input className="form-input" value={formData.imageUrl} onChange={e=>setFormData({...formData, imageUrl:e.target.value})}/></div>
                <div className="form-group"><label>Facilities (Comma separated)</label><input className="form-input" value={formData.facilities} onChange={e=>setFormData({...formData, facilities:e.target.value})}/></div>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : 'Save Hotel'}
                </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardHotels;