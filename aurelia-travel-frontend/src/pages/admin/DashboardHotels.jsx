import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, MapPin, Image as ImageIcon, ArrowLeft, Save, Loader2 } from 'lucide-react';
import './styles/dashboard.css';

const DashboardHotels = () => {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [hotels, setHotels] = useState([]);
  const [editingHotel, setEditingHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Updated State to include all required DB fields
  const [formData, setFormData] = useState({
    name: '', 
    address: '',        // Will map to address_line_1
    city: '', 
    province: '',       // NEW: Required by DB
    postalCode: '',     // NEW: Required by DB
    country: '',
    description: '', 
    imageUrl: '',       // Will map to image_url
    facilities: ''
  });

  useEffect(() => { fetchHotels(); }, []);

  const fetchHotels = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/hotels');
      setHotels(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err) { console.error(err); }
  };

  const handleSwitchToForm = (hotel = null) => {
    setEditingHotel(hotel);
    if (hotel) {
        setFormData({
            name: hotel.name || '',
            address: hotel.address_line_1 || '', // Map from DB
            city: hotel.city || '',
            province: hotel.province || '',
            postalCode: hotel.postal_code || '',
            country: hotel.country || '',
            description: hotel.description || '',
            imageUrl: hotel.image_url || '',     // Map from DB
            facilities: Array.isArray(hotel.facilities) ? hotel.facilities.join(', ') : ''
        });
    } else {
        setFormData({ 
            name: '', address: '', city: '', province: '', postalCode: '', 
            country: '', description: '', imageUrl: '', facilities: '' 
        });
    }
    setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // --- FIX: Construct Payload to match Database Schema exactly ---
    const payload = {
      name: formData.name,
      address_line_1: formData.address, // Fix: Map 'address' to 'address_line_1'
      city: formData.city,
      province: formData.province || formData.city, // Fallback to city if empty
      postal_code: formData.postalCode || '00000',  // Fallback to avoid DB error
      country: formData.country,
      description: formData.description,
      image_url: formData.imageUrl,     // Fix: Send as string 'image_url', not array 'photos'
      facilities: formData.facilities.split(',').map(f => f.trim()).filter(Boolean)
    };

    try {
      if (editingHotel) {
        await axios.put(`http://localhost:5000/api/hotels/${editingHotel.id}`, payload);
      } else {
        await axios.post('http://localhost:5000/api/hotels', payload);
      }
      fetchHotels();
      setView('list');
    } catch (err) {
      console.error("Save Error:", err);
      // Show backend error message if available
      alert("Error: " + (err.response?.data?.message || err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure? This will delete the hotel and all its rooms.")) return;
    try {
        await axios.delete(`http://localhost:5000/api/hotels/${id}`);
        setHotels(prev => prev.filter(h => h.id !== id));
    } catch(err) { console.error(err); }
  };

  return (
    <div className="hotels-page">
      <AnimatePresence mode="wait">
        
        {/* === LIST VIEW === */}
        {view === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="table-header-action table-card" style={{marginBottom: '30px'}}>
              <div>
                  <h1 style={{fontSize: '1.5rem', fontWeight: 800}}>My Hotels</h1>
                  <p style={{color: '#64748b'}}>Manage your properties and details</p>
              </div>
              <button className="btn-primary" onClick={() => handleSwitchToForm()}>
                <Plus size={18} /> Add Property
              </button>
            </div>

            <div className="table-card">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Location</th>
                    <th>Starting Price</th>
                    <th style={{textAlign: 'right'}}>Actions</th>
                  </tr>
                </thead>
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
                      <td>
                          <div style={{display:'flex', alignItems:'center', gap:'5px', color:'#64748b'}}>
                              <MapPin size={14}/> {hotel.city}, {hotel.country}
                          </div>
                      </td>
                      <td style={{fontWeight: 600}}>${hotel.price || 0}</td>
                      <td>
                        <div className="action-buttons" style={{justifyContent: 'flex-end'}}>
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

        {/* === FORM VIEW === */}
        {view === 'form' && (
          <motion.div 
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="form-container"
          >
            <div className="form-header-row">
                <h2>{editingHotel ? 'Update Property' : 'Add New Property'}</h2>
                <button className="btn-secondary" onClick={() => setView('list')}>
                    <ArrowLeft size={16} style={{marginRight:'5px'}}/> Cancel
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Hotel Name</label>
                    <input 
                        className="form-input" 
                        required 
                        value={formData.name} 
                        onChange={e=>setFormData({...formData, name:e.target.value})} 
                        placeholder="e.g. The Grand Budapest"
                    />
                </div>
                
                {/* Location Row 1 */}
                <div className="form-grid-row">
                    <div className="form-group">
                        <label>City</label>
                        <input className="form-input" required value={formData.city} onChange={e=>setFormData({...formData, city:e.target.value})}/>
                    </div>
                    <div className="form-group">
                        <label>Country</label>
                        <input className="form-input" required value={formData.country} onChange={e=>setFormData({...formData, country:e.target.value})}/>
                    </div>
                </div>

                {/* Location Row 2 (Required by DB) */}
                <div className="form-grid-row">
                    <div className="form-group">
                        <label>Province / State</label>
                        <input className="form-input" required value={formData.province} onChange={e=>setFormData({...formData, province:e.target.value})} placeholder="e.g. Western Province"/>
                    </div>
                    <div className="form-group">
                        <label>Postal Code</label>
                        <input className="form-input" required value={formData.postalCode} onChange={e=>setFormData({...formData, postalCode:e.target.value})} placeholder="e.g. 10100"/>
                    </div>
                </div>

                <div className="form-group">
                    <label>Address Line 1</label>
                    <input className="form-input" required value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} placeholder="Street address"/>
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea className="form-input" rows="4" value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} />
                </div>
                
                <div className="form-group">
                    <label>Cover Image URL</label>
                    <div style={{display:'flex', gap:'20px', alignItems:'flex-start'}}>
                        <input className="form-input" placeholder="https://example.com/image.jpg" value={formData.imageUrl} onChange={e=>setFormData({...formData, imageUrl:e.target.value})}/>
                        
                        {/* Image Preview Box */}
                        <div className="image-preview-box">
                            {formData.imageUrl ? <img src={formData.imageUrl} alt="Preview" onError={(e)=>e.target.style.display='none'}/> : <ImageIcon size={24} color="#cbd5e1"/>}
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label>Facilities (Comma separated)</label>
                    <input className="form-input" placeholder="Pool, Gym, Free WiFi, Spa" value={formData.facilities} onChange={e=>setFormData({...formData, facilities:e.target.value})}/>
                </div>
                
                <div style={{display:'flex', justifyContent:'flex-end', marginTop:'30px'}}>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? <Loader2 className="spin" size={18}/> : <Save size={18}/>}
                        {editingHotel ? 'Save Changes' : 'Create Hotel'}
                    </button>
                </div>
            </form>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default DashboardHotels;