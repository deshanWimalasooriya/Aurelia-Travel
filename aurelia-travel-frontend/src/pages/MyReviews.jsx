import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Star, Building2, Calendar, MessageSquare, CornerDownRight } from 'lucide-react';
import './styles/my-reviews.css';

const MyReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyReviews = async () => {
            try {
                const res = await api.get('/reviews/mine');
                setReviews(res.data.data || []);
            } catch (err) {
                console.error("Failed to fetch reviews", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMyReviews();
    }, []);

    const renderStars = (rating) => {
        return (
            <div className="review-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star} 
                        size={16} 
                        fill={star <= rating ? "#f59e0b" : "none"} 
                        color={star <= rating ? "#f59e0b" : "#cbd5e1"} 
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return <div className="reviews-loading">Loading your reviews...</div>;
    }

    return (
        <div className="my-reviews-page">
            <div className="my-reviews-container">
                <div className="reviews-header">
                    <h1>My Reviews</h1>
                    <p>Manage your feedback and see property responses.</p>
                </div>

                {reviews.length === 0 ? (
                    <div className="empty-reviews-state">
                        <MessageSquare size={48} color="#cbd5e1" />
                        <h3>No reviews yet</h3>
                        <p>You haven't written any reviews for your past stays.</p>
                        <Link to="/profile" className="btn-primary-compact">View Past Bookings</Link>
                    </div>
                ) : (
                    <div className="reviews-list">
                        {reviews.map((review) => (
                            <div key={review.id} className="user-review-card">
                                
                                {/* Top Section: Hotel Info */}
                                <div className="ur-hotel-info">
                                    <div className="ur-hotel-thumb">
                                        {review.hotel_image ? (
                                            <img src={review.hotel_image} alt={review.hotel_name} />
                                        ) : (
                                            <Building2 size={24} color="#94a3b8" />
                                        )}
                                    </div>
                                    <div className="ur-hotel-details">
                                        <h4><Link to={`/hotel/${review.hotel_id}`}>{review.hotel_name}</Link></h4>
                                        <span className="ur-date">
                                            <Calendar size={14} /> 
                                            {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Middle Section: User's Review */}
                                <div className="ur-content">
                                    {renderStars(review.rating)}
                                    <h5 className="ur-title">{review.title}</h5>
                                    <p className="ur-comment">{review.comment}</p>
                                </div>

                                {/* Bottom Section: Manager's Reply (If it exists) */}
                                {review.hotel_response && (
                                    <div className="ur-manager-reply">
                                        <div className="reply-header">
                                            <CornerDownRight size={16} />
                                            <strong>Response from Property Manager</strong>
                                        </div>
                                        <p>{review.hotel_response}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyReviews;