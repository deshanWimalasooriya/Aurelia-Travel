import { useState, useEffect } from 'react';
import { 
    DollarSign, AlertTriangle, CheckCircle, TrendingUp, CreditCard, 
    History, Mail, MessageCircle, Download, Calendar, X 
} from 'lucide-react';
import './styles/manager-finance.css';

const ManagerFinance = () => {
  // --- MOCK DATA STATE ---
  const [stats, setStats] = useState({
    total_revenue: 125000,
    unpaid_commission: 6250, // 5% of Revenue
    net_income: 118750,
    has_overdue: true        // Simulating a warning
  });

  const [history, setHistory] = useState([
    { id: 1, date: '2025-12-01', items_covered: 120, total_amount: 4500, status: 'paid' },
    { id: 2, date: '2025-11-01', items_covered: 98, total_amount: 3200, status: 'paid' },
    { id: 3, date: '2025-10-01', items_covered: 110, total_amount: 4100, status: 'paid' },
  ]);

  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // --- ACTIONS ---

  // 1. Simulate Payment Process
  const handlePayment = () => {
    if (stats.unpaid_commission === 0) return;
    
    if(!window.confirm(`Confirm payment of $${stats.unpaid_commission.toLocaleString()} to Aurelia Travel?`)) return;
    
    setLoading(true);

    // Simulate Network Delay
    setTimeout(() => {
        // 1. Add new record to history
        const newRecord = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            items_covered: 45, // Mock count
            total_amount: stats.unpaid_commission,
            status: 'paid'
        };

        setHistory([newRecord, ...history]);

        // 2. Clear Debt
        setStats(prev => ({
            ...prev,
            unpaid_commission: 0,
            has_overdue: false
        }));

        setLoading(false);
        setPaymentSuccess(true);
        
        // Hide success toast after 3s
        setTimeout(() => setPaymentSuccess(false), 3000);
    }, 2000);
  };

  // 2. Simulate Invoice Download
  const handleDownloadInvoice = (date) => {
    alert(`Downloading Invoice_${date}.pdf...`);
  };

  return (
    <div className="finance-page fade-in">
      
      {/* HEADER SECTION */}
      <div className="finance-header-row">
        <div>
            <h1>Financial Hub</h1>
            <p>Manage earnings, pay platform fees, and view statements.</p>
        </div>
        <div className="contact-actions">
             <button className="btn-contact" onClick={() => window.location.href = 'mailto:support@aureliatravel.com'}>
                <Mail size={18} /> Email Support
             </button>
             <button className={`btn-contact ${showChat ? 'active' : 'primary'}`} onClick={() => setShowChat(!showChat)}>
                {showChat ? <X size={18}/> : <MessageCircle size={18} />} 
                {showChat ? 'Close Chat' : 'Live Chat'}
             </button>
        </div>
      </div>

      {/* MOCK CHAT BOX */}
      {showChat && (
          <div className="chat-box scale-up-center">
              <div className="chat-header">
                  <div className="chat-title">
                    <span className="online-dot"></span> Aurelia Support
                  </div>
                  <button onClick={() => setShowChat(false)}><X size={16}/></button>
              </div>
              <div className="chat-body">
                  <p className="msg-received">Hello! I'm Sarah from Aurelia. How can I help you with your finances today?</p>
              </div>
              <div className="chat-footer">
                  <input type="text" placeholder="Type a message..." />
                  <button>Send</button>
              </div>
          </div>
      )}

      {/* ALERT BANNER */}
      {stats.has_overdue && (
        <div className="alert-banner">
          <AlertTriangle size={20} />
          <div>
            <strong>Action Required:</strong> You have pending commissions older than 30 days.
            <div style={{fontSize:'0.85rem', opacity:0.9}}>Please settle your balance to maintain full access to booking features.</div>
          </div>
        </div>
      )}

      {/* STATS GRID */}
      <div className="stats-grid">
        {/* Total Revenue */}
        <div className="stat-card revenue-card">
          <div className="icon-wrapper bg-green">
            <TrendingUp size={24} color="#10b981" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Booking Revenue</span>
            <h2 className="stat-value">${stats.total_revenue.toLocaleString()}</h2>
            <span className="stat-sub">Gross income before fees</span>
          </div>
        </div>

        {/* Commission Due */}
        <div className={`stat-card commission-card ${stats.unpaid_commission > 0 ? 'active-debt' : ''}`}>
          <div className="icon-wrapper bg-orange">
            <DollarSign size={24} color="#f59e0b" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Commission Due (5%)</span>
            <h2 className="stat-value">${stats.unpaid_commission.toLocaleString()}</h2>
            <span className="stat-sub">Payable to Aurelia Travel</span>
          </div>
          
          {stats.unpaid_commission > 0 ? (
            <button className="pay-btn" onClick={handlePayment} disabled={loading}>
              {loading ? (
                  <>Processing...</> 
              ) : ( 
                  <>Pay Now <CreditCard size={16} /></> 
              )}
            </button>
          ) : (
             <div className="paid-badge"><CheckCircle size={16} /> All Settled</div>
          )}
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {paymentSuccess && (
          <div className="success-toast">
              <CheckCircle size={20} /> 
              <span>Payment Successful! Your balance is now clear.</span>
          </div>
      )}

      {/* HISTORY TABLE */}
      <div className="history-section">
        <div className="section-header">
            <h3><History size={20} /> Payment History</h3>
            <button className="btn-text" onClick={() => alert("Simulating CSV Export...")}>
                <Download size={16} /> Export CSV
            </button>
        </div>
        
        <div className="table-responsive">
            <table className="finance-table">
                <thead>
                    <tr>
                        <th>Date Paid</th>
                        <th>Bookings Covered</th>
                        <th>Amount Paid</th>
                        <th>Status</th>
                        <th>Invoice</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((item) => (
                        <tr key={item.id}>
                            <td>
                                <div className="date-cell">
                                    <Calendar size={14} />
                                    {item.date}
                                </div>
                            </td>
                            <td>{item.items_covered} bookings</td>
                            <td className="amount-cell">${item.total_amount.toLocaleString()}</td>
                            <td><span className="status-badge paid">Paid</span></td>
                            <td>
                                <button className="btn-icon" title="Download Invoice" onClick={() => handleDownloadInvoice(item.date)}>
                                    <Download size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};

export default ManagerFinance;