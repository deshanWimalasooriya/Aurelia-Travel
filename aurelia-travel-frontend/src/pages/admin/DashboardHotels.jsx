import { useState, useEffect, useCallback, useRef } from 'react'; 
import api from '../../services/api'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Image as ImageIcon, Loader2, 
  MapPin, Clock, Phone, Globe, Mail, Search, X, 
  Building, Star, CheckCircle2, AlertCircle,
  Bold, Italic, Underline, List, ListOrdered
} from 'lucide-react';
import './styles/dashboard-hotels.css';

// --- Sub-Component: Lightweight Rich Text Editor ---
const SimpleEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);
    const isLocked = useRef(false); // 🔒 Lock to prevent React from resetting cursor

    const applyFormat = (command) => {
        document.execCommand(command, false, null);
        editorRef.current.focus();
    };

    // Sync external value changes to the editor (e.g. initial load)
    // But DO NOT sync if the user is currently typing (isLocked is true)
    useEffect(() => {
        if (editorRef.current) {
            const currentHTML = editorRef.current.innerHTML;
            if (value !== currentHTML && !isLocked.current) {
                editorRef.current.innerHTML = value || "";
            }
        }
    }, [value]);

    const handleInput = (e) => {
        // 1. Lock updates to prevent cursor jump
        isLocked.current = true; 
        
        // 2. Send data to parent
        const html = e.currentTarget.innerHTML;
        onChange(html);
        
        // 3. We stay locked. The lock is only released when the component
        //    receives a new value that matches what we just typed, or on blur.
    };

    // Ensure we unlock if the user clicks away
    const handleBlur = () => {
        isLocked.current = false;
    };

    return (
        <div className="rich-editor-container">
            <div className="editor-toolbar">
                <button type="button" onClick={() => applyFormat('bold')} title="Bold"><Bold size={16}/></button>
                <button type="button" onClick={() => applyFormat('italic')} title="Italic"><Italic size={16}/></button>
                <button type="button" onClick={() => applyFormat('underline')} title="Underline"><Underline size={16}/></button>
                <div className="toolbar-divider"></div>
                <button type="button" onClick={() => applyFormat('insertUnorderedList')} title="Bullet List"><List size={16}/></button>
                <button type="button" onClick={() => applyFormat('insertOrderedList')} title="Numbered List"><ListOrdered size={16}/></button>
            </div>
            <div 
                className="editor-content"
                contentEditable
                ref={editorRef}
                onInput={handleInput}
                onBlur={handleBlur}
                suppressContentEditableWarning={true}
            />
        </div>
    );
};

