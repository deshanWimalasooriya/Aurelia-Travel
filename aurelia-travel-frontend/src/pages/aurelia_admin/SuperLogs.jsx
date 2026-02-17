import { useState, useEffect, useCallback } from 'react';
import platformService from '../../services/platformService'; // ✅ Import Service
import { 
  Search, Calendar, Filter, Clock, Download, 
  Loader2, Info 
} from 'lucide-react';
import './styles/super-common.css';

const SuperLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [filterDate, setFilterDate] = useState('');
    const [search, setSearch] = useState('');
    const [filterAction, setFilterAction] = useState('all');

    // Dynamic Action Types (could also be hardcoded)
    const actionTypes = ['DELETE', 'UPDATE', 'CREATE', 'BAN', 'RESOLVE'];

    // ✅ FETCH DATA FUNCTION
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await platformService.getLogs({
                search,
                date: filterDate,
                action: filterAction
            });
            
            if (res.success) {
                setLogs(res.data);
            }
        } catch (err) {
            console.error("Failed to load logs:", err);
        } finally {
            setLoading(false);
        }
    }, [search, filterDate, filterAction]); // Re-fetch when filters change

    // Debounce Search to prevent too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 500); // 500ms delay
        return () => clearTimeout(timer);
    }, [fetchLogs]);

    // Helper for Badge Styles
    const getBadgeStyle = (action) => {
        if (!action) return 'sa-badge-neutral';
        if (action.includes('DELETE') || action.includes('BAN')) return 'sa-badge-banned';
        if (action.includes('UPDATE') || action.includes('EDIT')) return 'sa-role-admin';
        if (action.includes('CREATE') || action.includes('ADD')) return 'sa-badge-active';
        return 'sa-role-hotel_manager';
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* HEADER */}
            <div className="sa-header-row">
                <div>
                    <h1 className="sa-page-title" style={{ marginBottom: '5px' }}>Activity Logs</h1>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                        Audit trail of all administrator actions.
                    </p>
                </div>
                <button className="sa-btn-export" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
                    <Download size={18} /> Export CSV
                </button>
            </div>

            {/* FILTERS */}
            <div className="sa-table-controls" style={{ marginBottom: '20px', display: 'flex', gap: '15px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                
                {/* Search */}
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

                {/* Action Type Filter */}
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

                {/* Date Picker */}
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
                                    <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'10px', color: '#64748b'}}>
                                        <Loader2 className="animate-spin" /> Loading Logs...
                                    </div>
                                </td>
                            </tr>
                        ) : logs.length > 0 ? (
                            logs.map(log => (
                                <tr key={log.id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600, color: '#334155' }}>
                                                {new Date(log.timestamp).toLocaleDateString()}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12}/> {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', fontSize: '0.8rem', fontWeight: 700 }}>
                                                {log.admin ? log.admin.charAt(0).toUpperCase() : 'S'}
                                            </div>
                                            <span className="sa-user-name">{log.admin}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500, background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                            {log.module}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={getBadgeStyle(log.action)}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ color: '#334155', fontWeight: 500 }}>
                                        {log.target}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                                    <Info size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                                    <p>No activity found for these filters.</p>
                                    <button 
                                        onClick={() => { setSearch(''); setFilterDate(''); setFilterAction('all'); }}
                                        style={{ marginTop: '10px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
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