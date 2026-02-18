import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Star, MessageSquare, Reply, CheckCircle } from 'lucide-react';
import './styles/manager-reviews.css'; // We will create this css next

const ManagerReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null); // ID of review being replied to
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await api.get('/reviews/manager');
            if (res.data.success) {
                setReviews(res.data.data);
            }
        } catch (err) {
            console.error("Failed to load reviews", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReply = async (reviewId) => {
        if (!replyText.trim()) return;
        try {
            await api.put(`/reviews/${reviewId}/reply`, { reply: replyText });
            alert("Reply posted successfully!");
            setReplyingTo(null);
            setReplyText("");
            fetchReviews(); // Refresh list
        } catch (err) {
            alert("Failed to post reply.");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading feedback...</div>;

    return (
        <div className="manager-reviews-page">
            <div className="review-header-card">
                <h1>Guest Reviews</h1>
                <p>Manage feedback across all your properties.</p>
            </div>

            <div className="reviews-feed">
                {reviews.length === 0 ? (
                    <div className="empty-state">No reviews received yet.</div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="review-item-card">
                            <div className="review-top">
                                <div className="reviewer-info">
                                    <div className="reviewer-avatar">
                                        {review.guest_image ? <img src={review.guest_image} alt=""/> : review.guest_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="reviewer-name">{review.guest_name}</h4>
                                        <span className="stay-info">Stayed at <strong>{review.hotel_name}</strong></span>
                                    </div>
                                </div>
                                <div className="review-rating">
                                    <span className="rating-num">{review.rating}</span> <Star size={14} fill="currentColor"/>
                                </div>
                            </div>

                            <div className="review-content">
                                <h5 className="review-title">{review.title}</h5>
                                <p className="review-body">"{review.comment}"</p>
                                <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                            </div>

                            {/* Existing Reply */}
                            {review.hotel_response && (
                                <div className="manager-response">
                                    <div className="response-label"><Reply size={14}/> Response from Property</div>
                                    <p>{review.hotel_response}</p>
                                </div>
                            )}

                            {/* Reply Action */}
                            {!review.hotel_response && (
                                <div className="reply-action-area">
                                    {replyingTo === review.id ? (
                                        <div className="reply-input-box">
                                            <textarea 
                                                placeholder="Write a professional response..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                            />
                                            <div className="reply-btns">
                                                <button className="btn-cancel" onClick={() => setReplyingTo(null)}>Cancel</button>
                                                <button className="btn-submit" onClick={() => handleSubmitReply(review.id)}>Post Reply</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button className="btn-reply-toggle" onClick={() => setReplyingTo(review.id)}>
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