const DashboardHotels = () => {
  // --- State Management ---
  const [view, setView] = useState('list');
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingHotel, setEditingHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', description: '', address: '', city: '', province: '', 
    postalCode: '', country: '', latitude: '', longitude: '',
    email: '', phone: '', website: '',
    checkIn: '14:00', checkOut: '11:00', cancellationPolicy: '24', 
    imageUrl: '', facilities: ''
  });

  // --- API Functions ---
  const fetchHotels = useCallback(async () => {
    try {
      const res = await api.get('/hotels/mine');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setHotels(data);
      setFilteredHotels(data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

  // --- Search Logic ---
  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = hotels.filter(h => 
      h.name.toLowerCase().includes(lowerTerm) || 
      h.city.toLowerCase().includes(lowerTerm) ||
      h.country.toLowerCase().includes(lowerTerm)
    );
    setFilteredHotels(filtered);
  }, [searchTerm, hotels]);

  // --- Handlers ---
  const handleSwitchToForm = (hotel = null) => {
    setEditingHotel(hotel);
    if (hotel) {
        setFormData({
            name: hotel.name || '', description: hotel.description || '', address: hotel.address_line_1 || '',
            city: hotel.city || '', province: hotel.state || '', postalCode: hotel.postal_code || '',
            country: hotel.country || '', 
            latitude: hotel.latitude || '', longitude: hotel.longitude || '',
            email: hotel.email || '', phone: hotel.phone || '', website: hotel.website || '',
            checkIn: hotel.check_in_time || '14:00', checkOut: hotel.check_out_time || '11:00',
            cancellationPolicy: hotel.cancellation_policy_hours || '24', imageUrl: hotel.main_image || '', 
            facilities: Array.isArray(hotel.amenities) ? hotel.amenities.map(a => typeof a === 'string' ? a : a.name).join(', ') : ''
        });
    } else {
        setFormData({ 
            name: '', description: '', address: '', city: '', province: '', postalCode: '', country: '', 
            latitude: '', longitude: '', email: '', phone: '', website: '', 
            checkIn: '14:00', checkOut: '11:00', cancellationPolicy: '24', imageUrl: '', facilities: '' 
        });
    }
    setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      name: formData.name, 
      description: formData.description, // Now contains HTML
      address_line_1: formData.address,
      city: formData.city, 
      state: formData.province, 
      postal_code: formData.postalCode || '00000',
      country: formData.country, 
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      email: formData.email, 
      phone: formData.phone, 
      website: formData.website,
      check_in_time: formData.checkIn, 
      check_out_time: formData.checkOut,
      cancellation_policy_hours: parseInt(formData.cancellationPolicy) || 24,
      main_image: formData.imageUrl,
      amenities: formData.facilities.split(',').map(f => f.trim()).filter(Boolean)
    };

    try {
      if (editingHotel) await api.put(`/hotels/${editingHotel.id}`, payload);
      else await api.post('/hotels', payload);
      await fetchHotels(); 
      setView('list');
    } catch (err) { 
        alert("Error: " + (err.response?.data?.message || err.message)); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to remove this property?")) return;
    try { 
        await api.delete(`/hotels/${id}`); 
        const updated = hotels.filter(h => h.id !== id);
        setHotels(updated);
        setFilteredHotels(updated);
    } 
    catch(err) { alert("Failed to delete."); }
  };

  return (
    <div className="hotels-dashboard-wrapper">
      <AnimatePresence mode="wait">
        
        {/* --- LIST VIEW --- */}
        {view === 'list' && (
          <motion.div 
            key="list" 
            className="dashboard-content"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="page-title">Property Portfolio</h1>
                    <p className="page-subtitle">Manage your listed properties and locations</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={16} className="search-icon"/>
                        <input 
                            placeholder="Search hotels..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary-compact" onClick={() => handleSwitchToForm()}>
                        <Plus size={16} strokeWidth={2.5} /> 
                        <span>Add Property</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th style={{width: '35%'}}>Property</th>
                            <th>Location</th>
                            <th>Contact</th>
                            <th>Rating</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {filteredHotels.length > 0 ? filteredHotels.map(hotel => (
                        <tr key={hotel.id}>
                            <td>
                                <div className="hotel-cell-main">
                                    <div className="hotel-thumbnail">
                                        {hotel.main_image ? 
                                            <img src={hotel.main_image} alt={hotel.name} onError={(e) => e.target.style.display='none'}/> : 
                                            <Building size={20} className="placeholder-icon"/>
                                        }
                                    </div>
                                    <div className="hotel-meta">
                                        <span className="hotel-name">{hotel.name}</span>
                                        <span className="hotel-id">ID: #{hotel.id}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="info-badge">
                                    <MapPin size={14} /> 
                                    {hotel.city}, {hotel.country}
                                </div>
                            </td>
                            <td>
                                <div className="contact-stack">
                                    {hotel.email && <span title={hotel.email}><Mail size={12}/> {hotel.email}</span>}
                                    {hotel.phone && <span title={hotel.phone}><Phone size={12}/> {hotel.phone}</span>}
                                </div>
                            </td>
                            <td>
                                <div className="rating-pill">
                                    <Star size={12} fill="#eab308" stroke="none"/>
                                    {hotel.rating_average || "New"}
                                </div>
                            </td>
                            <td className="text-right">
                                <div className="action-row">
                                    <button className="icon-btn" onClick={() => handleSwitchToForm(hotel)} title="Edit">
                                        <Edit2 size={16}/>
                                    </button>
                                    <button className="icon-btn delete" onClick={() => handleDelete(hotel.id)} title="Delete">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="5" className="empty-state-cell">
                                <div className="empty-state-content">
                                    <div className="empty-icon"><AlertCircle size={32} /></div>
                                    <h3>No properties found</h3>
                                    <p>Try adjusting your search or add a new property.</p>
                                </div>
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
          <motion.div 
            key="form" 
            className="form-wrapper" 
            initial={{ opacity: 0, scale: 0.99 }} 
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="form-card">
                <div className="form-header">
                    <div>
                        <h2>{editingHotel ? 'Edit Property' : 'New Property'}</h2>
                        <p>Fill in the details below to list your hotel</p>
                    </div>
                    <button type="button" className="btn-close" onClick={() => setView('list')}>
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="professional-form">
                    
                    {/* Section 1: Core Info & Image Preview */}
                    <div className="form-section">
                        <h4 className="section-heading"><Building size={18}/> Core Information</h4>
                        
                        <div className="core-info-grid">
                            {/* Left Side: Inputs */}
                            <div className="core-inputs">
                                <div className="form-group">
                                    <label>Property Name <span className="req">*</span></label>
                                    <input type="text" placeholder="e.g. The Grand Budapest" required 
                                        value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                    <label>Image URL</label>
                                    <div className="input-with-icon">
                                        <Globe size={16}/>
                                        <input type="text" placeholder="https://image.com/..." 
                                            value={formData.imageUrl} onChange={e=>setFormData({...formData, imageUrl:e.target.value})}/>
                                    </div>
                                </div>
                                
                                {/* --- NEW: Rich Text Editor Replacement --- */}
                                <div className="form-group">
                                    <label>Description</label>
                                    <SimpleEditor 
                                        value={formData.description} 
                                        onChange={(val) => setFormData({...formData, description: val})}
                                    />
                                </div>
                            </div>

                            {/* Right Side: Image Preview */}
                            <div className="image-preview-wrapper">
                                <label>Main Image Preview</label>
                                <div className="image-preview-box">
                                    {formData.imageUrl ? (
                                        <img 
                                            src={formData.imageUrl} 
                                            alt="Preview" 
                                            onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}}
                                        />
                                    ) : null}
                                    {/* Fallback / Placeholder */}
                                    <div className="preview-placeholder" style={{display: formData.imageUrl ? 'none' : 'flex'}}>
                                        <ImageIcon size={32} />
                                        <span>Enter URL to preview</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Location */}
                    <div className="form-section">
                        <h4 className="section-heading"><MapPin size={18}/> Location Details</h4>
                        <div className="form-grid-2">
                            <div className="form-group full-width">
                                <label>Address Line 1 <span className="req">*</span></label>
                                <input type="text" required value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})}/>
                            </div>
                            
                            <div className="form-group">
                                <label>City <span className="req">*</span></label>
                                <input type="text" required value={formData.city} onChange={e=>setFormData({...formData, city:e.target.value})}/>
                            </div>
                            <div className="form-group">
                                <label>Country <span className="req">*</span></label>
                                <input type="text" required value={formData.country} onChange={e=>setFormData({...formData, country:e.target.value})}/>
                            </div>

                            <div className="form-group">
                                <label>State / Province</label>
                                <input type="text" value={formData.province} onChange={e=>setFormData({...formData, province:e.target.value})}/>
                            </div>
                            <div className="form-group">
                                <label>Postal Code</label>
                                <input type="text" value={formData.postalCode} onChange={e=>setFormData({...formData, postalCode:e.target.value})}/>
                            </div>

                            {/* Lat & Long */}
                            <div className="form-group">
                                <label>Latitude</label>
                                <input type="number" step="any" placeholder="e.g. 40.7128" 
                                    value={formData.latitude} onChange={e=>setFormData({...formData, latitude:e.target.value})}/>
                            </div>
                            <div className="form-group">
                                <label>Longitude</label>
                                <input type="number" step="any" placeholder="e.g. -74.0060" 
                                    value={formData.longitude} onChange={e=>setFormData({...formData, longitude:e.target.value})}/>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Operations */}
                    <div className="form-section">
                        <h4 className="section-heading"><Clock size={18}/> Operations & Contact</h4>
                        <div className="form-grid-3">
                            <div className="form-group">
                                <label>Check-in</label>
                                <input type="time" value={formData.checkIn} onChange={e=>setFormData({...formData, checkIn:e.target.value})}/>
                            </div>
                            <div className="form-group">
                                <label>Check-out</label>
                                <input type="time" value={formData.checkOut} onChange={e=>setFormData({...formData, checkOut:e.target.value})}/>
                            </div>
                            <div className="form-group">
                                <label>Cancellation (Hrs)</label>
                                <input type="number" value={formData.cancellationPolicy} onChange={e=>setFormData({...formData, cancellationPolicy:e.target.value})}/>
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})}/>
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="text" value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})}/>
                            </div>
                            <div className="form-group">
                                <label>Website</label>
                                <input type="text" value={formData.website} onChange={e=>setFormData({...formData, website:e.target.value})}/>
                            </div>
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className="form-section no-border">
                        <h4 className="section-heading"><CheckCircle2 size={18}/> Amenities</h4>
                        <div className="form-group full-width">
                            <label>Facility Tags</label>
                            <input type="text" placeholder="WiFi, Pool, Gym, Spa, Parking (separated by comma)" 
                                value={formData.facilities} onChange={e=>setFormData({...formData, facilities:e.target.value})}/>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-ghost" onClick={() => setView('list')}>Cancel</button>
                        <button type="submit" className="btn-primary-compact submit" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={16} /> : (editingHotel ? 'Save Changes' : 'Create Property')}
                        </button>
                    </div>

                </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardHotels;