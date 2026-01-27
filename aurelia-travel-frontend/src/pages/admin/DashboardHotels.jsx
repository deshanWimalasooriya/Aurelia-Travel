import { useState, useEffect, useCallback, useRef } from 'react'; 
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Eye, Image as ImageIcon, Loader2, MinusCircle,
  MapPin, Clock, Phone, Search, X,
  Building, Star, CheckCircle2,
  Bold, Italic, List,
  ChevronRight, ChevronLeft
} from 'lucide-react';
import './styles/dashboard-hotels.css';

// --- Simple Editor (No Changes) ---
const SimpleEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);
    const isLocked = useRef(false);
    const applyFormat = (command) => { document.execCommand(command, false, null); editorRef.current.focus(); };
    useEffect(() => {
        if (editorRef.current) {
            const currentHTML = editorRef.current.innerHTML;
            if (value !== currentHTML && !isLocked.current) editorRef.current.innerHTML = value || "";
        }
    }, [value]);
    const handleInput = (e) => { isLocked.current = true; onChange(e.currentTarget.innerHTML); };
    const handleBlur = () => { isLocked.current = false; };
    return (
        <div className="rich-editor-container">
            <div className="editor-toolbar">
                <button type="button" onClick={() => applyFormat('bold')}><Bold size={16}/></button>
                <button type="button" onClick={() => applyFormat('italic')}><Italic size={16}/></button>
                <div className="toolbar-divider"></div>
                <button type="button" onClick={() => applyFormat('insertUnorderedList')}><List size={16}/></button>
            </div>
            <div className="editor-content" contentEditable ref={editorRef} onInput={handleInput} onBlur={handleBlur} />
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
  const navigate = useNavigate();
  
  // Amenities State
  const [dbAmenities, setDbAmenities] = useState([]); // Master list (Right Side Source)
  const [newAmenityText, setNewAmenityText] = useState('');

  const [formData, setFormData] = useState({
    name: '', description: '', address: '', city: '', province: '', 
    postalCode: '', country: '', latitude: '', longitude: '',
    email: '', phone: '', website: '',
    checkIn: '14:00', checkOut: '11:00', cancellationPolicy: '24', 
    images: [], 
    amenities: [] // This stores the IDs of amenities on the Left Side
  });

  // --- 1. Fetch Global Amenities (The Available Options) ---
  useEffect(() => {
      api.get('/amenities') 
        .then(res => {
            const rawAm = Array.isArray(res.data) ? res.data : (res.data.data || []);
            const normalized = rawAm.map(a => ({
                ...a,
                id: a.id || a._id, 
                name: a.name 
            }));
            setDbAmenities(normalized);
        })
        .catch(err => console.warn("Global amenities fetch failed:", err));
  }, []);

  // --- 2. Fetch Hotels List ---
  const fetchHotels = useCallback(async () => {
    try {
      const res = await api.get('/hotels/mine');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setHotels(data);
      setFilteredHotels(data);
    } catch (err) { 
      console.error("Failed to load hotels:", err); 
    }
  }, []);

  useEffect(() => {
      fetchHotels();
  }, [fetchHotels]);

  // Search Logic
  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = hotels.filter(h => h.name.toLowerCase().includes(lowerTerm));
    setFilteredHotels(filtered);
  }, [searchTerm, hotels]);


  // --- 3. SYNC LOGIC: Fetch Specific Hotel Amenities ---
  // When editing, this fetches the hotel's existing amenities and puts them in the "Left Side"
  useEffect(() => {
    if (editingHotel && view === 'form') {
        api.get(`/hotels/${editingHotel.id}/amenities`)
            .then(res => {
                const fetchedAmenities = Array.isArray(res.data) ? res.data : (res.data.data || []);
                
                // Extract IDs to match against the global list
                const amenityIds = fetchedAmenities.map(item => {
                    if (typeof item === 'object' && item !== null) {
                        // Handle potential pivot table structure (amenity_id) or direct object (id)
                        return item.amenity_id || item.id || item._id; 
                    }
                    return item; // Handle if it is just an ID
                });

                // Updating formData.amenities moves them to the "Selected" (Left) list
                setFormData(prev => ({ ...prev, amenities: amenityIds }));
            })
            .catch(err => console.error("Failed to fetch hotel amenities:", err));
    }
  }, [editingHotel, view]);


  // --- FORM HANDLERS ---
  const handleSwitchToForm = (hotel = null) => {
    setEditingHotel(hotel);
    
    if (hotel) {
        // Handle Images
        const processedImages = (hotel.images_meta && hotel.images_meta.length > 0) 
            ? hotel.images_meta.map(img => ({ url: img.url, isPrimary: img.isPrimary }))
            : (hotel.images && hotel.images.length > 0 
                ? hotel.images.map(url => ({ url, isPrimary: url === hotel.main_image })) 
                : [{ url: hotel.main_image || '', isPrimary: true }]);

        if (processedImages.length > 0 && !processedImages.some(i => i.isPrimary)) processedImages[0].isPrimary = true;

        setFormData({
            name: hotel.name || '', description: hotel.description || '', address: hotel.address_line_1 || '',
            city: hotel.city || '', province: hotel.state || '', postalCode: hotel.postal_code || '',
            country: hotel.country || '', latitude: hotel.latitude || '', longitude: hotel.longitude || '',
            email: hotel.email || '', phone: hotel.phone || '', website: hotel.website || '',
            checkIn: hotel.check_in_time || '14:00', checkOut: hotel.check_out_time || '11:00',
            cancellationPolicy: hotel.cancellation_policy_hours || '24',
            images: processedImages,
            amenities: [] // Start empty, useEffect above will fill this with existing data
        });
    } else {
        setFormData({ 
            name: '', description: '', address: '', city: '', province: '', postalCode: '', country: '', 
            latitude: '', longitude: '', email: '', phone: '', website: '', 
            checkIn: '14:00', checkOut: '11:00', cancellationPolicy: '24', 
            images: [{ url: '', isPrimary: true }], amenities: [] 
        });
    }
    setView('form');
  };

  const handleImageChange = (index, value) => {
      const newImages = [...formData.images];
      newImages[index].url = value;
      setFormData({ ...formData, images: newImages });
  };
  const addImageField = () => setFormData({ ...formData, images: [...formData.images, { url: '', isPrimary: false }] });
  const removeImageField = (index) => {
      const newImages = formData.images.filter((_, i) => i !== index);
      if (newImages.length && !newImages.some(i => i.isPrimary)) newImages[0].isPrimary = true;
      setFormData({ ...formData, images: newImages.length ? newImages : [{url:'', isPrimary:true}] });
  };
  const setPrimaryImage = (index) => {
      const newImages = formData.images.map((img, i) => ({ ...img, isPrimary: i === index }));
      setFormData({ ...formData, images: newImages });
  };

  // --- TRANSFER LIST LOGIC ---

  // 1. Move from RIGHT (Available) to LEFT (Selected)
  const moveToSelected = (id) => {
      if (!formData.amenities.some(a => String(a) === String(id))) {
          setFormData(prev => ({
              ...prev,
              amenities: [...prev.amenities, id]
          }));
      }
  };

  // 2. Move from LEFT (Selected) to RIGHT (Available)
  const moveToAvailable = (id) => {
      setFormData(prev => ({
          ...prev,
          amenities: prev.amenities.filter(a => String(a) !== String(id))
      }));
  };

  // Add a brand new amenity (automatically goes to Left)
  const addNewAmenity = () => {
      if (!newAmenityText.trim()) return;
      const name = newAmenityText.trim();
      
      const existing = dbAmenities.find(a => a.name.toLowerCase() === name.toLowerCase());
      
      if (existing) {
          moveToSelected(existing.id); 
      } else {
          // Add to local master list and select it
          const tempId = name; 
          setDbAmenities(prev => [...prev, { id: tempId, name: name }]); 
          setFormData(prev => ({ ...prev, amenities: [...prev.amenities, tempId] }));
      }
      setNewAmenityText('');
  };

  // --- LIST CALCULATION ---
  // LEFT SIDE: Amenities that ARE in formData.amenities
  const selectedList = dbAmenities.filter(am => 
      formData.amenities.some(id => String(id) === String(am.id))
  );
  
  // RIGHT SIDE: Amenities that are NOT in formData.amenities
  const availableList = dbAmenities.filter(am => 
      !formData.amenities.some(id => String(id) === String(am.id))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const validImages = formData.images.filter(img => img.url.trim() !== '');
    
    const payload = {
      name: formData.name, description: formData.description, address_line_1: formData.address,
      city: formData.city, state: formData.province, postal_code: formData.postalCode || '00000',
      country: formData.country, latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude),
      email: formData.email, phone: formData.phone, website: formData.website,
      check_in_time: formData.checkIn, check_out_time: formData.checkOut,
      cancellation_policy_hours: parseInt(formData.cancellationPolicy) || 24,
      images: validImages, 
      amenities: formData.amenities // Sends the list from the Left Side
    };

    try {
      if (editingHotel) await api.put(`/hotels/${editingHotel.id}`, payload);
      else await api.post('/hotels', payload);
      await fetchHotels(); setView('list');
    } catch (err) { alert("Error: " + (err.response?.data?.error || err.message)); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete property?")) return;
    try { await api.delete(`/hotels/${id}`); setHotels(prev => prev.filter(h => h.id !== id)); } 
    catch(err) { alert("Failed to delete."); }
  };

  return (
    <div className="hotels-dashboard-wrapper">
      <AnimatePresence mode="wait">
        
        {/* --- LIST VIEW --- */}
        {view === 'list' && (
          <motion.div key="list" className="dashboard-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="dashboard-header">
                <div><h1>Property Portfolio</h1><p>Manage your hotels</p></div>
                <div className="header-actions">
                    <div className="search-bar"><Search size={16}/><input placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div>
                    <button className="btn-primary-compact" onClick={() => handleSwitchToForm()}><Plus size={16}/> Add Hotel</button>
                </div>
            </div>
            <div className="table-container">
                <table className="modern-table">
                    <thead><tr><th>Property</th><th>Location</th><th>Contact</th><th className="text-right">Actions</th></tr></thead>
                    <tbody>
                    {filteredHotels.length === 0 ? (
                        <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>No hotels found.</td></tr>
                    ) : (
                        filteredHotels.map(hotel => (
                            <tr key={hotel.id}>
                                <td>
                                    <div className="hotel-cell-main">
                                        <div className="hotel-thumbnail">{hotel.main_image ? <img src={hotel.main_image} alt=""/> : <Building size={20}/>}</div>
                                        <div className="hotel-meta"><span className="hotel-name clickable-name" onClick={() => navigate(`/hotel/${hotel.id}`)}>{hotel.name}</span><span className="hotel-id">#{hotel.id}</span></div>
                                    </div>
                                </td>
                                <td><MapPin size={14}/> {hotel.city}, {hotel.country}</td>
                                <td><div className="contact-stack"><span>{hotel.email}</span><span>{hotel.phone}</span></div></td>
                                <td className="text-right">
                                    <div className="action-row">
                                        <button className="icon-btn" onClick={() => navigate(`/hotel/${hotel.id}`)}><Eye size={16}/></button>
                                        <button className="icon-btn" onClick={() => handleSwitchToForm(hotel)}><Edit2 size={16}/></button>
                                        <button className="icon-btn delete" onClick={() => handleDelete(hotel.id)}><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
          </motion.div>
        )}
        
        {/* --- FORM VIEW --- */}
        {view === 'form' && (
          <motion.div key="form" className="form-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="form-card">
                <div className="form-header"><h2>{editingHotel ? 'Edit Property' : 'New Property'}</h2><button onClick={() => setView('list')}><X/></button></div>
                
                <form onSubmit={handleSubmit} className="professional-form">
                    
                    {/* CORE INFO */}
                    <div className="form-section">
                        <h4 className="section-heading"><Building size={18}/> Core Info</h4>
                        <div className="core-info-grid">
                            <div className="core-inputs">
                                <input className="form-input mb-3" placeholder="Property Name" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} required/>
                                <SimpleEditor value={formData.description} onChange={val => setFormData({...formData, description:val})}/>
                            </div>
                            
                            <div className="image-preview-wrapper">
                                <label>Images (Star = Primary)</label>
                                <div className="image-inputs-col">
                                    {formData.images.map((img, i) => (
                                        <div key={i} className="image-input-row" style={{display:'flex', gap:'8px', alignItems:'center', marginBottom:'8px'}}>
                                            <button type="button" onClick={() => setPrimaryImage(i)} className={`icon-btn small ${img.isPrimary ? 'active-star' : ''}`} style={{color: img.isPrimary ? '#f59e0b' : '#cbd5e1', border: img.isPrimary ? '1px solid #f59e0b' : '1px solid #e2e8f0'}}>
                                                <Star size={16} fill={img.isPrimary ? '#f59e0b' : 'none'}/>
                                            </button>
                                            <input className="form-input" placeholder="Image URL" value={img.url} onChange={e => handleImageChange(i, e.target.value)}/>
                                            {formData.images.length > 1 && <button type="button" className="icon-btn delete" onClick={() => removeImageField(i)}><MinusCircle size={16}/></button>}
                                        </div>
                                    ))}
                                    <button type="button" className="btn-ghost small" onClick={addImageField}>+ Add Image URL</button>
                                </div>
                                <div className="image-preview-box mt-2">
                                    {formData.images.find(i=>i.isPrimary && i.url) ? <img src={formData.images.find(i=>i.isPrimary).url} alt="Primary" onError={(e) => e.target.style.display='none'}/> : <ImageIcon size={32}/>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* LOCATION */}
                    <div className="form-section">
                        <h4 className="section-heading"><MapPin size={18}/> Location Details</h4>
                        <div className="form-grid-2">
                            <input className="form-input" placeholder="Address" value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} required/>
                            <input className="form-input" placeholder="City" value={formData.city} onChange={e=>setFormData({...formData, city:e.target.value})} required/>
                            <input className="form-input" placeholder="Province/State" value={formData.province} onChange={e=>setFormData({...formData, province:e.target.value})}/>
                            <input className="form-input" placeholder="Country" value={formData.country} onChange={e=>setFormData({...formData, country:e.target.value})} required/>
                            <input className="form-input" placeholder="Latitude" type="number" step="any" value={formData.latitude} onChange={e=>setFormData({...formData, latitude:e.target.value})}/>
                            <input className="form-input" placeholder="Longitude" type="number" step="any" value={formData.longitude} onChange={e=>setFormData({...formData, longitude:e.target.value})}/>
                        </div>
                    </div>

                    {/* CONTACT */}
                    <div className="form-section">
                        <h4 className="section-heading"><Clock size={18}/> Operations & Contact</h4>
                        <div className="form-grid-3">
                            <input className="form-input" placeholder="Email" type="email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})}/>
                            <input className="form-input" placeholder="Phone" value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})}/>
                            <input className="form-input" placeholder="Website" value={formData.website} onChange={e=>setFormData({...formData, website:e.target.value})}/>
                            <div className="form-group"><label>Check-in</label><input type="time" className="form-input" value={formData.checkIn} onChange={e=>setFormData({...formData, checkIn:e.target.value})}/></div>
                            <div className="form-group"><label>Check-out</label><input type="time" className="form-input" value={formData.checkOut} onChange={e=>setFormData({...formData, checkOut:e.target.value})}/></div>
                            <div className="form-group"><label>Cancel (Hrs)</label><input type="number" className="form-input" value={formData.cancellationPolicy} onChange={e=>setFormData({...formData, cancellationPolicy:e.target.value})}/></div>
                        </div>
                    </div>

                    {/* --- TRANSFER LIST AMENITIES --- */}
                    <div className="form-section no-border">
                        <h4 className="section-heading"><CheckCircle2 size={18}/> Amenities Management</h4>
                        
                        {/* New Amenity Input */}
                        <div style={{display:'flex', gap:'10px', marginBottom:'15px', alignItems: 'center'}}>
                            <input 
                                className="form-input" 
                                placeholder="Create new amenity..." 
                                value={newAmenityText} 
                                onChange={e => setNewAmenityText(e.target.value)} 
                                style={{maxWidth: '300px'}}
                            />
                            <button type="button" className="btn-secondary" onClick={addNewAmenity}>Add</button>
                            <span style={{fontSize:'0.8rem', color:'#64748b'}}>Adds to Selected list.</span>
                        </div>

                        {/* Dual List Container */}
                        <div className="transfer-container">
                            
                            {/* Left Side: SELECTED (Existing backend amenities will appear here) */}
                            <div className="transfer-column">
                                <div className="transfer-header">
                                    <span>Selected ({selectedList.length})</span>
                                    <CheckCircle2 size={16} />
                                </div>
                                <div className="transfer-list">
                                    {selectedList.length === 0 && <p style={{padding:'20px', textAlign:'center', color:'#94a3b8', fontSize:'0.85rem'}}>No amenities selected.</p>}
                                    {selectedList.map(am => (
                                        <div 
                                            key={am.id} 
                                            className="transfer-item selected-item"
                                            onClick={() => moveToAvailable(am.id)}
                                            title="Click to remove"
                                        >
                                            <span>{am.name}</span>
                                            <MinusCircle size={14} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Middle Controls */}
                            <div className="transfer-controls">
                                <div className="count-badge"><ChevronLeft size={14}/> In</div>
                                <div className="count-badge">Out <ChevronRight size={14}/></div>
                            </div>

                            {/* Right Side: AVAILABLE (Global list minus selected) */}
                            <div className="transfer-column">
                                <div className="transfer-header">
                                    <span>Available ({availableList.length})</span>
                                    <List size={16} />
                                </div>
                                <div className="transfer-list">
                                    {availableList.length === 0 && <p style={{padding:'20px', textAlign:'center', color:'#94a3b8', fontSize:'0.85rem'}}>No other amenities available.</p>}
                                    {availableList.map(am => (
                                        <div 
                                            key={am.id} 
                                            className="transfer-item available-item"
                                            onClick={() => moveToSelected(am.id)}
                                            title="Click to add"
                                        >
                                            <span>{am.name}</span>
                                            <Plus size={14} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-ghost" onClick={() => setView('list')}>Cancel</button>
                        <button type="submit" className="btn-primary-compact submit" disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : 'Save Hotel'}</button>
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