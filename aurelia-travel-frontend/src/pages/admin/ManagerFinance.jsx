import { useState, useEffect } from 'react';
import { 
    DollarSign, AlertTriangle, CheckCircle, TrendingUp, CreditCard, 
    History, Mail, MessageCircle, Download, Calendar, X,
    Lock, ChevronRight, RefreshCw
} from 'lucide-react';
import './styles/manager-finance.css';

const ManagerFinance = () => {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_revenue: 0,
    unpaid_commission: 0, 
    pending_bookings_count: 0,
    has_overdue: false
  });
  const [history, setHistory] = useState([]);
  
  // UI State
  const [showChat, setShowChat] = useState(false);
  
  // Payment Flow State
  const [paymentStep, setPaymentStep] = useState(0); // 0: Closed, 1: Method, 2: OTP, 3: Processing
  const [selectedMethod, setSelectedMethod] = useState('card-saved');
  const [otp, setOtp] = useState(['', '', '', '']); 
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // --- FETCH DATA (ROBUST VERSION) ---
  const fetchFinanceData = async () => {
    try {
        const token = localStorage.getItem('token');
        
        // We send BOTH credentials (cookie) and Authorization header (localStorage)
        // This ensures it works regardless of your browser/server strictness
        const response = await fetch('http://localhost:5000/api/finance/dashboard', {
            method: 'GET',
            credentials: 'include', 
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });

        if (response.status === 401) {
            console.error("Unauthorized: Please log in again.");
            // Optional: window.location.href = '/login'; 
            setLoading(false);
            return;
        }

        const data = await response.json();
        
        if (data.success) {
            setStats(data.stats);
            setHistory(data.history);
        }
    } catch (error) {
        console.error("Error fetching finance data:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // --- ACTIONS ---

  const initiatePayment = () => {
    if (stats.unpaid_commission > 0) {
        setPaymentStep(1); 
    }
  };

  const handleMethodConfirm = () => {
      setPaymentStep(2); // Go to OTP
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling && element.value) element.nextSibling.focus();
  };

  // --- PROCESS PAYMENT ---
  const handleFinalPayment = async () => {
    if (otp.join('').length < 4) {
        alert("Please enter the 4-digit code.");
        return;
    }

    setPaymentStep(3); // Show Spinner

    try {
        const token = localStorage.getItem('token');

        const response = await fetch('http://localhost:5000/api/finance/pay', {
            method: 'POST',
            credentials: 'include',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                transaction_id: `TXN-${Date.now()}`, 
                provider: 'credit_card'
            })
        });

        const result = await response.json();

        if (result.success) {
            setPaymentSuccess(true);
            setPaymentStep(0); 
            setOtp(['', '', '', '']);
            
            // Refresh Data
            fetchFinanceData();
            
            setTimeout(() => setPaymentSuccess(false), 5000);
        } else {
            alert("Payment Failed: " + (result.message || result.error));
            setPaymentStep(2); 
        }

    } catch (error) {
        console.error("Payment Error:", error);
        alert("Network Error. Please try again.");
        setPaymentStep(2);
    }
  };

  const handleDownloadInvoice = (id) => {
    alert(`Downloading Invoice #${id}...`);
  };

  if (loading) return <div className="loading-screen"><RefreshCw className="spin"/> Loading Financials...</div>;

  return (
    <div className="finance-page fade-in">
      
      {/* HEADER SECTION */}
      <div className="finance-header-row">
        <div>
            <h1>Financial Hub</h1>
            <p>Manage earnings, pay platform fees (5%), and view statements.</p>
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

      {/* --- PAYMENT MODAL --- */}
      {paymentStep > 0 && (
          <div className="modal-overlay">
              <div className="payment-modal scale-up-center">
                  <div className="modal-header">
                      <h3>
                          {paymentStep === 1 && "Select Payment Method"}
                          {paymentStep === 2 && "Security Verification"}
                          {paymentStep === 3 && "Processing Payment"}
                      </h3>
                      {paymentStep < 3 && <button onClick={() => setPaymentStep(0)}><X size={20}/></button>}
                  </div>

                  <div className="modal-body">
                      {paymentStep === 1 && (
                          <div className="method-selection">
                              <p className="modal-desc">
                                  Total Due: <strong>${parseFloat(stats.unpaid_commission || 0).toLocaleString()}</strong>
                                  <br/>
                                  <small className="text-muted">Covering {stats.pending_bookings_count} bookings</small>
                              </p>
                              
                              <label className={`method-option ${selectedMethod === 'card-saved' ? 'selected' : ''}`}>
                                  <input type="radio" name="method" checked={selectedMethod === 'card-saved'} onChange={() => setSelectedMethod('card-saved')} />
                                  <div className="method-icon"><CreditCard size={20}/></div>
                                  <div className="method-info">
                                      <span>Visa ending in 4242</span>
                                      <small>Expires 12/28</small>
                                  </div>
                              </label>

                              <button className="btn-primary-full" onClick={handleMethodConfirm}>
                                  Continue <ChevronRight size={18} />
                              </button>
                          </div>
                      )}

                      {paymentStep === 2 && (
                          <div className="otp-verification">
                              <div className="otp-icon-circle"><Lock size={24} /></div>
                              <p>Enter 4-digit mock code (Any 4 digits)</p>
                              <div className="otp-inputs">
                                  {otp.map((digit, index) => (
                                      <input key={index} type="text" maxLength="1" value={digit} onChange={e => handleOtpChange(e.target, index)} />
                                  ))}
                              </div>
                              <button className="btn-primary-full" onClick={handleFinalPayment}>
                                  Confirm Payment <CheckCircle size={18} />
                              </button>
                          </div>
                      )}

                      {paymentStep === 3 && (
                          <div className="processing-state">
                              <div className="spinner"></div>
                              <p>Updating records and generating invoice...</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* ALERT BANNER */}
      {stats.has_overdue && (
        <div className="alert-banner">
          <AlertTriangle size={20} />
          <div><strong>Action Required:</strong> You have pending commissions older than 30 days.</div>
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
            <h2 className="stat-value">${parseFloat(stats.total_revenue || 0).toLocaleString()}</h2>
            <span className="stat-sub">Gross income from completed stays</span>
          </div>
        </div>

        {/* Commission Due */}
        <div className={`stat-card commission-card ${stats.unpaid_commission > 0 ? 'active-debt' : ''}`}>
          <div className="icon-wrapper bg-orange">
            <DollarSign size={24} color="#f59e0b" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Commission Due (5%)</span>
            <h2 className="stat-value">${parseFloat(stats.unpaid_commission || 0).toLocaleString()}</h2>
            <span className="stat-sub">{stats.pending_bookings_count} bookings pending payment</span>
          </div>
          
          {stats.unpaid_commission > 0 ? (
            <button className="pay-btn" onClick={initiatePayment}>
               Pay Now <CreditCard size={16} />
            </button>
          ) : (
             <div className="paid-badge"><CheckCircle size={16} /> All Settled</div>
          )}
        </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="history-section">
        <div className="section-header">
            <h3><History size={20} /> Payment History</h3>
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
                    {history.length === 0 ? (
                        <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No payment history found.</td></tr>
                    ) : (
                        history.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <div className="date-cell">
                                        <Calendar size={14} />
                                        {new Date(item.paid_at).toLocaleDateString()}
                                    </div>
                                </td>
                                <td>{item.bookings_count} bookings</td>
                                <td className="amount-cell">${parseFloat(item.amount_paid).toLocaleString()}</td>
                                <td><span className="status-badge paid">Paid</span></td>
                                <td>
                                    <button className="btn-icon" onClick={() => handleDownloadInvoice(item.id)}>
                                        <Download size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {paymentSuccess && (
          <div className="success-toast">
              <CheckCircle size={20} /> 
              <div>
                  <strong>Payment Successful!</strong>
                  <div style={{fontSize: '0.8rem', opacity: 0.9}}>Database Updated.</div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ManagerFinance;