import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, ArrowLeft, Save, Loader2, BedDouble } from 'lucide-react';
import './styles/dashboard.css';
import { use } from 'react';

const DashboardRooms = () => {
  const [view, setView] = useState('list');
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  // Hotel Category Filter
  const [selectedHotelFilter, setSelectedHotelFilter] = useState('all');

  const [roomData, setRoomData] = useState({
    title: '', price: '', maxPeople: '', desc: '', hotelId: '', roomNumbers: ''
  });
  
  // Fetch rooms and hotels on mount
  useEffect(() => { fetchHotels(); }, []);
  useEffect(() => { fetchRooms(); }, []);

  const fetchHotels = async () => {
    try {
      // ✅ Use /mine endpoint to get only manager's hotels
      const res = await axios.get('http://localhost:5000/api/hotels/mine', { withCredentials: true });
      setHotels(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) { console.error(err); }
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/rooms', { withCredentials: true });
      setRooms(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) { console.error(err); }
  };




  const filteredRooms = selectedHotelFilter === 'all' 
    ? rooms 
    : rooms.filter(r => r.hotel_id === parseInt(selectedHotelFilter));

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
        await axios.delete(`http://localhost:5000/api/rooms/${id}`, { withCredentials: true });
        setRooms(prev => prev.filter(r => r.id !== id));
      } catch (err) { console.error(err); }
  };

  
  return (
    <div className="rooms-page">
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="table-header-action table-card" style={{marginBottom: '30px'}}>
                <div>
                    <h1 style={{fontSize: '1.5rem', fontWeight: 800}}>My Rooms</h1>
                    <p style={{color: '#64748b'}}>Manage rooms by hotel</p>
                </div>
                
                <div style={{display:'flex', gap:'15px'}}>
                    <select 
                        className="form-input" 
                        style={{width: '200px', padding:'10px'}}
                        value={selectedHotelFilter}
                        onChange={(e) => setSelectedHotelFilter(e.target.value)}
                    >
                        <option value="all">All Hotels</option>
                        {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>

                    <button className="btn-primary" onClick={() => handleSwitchToForm()}>
                        <Plus size={18} /> Add Room
                    </button>
                </div>
            </div>

            <div className="table-card">
                <table className="dashboard-table">
                <thead><tr><th>Room Type</th><th>Hotel</th><th>Price</th><th>Actions</th></tr></thead>
                <tbody>
                    {filteredRooms.length > 0 ? filteredRooms.map(room => (
                    <tr key={room.id}>
                        <td style={{fontWeight: 700}}>{room.title}</td>
                        <td>{room.hotel_name || hotels.find(h => h.id === room.hotel_id)?.name || 'Unknown'}</td>
                        <td>${room.price_per_night}</td>
                        <td>
                        <div className="action-buttons">
                            <button className="btn-icon" onClick={() => handleSwitchToForm(room)}><Edit3 size={16} /></button>
                            <button className="btn-icon danger" onClick={() => handleDelete(room.id)}><Trash2 size={16} /></button>
                        </div>
                        </td>
                    </tr>
                    )) : (
                        <tr><td colSpan="4" style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>No rooms found for selection.</td></tr>
                    )}
                </tbody>
                </table>
            </div>
          </motion.div>
        )}

        {/* Form View (Kept same as provided context, mapped for logic) */}
        {view === 'form' && (
          <motion.div key="form" className="form-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="form-header-row">
                  <h2>{editingRoom ? 'Edit' : 'Add'} Room</h2>
                  <button className="btn-secondary" onClick={() => setView('list')}>Cancel</button>
              </div>
              <form onSubmit={handleSubmit}>
                  <div className="form-group">
                      <label>Select Hotel</label>
                      <select className="form-input" value={roomData.hotelId} onChange={e=>setRoomData({...roomData, hotelId: e.target.value})} required>
                          <option value="">-- Choose Hotel --</option>
                          {hotels.map(h => (<option key={h.id} value={h.id}>{h.name}</option>))}
                      </select>
                  </div>
                  <div className="form-group"><label>Title</label><input className="form-input" required value={roomData.title} onChange={e=>setRoomData({...roomData, title: e.target.value})}/></div>
                  <div className="form-grid-row">
                      <div className="form-group"><label>Price</label><input type="number" className="form-input" required value={roomData.price} onChange={e=>setRoomData({...roomData, price: e.target.value})}/></div>
                      <div className="form-group"><label>Capacity</label><input type="number" className="form-input" required value={roomData.maxPeople} onChange={e=>setRoomData({...roomData, maxPeople: e.target.value})}/></div>
                  </div>
                  <div className="form-group"><label>Description</label><textarea className="form-input" rows="3" value={roomData.desc} onChange={e=>setRoomData({...roomData, desc: e.target.value})}/></div>
                  <button type="submit" className="btn-primary">Save Room</button>
              </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardRooms;