import { useState, useEffect } from 'react';
import platformService from '../../services/platformService';
import { DollarSign, Download, Calendar, CheckCircle } from 'lucide-react';
import './styles/super-finance.css';

const SuperFinance = () => {
    const [transactions, setTransactions] = useState([]);
    
    useEffect(() => {
        const fetchFinance = async () => {
            try {
                const data = await platformService.getTransactions();
                setTransactions(data);
            } catch (err) { console.error(err); }
        };
        fetchFinance();
    }, []);

    const totalCollected = transactions.reduce((acc, curr) => acc + parseFloat(curr.amount_paid), 0);

    const downloadCSV = () => {
        if (transactions.length === 0) return alert("No data to export");
        
        const headers = "Transaction ID,Hotel,Date,Status,Amount\n";
        const rows = transactions.map(txn => 
            `${txn.transaction_id},"${txn.hotel_name}",${new Date(txn.payment_date).toLocaleDateString()},${txn.status},${txn.amount_paid}`
        ).join("\n");
        
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Aurelia_Finances_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div>
            <h1 className="sa-page-title" style={{marginBottom: '10px'}}>Financial Ledger</h1>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Tracking 5% commission payments from Hotel Managers.</p>

            <div className="sa-finance-hero">
                <div>
                    <p className="sa-hero-label">Total Commissions Collected</p>
                    <h2 className="sa-hero-amount">${totalCollected.toLocaleString()}</h2>
                </div>
                <div className="sa-hero-icon">
                    <DollarSign size={32} color="#fbbf24"/>
                </div>
            </div>

            <div className="sa-table-card">
                <div className="sa-table-header">
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>Incoming Transactions</h3>
                    <button className="sa-btn-export" onClick={downloadCSV}>
                        <Download size={16}/> Export CSV
                    </button>
                </div>
                
                <table className="sa-table">
                    <thead>
                        <tr>
                            <th>Transaction ID</th>
                            <th>Hotel Source</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th style={{textAlign: 'right'}}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No transactions recorded yet.</td></tr>
                        ) : (
                            transactions.map((txn, index) => (
                                <tr key={txn.id || index}>
                                    <td className="sa-txn-id">{txn.transaction_id}</td>
                                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{txn.hotel_name}</td>
                                    <td>
                                        <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={14}/> {new Date(txn.payment_date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="sa-status-success">
                                            <CheckCircle size={12}/> {txn.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="sa-txn-amount">+${parseFloat(txn.amount_paid).toLocaleString()}</span>
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
export default SuperFinance;