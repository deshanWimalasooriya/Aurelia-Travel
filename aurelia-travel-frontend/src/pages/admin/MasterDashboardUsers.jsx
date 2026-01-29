import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Trash2, Search, User, Shield, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/masterAdmin.css';

const MasterDashboardUsers = () => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Debounce search could be added here for optimization
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllUsers(filters);
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deactivated');
      fetchUsers(); // Refresh list
    } catch (err) {
      toast.error('Failed to deactivate user');
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <Shield size={16} color="#7c3aed"/>;
      case 'hotel_manager': return <Briefcase size={16} color="#2563eb"/>;
      default: return <User size={16} color="#64748b"/>;
    }
  };

  return (
    <div className="fade-in">
      <div className="content-header">
        <div className="content-title">
          <h1>User Management</h1>
          <p>Manage access and roles for all platform users</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar" style={{marginBottom: 20, display:'flex', gap: 15}}>
        <div className="search-input-wrapper" style={{position:'relative'}}>
          <Search size={18} style={{position:'absolute', left: 10, top: 10, color:'#94a3b8'}}/>
          <input 
            className="form-input" 
            style={{paddingLeft: 35}} 
            placeholder="Search users..." 
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        <select 
          className="form-select"
          value={filters.role} 
          onChange={(e) => setFilters({...filters, role: e.target.value})}
        >
          <option value="">All Roles</option>
          <option value="user">Travelers</option>
          <option value="hotel_manager">Hotel Managers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* USERS TABLE */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="text-center p-8">Loading...</td></tr> : 
             users.length === 0 ? <tr><td colSpan="6" className="text-center p-8">No users found</td></tr> :
             users.map(user => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td>
                  <div style={{fontWeight:600}}>{user.username}</div>
                  <div style={{fontSize:'0.8rem', color:'#64748b'}}>{user.email}</div>
                </td>
                <td>
                  <div style={{display:'flex', alignItems:'center', gap:6}}>
                    {getRoleIcon(user.role)}
                    <span style={{textTransform:'capitalize'}}>{user.role.replace('_', ' ')}</span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'confirmed' : 'cancelled'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button 
                    className="table-action-btn delete" 
                    onClick={() => handleDelete(user.id)}
                    title="Deactivate User"
                  >
                    <Trash2 size={16}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterDashboardUsers;