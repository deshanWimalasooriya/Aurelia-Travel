import { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Loader2 } from 'lucide-react';
import './styles/dashboard.css';

const DashboardRooms = () => {
  const [view, setView] = useState('list');
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  // Hotel Category Filter
  const [selectedHotelFilter, setSelectedHotelFilter] = useState('all');

  const [roomData, setRoomData] = useState({
    title: '', price: '', maxPeople: '', desc: '', hotelId: '', totalQuantity: ''
  });
  
  // 1. Fetch hotels on mount to populate dropdown
  useEffect(() => { fetchHotels(); }, []);

  // 2. Fetch rooms whenever filter changes
  useEffect(() => { fetchRooms(selectedHotelFilter); }, [selectedHotelFilter]);

  const fetchHotels = async () => {
    try {
      const res = await api.get('/hotels/mine');
      setHotels(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) { console.error(err); }
  };

  const fetchRooms = async (filterId) => {
    setLoading(true);
    try {
      let url = filterId === 'all' ? '/rooms/mine' : `/rooms/hotel/${filterId}`;
      const res = await api.get(url);
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setRooms(data);
    } catch (err) { 
      console.error(err); 
      setRooms([]); 
    } finally {
      setLoading(false);
    }
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
        room_type: 'Standard' // Default, can add dropdown later
    };

    try {
        if (editingRoom) {
            await api.put(`/rooms/${editingRoom.id}`, payload);
        } else {
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
      if(!window.confirm("Delete this room type?")) return;
      try {
        await api.delete(`/rooms/${id}`);
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
                    <p style={{color: '#64748b'}}>Manage inventory</p>
                </div>
                
                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
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
                <thead><tr><th>Room Type</th><th>Hotel</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
                <tbody>
                    {loading ? (
                       <tr><td colSpan="5" className="text-center p-4">Loading...</td></tr> 
                    ) : rooms.length > 0 ? rooms.map(room => (
                    <tr key={room.id}>
                        <td style={{fontWeight: 700}}>{room.title}</td>
                        <td>{room.hotel_name || hotels.find(h => h.id === room.hotel_id)?.name || 'Unknown'}</td>
                        <td>${room.base_price_per_night || room.price_per_night}</td>
                        <td>{room.total_quantity}</td>
                        <td>
                        <div className="action-buttons">
                            <button className="btn-icon" onClick={() => handleSwitchToForm(room)}><Edit3 size={16} /></button>
                            <button className="btn-icon danger" onClick={() => handleDelete(room.id)}><Trash2 size={16} /></button>
                        </div>
                        </td>
                    </tr>
                    )) : (
                        <tr><td colSpan="5" className="text-center p-8 text-gray-500">No rooms found. Add one to start selling!</td></tr>
                    )}
                </tbody>
                </table>
            </div>
          </motion.div>
        )}

        {view === 'form' && (
          <motion.div key="form" className="form-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="form-header-row">
                  <h2>{editingRoom ? 'Edit' : 'Add'} Room</h2>
                  <button type="button" className="btn-secondary" onClick={() => setView('list')}>Cancel</button>
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
                      <div className="form-group"><label>Price (Per Night)</label><input type="number" className="form-input" required value={roomData.price} onChange={e=>setRoomData({...roomData, price: e.target.value})}/></div>
                      <div className="form-group"><label>Max Guests</label><input type="number" className="form-input" required value={roomData.maxPeople} onChange={e=>setRoomData({...roomData, maxPeople: e.target.value})}/></div>
                  </div>
                  <div className="form-group"><label>Total Inventory (Rooms)</label><input type="number" className="form-input" required value={roomData.totalQuantity} onChange={e=>setRoomData({...roomData, totalQuantity: e.target.value})}/></div>
                  <div className="form-group"><label>Description</label><textarea className="form-input" rows="3" value={roomData.desc} onChange={e=>setRoomData({...roomData, desc: e.target.value})}/></div>
                  <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : 'Save Room'}
                  </button>
              </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardRooms;