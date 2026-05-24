import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Adjust this path if your api service is located elsewhere

const IncompleteBookingTag = () => {
    const [pendingBooking, setPendingBooking] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPendingBooking = async () => {
            try {
                // Fetch the user's bookings from the endpoint we fixed earlier
                const response = await api.get('/bookings/my-bookings');
                
                if (response.data && response.data.success) {
                    // Search the array for any booking that is stuck in 'pending' status
                    const incomplete = response.data.data.find(b => b.status === 'pending');
                    setPendingBooking(incomplete);
                }
            } catch (err) {
                console.error("Failed to fetch pending bookings", err);
            }
        };

        fetchPendingBooking();
    }, []);

    // If there is no pending booking, render absolutely nothing
    if (!pendingBooking) return null; 

    return (
        <div className="floating-pending-tag" onClick={() => navigate('/booking-confirmation')}>
            <div className="tag-icon">⏳</div>
            <div className="tag-content">
                <h4>Complete your booking!</h4>
                <p>You have an unfinished reservation for {pendingBooking.hotel?.name || 'a hotel'}.</p>
            </div>
        </div>
    );
};

export default IncompleteBookingTag;