import { useState, useEffect } from 'react';
import platformService from '../../services/platformService';
import { Search, User, Trash2, ShieldBan, CheckCircle } from 'lucide-react';
import './styles/super-users.css';

const SuperUsers = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await platformService.getUsers();
            setUsers(data);
        } catch (err) { console.error(err); }
    };

    const handleUserAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            await platformService.manageUser(id, action);
            loadUsers();
        } catch (err) { alert("Action failed"); }
    };

    const filtered = users.filter(u => 
        u.username.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
             <div className="sa-header-row">
                <h1 className="sa-page-title" style={{marginBottom:0}}>User Management</h1>
                <div className="sa-search-wrapper">
                    <Search size={18} className="sa-search-icon"/>
                    <input 
                        className="sa-search-input"
                        placeholder="Search users..." 
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="sa-table-card">
                <table className="sa-table">
                    <thead>
                        <tr>
                            <th>User Profile</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th style={{textAlign: 'right'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div className="sa-user-cell">
                                        <div className="sa-user-avatar">
                                            <User size={20}/>
                                        </div>
                                        <div>
                                            <div className="sa-user-name">{user.username}</div>
                                            <div className="sa-user-email">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`sa-role-badge ${user.role === 'admin' ? 'sa-role-admin' : 'sa-role-user'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    {user.is_active !== false ? (
                                        <span className="sa-status-text sa-text-active">
                                            <CheckCircle size={14}/> Active
                                        </span>
                                    ) : (
                                        <span className="sa-status-text sa-text-banned">
                                            <ShieldBan size={14}/> Banned
                                        </span>
                                    )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button 
                                        className="sa-action-btn sa-action-ban"
                                        onClick={() => handleUserAction(user.id, 'ban')}
                                        title={user.is_active !== false ? "Ban User" : "Activate User"}
                                        style={{ marginRight: '8px' }}
                                    >
                                        <ShieldBan size={18}/>
                                    </button>
                                    <button 
                                        className="sa-action-btn sa-action-delete"
                                        onClick={() => handleUserAction(user.id, 'delete')}
                                        title="Delete User"
                                    >
                                        <Trash2 size={18}/>
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
export default SuperUsers;