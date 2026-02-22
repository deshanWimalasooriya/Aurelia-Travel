import { useState, useEffect, useRef } from 'react';
import api from '../../services/api'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
    DollarSign, AlertTriangle, CheckCircle, TrendingUp, CreditCard, 
    History, Mail, MessageCircle, Download, Calendar, X,
    Lock, ChevronRight, RefreshCw, Send, Paperclip, CheckCheck
} from 'lucide-react';
import './styles/manager-finance.css';

const ManagerFinance = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_revenue: 0, unpaid_commission: 0, pending_bookings_count: 0, has_overdue: false });
  const [history, setHistory] = useState([]);
  
  // Chat States
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
      { id: 1, text: "Hello! Our finance support team is online. How can we help you regarding your payouts or commissions today?", sender: 'support', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
  ]);

  const [paymentStep, setPaymentStep] = useState(0); 
  const [selectedMethod, setSelectedMethod] = useState('card-saved');
  const [otp, setOtp] = useState(['', '', '', '']); 
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchFinanceData = async () => {
    try {
        const response = await api.get('/finance/dashboard');
        const data = response.data;
        if (data.success) { setStats(data.stats); setHistory(data.history); }
    } catch (error) { console.error("Error fetching finance data:", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFinanceData(); }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
      if (showChat) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
  }, [messages, showChat]);

  const handleSendMessage = (e) => {
      e.preventDefault();
      if (!newMessage.trim()) return;
      
      // Add user message
      const userMsg = { 
          id: Date.now(), text: newMessage, sender: 'me', 
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
      };
      setMessages(prev => [...prev, userMsg]);
      setNewMessage("");

      // Simulate Agent Reply
      setTimeout(() => {
          const botMsg = {
              id: Date.now() + 1,
              text: "Thanks for reaching out! An agent is reviewing your account and will reply shortly.",
              sender: 'support',
              time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          };
          setMessages(prev => [...prev, botMsg]);
      }, 1500);
  };

  const initiatePayment = () => { if (stats.unpaid_commission > 0) setPaymentStep(1); };
  const handleMethodConfirm = () => setPaymentStep(2);

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling && element.value) element.nextSibling.focus();
  };

  const handleFinalPayment = async () => {
    if (otp.join('').length < 4) { alert("Please enter the 4-digit code."); return; }
    setPaymentStep(3); 
    try {
        const result = await api.post('/finance/pay', { transaction_id: `TXN-${Date.now()}`, provider: 'credit_card' });
        if (result.data.success) {
            setPaymentSuccess(true); setPaymentStep(0); setOtp(['', '', '', '']);
            fetchFinanceData(); setTimeout(() => setPaymentSuccess(false), 5000);
        } else {
            alert("Payment Failed: " + (result.data.message || result.data.error)); setPaymentStep(2); 
        }
    } catch (error) { alert(error.response?.data?.message || "Network Error. Please try again."); setPaymentStep(2); }
  };

  if (loading) return <div className="mf-loading"><RefreshCw className="mf-spin"/> Loading Financials...</div>;

  return (
    <div className="mf-page fade-in">
      <div className="mf-header-row">
        <div>
            <h1>Financial Hub</h1>
            <p>Manage earnings, pay platform fees ({stats.current_rate || 0}%), and view statements.</p>
        </div>
        <div className="mf-contact-actions">
             <button className="mf-btn-ghost" onClick={() => window.location.href = 'mailto:support@aureliatravel.com'}>
                <Mail size={18} /> Email Support
             </button>
             <button className="mf-btn-primary" onClick={() => setShowChat(!showChat)}>
                {showChat ? <X size={18}/> : <MessageCircle size={18} />} {showChat ? 'Close Chat' : 'Live Chat'}
             </button>
        </div>
      </div>

      {paymentStep > 0 && (
          <div className="sa-modal-overlay">
              <div className="sa-modal-content narrow-modal scale-up-center">
                  <div className="sa-modal-header">
                      <h3>{paymentStep === 1 ? "Select Payment Method" : paymentStep === 2 ? "Security Verification" : "Processing Payment"}</h3>
                      {paymentStep < 3 && <button className="sa-btn-close" onClick={() => setPaymentStep(0)}><X size={20}/></button>}
                  </div>
                  <div className="sa-modal-body">
                      {paymentStep === 1 && (
                          <div className="mf-method-selection">
                              <p className="mf-modal-desc">
                                  Total Due: <strong>${parseFloat(stats.unpaid_commission || 0).toLocaleString()}</strong><br/>
                                  <small>Covering {stats.pending_bookings_count} bookings</small>
                              </p>
                              <label className={`mf-method-option ${selectedMethod === 'card-saved' ? 'selected' : ''}`}>
                                  <input type="radio" name="method" checked={selectedMethod === 'card-saved'} onChange={() => setSelectedMethod('card-saved')} />
                                  <div className="mf-method-icon"><CreditCard size={20}/></div>
                                  <div className="mf-method-info"><span>Visa ending in 4242</span><small>Expires 12/28</small></div>
                              </label>
                              <button className="mf-btn-submit" onClick={handleMethodConfirm}>Continue <ChevronRight size={18} /></button>
                          </div>
                      )}
                      {paymentStep === 2 && (
                          <div className="mf-otp-verification">
                              <div className="mf-otp-icon"><Lock size={24} /></div>
                              <p>Enter 4-digit code</p>
                              <div className="mf-otp-inputs">
                                  {otp.map((digit, index) => <input key={index} type="text" maxLength="1" value={digit} onChange={e => handleOtpChange(e.target, index)} />)}
                              </div>
                              <button className="mf-btn-submit" onClick={handleFinalPayment}>Confirm Payment <CheckCircle size={18} /></button>
                          </div>
                      )}
                      {paymentStep === 3 && (
                          <div className="mf-processing-state"><div className="mf-spinner"></div><p>Processing payment...</p></div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {stats.has_overdue && (
        <div className="mf-alert-banner">
          <AlertTriangle size={20} />
          <div><strong>Action Required:</strong> You have pending commissions older than 30 days.</div>
        </div>
      )}

      <div className="mf-stats-grid">
        <div className="mf-stat-card">
          <div className="mf-icon-wrapper bg-green"><TrendingUp size={24} /></div>
          <div className="mf-stat-info">
    {/* Update the hardcoded 5% to use the state variable */}
            <span className="mf-stat-label">Commission Due ({stats.current_rate}%)</span>
            <h2 className="mf-stat-value">${parseFloat(stats.unpaid_commission || 0).toLocaleString()}</h2>
            <span className="mf-stat-sub">{stats.pending_bookings_count} bookings pending payment</span>
        </div>
        </div>
        <div className={`mf-stat-card ${stats.unpaid_commission > 0 ? 'active-debt' : ''}`}>
          <div className="mf-icon-wrapper bg-orange"><DollarSign size={24} /></div>
          <div className="mf-stat-info">
            <span className="mf-stat-label">Commission Due ({stats.current_rate}%)</span>
            <h2 className="mf-stat-value">${parseFloat(stats.unpaid_commission || 0).toLocaleString()}</h2>
            <span className="mf-stat-sub">{stats.pending_bookings_count} bookings pending payment</span>
          </div>
          {stats.unpaid_commission > 0 ? (
            <button className="mf-pay-btn" onClick={initiatePayment}>Pay Now <CreditCard size={16} /></button>
          ) : (
             <div className="mf-paid-badge"><CheckCircle size={16} /> All Settled</div>
          )}
        </div>
      </div>

      <div className="sa-table-card">
        <div className="mf-section-header">
            <h3><History size={18} style={{marginRight: 8, display:'inline'}}/> Payment History</h3>
        </div>
        <table className="modern-table">
            <thead>
                <tr><th>Date Paid</th><th>Bookings</th><th>Amount</th><th>Status</th><th>Receipt</th></tr>
            </thead>
            <tbody>
                {history.length === 0 ? (
                    <tr><td colSpan="5" style={{textAlign: 'center', padding: '30px', color:'var(--text-muted)'}}>No payment history.</td></tr>
                ) : (
                    history.map((item) => (
                        <tr key={item.id}>
                            <td className="mf-date-cell"><Calendar size={14} />{new Date(item.paid_at).toLocaleDateString()}</td>
                            <td>{item.bookings_count} bookings</td>
                            <td className="mf-amount-cell">${parseFloat(item.amount_paid).toLocaleString()}</td>
                            <td><span className="mf-status-badge">Paid</span></td>
                            <td><button className="mf-icon-btn"><Download size={16} /></button></td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {paymentSuccess && (
          <div className="mf-success-toast">
              <CheckCircle size={20} /> 
              <div><strong>Payment Successful!</strong><div style={{fontSize: '0.8rem', opacity: 0.9}}>Database Updated.</div></div>
          </div>
      )}

    </div>
  );
};
export default ManagerFinance;