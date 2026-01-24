import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit3, Trash2, Loader2, BedDouble, Search, 
  DollarSign, Users, Building2, FileText, X, CheckCircle,
  Maximize, Armchair, Mountain
} from 'lucide-react';
import './styles/dashboard-rooms.css';

const DashboardRooms = () => {
  const [view, setView] = useState('list');
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedHotelFilter, setSelectedHotelFilter] = useState('all');

  // Expanded State based on DB Schema
  const [roomData, setRoomData] = useState({
    title: '', 
    hotelId: '', 
    price: '', 
    description: '', 
    roomType: 'Standard', // DB: room_type
    maxAdults: 2,         // DB: max_adults
    maxChildren: 1,       // DB: max_children
    sizeSqm: '',          // DB: size_sqm
    viewType: '',         // DB: view_type
    bedType: '',          // DB: bed_type
    totalQuantity: 1,     // DB: total_quantity
    mainImage: ''         // DB: main_image
  });
  
  useEffect(() => { fetchHotels(); }, []);
  useEffect(() => { fetchRooms(selectedHotelFilter); }, [selectedHotelFilter]);

  const fetchHotels = async () => {
    try {
      const res = await api.get('/hotels/mine');
      setHotels(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err) { console.error(err); }
  };

  const fetchRooms = async (filterId) => {
    setLoading(true);
    try {
      // Endpoint logic: If 'all', fetch all rooms for this manager
      let url = filterId === 'all' ? '/rooms/mine' : `/rooms/hotel/${filterId}`;
      const res = await api.get(url);
      setRooms(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err) { setRooms([]); } 
    finally { setLoading(false); }
  };

  const handleSwitchToForm = (room = null) => {
      setEditingRoom(room);
      if (room) {
          setRoomData({
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
              mainImage: room.main_image || ''
          });
      } else {
          // Defaults for new room
          setRoomData({
              title: '', 
              hotelId: (selectedHotelFilter !== 'all' ? selectedHotelFilter : ''), 
              price: '', 
              description: '', 
              roomType: 'Standard',
              maxAdults: 2, 
              maxChildren: 0, 
              sizeSqm: '', 
              viewType: '', 
              bedType: '', 
              totalQuantity: 1, 
              mainImage: ''
          });
      }
      setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Payload matching DB columns
    const payload = {
        hotel_id: roomData.hotelId,
        title: roomData.title,
        room_type: roomData.roomType,
        description: roomData.description,
        base_price_per_night: Number(roomData.price),
        max_adults: Number(roomData.maxAdults),
        max_children: Number(roomData.maxChildren),
        capacity: Number(roomData.maxAdults) + Number(roomData.maxChildren), // Auto-calc total capacity
        size_sqm: roomData.sizeSqm ? Number(roomData.sizeSqm) : null,
        view_type: roomData.viewType,
        bed_type: roomData.bedType,
        total_quantity: Number(roomData.totalQuantity),
        main_image: roomData.mainImage,
        // Backend handles inventory generation automatically on Create
    };

    try {
        if (editingRoom) {
            await api.put(`/rooms/${editingRoom.id}`, payload);
        } else {
            // Create requires explicit call to generate inventory
            await api.post('/rooms', payload);
        }
        await fetchRooms(selectedHotelFilter); 
        setView('list');
    } catch (err) { 
        alert("Error: " + (err.response?.data?.message || err.message)); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Delete this room? This will remove all future availability.")) return;
      try { 
          await api.delete(`/rooms/${id}`); 
          setRooms(prev => prev.filter(r => r.id !== id)); 
      } catch (err) { console.error(err); }
  };
  
  return (
    <div className="rooms-page">
      <AnimatePresence mode="wait">
        
        {/* --- LIST VIEW --- */}
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            
            <div className="table-header-action table-card">
                <div className="header-title">
                    <h1>Room Inventory</h1>
                    <p>Manage room types, pricing, and availability.</p>
                </div>
                
                <div className="header-controls">
                    <div className="search-filter-wrapper">
                        <Search size={16} className="search-icon"/>
                        <select 
                            className="form-input filter-select"
                            value={selectedHotelFilter}
                            onChange={(e) => setSelectedHotelFilter(e.target.value)}
                        >
                            <option value="all">All Properties</option>
                            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                    </div>

                    <button className="btn-primary" onClick={() => handleSwitchToForm()}>
                        <Plus size={18} strokeWidth={3} /> Add Room
                    </button>
                </div>
            </div>

            <div className="table-card no-padding">
                <table className="dashboard-table">
                <thead>
                    <tr>
                        <th className="pl-30">Room Type</th>
                        <th>Details</th>
                        <th>Capacity</th>
                        <th>Base Price</th>
                        <th>Stock</th>
                        <th className="text-right pr-30">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                       <tr><td colSpan="6" className="text-center p-8">Loading Inventory...</td></tr> 
                    ) : rooms.length > 0 ? rooms.map(room => (
                    <tr key={room.id}>
                        <td className="pl-30">
                            <div className="room-info-cell">
                                <div className="table-img">
                                    {room.main_image ? <img src={room.main_image} alt=""/> : <BedDouble size={24}/>}
                                </div>
                                <div>
                                    <div className="room-title-text">{room.title}</div>
                                    <div className="room-capacity-text">{room.room_type}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div style={{fontSize:'0.85rem', color:'#64748b'}}>
                                <div>{room.bed_type || 'Standard Bed'}</div>
                                <div>{room.view_type ? `${room.view_type} View` : ''}</div>
                            </div>
                        </td>
                        <td>
                            <div style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'0.9rem', fontWeight:600, color:'#0f172a'}}>
                                <Users size={14} color="#94a3b8"/> {room.max_adults}Ad {room.max_children > 0 && `+ ${room.max_children}Ch`}
                            </div>
                        </td>
                        <td>
                            <div className="price-text">${room.base_price_per_night}</div>
                        </td>
                        <td>
                            <span className={`stock-badge ${room.total_quantity > 0 ? 'stock-ok' : 'stock-low'}`}>
                                {room.total_quantity} Units
                            </span>
                        </td>
                        <td className="text-right pr-30">
                            <div className="action-buttons">
                                <button className="btn-icon" onClick={() => handleSwitchToForm(room)} title="Edit Room"><Edit3 size={18} /></button>
                                <button className="btn-icon danger" onClick={() => handleDelete(room.id)} title="Delete Room"><Trash2 size={18} /></button>
                            </div>
                        </td>
                    </tr>
                    )) : (
                        <tr>
                            <td colSpan="6" className="empty-state">
                                <div className="empty-icon-circle">
                                    <BedDouble size={40} color="#cbd5e1"/>
                                </div>
                                <h3>No Rooms Added</h3>
                                <p>Start selling by adding room types to your properties.</p>
                                <button className="btn-secondary" onClick={() => handleSwitchToForm()}>
                                    <Plus size={18}/> Create First Room
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
                    <h2>{editingRoom ? 'Edit Room Type' : 'Add New Room'}</h2>
                    <p>Set specific details, amenities, and pricing</p>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setView('list')} title="Close">
                      <X size={24} />
                  </button>
              </div>

              <form onSubmit={handleSubmit}>
                  
                  {/* Section 1: Property Link */}
                  <div className="form-section-title"><Building2 size={20}/> Allocation</div>
                  <div className="form-group">
                      <label>Select Property <span className="required-star">*</span></label>
                      <div className="input-icon-wrapper">
                        <Building2 size={18} className="input-icon" style={{zIndex:1}}/>
                        <select 
                            className="form-input pl-42"
                            value={roomData.hotelId} 
                            onChange={e=>setRoomData({...roomData, hotelId: e.target.value})} 
                            required 
                            disabled={!!editingRoom}
                        >
                            <option value="">-- Choose Hotel --</option>
                            {hotels.map(h => (<option key={h.id} value={h.id}>{h.name}</option>))}
                        </select>
                      </div>
                  </div>

                  <div className="form-grid-row">
                      <div className="form-group">
                          <label>Room Title <span className="required-star">*</span></label>
                          <input className="form-input" placeholder="e.g. Deluxe Ocean View Suite" required value={roomData.title} onChange={e=>setRoomData({...roomData, title: e.target.value})}/>
                      </div>
                      <div className="form-group">
                          <label>Room Category</label>
                          <select className="form-input" value={roomData.roomType} onChange={e=>setRoomData({...roomData, roomType: e.target.value})}>
                              <option value="Standard">Standard</option>
                              <option value="Deluxe">Deluxe</option>
                              <option value="Suite">Suite</option>
                              <option value="Family">Family</option>
                              <option value="Penthouse">Penthouse</option>
                          </select>
                      </div>
                  </div>
                  
                  <hr className="form-divider"/>

                  {/* Section 2: Capacity & Specs (DB Specifics) */}
                  <div className="form-section-title"><Users size={20}/> Capacity & Specs</div>
                  <div className="form-grid-3">
                      <div className="form-group">
                          <label>Max Adults</label>
                          <input type="number" className="form-input" required value={roomData.maxAdults} onChange={e=>setRoomData({...roomData, maxAdults: e.target.value})}/>
                      </div>
                      <div className="form-group">
                          <label>Max Children</label>
                          <input type="number" className="form-input" value={roomData.maxChildren} onChange={e=>setRoomData({...roomData, maxChildren: e.target.value})}/>
                      </div>
                      <div className="form-group">
                          <label>Room Size (m²)</label>
                          <div className="input-icon-wrapper">
                             <Maximize size={16} className="input-icon"/>
                             <input type="number" className="form-input pl-40" value={roomData.sizeSqm} onChange={e=>setRoomData({...roomData, sizeSqm: e.target.value})}/>
                          </div>
                      </div>
                  </div>

                  <div className="form-grid-row">
                      <div className="form-group">
                          <label>Bed Configuration</label>
                          <div className="input-icon-wrapper">
                             <Armchair size={16} className="input-icon"/>
                             <input className="form-input pl-40" placeholder="e.g. 1 King or 2 Twin" value={roomData.bedType} onChange={e=>setRoomData({...roomData, bedType: e.target.value})}/>
                          </div>
                      </div>
                      <div className="form-group">
                          <label>View Type</label>
                          <div className="input-icon-wrapper">
                             <Mountain size={16} className="input-icon"/>
                             <input className="form-input pl-40" placeholder="e.g. Ocean, City, Garden" value={roomData.viewType} onChange={e=>setRoomData({...roomData, viewType: e.target.value})}/>
                          </div>
                      </div>
                  </div>

                  <hr className="form-divider"/>

                  {/* Section 3: Financials & Stock */}
                  <div className="form-section-title"><DollarSign size={20}/> Pricing & Inventory</div>
                  <div className="form-grid-row">
                      <div className="form-group">
                          <label>Base Price / Night <span className="required-star">*</span></label>
                          <div className="input-icon-wrapper">
                             <span className="input-symbol">$</span>
                             <input type="number" className="form-input pl-30" required value={roomData.price} onChange={e=>setRoomData({...roomData, price: e.target.value})}/>
                          </div>
                      </div>
                      <div className="form-group">
                          <label>Total Units (Inventory) <span className="required-star">*</span></label>
                          <div className="input-icon-wrapper">
                             <CheckCircle size={16} className="input-icon"/>
                             <input type="number" className="form-input pl-40" required value={roomData.totalQuantity} onChange={e=>setRoomData({...roomData, totalQuantity: e.target.value})}/>
                          </div>
                      </div>
                  </div>

                  <div className="form-group" style={{marginTop:'10px'}}>
                      <label>Room Description</label>
                      <textarea 
                          className="form-input" 
                          rows="3" 
                          placeholder="Describe amenities, decor, and unique features..." 
                          value={roomData.description} 
                          onChange={e=>setRoomData({...roomData, description: e.target.value})}
                      />
                  </div>

                  <div className="form-group">
                      <label>Main Image URL</label>
                      <input className="form-input" placeholder="https://..." value={roomData.mainImage} onChange={e=>setRoomData({...roomData, mainImage: e.target.value})}/>
                  </div>
                  
                  <div className="form-footer">
                      <button type="button" className="btn-secondary" onClick={() => setView('list')}>Cancel</button>
                      <button type="submit" className="btn-primary btn-submit" disabled={loading}>
                          {loading ? <Loader2 className="animate-spin" /> : (editingRoom ? 'Save Changes' : 'Create Room')}
                      </button>
                  </div>

              </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardRooms;