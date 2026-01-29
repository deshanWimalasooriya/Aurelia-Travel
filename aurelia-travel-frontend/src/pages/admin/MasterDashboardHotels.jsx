import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Edit, Trash2, ToggleLeft, ToggleRight, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/masterAdmin.css';

const MasterDashboardHotels = () => {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHotels();
    }, []);

    const fetchHotels = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getAllHotels();
            setHotels(res.data.data);
        } catch (err) {
            toast.error('Failed to fetch hotels');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await adminAPI.toggleHotelStatus(id);
            toast.success('Hotel status updated');
            fetchHotels();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    if (loading) {
        return <div className="loading-container">Loading hotels...</div>;
    }

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="content-header">
                <div className="content-header-top">
                    <div className="content-title">
                        <h1>Hotel Management</h1>
                        <p>Manage all properties on the platform</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Hotel Name</th>
                            <th>Location</th>
                            <th>Manager</th>
                            <th>Rating</th>
                            <th>Total Bookings</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hotels.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                    No hotels found
                                </td>
                            </tr>
                        ) : (
                            hotels.map((hotel) => (
                                <tr key={hotel.id}>
                                    <td>{hotel.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {hotel.main_image && (
                                                <img 
                                                    src={hotel.main_image} 
                                                    alt={hotel.name}
                                                    style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                                                />
                                            )}
                                            <strong>{hotel.name}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <MapPin size={14} />
                                            {hotel.city}, {hotel.country}
                                        </div>
                                    </td>
                                    <td>{hotel.manager_name || 'N/A'}</td>
                                    <td>
                                        <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                                            ★ {hotel.rating_average || 'N/A'}
                                        </span>
                                    </td>
                                    <td>{hotel.total_bookings || 0}</td>
                                    <td>
                                        <span className={`status-badge ${hotel.is_active ? 'confirmed' : 'cancelled'}`}>
                                            {hotel.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="table-action-btn">
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                className="table-action-btn"
                                                onClick={() => handleToggleStatus(hotel.id)}
                                            >
                                                {hotel.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MasterDashboardHotels;
