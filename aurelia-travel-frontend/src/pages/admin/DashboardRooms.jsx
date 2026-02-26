import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Image as ImageIcon, Loader2, 
  Search, X, Users, Building, Maximize, 
  BedDouble, Mountain, Bold, Italic, Underline, List, 
  ListOrdered, Coffee, Cigarette, RefreshCw, MinusCircle, Star,
  Power, UploadCloud, CheckCircle2, Bath
} from 'lucide-react';
import './styles/dashboard-rooms.css';

// --- Rich Text Editor ---
const SimpleEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);
    const isLocked = useRef(false);

    const applyFormat = (command) => {
        document.execCommand(command, false, null);
        editorRef.current.focus();
    };

    useEffect(() => {
        if (editorRef.current) {
            const currentHTML = editorRef.current.innerHTML;
            if (value !== currentHTML && !isLocked.current) {
                editorRef.current.innerHTML = value || "";
            }
        }
    }, [value]);

    const handleInput = (e) => {
        isLocked.current = true; 
        onChange(e.currentTarget.innerHTML);
    };

    const handleBlur = () => { isLocked.current = false; };

    return (
        <div className="rich-editor-container">
            <div className="editor-toolbar">
                <button type="button" onClick={() => applyFormat('bold')}><Bold size={14}/></button>
                <button type="button" onClick={() => applyFormat('italic')}><Italic size={14}/></button>
                <button type="button" onClick={() => applyFormat('underline')}><Underline size={14}/></button>
                <div className="toolbar-divider"></div>
                <button type="button" onClick={() => applyFormat('insertUnorderedList')}><List size={14}/></button>
                <button type="button" onClick={() => applyFormat('insertOrderedList')}><ListOrdered size={14}/></button>
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

const DashboardRooms = () => {
  const [view, setView] = useState('list');
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedHotelFilter, setSelectedHotelFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Image Upload States
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [manualUrl, setManualUrl] = useState('');

  // Expanded form data aligning with PropertyOnboarding features
  const [formData, setFormData] = useState({
    title: '', hotelId: '', price: '', description: '', 
    roomType: 'Standard', viewType: 'City View',
    maxAdults: 2, maxChildren: 0, sizeSqm: '', bedType: '', totalQuantity: 1, 
    hasBreakfast: false, isRefundable: true, smokingAllowed: false,
    roomAmenities: [], customFeatures: '',
    bathroomType: 'Private En-suite', bathroomAmenities: [],
    images: []
  });

  useEffect(() => {
    const fetchHotels = async () => {
        try {
            const res = await api.get('/hotels/mine');
            setHotels(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch (err) { console.error(err); }
    };
    fetchHotels();
  }, []);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
        let url = selectedHotelFilter === 'all' ? '/rooms/mine' : `/rooms/hotel/${selectedHotelFilter}`;
        const res = await api.get(url);
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setRooms(data);
        setFilteredRooms(data);
    } catch (err) { setRooms([]); setFilteredRooms([]); } 
    finally { setLoading(false); }
  }, [selectedHotelFilter]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = rooms.filter(r => 
        r.title.toLowerCase().includes(lowerTerm) || r.room_type.toLowerCase().includes(lowerTerm)
    );
    setFilteredRooms(filtered);
  }, [searchTerm, rooms]);

  const handleSwitchToForm = (room = null) => {
      setEditingRoom(room);
      setSelectedFiles([]);
      // Free up memory from image previews
      formData.images.forEach(img => { if(img.file) URL.revokeObjectURL(img.url); });

      if (room) {
          let processedImages = [];
          if (room.images_meta && room.images_meta.length > 0) {
              processedImages = room.images_meta.map(img => ({ url: img.url, isPrimary: img.isPrimary, file: null }));
          } else if (room.images && room.images.length > 0) {
              processedImages = room.images.map(url => ({ url, isPrimary: url === room.main_image, file: null }));
          } else if (room.main_image) {
              processedImages = [{ url: room.main_image, isPrimary: true, file: null }];
          }
            
          if (processedImages.length && !processedImages.some(i => i.isPrimary)) processedImages[0].isPrimary = true;

          setFormData({
              title: room.title || '', hotelId: room.hotel_id || '', price: room.base_price_per_night || '',
              description: room.description || '', roomType: room.room_type || 'Standard',
              viewType: room.view_type || 'City View', maxAdults: room.max_adults || 2, maxChildren: room.max_children || 0,
              sizeSqm: room.size_sqm || '', bedType: room.bed_type || '', totalQuantity: room.total_quantity || 1, 
              hasBreakfast: !!room.has_breakfast, isRefundable: !!room.is_refundable, smokingAllowed: !!room.smoking_allowed,
              roomAmenities: room.room_amenities || [], customFeatures: room.custom_features || '',
              bathroomType: room.bathroom_type || 'Private En-suite', bathroomAmenities: room.bathroom_amenities || [],
              images: processedImages
          });
      } else {
          setFormData({
              title: '', hotelId: (selectedHotelFilter !== 'all' ? selectedHotelFilter : ''), 
              price: '', description: '', roomType: 'Standard', viewType: 'City View', maxAdults: 2, maxChildren: 0, 
              sizeSqm: '', bedType: '', totalQuantity: 1, 
              hasBreakfast: false, isRefundable: true, smokingAllowed: false,
              roomAmenities: [], customFeatures: '',
              bathroomType: 'Private En-suite', bathroomAmenities: [],
              images: []
          });
      }
      setView('form');
  };

  // --- AMENITY TOGGLES ---
  const toggleRoomAmenity = (item) => {
      setFormData(prev => ({
          ...prev,
          roomAmenities: prev.roomAmenities.includes(item) 
              ? prev.roomAmenities.filter(i => i !== item) 
              : [...prev.roomAmenities, item]
      }));
  };

  const toggleBathroomAmenity = (item) => {
      setFormData(prev => ({
          ...prev,
          bathroomAmenities: prev.bathroomAmenities.includes(item) 
              ? prev.bathroomAmenities.filter(i => i !== item) 
              : [...prev.bathroomAmenities, item]
      }));
  };

  // --- UNIFIED IMAGE MANAGEMENT LOGIC ---
  const handleFileSelect = (e) => {
      const files = Array.from(e.target.files);
      const newImages = files.map(file => ({
          url: URL.createObjectURL(file), // Local Preview URL
          file: file,
          isPrimary: false
      }));

      setFormData(prev => {
          const updated = [...prev.images, ...newImages];
          if (updated.length > 0 && !updated.some(i => i.isPrimary)) updated[0].isPrimary = true;
          return { ...prev, images: updated };
      });
      e.target.value = null; // Reset input
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

  // --- SUBMIT LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const localImages = formData.images.filter(img => img.file);
        const existingImages = formData.images.filter(img => !img.file);
        let uploadedImagesArray = [];

        // 1. Upload Local Files
        if (localImages.length > 0) {
            const uploadData = new FormData();
            localImages.forEach(img => { uploadData.append('images', img.file); });

            const uploadRes = await api.post('/upload/bulk', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            uploadedImagesArray = uploadRes.data.images.map((backendImg, index) => ({
                url: backendImg.url,
                isPrimary: localImages[index].isPrimary 
            }));
        }

        // 2. Assemble Final Images Array
        const finalImages = [
            ...existingImages.map(img => ({ url: img.url, isPrimary: img.isPrimary })),
            ...uploadedImagesArray
        ];

        if (finalImages.length > 0 && !finalImages.some(img => img.isPrimary)) {
            finalImages[0].isPrimary = true;
        }

        // 3. Assemble Room Payload
        const payload = {
            hotel_id: formData.hotelId, title: formData.title, room_type: formData.roomType, description: formData.description,
            base_price_per_night: Number(formData.price), max_adults: Number(formData.maxAdults), max_children: Number(formData.maxChildren),
            size_sqm: formData.sizeSqm ? Number(formData.sizeSqm) : null, view_type: formData.viewType, bed_type: formData.bedType, 
            total_quantity: Number(formData.totalQuantity),
            has_breakfast: formData.hasBreakfast ? 1 : 0, is_refundable: formData.isRefundable ? 1 : 0, smoking_allowed: formData.smokingAllowed ? 1 : 0,
            
            // New Extended Features
            custom_features: formData.customFeatures,
            bathroom_type: formData.bathroomType,
            room_amenities: formData.roomAmenities,
            bathroom_amenities: formData.bathroomAmenities,

            images: finalImages, 
        };

        if (editingRoom) await api.put(`/rooms/${editingRoom.id}`, payload);
        else await api.post('/rooms', payload);
        
        await fetchRooms(); 
        setView('list');
    } catch (err) { 
        alert("Error: " + (err.response?.data?.message || err.message)); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Delete this room?")) return;
      try { 
          await api.delete(`/rooms/${id}`); 
          const updated = rooms.filter(r => r.id !== id);
          setRooms(updated); setFilteredRooms(updated);
      } catch (err) { alert("Failed to delete."); }
  };

  const handleToggleStatus = async (room) => {
      const newStatus = !room.is_active;
      const confirmMsg = newStatus 
        ? "Activate this room type? It will be visible to guests." 
        : "Deactivate this room type? It will be hidden from guests.";
        
      if (!window.confirm(confirmMsg)) return;

      try {
          const updateList = (list) => list.map(r => r.id === room.id ? { ...r, is_active: newStatus } : r);
          setRooms(prev => updateList(prev));
          setFilteredRooms(prev => updateList(prev));
          await api.put(`/rooms/${room.id}`, { is_active: newStatus });
      } catch (err) {
          alert("Failed to update status.");
          await fetchRooms(); 
      }
  };

  return (
    <div className="rooms-dashboard-wrapper">
      <AnimatePresence mode="wait">
        {/* --- LIST VIEW --- */}
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="dashboard-header">
                <div>
                    <h1 className="page-title">Room Inventory</h1>
                    <p className="page-subtitle">Manage availability and pricing</p>
                </div>
                <div className="header-actions">
                    <select className="header-select" value={selectedHotelFilter} onChange={(e) => setSelectedHotelFilter(e.target.value)}>
                        <option value="all">All Properties</option>
                        {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                    <div className="search-bar">
                        <Search size={16} className="search-icon"/>
                        <input placeholder="Search rooms..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    </div>
                    <button className="btn-primary-compact" onClick={() => handleSwitchToForm()}>
                        <Plus size={16} /> <span>Add Room</span>
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th style={{width: '35%'}}>Room Detail</th>
                            <th>Specs</th>
                            <th>Pricing</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan="6" className="empty-state-cell"><Loader2 className="animate-spin" style={{margin:'0 auto'}}/></td></tr> 
                    ) : filteredRooms.length > 0 ? filteredRooms.map(room => (
                        <tr key={room.id} style={{ opacity: room.is_active ? 1 : 0.6 }}>
                            <td>
                                <div className="room-cell-main">
                                    <div className="room-thumbnail">
                                        {room.main_image ? <img src={room.main_image} alt=""/> : <BedDouble size={20} className="placeholder-icon"/>}
                                    </div>
                                    <div className="room-meta">
                                        <span className="room-title">{room.title}</span>
                                        <span className="room-type-badge">{room.room_type}</span>
                                        <div className="sub-meta" style={{display:'flex', gap:'5px', marginTop:'4px'}}>
                                            {room.view_type && <span style={{fontSize:'0.7rem', color:'#64748b'}}>{room.view_type}</span>}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="specs-stack">
                                    <span><Users size={12}/> {room.max_adults}Ad, {room.max_children}Ch</span>
                                    <span><Maximize size={12}/> {room.size_sqm || '-'} m²</span>
                                </div>
                            </td>
                            <td><div className="price-tag">${room.base_price_per_night}</div></td>
                            <td><div className={`stock-indicator ${room.total_quantity > 0 ? 'good' : 'low'}`}>{room.total_quantity} Units</div></td>
                            <td>
                                <span className={`status-badge ${room.is_active ? 'active' : 'inactive'}`} 
                                      style={{
                                          padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                                          backgroundColor: room.is_active ? '#dcfce7' : '#f1f5f9',
                                          color: room.is_active ? '#166534' : '#64748b',
                                          border: `1px solid ${room.is_active ? '#bbf7d0' : '#e2e8f0'}`
                                      }}>
                                    {room.is_active ? 'Active' : 'Hidden'}
                                </span>
                            </td>
                            <td className="text-right">
                                <div className="action-row">
                                    <button 
                                        className="icon-btn" 
                                        onClick={() => handleToggleStatus(room)}
                                        title={room.is_active ? "Hide Room" : "Activate Room"}
                                        style={{ color: room.is_active ? '#22c55e' : '#cbd5e1', borderColor: room.is_active ? '#22c55e' : '#e2e8f0' }}
                                    ><Power size={16}/></button>
                                    <button className="icon-btn" onClick={() => handleSwitchToForm(room)}><Edit2 size={16}/></button>
                                    <button className="icon-btn delete" onClick={() => handleDelete(room.id)}><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan="6" className="empty-state-cell">No rooms found.</td></tr>
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
                <div className="form-header">
                    <div>
                        <h2>{editingRoom ? 'Edit Room' : 'Add Room'}</h2>
                        <p>Configure details, pricing, and images for this unit.</p>
                    </div>
                    <button type="button" className="btn-close" onClick={() => setView('list')}><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="professional-form">
                    
                    {/* ALLOCATION & DETAILS */}
                    <div className="form-section">
                        <h4 className="section-heading"><Building size={18}/> Allocation & Core Details</h4>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label>Property <span className="req">*</span></label>
                                <select className="form-input" value={formData.hotelId} onChange={e=>setFormData({...formData, hotelId:e.target.value})} required disabled={!!editingRoom}>
                                    <option value="">-- Choose Hotel --</option>
                                    {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Room Title <span className="req">*</span></label>
                                <input type="text" className="form-input" placeholder="e.g. Deluxe Ocean Suite" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} required/>
                            </div>
                            <div className="form-group">
                                <label>Room Type</label>
                                <select className="form-input" value={formData.roomType} onChange={e=>setFormData({...formData, roomType:e.target.value})}>
                                    <option>Standard</option><option>Deluxe</option><option>Suite</option><option>Villa</option><option>Family Room</option><option>Studio</option><option>Penthouse</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Room View</label>
                                <select className="form-input" value={formData.viewType} onChange={e=>setFormData({...formData, viewType:e.target.value})}>
                                    <option>City View</option><option>Ocean View</option><option>Garden View</option><option>Mountain View</option><option>Pool View</option><option>No Specific View</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SPECS, OCCUPANCY & PRICING */}
                    <div className="form-section">
                        <h4 className="section-heading"><Users size={18}/> Specs, Occupancy & Pricing</h4>
                        <div className="form-grid-3">
                            <div className="form-group"><label>Adults</label><input type="number" className="form-input" value={formData.maxAdults} onChange={e=>setFormData({...formData, maxAdults:e.target.value})}/></div>
                            <div className="form-group"><label>Children</label><input type="number" className="form-input" value={formData.maxChildren} onChange={e=>setFormData({...formData, maxChildren:e.target.value})}/></div>
                            <div className="form-group"><label>Size (m²)</label><input type="number" className="form-input" value={formData.sizeSqm} onChange={e=>setFormData({...formData, sizeSqm:e.target.value})}/></div>
                            
                            <div className="form-group"><label>Bed Type</label><input type="text" className="form-input" placeholder="e.g. 1 King, 2 Twins" value={formData.bedType} onChange={e=>setFormData({...formData, bedType:e.target.value})}/></div>
                            <div className="form-group"><label>Total Stock <span className="req">*</span></label><input type="number" className="form-input" required value={formData.totalQuantity} onChange={e=>setFormData({...formData, totalQuantity:e.target.value})}/></div>
                            <div className="form-group"><label>Price ($) <span className="req">*</span></label><input type="number" className="form-input" required value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/></div>
                        </div>

                        <div className="amenity-checkboxes" style={{marginTop: '16px'}}>
                            <label className="checkbox-item"><input type="checkbox" checked={formData.hasBreakfast} onChange={e=>setFormData({...formData, hasBreakfast:e.target.checked})}/> <span className="cb-label"><Coffee size={14}/> Breakfast Included</span></label>
                            <label className="checkbox-item"><input type="checkbox" checked={formData.isRefundable} onChange={e=>setFormData({...formData, isRefundable:e.target.checked})}/> <span className="cb-label"><RefreshCw size={14}/> Refundable</span></label>
                            <label className="checkbox-item"><input type="checkbox" checked={formData.smokingAllowed} onChange={e=>setFormData({...formData, smokingAllowed:e.target.checked})}/> <span className="cb-label"><Cigarette size={14}/> Smoking Allowed</span></label>
                        </div>
                    </div>

                    {/* NEW: FEATURES & AMENITIES */}
                    <div className="form-section">
                        <h4 className="section-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BedDouble size={18}/> Inside the Room</h4>
                        <p className="sub-text" style={{margin: '0 0 12px 0', fontSize: '0.85rem'}}>Select all features available in this specific room.</p>
                        
                        <div className="pill-grid" style={{marginBottom: '16px'}}>
                            {['Air Conditioning', 'Flat-screen TV', 'Balcony', 'Minibar', 'Coffee Maker', 'Work Desk', 'Safe', 'Seating Area', 'Kitchenette'].map(item => (
                                <label key={item} className={`checkbox-pill ${formData.roomAmenities.includes(item) ? 'active' : ''}`} style={{padding: '8px 14px', fontSize: '0.85rem'}}>
                                    <input type="checkbox" hidden checked={formData.roomAmenities.includes(item)} onChange={() => toggleRoomAmenity(item)}/>
                                    {formData.roomAmenities.includes(item) && <CheckCircle2 size={14} />}
                                    {item}
                                </label>
                            ))}
                        </div>
                        
                        <div className="form-group" style={{marginBottom: '24px'}}>
                            <label>Other Custom Room Features</label>
                            <input type="text" className="form-input" placeholder="e.g. Private plunge pool, Soundproofing..." value={formData.customFeatures} onChange={e=>setFormData({...formData, customFeatures: e.target.value})} />
                        </div>

                        <h4 className="section-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}><Bath size={18}/> Bathroom Setup</h4>
                        
                        <div className="form-group" style={{maxWidth: '300px', marginBottom: '16px'}}>
                            <label>Bathroom Type</label>
                            <select value={formData.bathroomType} onChange={e=>setFormData({...formData, bathroomType: e.target.value})} className="form-input">
                                <option>Private En-suite</option><option>Shared Bathroom</option>
                            </select>
                        </div>

                        <div className="pill-grid" style={{marginBottom: '10px'}}>
                            {['Free Toiletries', 'Hairdryer', 'Bathtub', 'Walk-in Shower', 'Towels', 'Bathrobe', 'Slippers', 'Bidet'].map(item => (
                                <label key={item} className={`checkbox-pill ${formData.bathroomAmenities.includes(item) ? 'active' : ''}`} style={{padding: '8px 14px', fontSize: '0.85rem'}}>
                                    <input type="checkbox" hidden checked={formData.bathroomAmenities.includes(item)} onChange={() => toggleBathroomAmenity(item)}/>
                                    {formData.bathroomAmenities.includes(item) && <CheckCircle2 size={14} />}
                                    {item}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* IMAGE GALLERY */}
                    <div className="form-section">
                        <h4 className="section-heading"><ImageIcon size={18}/> Image Gallery</h4>
                        <div className="core-info-grid">
                            <div className="image-preview-wrapper" style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Room Images <span className="req">*</span></label>
                                
                                <div className="upload-dropzone">
                                    <input type="file" multiple accept="image/*" onChange={handleFileSelect} />
                                    <div className="dropzone-content">
                                        <UploadCloud size={28} color="#3b82f6" />
                                        <span>Click here to select images from your computer</span>
                                    </div>
                                </div>

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

                                {formData.images.length > 0 && (
                                    <div className="image-grid-manager">
                                        {formData.images.map((img, i) => (
                                            <div key={i} className={`image-preview-card ${img.isPrimary ? 'is-primary' : ''}`}>
                                                <img src={img.url} alt={`Room Preview ${i}`} />
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

                    {/* DESCRIPTION */}
                    <div className="form-section no-border">
                        <div className="form-group full-width">
                            <label>Detailed Room Description</label>
                            <SimpleEditor value={formData.description} onChange={(val) => setFormData({...formData, description: val})}/>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-ghost" onClick={() => setView('list')}>Cancel</button>
                        <button type="submit" className="btn-primary-compact" disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : 'Save Room'}</button>
                    </div>
                </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardRooms;