import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit3, Trash2, Loader2, BedDouble, Search, 
  DollarSign, Users, Building2, FileText, X, CheckCircle 
} from 'lucide-react';
import './styles/dashboard-rooms.css';

const DashboardRooms = () => {
  const [view, setView] = useState('list');
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedHotelFilter, setSelectedHotelFilter] = useState('all');

  // Form State
  const [roomData, setRoomData] = useState({
    title: '', price: '', maxPeople: '', desc: '', hotelId: '', totalQuantity: ''
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
      let url = filterId === 'all' ? '/rooms/mine' : `/rooms/hotel/${filterId}`;
      const res = await api.get(url);
      setRooms(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err) { setRooms([]); } 
    finally { setLoading(false); }
  };

  const handleSwitchToForm = (room = null) => {
      setEditingRoom(room);
      setRoomData({
          title: room?.title || '',
          price: room?.base_price_per_night || room?.price_per_night || '',
          maxPeople: room?.capacity || '',
          desc: room?.description || '',
          hotelId: room?.hotel_id || (selectedHotelFilter !== 'all' ? selectedHotelFilter : ''),
          totalQuantity: room?.total_quantity || 1
      });
      setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
        title: roomData.title,
        base_price_per_night: Number(roomData.price),
        capacity: Number(roomData.maxPeople),
        description: roomData.desc,
        hotel_id: roomData.hotelId, 
        total_quantity: Number(roomData.totalQuantity),
        room_type: 'Standard'
    };

    try {
        if (editingRoom) await api.put(`/rooms/${editingRoom.id}`, payload);
        else await api.post('/rooms', payload);
        await fetchRooms(selectedHotelFilter); setView('list');
    } catch (err) { alert("Error: " + (err.response?.data?.message || err.message)); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Delete this room type? This will prevent future bookings.")) return;
      try { await api.delete(`/rooms/${id}`); setRooms(prev => prev.filter(r => r.id !== id)); } 
      catch (err) { console.error(err); }
  };
  
  return (
    <div className="rooms-page">
      <AnimatePresence mode="wait">
        
        {/* --- LIST VIEW --- */}
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            
            <div className="table-header-action table-card">
                <div>
                    <h1 style={{fontSize: '1.8rem', fontWeight: 800, margin:0, color:'#0f172a', letterSpacing:'-0.5px'}}>Room Inventory</h1>
                    <p style={{color: '#64748b', margin:'6px 0 0', fontSize:'0.95rem'}}>Manage room types, pricing, and availability.</p>
                </div>
                
                <div style={{display:'flex', gap:'15px', alignItems:'center', flexWrap:'wrap'}}>
                    <div style={{position:'relative'}}>
                        <Search size={16} style={{position:'absolute', left:14, top:13, color:'#94a3b8'}}/>
                        <select 
                            className="form-input" 
                            style={{width: '220px', paddingLeft:'38px', borderColor:'#e2e8f0', height:'42px'}}
                            value={selectedHotelFilter}
                            onChange={(e) => setSelectedHotelFilter(e.target.value)}
                        >
                            <option value="all">All Properties</option>
                            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                    </div>

                    <button className="btn-primary" style={{padding:'10px 20px', fontSize:'0.9rem'}} onClick={() => handleSwitchToForm()}>
                        <Plus size={18} strokeWidth={3} /> Add Room
                    </button>
                </div>
            </div>

            <div className="table-card" style={{padding:0, overflow:'hidden'}}>
                <table className="dashboard-table">
                <thead>
                    <tr>
                        <th style={{paddingLeft:'30px'}}>Room Type</th>
                        <th>Property</th>
                        <th>Base Price</th>
                        <th>Status</th>
                        <th style={{textAlign:'right', paddingRight:'30px'}}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                       <tr><td colSpan="5" className="text-center p-8">Loading Inventory...</td></tr> 
                    ) : rooms.length > 0 ? rooms.map(room => (
                    <tr key={room.id}>
                        <td style={{paddingLeft:'30px'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
                                <div className="table-img" style={{background:'#f1f5f9', color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'10px'}}>
                                    <BedDouble size={24}/>
                                </div>
                                <div>
                                    <div style={{fontWeight: 700, fontSize:'1rem', color:'#0f172a'}}>{room.title}</div>
                                    <div style={{fontSize:'0.85rem', color:'#64748b', display:'flex', alignItems:'center', gap:'4px', marginTop:'2px'}}>
                                        <Users size={12}/> Max {room.capacity} Guests
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td style={{color:'#64748b', fontWeight:500}}>{room.hotel_name || hotels.find(h => h.id === room.hotel_id)?.name || 'Unknown'}</td>
                        <td>
                            <div style={{fontWeight:700, color:'#0f172a', fontSize:'1rem'}}>${room.base_price_per_night || room.price_per_night}</div>
                            <div style={{fontSize:'0.75rem', color:'#94a3b8'}}>per night</div>
                        </td>
                        <td>
                            <span style={{
                                background: room.total_quantity > 0 ? '#dcfce7' : '#fee2e2', 
                                color: room.total_quantity > 0 ? '#166534' : '#991b1b',
                                padding: '6px 12px', borderRadius:'20px', fontWeight:700, fontSize:'0.8rem'
                            }}>
                                {room.total_quantity} Available
                            </span>
                        </td>
                        <td style={{textAlign:'right', paddingRight:'30px'}}>
                            <div className="action-buttons" style={{justifyContent:'flex-end'}}>
                                <button className="btn-icon" onClick={() => handleSwitchToForm(room)} title="Edit Room"><Edit3 size={18} /></button>
                                <button className="btn-icon danger" onClick={() => handleDelete(room.id)} title="Delete Room"><Trash2 size={18} /></button>
                            </div>
                        </td>
                    </tr>
                    )) : (
                        <tr>
                            <td colSpan="5" style={{padding:'60px', textAlign:'center'}}>
                                <div style={{background:'#f8fafc', width:'80px', height:'80px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px'}}>
                                    <BedDouble size={40} color="#cbd5e1"/>
                                </div>
                                <h3 style={{color:'#0f172a', margin:0}}>No Rooms Added</h3>
                                <p style={{color:'#64748b', margin:'10px 0 20px'}}>Start selling by adding room types to your properties.</p>
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
                  <div>
                    <h2 style={{fontSize:'1.5rem', color:'#0f172a'}}>{editingRoom ? 'Edit Room Type' : 'Add New Room'}</h2>
                    <p style={{margin:0, color:'#64748b'}}>Set pricing and allocation for your guests</p>
                  </div>
                  <button 
                      type="button" 
                      onClick={() => setView('list')}
                      style={{background:'transparent', border:'none', cursor:'pointer', color:'#94a3b8', padding:'8px'}}
                  >
                      <X size={24} />
                  </button>
              </div>

              <form onSubmit={handleSubmit}>
                  
                  {/* Section 1: Allocation */}
                  <div className="form-section-title"><Building2 size={20}/> Property Allocation</div>
                  <div className="form-group">
                      <label>Select Property <span style={{color:'red'}}>*</span></label>
                      <div style={{position:'relative'}}>
                        <Building2 size={18} style={{position:'absolute', left:14, top:14, color:'#94a3b8', zIndex:1}}/>
                        <select 
                            className="form-input" 
                            style={{paddingLeft:'42px'}}
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

                  <div className="form-group">
                      <label>Room Title <span style={{color:'red'}}>*</span></label>
                      <input className="form-input" placeholder="e.g. Deluxe Ocean View Suite" required value={roomData.title} onChange={e=>setRoomData({...roomData, title: e.target.value})}/>
                  </div>
                  
                  <hr style={{border:'0', borderTop:'1px solid #f1f5f9', margin:'30px 0'}}/>

                  {/* Section 2: Financials & Capacity */}
                  <div className="form-section-title"><DollarSign size={20}/> Pricing & Inventory</div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px'}}>
                      <div className="form-group">
                          <label>Price / Night</label>
                          <div style={{position:'relative'}}>
                             <span style={{position:'absolute', left:14, top:12, color:'#94a3b8', fontWeight:600}}>$</span>
                             <input type="number" className="form-input" style={{paddingLeft:'30px'}} required value={roomData.price} onChange={e=>setRoomData({...roomData, price: e.target.value})}/>
                          </div>
                      </div>
                      <div className="form-group">
                          <label>Max Capacity</label>
                          <div style={{position:'relative'}}>
                             <Users size={16} style={{position:'absolute', left:14, top:14, color:'#94a3b8'}}/>
                             <input type="number" className="form-input" style={{paddingLeft:'40px'}} required value={roomData.maxPeople} onChange={e=>setRoomData({...roomData, maxPeople: e.target.value})}/>
                          </div>
                      </div>
                      <div className="form-group">
                          <label>Total Units</label>
                          <div style={{position:'relative'}}>
                             <CheckCircle size={16} style={{position:'absolute', left:14, top:14, color:'#94a3b8'}}/>
                             <input type="number" className="form-input" style={{paddingLeft:'40px'}} required value={roomData.totalQuantity} onChange={e=>setRoomData({...roomData, totalQuantity: e.target.value})}/>
                          </div>
                      </div>
                  </div>

                  <div className="form-group" style={{marginTop:'10px'}}>
                      <label>Room Description</label>
                      <div style={{position:'relative'}}>
                        <FileText size={18} style={{position:'absolute', left:14, top:14, color:'#94a3b8'}}/>
                        <textarea 
                            className="form-input" 
                            rows="4" 
                            style={{paddingLeft:'42px', paddingTop:'12px'}}
                            placeholder="Describe amenities, view, bed type..." 
                            value={roomData.desc} 
                            onChange={e=>setRoomData({...roomData, desc: e.target.value})}
                        />
                      </div>
                  </div>
                  
                  {/* Action Footer */}
                  <div style={{display:'flex', justifyContent:'flex-end', gap:'15px', marginTop:'40px', borderTop:'1px solid #f1f5f9', paddingTop:'20px'}}>
                      <button 
                          type="button" 
                          onClick={() => setView('list')}
                          style={{
                              background:'transparent', border:'1px solid #cbd5e1', borderRadius:'8px', 
                              padding:'10px 24px', fontWeight:600, color:'#64748b', cursor:'pointer'
                          }}
                      >
                          Cancel
                      </button>
                      <button 
                          type="submit" 
                          className="btn-primary" 
                          style={{height:'44px', padding:'0 32px'}} 
                          disabled={loading}
                      >
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