import { useState, useEffect, useCallback, useRef } from 'react'; 
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Eye, Image as ImageIcon, Loader2, MinusCircle,
  MapPin, Clock, Phone, Globe, Mail, Search, X,
  Building, Star, CheckCircle2,
  Bold, Italic, Underline, List
} from 'lucide-react';
import './styles/dashboard-hotels.css';

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

const DashboardHotels = () => {
  const [view, setView] = useState('list');
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingHotel, setEditingHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Amenities Data
  const [dbAmenities, setDbAmenities] = useState([]); 
  const [newAmenityText, setNewAmenityText] = useState('');

  const [formData, setFormData] = useState({
    name: '', description: '', address: '', city: '', province: '', 
    postalCode: '', country: '', latitude: '', longitude: '',
    email: '', phone: '', website: '',
    checkIn: '14:00', checkOut: '11:00', cancellationPolicy: '24', 
    images: [], // { url, isPrimary }
    amenities: [] // Mixed IDs and Strings
  });

  const fetchHotels = useCallback(async () => {
    try {
      const res = await api.get('/hotels/mine');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setHotels(data);
      setFilteredHotels(data);
    } catch (err) { console.error(err); }
  }, []);

  // Fetch Amenities
  useEffect(() => {
      api.get('/hotels/amenities').then(res => {
          setDbAmenities(res.data.data || []);
      }).catch(() => console.log("Amenities fetch skipped"));
      fetchHotels();
  }, [fetchHotels]);

  // Search
  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = hotels.filter(h => h.name.toLowerCase().includes(lowerTerm));
    setFilteredHotels(filtered);
  }, [searchTerm, hotels]);

  // --- FORM HANDLERS ---
  const handleSwitchToForm = (hotel = null) => {
    setEditingHotel(hotel);
    if (hotel) {
        // Handle images
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
            amenities: hotel.amenities ? hotel.amenities.map(a => a.id) : [] 
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

  // Image Handlers
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

  // Amenity Handlers
  const toggleAmenity = (id) => {
      setFormData(prev => ({
          ...prev,
          amenities: prev.amenities.includes(id) 
            ? prev.amenities.filter(a => a !== id)
            : [...prev.amenities, id]
      }));
  };

  const addNewAmenity = () => {
      if (!newAmenityText.trim()) return;
      const name = newAmenityText.trim();
      if (!formData.amenities.includes(name)) {
          setFormData(prev => ({ ...prev, amenities: [...prev.amenities, name] }));
          setDbAmenities(prev => [...prev, { id: name, name: name }]); // Optimistic Update
      }
      setNewAmenityText('');
  };

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
      images: validImages, amenities: formData.amenities
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
                    {filteredHotels.map(hotel => (
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
                    ))}
                    </tbody>
                </table>
            </div>
          </motion.div>
        )}
        
        {view === 'form' && (
          <motion.div key="form" className="form-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="form-card">
                <div className="form-header"><h2>{editingHotel ? 'Edit Property' : 'New Property'}</h2><button onClick={() => setView('list')}><X/></button></div>
                
                <form onSubmit={handleSubmit} className="professional-form">
                    
                    {/* Basic Info & Images */}
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

                    {/* Location */}
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

                    {/* Contact & Policy */}
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

                    {/* Amenities */}
                    <div className="form-section no-border">
                        <h4 className="section-heading"><CheckCircle2 size={18}/> Amenities</h4>
                        <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                            <input className="form-input" placeholder="Add new amenity..." value={newAmenityText} onChange={e => setNewAmenityText(e.target.value)} style={{maxWidth:'300px'}}/>
                            <button type="button" className="btn-secondary" onClick={addNewAmenity}>Add</button>
                        </div>
                        <div className="amenity-checkboxes" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'12px'}}>
                            {dbAmenities.map(am => (
                                <label key={am.id} style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'0.9rem'}}>
                                    <input type="checkbox" checked={formData.amenities.includes(am.id) || formData.amenities.includes(am.name)} onChange={() => toggleAmenity(am.id)}/>
                                    {am.name}
                                </label>
                            ))}
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