import { useState, useEffect } from 'react';
import api from '../../services/api'; 
import { Search, Download, DollarSign, TrendingUp, CreditCard, Calendar, Loader2 } from 'lucide-react';
import './styles/super-finance.css';

const SuperFinance = () => {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ totalRevenue: 0, totalCommission: 0, netIncome: 0 });
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Transaction History (Uses the FIXED Platform Route)
            const transRes = await api.get('/platform/finance');
            if (transRes.data && Array.isArray(transRes.data)) {
                 setTransactions(transRes.data);
            } else if (transRes.data && transRes.data.data) {
                 setTransactions(transRes.data.data);
            }

            // 2. Fetch Summary Stats (Uses the WORKING Admin Analytics endpoint)
            const analyticsRes = await api.get('/admin/analytics');
            if (analyticsRes.data && analyticsRes.data.summary) {
                setSummary(analyticsRes.data.summary);
            }
        } catch (err) {
            console.error("Finance Load Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        if (transactions.length === 0) return;

        const headers = ["ID", "Ref", "Hotel", "Manager", "Amount", "Date", "Status"];
        const rows = transactions.map(t => [
            t.id,
            t.transaction_id || '-',
            t.hotel_name || 'Unknown',
            t.manager_email || '-',
            t.amount_paid,
            t.payment_date ? new Date(t.payment_date).toLocaleDateString() : '-',
            t.status
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `finance_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter Logic
    const filtered = transactions.filter(t => 
        (t.hotel_name && t.hotel_name.toLowerCase().includes(search.toLowerCase())) ||
        (t.transaction_id && t.transaction_id.toLowerCase().includes(search.toLowerCase())) ||
        (t.manager_email && t.manager_email.toLowerCase().includes(search.toLowerCase()))
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    return (
        <div className="super-finance-container">
            <div className="sa-header-row">
                <div>
                    <h1 className="sa-page-title" style={{marginBottom:'5px'}}>Financial Overview</h1>
                    <p style={{margin:0, color:'#64748b', fontSize:'0.9rem'}}>Track platform revenue and commission payments.</p>
                </div>
                <button 
                    className="sa-btn-export" 
                    onClick={exportCSV} 
                    disabled={transactions.length === 0 || loading}
                    style={{ opacity: transactions.length === 0 ? 0.6 : 1 }}
                >
                    <Download size={18}/> Export CSV
                </button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="finance-cards-grid">
                <div className="f-card bg-blue">
                    <div className="f-icon"><DollarSign size={24}/></div>
                    <div>
                        <p className="f-label">Total Booking Value</p>
                        <h3 className="f-value">{formatCurrency(summary.totalRevenue)}</h3>
                    </div>
                </div>
                <div className="f-card bg-green">
                    <div className="f-icon"><TrendingUp size={24}/></div>
                    <div>
                        <p className="f-label">Total Commission</p>
                        <h3 className="f-value">{formatCurrency(summary.totalCommission)}</h3>
                    </div>
                </div>
                <div className="f-card bg-purple">
                    <div className="f-icon"><CreditCard size={24}/></div>
                    <div>
                        <p className="f-label">Payouts Processed</p>
                        <h3 className="f-value">{transactions.length}</h3>
                    </div>
                </div>
            </div>

            {/* TRANSACTIONS TABLE */}
            <div className="sa-table-card mt-4">
                <div className="table-header-control">
                    <h3 className="card-title">Commission Payments</h3>
                    <div className="sa-search-wrapper">
                        <Search size={16} className="sa-search-icon"/>
                        <input 
                            className="sa-search-input compact" 
                            placeholder="Search hotel, ref, or email..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="sa-table">
                        <thead>
                            <tr>
                                <th>Transaction Ref</th>
                                <th>Hotel / Manager</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{textAlign:'center', padding:'40px'}}>
                                        <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'10px'}}>
                                            <Loader2 className="animate-spin"/> Loading Financial Data...
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length > 0 ? (
                                filtered.map(txn => (
                                    <tr key={txn.id || Math.random()}>
                                        <td>
                                            <div className="txn-ref">
                                                <span className="ref-id">{txn.transaction_id || `TXN-${txn.id}`}</span>
                                                <span className="txn-type">Commission</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="txn-hotel">{txn.hotel_name || 'Unknown Hotel'}</div>
                                            <div className="txn-manager" style={{fontSize:'0.8rem', color:'#64748b'}}>
                                                {txn.manager_email || 'No Email'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="txn-date">
                                                <Calendar size={12} style={{marginRight:'4px', display:'inline'}}/> 
                                                {txn.payment_date ? new Date(txn.payment_date).toLocaleDateString() : 'N/A'}
                                            </div>
                                            <div className="txn-time" style={{fontSize:'0.75rem', color:'#94a3b8', marginLeft:'18px'}}>
                                                {txn.payment_date ? new Date(txn.payment_date).toLocaleTimeString() : ''}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="amount-positive">
                                                + {formatCurrency(txn.amount_paid)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${
                                                (txn.status === 'succeeded' || txn.status === 'paid') ? 'success' : 'warning'
                                            }`}>
                                                {txn.status || 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{textAlign:'center', padding:'30px', color: '#64748b'}}>
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuperFinance;