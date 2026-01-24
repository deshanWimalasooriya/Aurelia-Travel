import { useState, useEffect, useCallback } from 'react'; 
import api from '../../services/api'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit3, Trash2, Image as ImageIcon, Loader2, 
  MapPin, Clock, Phone, Globe, Mail, CheckCircle, X, Building2 
} from 'lucide-react';
import './styles/dashboard-hotels.css';

const DashboardHotels = () => {
  const [view, setView] = useState('list');
  const [hotels, setHotels] = useState([]);
  const [editingHotel, setEditingHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', description: '', address: '', city: '', province: '', 
    postalCode: '', country: '', latitude: '', longitude: '',
    email: '', phone: '', website: '',
    checkIn: '14:00', checkOut: '11:00', cancellationPolicy: '24', 
    imageUrl: '', facilities: ''
  });

  const fetchHotels = useCallback(async () => {
    try {
      const res = await api.get('/hotels/mine');
      setHotels(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

  const handleSwitchToForm = (hotel = null) => {
    setEditingHotel(hotel);
    if (hotel) {
        setFormData({
            name: hotel.name || '', description: hotel.description || '', address: hotel.address_line_1 || '',
            city: hotel.city || '', province: hotel.state || '', postalCode: hotel.postal_code || '',
            country: hotel.country || '', latitude: hotel.latitude || '', longitude: hotel.longitude || '',
            email: hotel.email || '', phone: hotel.phone || '', website: hotel.website || '',
            checkIn: hotel.check_in_time || '14:00', checkOut: hotel.check_out_time || '11:00',
            cancellationPolicy: hotel.cancellation_policy_hours || '24', imageUrl: hotel.main_image || '', 
            facilities: Array.isArray(hotel.amenities) ? hotel.amenities.map(a => typeof a === 'string' ? a : a.name).join(', ') : ''
        });
    } else {
        setFormData({ name: '', description: '', address: '', city: '', province: '', postalCode: '', country: '', latitude: '', longitude: '', email: '', phone: '', website: '', checkIn: '14:00', checkOut: '11:00', cancellationPolicy: '24', imageUrl: '', facilities: '' });
    }
    setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: formData.name, description: formData.description, address_line_1: formData.address,
      city: formData.city, state: formData.province, postal_code: formData.postalCode || '00000',
      country: formData.country, latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      email: formData.email, phone: formData.phone, website: formData.website,
      check_in_time: formData.checkIn, check_out_time: formData.checkOut,
      cancellation_policy_hours: parseInt(formData.cancellationPolicy) || 24,
      main_image: formData.imageUrl,
      amenities: formData.facilities.split(',').map(f => f.trim()).filter(Boolean)
    };

    try {
      if (editingHotel) await api.put(`/hotels/${editingHotel.id}`, payload);
      else await api.post('/hotels', payload);
      await fetchHotels(); setView('list');
    } catch (err) { alert("Error: " + (err.response?.data?.message || err.message)); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this hotel?")) return;
    try { await api.delete(`/hotels/${id}`); setHotels(prev => prev.filter(h => h.id !== id)); } 
    catch(err) { alert("Failed to delete."); }
  };

  return (
    <div className="hotels-page">
      <AnimatePresence mode="wait">
        
        {/* --- LIST VIEW --- */}
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="table-header-action table-card">
                <div className="header-title">
                    <h1>My Properties</h1>
                    <p>Manage your hotel portfolio, locations, and details.</p>
                </div>
                <button className="btn-primary" onClick={() => handleSwitchToForm()}>
                    <Plus size={18} strokeWidth={3} /> Add Hotel
                </button>
            </div>

            <div className="table-card no-padding">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th className="pl-30">Property Name</th>
                            <th>Location</th>
                            <th>Rating</th>
                            <th>Status</th>
                            <th className="text-right pr-30">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {hotels.length > 0 ? hotels.map(hotel => (
                        <tr key={hotel.id}>
                            <td className="pl-30">
                                <div className="hotel-info-cell">
                                    <div className="table-img">
                                        {hotel.main_image ? <img src={hotel.main_image} alt=""/> : <Building2 size={24} color="#94a3b8"/>}
                                    </div>
                                    <div>
                                        <div className="hotel-name-text">{hotel.name}</div>
                                        <div className="hotel-id-text">ID: #{hotel.id}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="location-cell">
                                    <MapPin size={16} color="#94a3b8"/> 
                                    {hotel.city}, {hotel.country}
                                </div>
                            </td>
                            <td>
                                <span className="rating-badge">{hotel.rating_average || 0} ★</span>
                            </td>
                            <td>
                                <span className="status-badge">Active</span>
                            </td>
                            <td className="text-right pr-30">
                                <div className="action-buttons">
                                    <button className="btn-icon" onClick={() => handleSwitchToForm(hotel)} title="Edit Details"><Edit3 size={18}/></button>
                                    <button className="btn-icon danger" onClick={() => handleDelete(hotel.id)} title="Delete Property"><Trash2 size={18}/></button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="5" className="empty-state">
                                <div className="empty-icon-circle">
                                    <Building2 size={40} color="#cbd5e1"/>
                                </div>
                                <h3>No Properties Listed</h3>
                                <p>Get started by adding your first hotel to Aurelia Travel.</p>
                                <button className="btn-primary btn-center" onClick={() => handleSwitchToForm()}>
                                    <Plus size={18}/> Add First Hotel
                                </button>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
          </motion.div>
        )}
        
        {/* --- FORM VIEW --- */}
        {view === 'form' && (
          <motion.div key="form" className="form-container" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            
            <div className="form-header-row">
                <div className="form-title">
                    <h2>{editingHotel ? 'Edit Property' : 'New Property'}</h2>
                    <p>Fill in the details below to list your hotel</p>
                </div>
                <button type="button" className="btn-close" onClick={() => setView('list')} title="Close">
                    <X size={24} />
                </button>
            </div>
            
            <form onSubmit={handleSubmit}>
                
                <div className="form-main-grid">
                    <div>
                        <div className="form-section-title"><Building2 size={20}/> Core Information</div>
                        <div className="form-group">
                            <label>Property Name <span className="required-star">*</span></label>
                            <input className="form-input" placeholder="e.g. Aurelia Grand Resort" required value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea className="form-input" rows="5" placeholder="Tell guests what makes your hotel special..." value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})}/>
                        </div>
                    </div>

                    <div className="image-preview-container">
                        <label className="image-preview-label">Main Image Preview</label>
                        <div className="image-preview-box">
                            {formData.imageUrl ? (
                                <img src={formData.imageUrl} alt="Preview" className="preview-img" onError={(e)=>{e.target.style.display='none'}}/>
                            ) : (
                                <div className="preview-placeholder">
                                    <ImageIcon size={40} style={{marginBottom:'10px'}}/>
                                    <div>Image preview will appear here</div>
                                </div>
                            )}
                        </div>
                        <div className="form-group" style={{marginTop:'15px'}}>
                            <label>Image URL</label>
                            <input className="form-input" placeholder="https://..." value={formData.imageUrl} onChange={e=>setFormData({...formData, imageUrl:e.target.value})}/>
                        </div>
                    </div>
                </div>

                <hr className="form-divider"/>

                <div className="form-section-title"><MapPin size={20} /> Location Details</div>
                <div className="form-grid-row">
                    <div className="form-group"><label>Address Line 1 <span className="required-star">*</span></label><input className="form-input" required value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})}/></div>
                    <div className="form-group"><label>City <span className="required-star">*</span></label><input className="form-input" required value={formData.city} onChange={e=>setFormData({...formData, city:e.target.value})}/></div>
                </div>
                <div className="form-grid-3">
                    <div className="form-group"><label>State/Province</label><input className="form-input" value={formData.province} onChange={e=>setFormData({...formData, province:e.target.value})}/></div>
                    <div className="form-group"><label>Postal Code</label><input className="form-input" value={formData.postalCode} onChange={e=>setFormData({...formData, postalCode:e.target.value})}/></div>
                    <div className="form-group"><label>Country <span className="required-star">*</span></label><input className="form-input" required value={formData.country} onChange={e=>setFormData({...formData, country:e.target.value})}/></div>
                </div>

                <hr className="form-divider"/>

                <div className="form-grid-row" style={{gap: '40px'}}>
                    <div>
                        <div className="form-section-title"><Clock size={20} /> Policies</div>
                        <div className="form-grid-row">
                            <div className="form-group"><label>Check-in Time</label><input type="time" className="form-input" value={formData.checkIn} onChange={e=>setFormData({...formData, checkIn:e.target.value})}/></div>
                            <div className="form-group"><label>Check-out Time</label><input type="time" className="form-input" value={formData.checkOut} onChange={e=>setFormData({...formData, checkOut:e.target.value})}/></div>
                        </div>
                        <div className="form-group"><label>Cancellation Policy (Hours)</label><input type="number" className="form-input" value={formData.cancellationPolicy} onChange={e=>setFormData({...formData, cancellationPolicy:e.target.value})}/></div>
                    </div>
                    
                    <div>
                        <div className="form-section-title"><Phone size={20} /> Contact Info</div>
                        <div className="form-group"><label>Email Address</label><div className="input-icon-wrapper"><Mail size={16} className="input-icon"/><input type="email" className="form-input pl-40" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})}/></div></div>
                        <div className="form-group"><label>Website</label><div className="input-icon-wrapper"><Globe size={16} className="input-icon"/><input className="form-input pl-40" value={formData.website} onChange={e=>setFormData({...formData, website:e.target.value})}/></div></div>
                    </div>
                </div>

                <hr className="form-divider"/>

                <div className="form-section-title"><CheckCircle size={20} /> Amenities</div>
                <div className="form-group">
                    <label>List Amenities (separated by commas)</label>
                    <input className="form-input" placeholder="e.g. Free WiFi, Swimming Pool, Gym, Spa, Parking" value={formData.facilities} onChange={e=>setFormData({...formData, facilities:e.target.value})}/>
                    <p className="helper-text">These will be displayed as tags on your hotel page.</p>
                </div>
                
                <div className="form-footer">
                    <button type="button" className="btn-secondary" onClick={() => setView('list')}>Cancel</button>
                    <button type="submit" className="btn-primary btn-submit" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : (editingHotel ? 'Save Changes' : 'Create Property')}
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