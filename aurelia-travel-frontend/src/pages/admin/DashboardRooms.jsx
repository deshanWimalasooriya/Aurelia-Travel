import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Image as ImageIcon, Loader2, 
  Search, X, Users, Building, Maximize, 
  BedDouble, Mountain, Bold, Italic, Underline, List, 
  ListOrdered, Coffee, Cigarette, RefreshCw, MinusCircle, Star,
  Power // ✅ Imported Power Icon
} from 'lucide-react';
import './styles/dashboard-rooms.css';

// --- Sub-Component: Rich Text Editor ---
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

  // Form Data (Includes viewType and bedType)
  const [formData, setFormData] = useState({
    title: '', hotelId: '', price: '', description: '', roomType: 'Standard',
    maxAdults: 2, maxChildren: 0, sizeSqm: '', 
    viewType: '', bedType: '', 
    totalQuantity: 1, 
    images: [], // Array of {url, isPrimary}
    hasBreakfast: false, isRefundable: true, smokingAllowed: false
  });

  // --- Initial Fetch ---
  useEffect(() => {
    const fetchHotels = async () => {
        try {
            const res = await api.get('/hotels/mine');
            setHotels(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch (err) { console.error(err); }
    };
    fetchHotels();
  }, []);

  // --- Fetch Rooms ---
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

  // --- Handlers ---
  const handleSwitchToForm = (room = null) => {
      setEditingRoom(room);
      if (room) {
          // Map backend data
          const processedImages = (room.images_meta && room.images_meta.length > 0)
            ? room.images_meta.map(img => ({ url: img.url, isPrimary: img.isPrimary }))
            : (room.images && room.images.length > 0
                ? room.images.map(url => ({ url, isPrimary: url === room.main_image }))
                : [{ url: room.main_image || '', isPrimary: true }]);
            
          if (processedImages.length && !processedImages.some(i => i.isPrimary)) processedImages[0].isPrimary = true;

          setFormData({
              title: room.title || '',
              hotelId: room.hotel_id || '',
              price: room.base_price_per_night || '',
              description: room.description || '',
              roomType: room.room_type || 'Standard',
              maxAdults: room.max_adults || 2,
              maxChildren: room.max_children || 0,
              sizeSqm: room.size_sqm || '',
              viewType: room.view_type || '', 
              bedType: room.bed_type || '',   
              totalQuantity: room.total_quantity || 1,
              images: processedImages, 
              hasBreakfast: !!room.has_breakfast,
              isRefundable: !!room.is_refundable,
              smokingAllowed: !!room.smoking_allowed
          });
      } else {
          // Defaults for new room
          setFormData({
              title: '', 
              hotelId: (selectedHotelFilter !== 'all' ? selectedHotelFilter : ''), 
              price: '', description: '', roomType: 'Standard',
              maxAdults: 2, maxChildren: 0, sizeSqm: '', 
              viewType: '', bedType: '', 
              totalQuantity: 1, 
              images: [{ url: '', isPrimary: true }], 
              hasBreakfast: false, isRefundable: true, smokingAllowed: false
          });
      }
      setView('form');
  };

  // Multiple Image Handlers
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const validImages = formData.images.filter(img => img.url.trim() !== '');

    const payload = {
        hotel_id: formData.hotelId,
        title: formData.title,
        room_type: formData.roomType,
        description: formData.description,
        base_price_per_night: Number(formData.price),
        max_adults: Number(formData.maxAdults),
        max_children: Number(formData.maxChildren),
        size_sqm: formData.sizeSqm ? Number(formData.sizeSqm) : null,
        view_type: formData.viewType, 
        bed_type: formData.bedType,   
        total_quantity: Number(formData.totalQuantity),
        has_breakfast: formData.hasBreakfast ? 1 : 0,
        is_refundable: formData.isRefundable ? 1 : 0,
        smoking_allowed: formData.smokingAllowed ? 1 : 0,
        images: validImages, 
    };

    try {
        if (editingRoom) {
            await api.put(`/rooms/${editingRoom.id}`, payload);
        } else {
            await api.post('/rooms', payload);
        }
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
          setRooms(updated);
          setFilteredRooms(updated);
      } catch (err) { alert("Failed to delete."); }
  };

  // ✅ NEW: Toggle Active Status Logic
  const handleToggleStatus = async (room) => {
      const newStatus = !room.is_active;
      const confirmMsg = newStatus 
        ? "Activate this room type? It will be visible to guests." 
        : "Deactivate this room type? It will be hidden from guests.";
        
      if (!window.confirm(confirmMsg)) return;

      try {
          // Optimistic UI Update
          const updateList = (list) => list.map(r => r.id === room.id ? { ...r, is_active: newStatus } : r);
          setRooms(prev => updateList(prev));
          setFilteredRooms(prev => updateList(prev));

          // API Call
          await api.put(`/rooms/${room.id}`, { is_active: newStatus });
      } catch (err) {
          console.error("Status toggle failed", err);
          alert("Failed to update status.");
          await fetchRooms(); // Revert on failure
      }
  };

  return (
    <div className="rooms-dashboard-wrapper">
      <AnimatePresence mode="wait">
        
        {/* --- LIST VIEW --- */}
        {view === 'list' && (
          <motion.div key="list" className="dashboard-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
                        <Plus size={16} strokeWidth={2.5} /> <span>Add Room</span>
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
                            <th>Status</th> {/* ✅ New Header */}
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan="6" className="text-center p-8"><Loader2 className="animate-spin mx-auto"/></td></tr> 
                    ) : filteredRooms.length > 0 ? filteredRooms.map(room => (
                        <tr key={room.id} style={{ opacity: room.is_active ? 1 : 0.6 }}> {/* ✅ Opacity style */}
                            <td>
                                <div className="room-cell-main">
                                    <div className="room-thumbnail">
                                        {room.main_image ? <img src={room.main_image} alt=""/> : <BedDouble size={20} className="placeholder-icon"/>}
                                    </div>
                                    <div className="room-meta">
                                        <span className="room-title">{room.title}</span>
                                        <span className="room-type-badge">{room.room_type}</span>
                                        <div className="sub-meta">
                                            {room.view_type && <span className="meta-tag">{room.view_type}</span>}
                                            {room.bed_type && <span className="meta-tag">{room.bed_type}</span>}
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
                            
                            {/* ✅ Status Column */}
                            <td>
                                <span className={`status-badge ${room.is_active ? 'active' : 'inactive'}`} 
                                      style={{
                                          padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                          backgroundColor: room.is_active ? '#dcfce7' : '#f1f5f9',
                                          color: room.is_active ? '#166534' : '#64748b',
                                          border: `1px solid ${room.is_active ? '#bbf7d0' : '#e2e8f0'}`
                                      }}>
                                    {room.is_active ? 'Active' : 'Hidden'}
                                </span>
                            </td>

                            <td className="text-right">
                                <div className="action-row">
                                    {/* ✅ Power Button */}
                                    <button 
                                        className="icon-btn" 
                                        onClick={() => handleToggleStatus(room)}
                                        title={room.is_active ? "Hide Room" : "Activate Room"}
                                        style={{ 
                                            color: room.is_active ? '#22c55e' : '#cbd5e1', 
                                            borderColor: room.is_active ? '#22c55e' : '#e2e8f0' 
                                        }}
                                    >
                                        <Power size={16}/>
                                    </button>

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
        
        {/* --- FORM VIEW (UNCHANGED) --- */}
        {view === 'form' && (
          <motion.div key="form" className="form-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="form-card">
                <div className="form-header">
                    <h2>{editingRoom ? 'Edit Room' : 'Add Room'}</h2>
                    <button type="button" className="btn-close" onClick={() => setView('list')}><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="professional-form">
                    
                    {/* Basics */}
                    <div className="form-section">
                        <h4 className="section-heading"><Building size={18}/> Allocation & Details</h4>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label>Property <span className="req">*</span></label>
                                <select className="form-input" value={formData.hotelId} onChange={e=>setFormData({...formData, hotelId:e.target.value})} required disabled={!!editingRoom}>
                                    <option value="">-- Choose Hotel --</option>
                                    {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Title <span className="req">*</span></label>
                                <input type="text" className="form-input" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} required/>
                            </div>
                        </div>
                    </div>

                    {/* Multiple Images Section */}
                    <div className="form-section">
                        <h4 className="section-heading"><ImageIcon size={18}/> Image Gallery (Star = Primary)</h4>
                        <div className="images-grid">
                            <div className="image-inputs-col">
                                {formData.images.map((img, index) => (
                                    <div key={index} className="image-input-row" style={{display:'flex', gap:'8px', alignItems:'center', marginBottom:'8px'}}>
                                        <button 
                                            type="button" 
                                            onClick={() => setPrimaryImage(index)} 
                                            className={`icon-btn small ${img.isPrimary ? 'active-star' : ''}`} 
                                            style={{color: img.isPrimary ? '#f59e0b' : '#cbd5e1', border: img.isPrimary ? '1px solid #f59e0b' : '1px solid #e2e8f0'}}
                                        >
                                            <Star size={16} fill={img.isPrimary ? '#f59e0b' : 'none'}/>
                                        </button>
                                        <input className="form-input" placeholder={`Image URL ${index + 1}`} value={img.url} onChange={(e) => handleImageChange(index, e.target.value)}/>
                                        {formData.images.length > 1 && (
                                            <button type="button" className="btn-icon delete" onClick={() => removeImageField(index)} title="Remove"><MinusCircle size={16}/></button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className="btn-ghost small" onClick={addImageField}>+ Add Another Image</button>
                            </div>
                            <div className="image-preview-box">
                                {formData.images.find(i=>i.isPrimary && i.url) ? <img src={formData.images.find(i=>i.isPrimary).url} alt="Preview" onError={(e) => e.target.style.display='none'}/> : <div className="preview-placeholder"><ImageIcon size={32}/><span>Primary Image</span></div>}
                            </div>
                        </div>
                    </div>

                    {/* Specs & Pricing */}
                    <div className="form-section">
                        <h4 className="section-heading"><Users size={18}/> Specs, Occupancy & Pricing</h4>
                        <div className="form-grid-3">
                            <div className="form-group"><label>Adults</label><input type="number" className="form-input" value={formData.maxAdults} onChange={e=>setFormData({...formData, maxAdults:e.target.value})}/></div>
                            <div className="form-group"><label>Children</label><input type="number" className="form-input" value={formData.maxChildren} onChange={e=>setFormData({...formData, maxChildren:e.target.value})}/></div>
                            <div className="form-group"><label>Size (m²)</label><input type="number" className="form-input" value={formData.sizeSqm} onChange={e=>setFormData({...formData, sizeSqm:e.target.value})}/></div>
                            
                            <div className="form-group"><label>Bed Type</label><input type="text" className="form-input" placeholder="e.g. King, Twin" value={formData.bedType} onChange={e=>setFormData({...formData, bedType:e.target.value})}/></div>
                            <div className="form-group"><label>View Type</label><input type="text" className="form-input" placeholder="e.g. Ocean, City" value={formData.viewType} onChange={e=>setFormData({...formData, viewType:e.target.value})}/></div>
                            
                            <div className="form-group"><label>Total Stock</label><input type="number" className="form-input" required value={formData.totalQuantity} onChange={e=>setFormData({...formData, totalQuantity:e.target.value})}/></div>
                            <div className="form-group"><label>Price ($)</label><input type="number" className="form-input" required value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/></div>
                            <div className="form-group">
                                <label>Room Type</label>
                                <select className="form-input" value={formData.roomType} onChange={e=>setFormData({...formData, roomType:e.target.value})}>
                                    <option>Standard</option><option>Deluxe</option><option>Suite</option><option>Family</option>
                                </select>
                            </div>
                        </div>

                        <div className="amenity-checkboxes">
                            <label className="checkbox-item"><input type="checkbox" checked={formData.hasBreakfast} onChange={e=>setFormData({...formData, hasBreakfast:e.target.checked})}/> <Coffee size={14}/> Breakfast</label>
                            <label className="checkbox-item"><input type="checkbox" checked={formData.isRefundable} onChange={e=>setFormData({...formData, isRefundable:e.target.checked})}/> <RefreshCw size={14}/> Refundable</label>
                            <label className="checkbox-item"><input type="checkbox" checked={formData.smokingAllowed} onChange={e=>setFormData({...formData, smokingAllowed:e.target.checked})}/> <Cigarette size={14}/> Smoking</label>
                        </div>
                    </div>

                    <div className="form-section no-border">
                        <div className="form-group full-width">
                            <label>Description</label>
                            <SimpleEditor value={formData.description} onChange={(val) => setFormData({...formData, description: val})}/>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-ghost" onClick={() => setView('list')}>Cancel</button>
                        <button type="submit" className="btn-primary-compact submit" disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : 'Save Room'}</button>
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