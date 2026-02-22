import { useState, useEffect, useCallback } from 'react';
import platformService from '../../services/platformService'; 
import { 
  Search, Calendar, Filter, Clock, Download, 
  Loader2, Info 
} from 'lucide-react';
import './styles/super-common.css';

const SuperLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filterDate, setFilterDate] = useState('');
    const [search, setSearch] = useState('');
    const [filterAction, setFilterAction] = useState('all');

    const actionTypes = ['DELETE', 'UPDATE', 'CREATE', 'BAN', 'RESOLVE'];

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await platformService.getLogs({
                search, date: filterDate, action: filterAction
            });
            if (res.success) setLogs(res.data);
        } catch (err) {
            console.error("Failed to load logs:", err);
        } finally {
            setLoading(false);
        }
    }, [search, filterDate, filterAction]);

    useEffect(() => {
        const timer = setTimeout(() => fetchLogs(), 500); 
        return () => clearTimeout(timer);
    }, [fetchLogs]);

    const getBadgeStyle = (action) => {
        if (!action) return 'sa-badge-neutral';
        if (action.includes('DELETE') || action.includes('BAN')) return 'sa-role-banned';
        if (action.includes('UPDATE') || action.includes('EDIT')) return 'sa-role-admin';
        if (action.includes('CREATE') || action.includes('ADD')) return 'sa-role-manager';
        return 'sa-role-user';
    };

    return (
        <div>
            {/* HEADER */}
            <div className="sa-header-row">
                <div>
                    <h1 className="sa-page-title" style={{ marginBottom: '5px' }}>Activity Logs</h1>
                    <p className="sa-page-subtitle" style={{ margin: 0 }}>Audit trail of all administrator actions.</p>
                </div>
                <button className="sa-btn-export" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'var(--color-surface)', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    <Download size={18} /> Export CSV
                </button>
            </div>

            {/* FILTERS */}
            <div className="sa-table-controls" style={{ marginBottom: '24px', display: 'flex', gap: '20px', background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', flexWrap: 'wrap', boxShadow: 'var(--shadow-sm)' }}>
                
                <div className="sa-search-wrapper" style={{ flex: 2, minWidth: '250px' }}>
                    <Search size={18} className="sa-search-icon" />
                    <input 
                        className="sa-search-input" 
                        placeholder="Search admin, details..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>

                <div className="sa-search-wrapper" style={{ flex: 1, minWidth: '180px' }}>
                    <Filter size={18} className="sa-search-icon" />
                    <select 
                        className="sa-search-input"
                        value={filterAction}
                        onChange={e => setFilterAction(e.target.value)}
                        style={{ width: '100%', cursor: 'pointer', appearance: 'none' }}
                    >
                        <option value="all">All Actions</option>
                        {actionTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div className="sa-search-wrapper" style={{ flex: 1, minWidth: '180px' }}>
                    <Calendar size={18} className="sa-search-icon" />
                    <input 
                        type="date"
                        className="sa-search-input"
                        value={filterDate} 
                        onChange={e => setFilterDate(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="sa-table-card">
                <table className="sa-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Admin User</th>
                            <th>Module</th>
                            <th>Action</th>
                            <th>Target / Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '60px' }}>
                                    <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'10px', color: 'var(--text-muted)'}}>
                                        <Loader2 className="animate-spin" /> Loading Logs...
                                    </div>
                                </td>
                            </tr>
                        ) : logs.length > 0 ? (
                            logs.map(log => (
                                <tr key={log.id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--color-dark)' }}>
                                                {new Date(log.timestamp).toLocaleDateString()}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                <Clock size={12}/> {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', fontSize: '0.9rem', fontWeight: 800 }}>
                                                {log.admin ? log.admin.charAt(0).toUpperCase() : 'S'}
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--color-dark)' }}>{log.admin}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, background: 'var(--color-background)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                                            {log.module}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`sa-role-badge ${getBadgeStyle(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.95rem' }}>
                                        {log.target}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                    <Info size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                                    <p style={{fontSize: '1rem', margin: 0}}>No activity found for these filters.</p>
                                    <button 
                                        onClick={() => { setSearch(''); setFilterDate(''); setFilterAction('all'); }}
                                        style={{ marginTop: '15px', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                                    >
                                        Clear Filters
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SuperLogs;