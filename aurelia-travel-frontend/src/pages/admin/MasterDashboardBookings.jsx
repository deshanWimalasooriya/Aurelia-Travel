import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/masterAdmin.css';

const MasterDashboardBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllBookings({ status: filter });
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if(!window.confirm(`Mark booking as ${status}?`)) return;
    try {
      const res = await adminAPI.updateBooking(id, status);
      if(res.data.success) {
        toast.success(`Booking ${status}`);
        fetchBookings();
      }
    } catch(err) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="fade-in">
      <div className="content-header">
        <div className="content-title">
          <h1>Booking Operations</h1>
          <p>Oversee all reservations across the platform</p>
        </div>
      </div>

      <div className="filter-bar">
        <select 
          className="form-select" 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Guest</th>
              <th>Hotel & Room</th>
              <th>Dates</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7" className="text-center p-8">Loading...</td></tr> : 
             bookings.map(b => (
              <tr key={b.id}>
                <td><strong>{b.booking_reference}</strong></td>
                <td>
                  <div>{b.guest_name}</div>
                  <small style={{color:'#64748b'}}>{b.guest_email}</small>
                </td>
                <td>
                  <div style={{fontWeight:600}}>{b.hotel_name}</div>
                  <div style={{fontSize:'0.8rem', color:'#64748b'}}>{b.room_title}</div>
                </td>
                <td>
                  <div style={{fontSize:'0.85rem'}}>
                    {new Date(b.check_in).toLocaleDateString()} -> {new Date(b.check_out).toLocaleDateString()}
                  </div>
                </td>
                <td style={{fontWeight:700}}>${b.total_price}</td>
                <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                <td>
                  {b.status === 'pending' && (
                    <div style={{display:'flex', gap:8}}>
                      <button onClick={() => handleUpdateStatus(b.id, 'confirmed')} title="Confirm" style={{border:'none', background:'transparent', color:'#10b981', cursor:'pointer'}}><CheckCircle/></button>
                      <button onClick={() => handleUpdateStatus(b.id, 'cancelled')} title="Cancel" style={{border:'none', background:'transparent', color:'#ef4444', cursor:'pointer'}}><XCircle/></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterDashboardBookings;