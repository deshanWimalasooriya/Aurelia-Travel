import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Download, DollarSign, TrendingUp, CreditCard, Calendar, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
            // 1. Fetch Transaction History (List)
            const transRes = await api.get('/admin/finance');
            if (transRes.data.success) {
                setTransactions(transRes.data.data);
            }

            // 2. Fetch High-Level Summary (Calculated from Analytics)
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
        const headers = ["ID", "Hotel", "Manager", "Amount", "Date", "Status"];
        const rows = transactions.map(t => [
            t.id, t.hotel_name, t.manager_name, t.amount_paid, new Date(t.payment_date).toLocaleDateString(), t.status
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "platform_finance.csv");
        document.body.appendChild(link);
        link.click();
    };

    const filtered = transactions.filter(t => 
        (t.hotel_name && t.hotel_name.toLowerCase().includes(search.toLowerCase())) ||
        (t.transaction_reference && t.transaction_reference.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div>
            <div className="sa-header-row">
                <div>
                    <h1 className="sa-page-title" style={{marginBottom:'5px'}}>Financial Overview</h1>
                    <p style={{margin:0, color:'#64748b', fontSize:'0.9rem'}}>Track platform revenue and commission payments.</p>
                </div>
                <button className="sa-btn-export" onClick={exportCSV} disabled={transactions.length === 0}>
                    <Download size={18}/> Export CSV
                </button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="finance-cards-grid">
                <div className="f-card bg-blue">
                    <div className="f-icon"><DollarSign size={24}/></div>
                    <div>
                        <p className="f-label">Total Booking Value</p>
                        <h3 className="f-value">${summary.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                    </div>
                </div>
                <div className="f-card bg-green">
                    <div className="f-icon"><TrendingUp size={24}/></div>
                    <div>
                        <p className="f-label">Total Commission</p>
                        <h3 className="f-value">${summary.totalCommission.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
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
                            placeholder="Search hotel or ref ID..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

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
                            <tr><td colSpan="5" style={{textAlign:'center', padding:'40px'}}><Loader2 className="animate-spin"/> Loading...</td></tr>
                        ) : filtered.length > 0 ? (
                            filtered.map(txn => (
                                <tr key={txn.id}>
                                    <td>
                                        <div className="txn-ref">
                                            <span className="ref-id">{txn.transaction_reference || `TXN-${txn.id}`}</span>
                                            <span className="txn-type">Commission Payout</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="txn-hotel">{txn.hotel_name}</div>
                                        <div className="txn-manager">{txn.manager_email}</div>
                                    </td>
                                    <td>
                                        <div className="txn-date"><Calendar size={12}/> {new Date(txn.payment_date).toLocaleDateString()}</div>
                                        <div className="txn-time">{new Date(txn.payment_date).toLocaleTimeString()}</div>
                                    </td>
                                    <td>
                                        <span className="amount-positive">+ ${parseFloat(txn.amount_paid).toFixed(2)}</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${txn.status === 'succeeded' || txn.status === 'paid' ? 'success' : 'pending'}`}>
                                            {txn.status || 'Paid'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" style={{textAlign:'center', padding:'30px', color: '#64748b'}}>No transactions found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SuperFinance;