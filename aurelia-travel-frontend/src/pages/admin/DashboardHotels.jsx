import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, MapPin, Image as ImageIcon, ArrowLeft, Save, Loader2 } from 'lucide-react';
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

  useEffect(() => { fetchHotels(); }, []);

  const fetchHotels = async () => {
    try {
      // ✅ Use /mine endpoint to get only manager's hotels
      const res = await axios.get('http://localhost:5000/api/hotels/mine', { withCredentials: true });
      setHotels(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) { console.error(err); }
  };

  const handleSwitchToForm = (hotel = null) => {
    setEditingHotel(hotel);
    if (hotel) {
        setFormData({
            name: hotel.name || '',
            address: hotel.address_line_1 || '',
            city: hotel.city || '',
            province: hotel.province || '',
            postalCode: hotel.postal_code || '',
            country: hotel.country || '',
            description: hotel.description || '',
            imageUrl: hotel.image_url || '',
            facilities: Array.isArray(hotel.facilities) ? hotel.facilities.join(', ') : ''
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
      province: formData.province || formData.city,
      postal_code: formData.postalCode || '00000',
      country: formData.country,
      description: formData.description,
      image_url: formData.imageUrl,
      facilities: formData.facilities.split(',').map(f => f.trim()).filter(Boolean)
    };

    try {
      const config = { withCredentials: true };
      if (editingHotel) {
        await axios.put(`http://localhost:5000/api/hotels/${editingHotel.id}`, payload, config);
      } else {
        await axios.post('http://localhost:5000/api/hotels', payload, config);
      }
      fetchHotels();
      setView('list');
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure?")) return;
    try {
        await axios.delete(`http://localhost:5000/api/hotels/${id}`, { withCredentials: true });
        setHotels(prev => prev.filter(h => h.id !== id));
    } catch(err) { console.error(err); }
  };

  console.log('Rendered with hotels:', hotels);
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
                <thead><tr><th>Property</th><th>Location</th><th>Price</th><th>Actions</th></tr></thead>
                <tbody>
                  {hotels.map(hotel => (
                    <tr key={hotel.id}>
                      <td>
                          <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                              <div className="table-img">
                                 {hotel.image_url ? <img src={hotel.image_url} alt=""/> : <ImageIcon size={20}/>}
                              </div>
                              <span style={{fontWeight: 700}}>{hotel.name}</span>
                          </div>
                      </td>
                      <td>{hotel.city}, {hotel.country}</td>
                      <td>${hotel.price}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon" onClick={() => handleSwitchToForm(hotel)}><Edit3 size={16}/></button>
                          <button className="btn-icon danger" onClick={() => handleDelete(hotel.id)}><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {view === 'form' && (
          <motion.div key="form" className="form-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Form is same as logic above */}
            <div className="form-header-row">
                <h2>{editingHotel ? 'Update Hotel' : 'Add New Hotel'}</h2>
                <button className="btn-secondary" onClick={() => setView('list')}>Cancel</button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-group"><label>Hotel Name</label><input className="form-input" required value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/></div>
                <div className="form-grid-row">
                    <div className="form-group"><label>Address</label><input className="form-input" required value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})}/></div>
                    <div className="form-group"><label>City</label><input className="form-input" required value={formData.city} onChange={e=>setFormData({...formData, city:e.target.value})}/></div>
                </div>
                <div className="form-grid-row">
                    <div className="form-group"><label>Province</label><input className="form-input" required value={formData.province} onChange={e=>setFormData({...formData, province:e.target.value})}/></div>
                    <div className="form-group"><label>Postal Code</label><input className="form-input" required value={formData.postalCode} onChange={e=>setFormData({...formData, postalCode:e.target.value})}/></div>
                </div>
                <div className="form-group"><label>Country</label><input className="form-input" required value={formData.country} onChange={e=>setFormData({...formData, country:e.target.value})}/></div>
                <div className="form-group"><label>Description</label><textarea className="form-input" rows="3" value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})}/></div>
                <div className="form-group"><label>Image URL</label><input className="form-input" value={formData.imageUrl} onChange={e=>setFormData({...formData, imageUrl:e.target.value})}/></div>
                <div className="form-group"><label>Facilities</label><input className="form-input" value={formData.facilities} onChange={e=>setFormData({...formData, facilities:e.target.value})}/></div>
                <button type="submit" className="btn-primary">Save Hotel</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardHotels;