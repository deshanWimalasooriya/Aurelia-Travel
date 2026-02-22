import { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Trash2 } from 'lucide-react';
import './styles/super-reviews.css';

const SuperReviews = () => {
    const [reviews, setReviews] = useState([]);
    
    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/platform/reviews', { withCredentials: true });
            setReviews(res.data);
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this review permanently?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/platform/reviews/${id}`, { withCredentials: true });
            setReviews(prev => prev.filter(r => r.id !== id));
        } catch (err) { alert("Failed to delete"); }
    };

    return (
        <div>
            <h1 className="sa-page-title" style={{marginBottom: '5px'}}>Content Moderation</h1>
            <p className="sa-page-subtitle" style={{marginBottom: '30px'}}>Monitor and remove inappropriate guest reviews.</p>

            <div className="sa-reviews-grid">
                {reviews.map(review => (
                    <div key={review.id} className="sa-review-card">
                        <div className="sa-review-header">
                            <div className="sa-reviewer-info">
                                <div className="sa-reviewer-img">
                                    {review.profile_image ? <img src={review.profile_image} alt="" /> : review.guest.charAt(0)}
                                </div>
                                <div>
                                    <div className="sa-reviewer-name">{review.guest}</div>
                                    <div className="sa-reviewer-sub">Stayed at <strong>{review.hotel_name}</strong></div>
                                </div>
                            </div>
                            <div className="sa-stars">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                                ))}
                            </div>
                        </div>

                        <div className="sa-review-body">
                            "{review.comment}"
                        </div>

                        <div className="sa-review-footer">
                            <span className="sa-review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                            <button className="sa-btn-delete-review" onClick={() => handleDelete(review.id)}>
                                <Trash2 size={16}/> Remove
                            </button>
                        </div>
                    </div>
                ))}
                {reviews.length === 0 && <div className="sa-no-reviews">No reviews found for moderation.</div>}
            </div>
        </div>
    );
};
export default SuperReviews;