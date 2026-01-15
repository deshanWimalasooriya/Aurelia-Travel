import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import './styles/dashboard.css';

const DashboardRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  
  // Fetch Rooms
  useEffect(() => {
    // In real app, fetch from your API
    const fetchRooms = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/rooms');
            setRooms(res.data); // Assuming API returns array
        } catch (err) { console.error(err); }
    };
    fetchRooms();
  }, []);

  const handleDelete = async (id) => {
      if(!window.confirm("Delete this room?")) return;
      // Call delete API...
      setRooms(rooms.filter(r => r.id !== id));
  };

  return (
    <div className="rooms-management">
      <div className="page-header-row">
        <h1 className="page-title">Room Management</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add New Room
        </button>
      </div>

      <div className="table-card">
        <div className="table-filters">
            <div className="search-box">
                <Search size={18} />
                <input placeholder="Search rooms..." />
            </div>
        </div>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Room Name</th>
              <th>Type</th>
              <th>Price/Night</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id}>
                <td>
                    <div className="table-img">
                       {room.photos && room.photos[0] ? <img src={room.photos[0]} alt=""/> : <ImageIcon size={20}/>}
                    </div>
                </td>
                <td className="font-bold">{room.title || room.name}</td>
                <td>{room.room_type}</td>
                <td>${room.price_per_night}</td>
                <td>{room.capacity} Guests</td>
                <td>
                    <span className={`status-pill ${room.is_available ? 'active' : 'inactive'}`}>
                        {room.is_available ? 'Available' : 'Booked'}
                    </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => { setEditingRoom(room); setShowModal(true); }}>
                        <Edit size={16} />
                    </button>
                    <button className="btn-icon danger" onClick={() => handleDelete(room.id)}>
                        <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- ADD/EDIT MODAL (Simplified for UI Demo) --- */}
      {showModal && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <h2>{editingRoom ? 'Edit Room' : 'Add New Room'}</h2>
                  <form className="admin-form">
                      <div className="form-group">
                          <label>Room Name</label>
                          <input className="form-input" defaultValue={editingRoom?.title} />
                      </div>
                      <div className="form-row">
                          <div className="form-group">
                              <label>Price ($)</label>
                              <input className="form-input" type="number" defaultValue={editingRoom?.price_per_night} />
                          </div>
                          <div className="form-group">
                              <label>Capacity</label>
                              <input className="form-input" type="number" defaultValue={editingRoom?.capacity} />
                          </div>
                      </div>
                      <div className="modal-actions">
                          <button type="button" className="btn-outline" onClick={() => {setShowModal(false); setEditingRoom(null)}}>Cancel</button>
                          <button type="submit" className="btn-primary">Save Room</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default DashboardRooms;