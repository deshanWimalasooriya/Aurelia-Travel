import { useState } from 'react';
import { 
    DollarSign, AlertTriangle, CheckCircle, TrendingUp, CreditCard, 
    History, Mail, MessageCircle, Download, Calendar, X,
    Smartphone, Lock, ChevronRight
} from 'lucide-react';
import './styles/manager-finance.css';

const ManagerFinance = () => {
  // --- MOCK DATA STATE ---
  const [stats, setStats] = useState({
    total_revenue: 125000,
    unpaid_commission: 6250, 
    net_income: 118750,
    has_overdue: true
  });

  const [history, setHistory] = useState([
    { id: 1, date: '2025-12-01', items_covered: 120, total_amount: 4500, status: 'paid' },
    { id: 2, date: '2025-11-01', items_covered: 98, total_amount: 3200, status: 'paid' },
    { id: 3, date: '2025-10-01', items_covered: 110, total_amount: 4100, status: 'paid' },
  ]);

  // --- UI STATE ---
  const [showChat, setShowChat] = useState(false);
  
  // --- PAYMENT FLOW STATE ---
  const [paymentStep, setPaymentStep] = useState(0); // 0: Closed, 1: Method, 2: OTP, 3: Processing
  const [selectedMethod, setSelectedMethod] = useState('card-saved');
  const [otp, setOtp] = useState(['', '', '', '']); // 4-digit OTP
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // --- ACTIONS ---

  // Step 1: Open Payment Modal
  const initiatePayment = () => {
    if (stats.unpaid_commission > 0) {
        setPaymentStep(1); // Go to Method Selection
    }
  };

  // Step 2: Handle Method Selection & Request OTP
  const handleMethodConfirm = () => {
      // Simulate sending OTP
      setPaymentStep(2); // Go to OTP
  };

  // OTP Input Handler
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-focus next input
    if (element.nextSibling && element.value) {
        element.nextSibling.focus();
    }
  };

  // Step 3: Verify OTP & Process Payment
  const handleFinalPayment = () => {
    // Check if OTP is filled (mock check)
    if (otp.join('').length < 4) {
        alert("Please enter the valid 4-digit code sent to your email.");
        return;
    }

    setPaymentStep(3); // Show Processing Spinner inside Modal

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

        // 3. Reset Flow & Show Success
        setPaymentStep(0); 
        setOtp(['', '', '', '']);
        setPaymentSuccess(true);
        setTimeout(() => setPaymentSuccess(false), 4000);

    }, 2500);
  };

  // Simulate Invoice Download
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

      {/* --- PAYMENT MODAL (Multi-Step) --- */}
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
                      {/* STEP 1: SELECT METHOD */}
                      {paymentStep === 1 && (
                          <div className="method-selection">
                              <p className="modal-desc">Total Due: <strong>${stats.unpaid_commission.toLocaleString()}</strong></p>
                              
                              <label className={`method-option ${selectedMethod === 'card-saved' ? 'selected' : ''}`}>
                                  <input type="radio" name="method" checked={selectedMethod === 'card-saved'} onChange={() => setSelectedMethod('card-saved')} />
                                  <div className="method-icon"><CreditCard size={20}/></div>
                                  <div className="method-info">
                                      <span>Visa ending in 4242</span>
                                      <small>Expires 12/28</small>
                                  </div>
                              </label>

                              <label className={`method-option ${selectedMethod === 'card-new' ? 'selected' : ''}`}>
                                  <input type="radio" name="method" checked={selectedMethod === 'card-new'} onChange={() => setSelectedMethod('card-new')} />
                                  <div className="method-icon"><CreditCard size={20}/></div>
                                  <div className="method-info">
                                      <span>Use a new card</span>
                                      <small>Credit or Debit</small>
                                  </div>
                              </label>

                              <button className="btn-primary-full" onClick={handleMethodConfirm}>
                                  Continue <ChevronRight size={18} />
                              </button>
                          </div>
                      )}

                      {/* STEP 2: OTP VERIFICATION */}
                      {paymentStep === 2 && (
                          <div className="otp-verification">
                              <div className="otp-icon-circle"><Lock size={24} /></div>
                              <p>Enter the 4-digit code sent to <strong>man***@hotel.com</strong></p>
                              
                              <div className="otp-inputs">
                                  {otp.map((digit, index) => (
                                      <input 
                                          key={index}
                                          type="text" 
                                          maxLength="1" 
                                          value={digit} 
                                          onChange={e => handleOtpChange(e.target, index)}
                                          onFocus={e => e.target.select()}
                                      />
                                  ))}
                              </div>

                              <button className="btn-primary-full" onClick={handleFinalPayment}>
                                  Confirm Payment <CheckCircle size={18} />
                              </button>
                              <button className="btn-link" onClick={() => setPaymentStep(1)}>Change Method</button>
                          </div>
                      )}

                      {/* STEP 3: PROCESSING SPINNER */}
                      {paymentStep === 3 && (
                          <div className="processing-state">
                              <div className="spinner"></div>
                              <p>Securely processing your payment...</p>
                              <small>Please do not close this window.</small>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

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
                  <p className="msg-received">Hello! I'm Sarah. Need help with the new payment system?</p>
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
            <span className="stat-sub">Gross income</span>
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
            <span className="stat-sub">Payable to Aurelia</span>
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

      {/* SUCCESS TOAST */}
      {paymentSuccess && (
          <div className="success-toast">
              <CheckCircle size={20} /> 
              <div>
                  <strong>Payment Successful!</strong>
                  <div style={{fontSize: '0.8rem', opacity: 0.9}}>Transaction ID: #TXN-{Math.floor(Math.random()*10000)}</div>
              </div>
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