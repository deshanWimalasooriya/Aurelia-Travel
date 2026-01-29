import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Edit, Trash2, Search, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/masterAdmin.css';

const MasterDashboardUsers = () => {
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({ role: '', search: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, [filters]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getAllUsers(filters);
            setUsers(res.data.data);
        } catch (err) {
            toast.error('Failed to fetch users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deactivate this user?')) return;
        try {
            await adminAPI.deleteUser(id);
            toast.success('User deactivated');
            fetchUsers();
        } catch (err) {
            toast.error('Failed to delete user');
        }
    };

    if (loading) {
        return <div className="loading-container">Loading users...</div>;
    }

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="content-header">
                <div className="content-header-top">
                    <div className="content-title">
                        <h1>User Management</h1>
                        <p>Manage all users, roles, and permissions</p>
                    </div>
                    <button className="action-btn primary">
                        <UserPlus size={18} /> Add User
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div className="search-input-wrapper">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="search-input"
                        />
                    </div>
                    <select 
                        className="form-select"
                        value={filters.role}
                        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    >
                        <option value="">All Roles</option>
                        <option value="user">User</option>
                        <option value="hotelmanager">Hotel Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td><strong>{user.username}</strong></td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`badge ${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.is_active ? 'confirmed' : 'cancelled'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="table-action-btn">
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                className="table-action-btn danger"
                                                onClick={() => handleDelete(user.id)}
                                            >
                                                <Trash2 size={16} />
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

export default MasterDashboardUsers;
