import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Eye, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/masterAdmin.css';

const MasterDashboardBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [filters, setFilters] = useState({ status: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, [filters]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getAllBookings(filters);
            setBookings(res.data.data);
        } catch (err) {
            toast.error('Failed to fetch bookings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await adminAPI.updateBooking(id, newStatus);
            toast.success('Booking status updated');
            fetchBookings();
        } catch (err) {
            toast.error('Failed to update booking');
        }
    };

    if (loading) {
        return <div className="loading-container">Loading bookings...</div>;
    }

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="content-header">
                <div className="content-header-top">
                    <div className="content-title">
                        <h1>Booking Management</h1>
                        <p>Monitor and manage all bookings</p>
                    </div>
                    <button className="action-btn primary">
                        <Download size={18} /> Export Data
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar" style={{ marginBottom: 24 }}>
                <select 
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Table */}
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Booking ID</th>
                            <th>Guest</th>
                            <th>Hotel</th>
                            <th>Room</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                                    No bookings found
                                </td>
                            </tr>
                        ) : (
                            bookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td><strong>{booking.booking_reference}</strong></td>
                                    <td>{booking.guest_name}</td>
                                    <td>{booking.hotel_name}</td>
                                    <td>{booking.room_title}</td>
                                    <td>{new Date(booking.check_in).toLocaleDateString()}</td>
                                    <td>{new Date(booking.check_out).toLocaleDateString()}</td>
                                    <td><strong>${booking.total_price}</strong></td>
                                    <td>
                                        <span className={`status-badge ${booking.status}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="table-action-btn">
                                                <Eye size={16} />
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

export default MasterDashboardBookings;
