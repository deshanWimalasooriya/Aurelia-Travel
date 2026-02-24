import { useState, useEffect, useCallback, useRef } from 'react'; 
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Eye, Image as ImageIcon, Loader2, MinusCircle,
  MapPin, Clock, Phone, Search, X,
  Building, Star, CheckCircle2,
  Bold, Italic, List,
  Power, Mail, UploadCloud
} from 'lucide-react';
import './styles/dashboard-hotels.css';
import { uploadImageDirectly } from '../../services/cloudinaryUpload';

// --- LEAFLET IMPORTS & SETUP ---
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Simple Editor ---
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

// --- MAP COMPONENTS ---
const LocationMarker = ({ setPosition }) => {
    useMapEvents({ click(e) { setPosition(e.latlng.lat, e.latlng.lng); } });
    return null;
};

const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => { 
        if (center && !isNaN(center[0]) && !isNaN(center[1])) {
            map.flyTo(center, map.getZoom()); 
        }
    }, [center, map]);
    return null;
};

// --- SAFE COORDINATE PARSERS ---
const getSafeCoords = (lat, lng) => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) return [parsedLat, parsedLng];
    return [51.505, -0.09]; // Default map fallback
};

const hasValidCoords = (lat, lng) => {
    return !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
};

const DashboardHotels = () => {
  const [view, setView] = useState('list');
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingHotel, setEditingHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const [dbAmenities, setDbAmenities] = useState([]); 
  const [newAmenityText, setNewAmenityText] = useState('');
  const [manualUrl, setManualUrl] = useState(''); 

  const [formData, setFormData] = useState({
    name: '', description: '', address: '', city: '', province: '', 
    postalCode: '', country: '', latitude: '', longitude: '',
    email: '', phone: '', website: '',
    checkIn: '14:00', checkOut: '11:00', cancellationPolicy: '24', 
    images: [], // Unified array: { url: string, isPrimary: boolean, file: File | null }
    amenities: [] 
  });

  useEffect(() => {
      api.get('/amenities') 
        .then(res => {
            const rawAm = Array.isArray(res.data) ? res.data : (res.data.data || []);
            const normalized = rawAm.map(a => ({ ...a, id: a.id || a._id, name: a.name }));
            setDbAmenities(normalized);
        }).catch(err => console.warn("Global amenities fetch failed:", err));
  }, []);

  const fetchHotels = useCallback(async () => {
    try {
      const res = await api.get('/hotels/mine');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setHotels(data); setFilteredHotels(data);
    } catch (err) { console.error("Failed to load hotels:", err); }
  }, []);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = hotels.filter(h => h.name.toLowerCase().includes(lowerTerm));
    setFilteredHotels(filtered);
  }, [searchTerm, hotels]);

  useEffect(() => {
    if (editingHotel && view === 'form') {
        api.get(`/hotels/${editingHotel.id}/amenities`)
            .then(res => {
                const fetchedAmenities = Array.isArray(res.data) ? res.data : (res.data.data || []);
                const amenityIds = fetchedAmenities.map(item => {
                    if (typeof item === 'object' && item !== null) return item.amenity_id || item.id || item._id; 
                    return item; 
                });
                setFormData(prev => ({ ...prev, amenities: amenityIds }));
            }).catch(err => console.error("Failed to fetch hotel amenities:", err));
    }
  }, [editingHotel, view]);

  const handleSwitchToForm = (hotel = null) => {
    setEditingHotel(hotel);
    
    // Clean up memory from old previews
    formData.images.forEach(img => { if(img.file) URL.revokeObjectURL(img.url); });

    if (hotel) {
        let processedImages = [];
        if (hotel.images_meta && hotel.images_meta.length > 0) {
            processedImages = hotel.images_meta.map(img => ({ url: img.url, isPrimary: img.isPrimary, file: null }));
        } else if (hotel.images && hotel.images.length > 0) {
            processedImages = hotel.images.map(url => ({ url, isPrimary: url === hotel.main_image, file: null }));
        } else if (hotel.main_image) {
            processedImages = [{ url: hotel.main_image, isPrimary: true, file: null }];
        }

        if (processedImages.length > 0 && !processedImages.some(i => i.isPrimary)) processedImages[0].isPrimary = true;

        setFormData({
            name: hotel.name || '', description: hotel.description || '', address: hotel.address_line_1 || '',
            city: hotel.city || '', province: hotel.state || '', postalCode: hotel.postal_code || '',
            country: hotel.country || '', 
            latitude: hotel.latitude ? String(hotel.latitude) : '', 
            longitude: hotel.longitude ? String(hotel.longitude) : '',
            email: hotel.email || '', phone: hotel.phone || '', website: hotel.website || '',
            checkIn: hotel.check_in_time || '14:00', checkOut: hotel.check_out_time || '11:00',
            cancellationPolicy: hotel.cancellation_policy_hours || '24',
            images: processedImages, amenities: [] 
        });
    } else {
        setFormData({ 
            name: '', description: '', address: '', city: '', province: '', postalCode: '', country: '', 
            latitude: '', longitude: '', email: '', phone: '', website: '', 
            checkIn: '14:00', checkOut: '11:00', cancellationPolicy: '24', 
            images: [], amenities: [] 
        });
    }
    setView('form');
  };

  const handleMapClick = (lat, lng) => {
      setFormData(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
  };

  const handleFileSelect = (e) => {
      const files = Array.from(e.target.files);
      const newImages = files.map(file => ({
          url: URL.createObjectURL(file), // Creates a temporary local preview URL
          file: file,
          isPrimary: false
      }));

      setFormData(prev => {
          const updated = [...prev.images, ...newImages];
          if (updated.length > 0 && !updated.some(i => i.isPrimary)) updated[0].isPrimary = true;
          return { ...prev, images: updated };
      });
      e.target.value = null; // Reset input so you can select the same file again if needed
  };

  const addManualUrl = () => {
      if (!manualUrl.trim()) return;
      setFormData(prev => {
          const updated = [...prev.images, { url: manualUrl.trim(), isPrimary: false, file: null }];
          if (updated.length > 0 && !updated.some(i => i.isPrimary)) updated[0].isPrimary = true;
          return { ...prev, images: updated };
      });
      setManualUrl('');
  };

  const removeImageField = (index) => {
      setFormData(prev => {
          const imgToRemove = prev.images[index];
          if (imgToRemove.file) URL.revokeObjectURL(imgToRemove.url); 

          const updated = prev.images.filter((_, i) => i !== index);
          if (updated.length > 0 && !updated.some(i => i.isPrimary)) updated[0].isPrimary = true;
          return { ...prev, images: updated };
      });
  };

  const setPrimaryImage = (index) => {
      setFormData(prev => ({
          ...prev,
          images: prev.images.map((img, i) => ({ ...img, isPrimary: i === index }))
      }));
  };

  const moveToSelected = (id) => {
      if (!formData.amenities.some(a => String(a) === String(id))) {
          setFormData(prev => ({ ...prev, amenities: [...prev.amenities, id] }));
      }
  };

  const moveToAvailable = (id) => {
      setFormData(prev => ({ ...prev, amenities: prev.amenities.filter(a => String(a) !== String(id)) }));
  };

  const addNewAmenity = () => {
      if (!newAmenityText.trim()) return;
      const name = newAmenityText.trim();
      const existing = dbAmenities.find(a => a.name.toLowerCase() === name.toLowerCase());
      if (existing) moveToSelected(existing.id); 
      else {
          const tempId = name; 
          setDbAmenities(prev => [...prev, { id: tempId, name: name }]); 
          setFormData(prev => ({ ...prev, amenities: [...prev.amenities, tempId] }));
      }
      setNewAmenityText('');
  };

  const selectedList = dbAmenities.filter(am => formData.amenities.some(id => String(id) === String(am.id)));
  const availableList = dbAmenities.filter(am => !formData.amenities.some(id => String(id) === String(am.id)));

  // --- SUBMIT LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const localImages = formData.images.filter(img => img.file);
      const existingImages = formData.images.filter(img => !img.file);
      let uploadedImagesArray = [];

      // ✅ INDUSTRY STANDARD: Parallel Direct-to-Cloud Bulk Uploads
      if (localImages.length > 0) {
          // Upload all images directly to Cloudinary at the same time, bypassing the backend server
          const uploadPromises = localImages.map(async (img) => {
              const cloudUrl = await uploadImageDirectly(img.file);
              return { url: cloudUrl, isPrimary: img.isPrimary };
          });
          
          uploadedImagesArray = await Promise.all(uploadPromises);
      }

      // 2. Combine all images for the database
      const finalImages = [
          ...existingImages.map(img => ({ url: img.url, isPrimary: img.isPrimary })),
          ...uploadedImagesArray
      ];

      // Ensure at least one primary image exists in the final payload
      if (finalImages.length > 0 && !finalImages.some(img => img.isPrimary)) {
          finalImages[0].isPrimary = true;
      }

      // 3. Assemble Payload
      const payload = {
        name: formData.name, description: formData.description, address_line_1: formData.address,
        city: formData.city, state: formData.province, postal_code: formData.postalCode || '00000',
        country: formData.country, 
        latitude: formData.latitude ? parseFloat(formData.latitude) : null, 
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        email: formData.email, phone: formData.phone, website: formData.website,
        check_in_time: formData.checkIn, check_out_time: formData.checkOut,
        cancellation_policy_hours: parseInt(formData.cancellationPolicy) || 24,
        images: finalImages, 
        amenities: formData.amenities 
      };

      if (editingHotel) await api.put(`/hotels/${editingHotel.id}`, payload);
      else await api.post('/hotels', payload);
      
      await fetchHotels(); 
      setView('list');

    } catch (err) { 
        alert("Error: " + (err.response?.data?.error || err.message)); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete property?")) return;
    try { await api.delete(`/hotels/${id}`); setHotels(prev => prev.filter(h => h.id !== id)); } 
    catch(err) { alert("Failed to delete."); }
  };

  const handleToggleStatus = async (hotel) => {
      const newStatus = !hotel.is_active; 
      const confirmMsg = newStatus ? "Publish this property?" : "Unpublish this property? It will be hidden from search results.";
      if (!window.confirm(confirmMsg)) return;

      try {
          setHotels(prev => prev.map(h => h.id === hotel.id ? { ...h, is_active: newStatus } : h));
          setFilteredHotels(prev => prev.map(h => h.id === hotel.id ? { ...h, is_active: newStatus } : h));
          await api.put(`/hotels/${hotel.id}`, { is_active: newStatus });
      } catch (err) {
          alert("Failed to update status. Please try again.");
          await fetchHotels(); 
      }
  };

  return (
    <div className="hotels-dashboard-wrapper">
      <AnimatePresence mode="wait">
        
        {/* --- LIST VIEW --- */}
        {view === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{duration: 0.2}}>
            <div className="dashboard-header">
                <div><h1 className="page-title">Property Portfolio</h1><p className="page-subtitle">Manage your hotels</p></div>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={16} className="search-icon"/>
                        <input placeholder="Search properties..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                    </div>
                    <button className="btn-primary-compact" onClick={() => handleSwitchToForm()}>
                        <Plus size={16}/> Add Hotel
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="modern-table">
                    <thead><tr><th>Property</th><th>Location</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                    <tbody>
                    {filteredHotels.length === 0 ? (
                        <tr><td colSpan="4" className="empty-state-cell">No hotels found.</td></tr>
                    ) : (
                        filteredHotels.map(hotel => (
                            <tr key={hotel.id} style={{ opacity: hotel.is_active ? 1 : 0.6 }}>
                                <td>
                                    <div className="hotel-cell-main">
                                        <div className="hotel-thumbnail">{hotel.main_image ? <img src={hotel.main_image} alt=""/> : <Building size={20} className="placeholder-icon"/>}</div>
                                        <div className="hotel-meta">
                                            <span className="clickable-name" onClick={() => navigate(`/hotel/${hotel.id}`)}>{hotel.name}</span>
                                            <span className="hotel-id">#{hotel.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="info-badge"><MapPin size={14}/> {hotel.city}, {hotel.country}</div>
                                </td>
                                <td>
                                    <span className={`status-badge ${hotel.is_active ? 'active' : 'inactive'}`}>
                                        {hotel.is_active ? 'Active' : 'Hidden'}
                                    </span>
                                </td>
                                <td className="text-right">
                                    <div className="action-row">
                                        <button 
                                            className="icon-btn" 
                                            onClick={() => handleToggleStatus(hotel)}
                                            title={hotel.is_active ? "Unpublish" : "Publish"}
                                            style={{ color: hotel.is_active ? '#22c55e' : '#cbd5e1', borderColor: hotel.is_active ? '#22c55e' : '#e2e8f0' }}
                                        ><Power size={16}/></button>
                                        <button className="icon-btn" title="Edit Hotel" onClick={() => handleSwitchToForm(hotel)}><Edit2 size={16}/></button>
                                        <button className="icon-btn delete" title="Delete Hotel" onClick={() => handleDelete(hotel.id)}><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
          </motion.div>
        ) : (
        /* --- FORM VIEW --- */
          <motion.div key="form" className="form-wrapper" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{duration: 0.2}}>
            <div className="form-card">
                <div className="form-header">
                    <div>
                        <h2>{editingHotel ? 'Edit Property' : 'New Property'}</h2>
                        <p>Fill in the details for your hotel listing.</p>
                    </div>
                    <button className="btn-close" onClick={() => setView('list')}><X size={24}/></button>
                </div>

                <form onSubmit={handleSubmit} className="professional-form">
                    {/* CORE INFO */}
                    <div className="form-section">
                        <h4 className="section-heading"><Building size={18}/> Core Info</h4>
                        <div className="core-info-grid">
                            <div className="core-inputs">
                                <div className="form-group"><label>Property Name <span className="req">*</span></label><input className="form-input" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} required/></div>
                                <div className="form-group"><label>Description</label><SimpleEditor value={formData.description} onChange={val => setFormData({...formData, description:val})}/></div>
                            </div>
                            <div className="image-preview-wrapper">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Property Images <span className="req">*</span></label>
                                
                                {/* 1. Dropzone for Local Files */}
                                <div className="upload-dropzone">
                                    <input type="file" multiple accept="image/*" onChange={handleFileSelect} />
                                    <div className="dropzone-content">
                                        <UploadCloud size={28} color="#3b82f6" />
                                        <span>Click here to select images from your computer</span>
                                    </div>
                                </div>

                                {/* 2. Fallback for Manual URLs */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="Or paste an image URL directly..." 
                                        value={manualUrl} 
                                        onChange={e => setManualUrl(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualUrl(); } }}
                                    />
                                    <button type="button" className="btn-ghost" onClick={addManualUrl}>Add</button>
                                </div>

                                {/* 3. The Visual Management Grid */}
                                {formData.images.length > 0 && (
                                    <div className="image-grid-manager">
                                        {formData.images.map((img, i) => (
                                            <div key={i} className={`image-preview-card ${img.isPrimary ? 'is-primary' : ''}`}>
                                                <img src={img.url} alt={`Property Preview ${i}`} />
                                                {img.isPrimary && <span className="primary-badge">Cover</span>}
                                                <div className="image-actions">
                                                    {!img.isPrimary && (
                                                        <button type="button" className="img-action-btn" onClick={() => setPrimaryImage(i)} title="Set as Cover Photo">
                                                            <Star size={14} color="#f59e0b" fill="#f59e0b"/>
                                                        </button>
                                                    )}
                                                    <button type="button" className="img-action-btn" onClick={() => removeImageField(i)} title="Remove Image">
                                                        <Trash2 size={14} color="#ef4444" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* LOCATION MAP */}
                    <div className="form-section">
                        <h4 className="section-heading"><MapPin size={18}/> Location Details</h4>
                        <div className="form-grid-2">
                            <div className="form-group"><label>Address <span className="req">*</span></label><input className="form-input" value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} required/></div>
                            <div className="form-group"><label>City <span className="req">*</span></label><input className="form-input" value={formData.city} onChange={e=>setFormData({...formData, city:e.target.value})} required/></div>
                            <div className="form-group"><label>Province/State</label><input className="form-input" value={formData.province} onChange={e=>setFormData({...formData, province:e.target.value})}/></div>
                            <div className="form-group"><label>Country <span className="req">*</span></label><input className="form-input" value={formData.country} onChange={e=>setFormData({...formData, country:e.target.value})} required/></div>
                            <div className="form-group"><label>Latitude</label><input className="form-input" type="number" step="any" value={formData.latitude} onChange={e=>setFormData({...formData, latitude:e.target.value})}/></div>
                            <div className="form-group"><label>Longitude</label><input className="form-input" type="number" step="any" value={formData.longitude} onChange={e=>setFormData({...formData, longitude:e.target.value})}/></div>
                        </div>

                        {/* SAFE MAP CONTAINER */}
                        <div style={{ marginTop: '20px', height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)', position: 'relative', zIndex: 1 }}>
                            <MapContainer 
                                center={getSafeCoords(formData.latitude, formData.longitude)} 
                                zoom={hasValidCoords(formData.latitude, formData.longitude) ? 15 : 4} 
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <LocationMarker setPosition={handleMapClick} />
                                {hasValidCoords(formData.latitude, formData.longitude) && (
                                    <>
                                        <Marker position={getSafeCoords(formData.latitude, formData.longitude)} />
                                        <MapUpdater center={getSafeCoords(formData.latitude, formData.longitude)} />
                                    </>
                                )}
                            </MapContainer>
                        </div>
                        <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px'}}>* Click on the map to set exact property coordinates.</p>
                    </div>

                    {/* CONTACT */}
                    <div className="form-section">
                        <h4 className="section-heading"><Clock size={18}/> Operations & Contact</h4>
                        <div className="form-grid-3">
                            <div className="form-group"><label>Email</label><div className="input-with-icon"><Mail size={16}/><input className="form-input" type="email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})}/></div></div>
                            <div className="form-group"><label>Phone</label><div className="input-with-icon"><Phone size={16}/><input className="form-input" value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})}/></div></div>
                            <div className="form-group"><label>Website</label><input className="form-input" value={formData.website} onChange={e=>setFormData({...formData, website:e.target.value})}/></div>
                            <div className="form-group"><label>Check-in</label><input type="time" className="form-input" value={formData.checkIn} onChange={e=>setFormData({...formData, checkIn:e.target.value})}/></div>
                            <div className="form-group"><label>Check-out</label><input type="time" className="form-input" value={formData.checkOut} onChange={e=>setFormData({...formData, checkOut:e.target.value})}/></div>
                            <div className="form-group"><label>Cancel Window (Hrs)</label><input type="number" className="form-input" value={formData.cancellationPolicy} onChange={e=>setFormData({...formData, cancellationPolicy:e.target.value})}/></div>
                        </div>
                    </div>

                    {/* AMENITIES */}
                    <div className="form-section no-border">
                        <h4 className="section-heading"><CheckCircle2 size={18}/> Amenities</h4>
                        <div style={{display:'flex', gap:'10px', marginBottom:'20px', alignItems: 'center'}}>
                            <input className="form-input" placeholder="Create new amenity..." value={newAmenityText} onChange={e => setNewAmenityText(e.target.value)} style={{maxWidth: '300px'}}/>
                            <button type="button" className="btn-ghost" onClick={addNewAmenity}>Add Custom</button>
                        </div>
                        <div className="transfer-container">
                            <div className="transfer-column">
                                <div className="transfer-header"><span>Selected ({selectedList.length})</span><CheckCircle2 size={16} /></div>
                                <div className="transfer-list">
                                    {selectedList.map(am => (
                                        <div key={am.id} className="transfer-item selected-item" onClick={() => moveToAvailable(am.id)}>
                                            <span>{am.name}</span><MinusCircle size={14} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="transfer-controls"></div>
                            <div className="transfer-column">
                                <div className="transfer-header"><span>Available ({availableList.length})</span><List size={16} /></div>
                                <div className="transfer-list">
                                    {availableList.map(am => (
                                        <div key={am.id} className="transfer-item available-item" onClick={() => moveToSelected(am.id)}>
                                            <span>{am.name}</span><Plus size={14} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-ghost" onClick={() => setView('list')}>Cancel</button>
                        <button type="submit" className="btn-primary-compact" disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : 'Save Property'}</button>
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