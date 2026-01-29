import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Star, Check, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MasterDashboardReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    try {
      const res = await adminAPI.getAllReviews({});
      if (res.data.success) setReviews(res.data.data);
    } catch (err) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (id) => {
    try {
      await adminAPI.toggleReviewApproval(id);
      toast.success('Review status updated');
      fetchReviews();
    } catch (err) { toast.error('Action failed'); }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await adminAPI.deleteReview(id);
      toast.success('Review deleted');
      fetchReviews();
    } catch (err) { toast.error('Delete failed'); }
  };

  return (
    <div className="fade-in">
      <div className="content-header">
        <h1>Review Moderation</h1>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Rating</th>
              <th>Review</th>
              <th>User & Hotel</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id}>
                <td>
                  <div style={{display:'flex', alignItems:'center', gap:4, fontWeight:'bold'}}>
                    <Star size={14} fill="#fbbf24" stroke="#fbbf24"/> {r.rating}
                  </div>
                </td>
                <td style={{maxWidth: '300px'}}>
                  <p style={{margin:0, fontSize:'0.9rem'}}>{r.comment}</p>
                  <small style={{color:'#94a3b8'}}>{new Date(r.created_at).toLocaleDateString()}</small>
                </td>
                <td>
                  <div>{r.username}</div>
                  <small style={{color:'#64748b'}}>@ {r.hotel_name}</small>
                </td>
                <td>
                  <span className={`status-badge ${r.is_approved ? 'confirmed' : 'pending'}`}>
                    {r.is_approved ? 'Visible' : 'Hidden'}
                  </span>
                </td>
                <td>
                  <div style={{display:'flex', gap: 10}}>
                    <button 
                      onClick={() => toggleApproval(r.id)} 
                      className="action-btn-icon"
                      title={r.is_approved ? "Hide Review" : "Approve Review"}
                      style={{color: r.is_approved ? '#f59e0b' : '#10b981'}}
                    >
                      {r.is_approved ? <X size={18}/> : <Check size={18}/>}
                    </button>
                    <button 
                      onClick={() => deleteReview(r.id)} 
                      className="action-btn-icon" 
                      title="Delete"
                      style={{color: '#ef4444'}}
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterDashboardReviews;