import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, ArrowLeft, Save, Loader2, BedDouble } from 'lucide-react';
import './styles/dashboard.css';

const DashboardRooms = () => {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  const [roomData, setRoomData] = useState({
    title: '', price: '', maxPeople: '', desc: '', hotelId: '', roomNumbers: ''
  });
  
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
        const [roomsRes, hotelsRes] = await Promise.all([
            axios.get('http://localhost:5000/api/rooms'),
            axios.get('http://localhost:5000/api/hotels')
        ]);
        setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : roomsRes.data.data || []);
        setHotels(Array.isArray(hotelsRes.data) ? hotelsRes.data : hotelsRes.data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSwitchToForm = (room = null) => {
      setEditingRoom(room);
      setRoomData({
          title: room?.title || '',
          price: room?.price_per_night || '',
          maxPeople: room?.capacity || room?.max_people || '',
          desc: room?.description || '',
          hotelId: room?.hotel_id || (hotels.length > 0 ? hotels[0].id : ''),
          roomNumbers: ''
      });
      setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
        title: roomData.title,
        price_per_night: Number(roomData.price),
        capacity: Number(roomData.maxPeople),
        description: roomData.desc,
        hotel_id: roomData.hotelId, 
    };

    try {
        // --- FIX: Add { withCredentials: true } ---
        const config = { withCredentials: true };

        if (editingRoom) {
            await axios.put(`http://localhost:5000/api/rooms/${editingRoom.id}`, payload, config);
        } else {
            await axios.post('http://localhost:5000/api/rooms', payload, config);
        }
        fetchData();
        setView('list');
    } catch (err) {
        alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Delete this room type?")) return;
      try {
        // --- FIX: Add { withCredentials: true } ---
        await axios.delete(`http://localhost:5000/api/rooms/${id}`, { withCredentials: true });
        setRooms(prev => prev.filter(r => r.id !== id));
      } catch (err) { console.error(err); }
  };

  // ... (Rest of the render code remains exactly the same) ...
  return (
    <div className="rooms-page">
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
                    <h1 style={{fontSize: '1.5rem', fontWeight: 800}}>Room Types</h1>
                    <p style={{color: '#64748b'}}>Configure rooms and pricing</p>
                </div>
                <button className="btn-primary" onClick={() => handleSwitchToForm()}>
                <Plus size={18} /> Add Room Type
                </button>
            </div>

            <div className="table-card">
                <table className="dashboard-table">
                <thead>
                    <tr>
                    <th>Room Type</th>
                    <th>Parent Hotel</th>
                    <th>Price / Night</th>
                    <th>Capacity</th>
                    <th style={{textAlign: 'right'}}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rooms.map(room => (
                    <tr key={room.id}>
                        <td style={{fontWeight: 700, display:'flex', alignItems:'center', gap:'10px'}}>
                            <div style={{background:'#e0f2fe', padding:'8px', borderRadius:'8px', color:'#0284c7'}}><BedDouble size={18}/></div>
                            {room.title}
                        </td>
                        <td>{hotels.find(h => h.id === room.hotel_id)?.name || 'Unknown Hotel'}</td>
                        <td style={{fontWeight: 600}}>${room.price_per_night}</td>
                        <td>{room.capacity || room.max_people} Guests</td>
                        <td>
                        <div className="action-buttons" style={{justifyContent: 'flex-end'}}>
                            <button className="btn-icon" onClick={() => handleSwitchToForm(room)}><Edit3 size={16} /></button>
                            <button className="btn-icon danger" onClick={() => handleDelete(room.id)}><Trash2 size={16} /></button>
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
                  <h2>{editingRoom ? 'Edit Room' : 'Add New Room'}</h2>
                  <button className="btn-secondary" onClick={() => setView('list')}>
                      <ArrowLeft size={16} style={{marginRight:'5px'}}/> Cancel
                  </button>
              </div>

              <form onSubmit={handleSubmit}>
                  
                  {!editingRoom && (
                      <div className="form-group">
                          <label>Select Hotel</label>
                          <select className="form-input" value={roomData.hotelId} onChange={e=>setRoomData({...roomData, hotelId: e.target.value})} required>
                              {hotels.map(h => (<option key={h.id} value={h.id}>{h.name}</option>))}
                          </select>
                      </div>
                  )}

                  <div className="form-group">
                      <label>Room Title</label>
                      <input className="form-input" required value={roomData.title} onChange={e=>setRoomData({...roomData, title: e.target.value})} placeholder="e.g. Ocean View Suite"/>
                  </div>
                  
                  <div className="form-grid-row">
                      <div className="form-group">
                          <label>Price Per Night ($)</label>
                          <input type="number" className="form-input" required value={roomData.price} onChange={e=>setRoomData({...roomData, price: e.target.value})}/>
                      </div>
                      <div className="form-group">
                          <label>Max Capacity (Guests)</label>
                          <input type="number" className="form-input" required value={roomData.maxPeople} onChange={e=>setRoomData({...roomData, maxPeople: e.target.value})}/>
                      </div>
                  </div>

                  <div className="form-group">
                      <label>Description</label>
                      <textarea className="form-input" rows="4" value={roomData.desc} onChange={e=>setRoomData({...roomData, desc: e.target.value})} />
                  </div>

                  <div style={{display:'flex', justifyContent:'flex-end', marginTop:'30px'}}>
                      <button type="submit" className="btn-submit" disabled={loading}>
                          {loading ? <Loader2 className="spin" size={18}/> : <Save size={18}/>}
                          {editingRoom ? 'Save Changes' : 'Create Room'}
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