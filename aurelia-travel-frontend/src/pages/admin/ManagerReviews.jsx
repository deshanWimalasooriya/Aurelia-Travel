import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Star, MessageSquare, Reply, Loader2 } from 'lucide-react';
import './styles/manager-reviews.css';

const ManagerReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null); 
    const [replyText, setReplyText] = useState("");

    useEffect(() => { fetchReviews(); }, []);

    const fetchReviews = async () => {
        try {
            const res = await api.get('/reviews/manager');
            if (res.data.success) setReviews(res.data.data);
        } catch (err) { console.error("Failed to load reviews", err); } 
        finally { setLoading(false); }
    };

    const handleSubmitReply = async (reviewId) => {
        if (!replyText.trim()) return;
        try {
            await api.put(`/reviews/${reviewId}/reply`, { reply: replyText });
            setReplyingTo(null); setReplyText(""); fetchReviews(); 
        } catch (err) { alert("Failed to post reply."); }
    };

    if (loading) return <div className="loading-state"><Loader2 className="animate-spin"/> Loading feedback...</div>;

    return (
        <div className="mr-page fade-in">
            <div className="mr-header">
                <h1>Guest Reviews</h1>
                <p>Manage feedback across all your properties.</p>
            </div>

            <div className="mr-grid">
                {reviews.length === 0 ? (
                    <div className="empty-state-cell">No reviews received yet.</div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="mr-card">
                            <div className="mr-card-top">
                                <div className="mr-user-info">
                                    <div className="mr-avatar">
                                        {review.guest_image ? <img src={review.guest_image} alt=""/> : review.guest_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="mr-name">{review.guest_name}</h4>
                                        <span className="mr-stay">Stayed at <strong>{review.hotel_name}</strong></span>
                                    </div>
                                </div>
                                <div className="mr-rating-pill">
                                    <span className="mr-rating-num">{review.rating}</span> <Star size={14} fill="currentColor"/>
                                </div>
                            </div>

                            <div className="mr-content">
                                <h5>{review.title}</h5>
                                <p>"{review.comment}"</p>
                                <span className="mr-date">{new Date(review.created_at).toLocaleDateString()}</span>
                            </div>

                            {review.hotel_response && (
                                <div className="mr-response">
                                    <div className="mr-response-label"><Reply size={14}/> Response from Property</div>
                                    <p>{review.hotel_response}</p>
                                </div>
                            )}

                            {!review.hotel_response && (
                                <div className="mr-action-area">
                                    {replyingTo === review.id ? (
                                        <div className="mr-reply-box">
                                            <textarea 
                                                placeholder="Write a professional response..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                            />
                                            <div className="mr-reply-btns">
                                                <button className="btn-ghost" onClick={() => setReplyingTo(null)}>Cancel</button>
                                                <button className="btn-primary-compact" onClick={() => handleSubmitReply(review.id)}>Post Reply</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button className="btn-ghost" onClick={() => setReplyingTo(review.id)}>
                                            <MessageSquare size={16}/> Reply to Guest
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
export default ManagerReviews;