import { useState, useEffect } from 'react';
import { useUser } from '../context/userContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  CreditCard, Wallet, Receipt, User, Shield, Users, 
  Sliders, Mail, Briefcase, Heart, MessageSquare, 
  HelpCircle, ShieldCheck, Scale, FileText, Home, 
  ChevronRight, Loader2, Camera, Check, Plus, Trash2, 
  AlertTriangle, Download, LogOut, CheckCircle2
} from 'lucide-react'; 
import './styles/profile.css';

export default function Profile() {
  const { user, refreshUser } = useUser();
  const navigate = useNavigate();
  
  // --- View Navigation State ---
  const [currentView, setCurrentView] = useState('directory');
  
  // Loading & Actions state
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Email Verification States
  const [isResending, setIsResending] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState({ text: '', type: '' });

  // WhatsApp States
// const [phoneInput, setPhoneInput] = useState(user?.phone || '');
// const [whatsappOtp, setWhatsappOtp] = useState('');
// const [showOtpInput, setShowOtpInput] = useState(false);
// const [isRequestingOtp, setIsRequestingOtp] = useState(false);
// const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
// const [whatsappMessage, setWhatsappMessage] = useState({ text: '', type: '' });

  // 2FA States
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState({ url: '', secret: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Form & Toggle States
  const [profileData, setProfileData] = useState({
    username: '', email: '', password: '', address_line_1: '', city: '', country: ''
  });
  const [paymentData, setPaymentData] = useState({
    card_type: '', card_number: '', cvv: '', expiry_date: ''
  });
  
  // Mock States for new sections
  const [emailPrefs, setEmailPrefs] = useState({ promos: true, bookings: true, account: true });
  const [twoFactor, setTwoFactor] = useState(false);
  const [companions, setCompanions] = useState([
      { id: 1, name: 'Jane Doe', relation: 'Spouse', dob: '1990-05-15' }
  ]);

  // --- ACTIONS ---

  const handleResendEmail = async () => {
    setIsResending(true);
    setVerifyMessage({ text: '', type: '' });

    try {
        const response = await api.post('/auth/resend-verification');
        setVerifyMessage({ text: response.data.message, type: 'success' });
    } catch (error) {
        setVerifyMessage({ 
            text: error.response?.data?.message || 'Failed to resend email.', 
            type: 'error' 
        });
    } finally {
        setIsResending(false);
    }
  };

  const handleToggle2FA = async () => {
      if (twoFactor) {
          if(window.confirm("Are you sure you want to disable 2FA? This makes your account less secure.")) {
              // Call your API to disable, then: setTwoFactor(false);
          }
          return;
      }

      try {
          const res = await api.post('/auth/2fa/generate');
          if (res.data.success) {
              setQrCodeData({ url: res.data.qrCodeUrl, secret: res.data.secret });
              setShowTwoFactorModal(true); 
          }
      } catch (err) {
          alert("Could not generate 2FA code.");
      }
  };

  const confirmEnable2FA = async () => {
      setIsVerifying(true);
      try {
          const res = await api.post('/auth/2fa/verify-enable', {
              secret: qrCodeData.secret,
              token: verificationCode
          });
          
          if (res.data.success) {
              setTwoFactor(true);
              setShowTwoFactorModal(false);
              setVerificationCode('');
              alert("Two-Factor Authentication is now enabled!");
          }
      } catch (err) {
          alert(err.response?.data?.message || "Invalid code. Try again.");
      } finally {
          setIsVerifying(false);
      }
  };

//   const handleRequestWhatsAppOTP = async () => {
//     setIsRequestingOtp(true);
//     setWhatsappMessage({ text: '', type: '' });
//     try {
//         const response = await api.post('/auth/whatsapp/request-otp', { phone: phoneInput });
//         setShowOtpInput(true);
//         setWhatsappMessage({ text: response.data.message, type: 'success' });
//     } catch (error) {
//         setWhatsappMessage({ text: error.response?.data?.message || 'Failed to send OTP.', type: 'error' });
//     } finally {
//         setIsRequestingOtp(false);
//     }
// };

// const handleVerifyWhatsAppOTP = async () => {
//     setIsVerifyingOtp(true);
//     setWhatsappMessage({ text: '', type: '' });
//     try {
//         const response = await api.post('/auth/whatsapp/verify-otp', { otp: whatsappOtp });
//         await refreshUser(); // Update the context so the badge turns green
//         setShowOtpInput(false);
//         setWhatsappMessage({ text: response.data.message, type: 'success' });
//     } catch (error) {
//         setWhatsappMessage({ text: error.response?.data?.message || 'Invalid OTP.', type: 'error' });
//     } finally {
//         setIsVerifyingOtp(false);
//     }
// };

  useEffect(() => {
    if (user) {
        setProfileData({
            username: user.username || user.first_name || '', 
            email: user.email || '',
            password: '', 
            address_line_1: user.address_line_1 || '', 
            city: user.city || '', 
            country: user.country || ''
        });
    }
  }, [user]);

  const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      try {
          const uploadRes = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          if (uploadRes.data.success) {
              await api.put(`/users/${user.id || user._id}`, { profile_image: uploadRes.data.url });
              await refreshUser();
          }
      } catch (err) { alert("Failed to upload image."); } 
      finally { setUploadingImage(false); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const payload = { ...profileData };
      if (!payload.password) delete payload.password;
      await api.put(`/users/${user.id || user._id}`, payload);
      await refreshUser(); 
      setCurrentView('directory');
    } catch (err) { alert("Failed to update profile."); } 
    finally { setLoadingProfile(false); }
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setLoadingPayment(true);
    try {
        const cleanNumber = paymentData.card_number.replace(/\s/g, '');
        await api.put(`/users/${user.id || user._id}`, { 
            card_type: paymentData.card_type, card_number: cleanNumber, cvv: paymentData.cvv, expiry_date: paymentData.expiry_date 
        });
        await refreshUser();
        setCurrentView('directory');
    } catch (err) { alert("Failed to save card"); } 
    finally { setLoadingPayment(false); }
  };

  if (!user) return <div className="profile-not-logged-in">Please sign in.</div>;

  // --- DIRECTORY CONFIGURATION ---
  const directory = [
    {
      title: "Payment info",
      items: [
        { icon: <Wallet size={18} strokeWidth={1.5}/>, label: "Rewards & Wallet", action: () => setCurrentView('rewards_wallet') },
        { icon: <CreditCard size={18} strokeWidth={1.5}/>, label: "Payment methods", action: () => setCurrentView('payment_methods') },
        { icon: <Receipt size={18} strokeWidth={1.5}/>, label: "Transactions", action: () => setCurrentView('transactions') }
      ]
    },
    {
      title: "Manage account",
      items: [
        { icon: <User size={18} strokeWidth={1.5}/>, label: "Personal details", action: () => setCurrentView('personal_details') },
        { icon: <Shield size={18} strokeWidth={1.5}/>, label: "Security settings", action: () => setCurrentView('security_settings') },
        { icon: <Users size={18} strokeWidth={1.5}/>, label: "Other travelers", action: () => setCurrentView('travel_companions') }
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: <Sliders size={18} strokeWidth={1.5}/>, label: "Customization preferences", action: () => setCurrentView('customization') },
        { icon: <Mail size={18} strokeWidth={1.5}/>, label: "Email preferences", action: () => setCurrentView('email_preferences') }
      ]
    },
    {
      title: "Travel activity",
      items: [
        { icon: <Briefcase size={18} strokeWidth={1.5}/>, label: "Bookings & Trips", link: "/my-bookings" },
        { icon: <Heart size={18} strokeWidth={1.5}/>, label: "Saved lists", link: "/wishlist" },
        { icon: <MessageSquare size={18} strokeWidth={1.5}/>, label: "My reviews", link: "/my-reviews" }
      ]
    },
    {
      title: "Help and support",
      items: [
        { icon: <HelpCircle size={18} strokeWidth={1.5}/>, label: "Contact Customer Service", link: "/contact" },
        { icon: <ShieldCheck size={18} strokeWidth={1.5}/>, label: "Safety resource center", action: () => setCurrentView('safety_center') },
        { icon: <Scale size={18} strokeWidth={1.5}/>, label: "Dispute resolution", action: () => setCurrentView('disputes') }
      ]
    },
    {
      title: "Legal and privacy",
      items: [
        { icon: <ShieldCheck size={18} strokeWidth={1.5}/>, label: "Privacy and data management", action: () => setCurrentView('privacy') },
        { icon: <FileText size={18} strokeWidth={1.5}/>, label: "Content guidelines", action: () => setCurrentView('guidelines') }
      ]
    }
  ];

  if (user.role !== 'hotel_manager' && user.role !== 'admin') {
      directory.push({
          title: "Manage your property",
          items: [ { icon: <Home size={18} strokeWidth={1.5}/>, label: "List your property", link: "/list-property" } ]
      });
  }

  const getViewTitle = () => {
      const titles = {
          'personal_details': 'Personal Details',
          'payment_methods': 'Payment Methods',
          'rewards_wallet': 'Rewards & Wallet',
          'transactions': 'Transaction History',
          'security_settings': 'Security Settings',
          'travel_companions': 'Travel Companions',
          'customization': 'Customization Preferences',
          'email_preferences': 'Email Preferences',
          'safety_center': 'Safety Resource Center',
          'disputes': 'Dispute Resolution',
          'privacy': 'Privacy & Data',
          'guidelines': 'Content Guidelines'
      };
      return titles[currentView] || '';
  };

  const BackButton = () => (
      <button type="button" className="btn-ghost" onClick={() => setCurrentView('directory')} style={{marginTop: '30px'}}>
          ← Back to Directory
      </button>
  );

  return (
    <div className="profile-page-wrapper">
      <div className="container profile-hub-container">
        
        {/* --- USER HEADER --- */}
        <div className="profile-hub-header">
            <div className="hub-avatar-wrapper">
                {uploadingImage ? (
                    <div className="hub-avatar loading"><Loader2 className="animate-spin" /></div>
                ) : user.profile_image ? (
                    <img src={user.profile_image} className="hub-avatar" alt="Profile" />
                ) : (
                    <div className="hub-avatar text">{user.username.charAt(0).toUpperCase()}</div>
                )}
                <label className="avatar-upload-btn" title="Change Avatar">
                    <Camera size={14} />
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} hidden/>
                </label>
            </div>
            <div className="hub-user-info">
                <h1>{user.username}</h1>
                <p>{user.email} • {user.country || 'Add your location'}</p>
            </div>
        </div>

        {/* --- DYNAMIC BREADCRUMB NAVIGATION --- */}
        <div className="breadcrumb-nav">
            <span className={`crumb-link ${currentView === 'directory' ? 'active' : ''}`} onClick={() => setCurrentView('directory')}>
                My Account
            </span>
            {currentView !== 'directory' && (
                <>
                    <ChevronRight size={16} className="crumb-separator" />
                    <span className="crumb-current">{getViewTitle()}</span>
                </>
            )}
        </div>

        <AnimatePresence mode="wait">
            
            {/* VIEW 0: MAIN DIRECTORY GRID */}
            {currentView === 'directory' && (
                <motion.div key="directory" className="profile-hub-grid"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                >
                    {directory.map((section, index) => (
                        <div key={index} className="hub-card">
                            <h3>{section.title}</h3>
                            <div className="hub-list">
                                {section.items.map((item, i) => (
                                    item.link ? (
                                        <Link to={item.link} key={i} className="hub-item">
                                            <div className="hub-item-left"><span className="hub-icon">{item.icon}</span><span className="hub-label">{item.label}</span></div>
                                            <ChevronRight size={18} className="hub-chevron" strokeWidth={1.5} />
                                        </Link>
                                    ) : (
                                        <button key={i} className="hub-item" onClick={item.action}>
                                            <div className="hub-item-left"><span className="hub-icon">{item.icon}</span><span className="hub-label">{item.label}</span></div>
                                            <ChevronRight size={18} className="hub-chevron" strokeWidth={1.5} />
                                        </button>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* VIEW 1: PERSONAL DETAILS */}
            {currentView === 'personal_details' && (
                <motion.div key="personal_details" className="profile-sub-page"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                    <div className="sub-page-header">
                        <h2>Personal Details</h2>
                        <p>Update your information and how we can reach you.</p>
                    </div>
                    <div className="sub-page-card">
                        <form onSubmit={handleSaveProfile} className="hub-page-form">
                            <div className="form-group"><label>Full Name</label><input value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})} className="form-input"/></div>
                            <div className="form-group"><label>Email Address</label><input value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="form-input"/></div>
                            <div className="form-group"><label>New Password (Optional)</label><input type="password" placeholder="••••••••" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} className="form-input"/></div>
                            <div className="form-group"><label>Address Line 1</label><input value={profileData.address_line_1} onChange={e => setProfileData({...profileData, address_line_1: e.target.value})} className="form-input"/></div>
                            <div className="form-row">
                                <div className="form-group"><label>City</label><input value={profileData.city} onChange={e => setProfileData({...profileData, city: e.target.value})} className="form-input"/></div>
                                <div className="form-group"><label>Country</label><input value={profileData.country} onChange={e => setProfileData({...profileData, country: e.target.value})} className="form-input"/></div>
                            </div>
                            <div className="form-actions-row">
                                <button type="button" className="btn-ghost" onClick={() => setCurrentView('directory')}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loadingProfile}>{loadingProfile ? <Loader2 className="animate-spin"/> : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}

            {/* VIEW 2: PAYMENT METHODS */}
            {currentView === 'payment_methods' && (
                <motion.div key="payment_methods" className="profile-sub-page"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                    <div className="sub-page-header">
                        <h2>Payment Methods</h2>
                        <p>Securely add or remove payment cards for faster bookings.</p>
                    </div>
                    <div className="sub-page-card">
                        {user.card_type && (
                            <div className="saved-card-box mb-4">
                                <div className="saved-card-content">
                                    <div>
                                        <strong className="card-brand">{user.card_type}</strong>
                                        <span className="card-hidden">•••• {user.card_number?.slice(-4) || "0000"}</span>
                                    </div>
                                    <CheckCircle2 size={24} color="#10b981"/>
                                </div>
                            </div>
                        )}
                        <h4 className="section-subtitle">Add New Card</h4>
                        <form onSubmit={handleSavePayment} className="hub-page-form">
                            <div className="form-group">
                                <label>Card Type</label>
                                <select value={paymentData.card_type} onChange={e => setPaymentData({...paymentData, card_type: e.target.value})} className="form-input" required>
                                    <option value="">Select Brand</option><option value="Visa">Visa</option><option value="MasterCard">MasterCard</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Card Number</label>
                                <input value={paymentData.card_number} onChange={e => setPaymentData({...paymentData, card_number: e.target.value})} placeholder="0000 0000 0000 0000" className="form-input" required maxLength={19}/>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Expiry Date</label><input value={paymentData.expiry_date} onChange={e => setPaymentData({...paymentData, expiry_date: e.target.value})} placeholder="MM/YY" className="form-input" required maxLength={5}/></div>
                                <div className="form-group"><label>Security Code (CVV)</label><input type="password" value={paymentData.cvv} onChange={e => setPaymentData({...paymentData, cvv: e.target.value})} placeholder="123" className="form-input" required maxLength={4}/></div>
                            </div>
                            <div className="form-actions-row">
                                <button type="button" className="btn-ghost" onClick={() => setCurrentView('directory')}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loadingPayment}>{loadingPayment ? <Loader2 className="animate-spin"/> : 'Save Card Securely'}</button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}

            {/* VIEW 3: REWARDS & WALLET */}
            {currentView === 'rewards_wallet' && (
                <motion.div key="rewards_wallet" className="profile-sub-page"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                    <div className="sub-page-header">
                        <h2>Rewards & Wallet</h2>
                        <p>Manage your Aurelia Points and platform credit.</p>
                    </div>
                    <div className="wallet-cards-grid">
                        <div className="premium-wallet-card balance-card">
                            <p className="wallet-label">Aurelia Credit Balance</p>
                            <h2 className="wallet-amount">$145.00</h2>
                            <button className="btn-topup">+ Top Up Balance</button>
                        </div>
                        <div className="premium-wallet-card points-card">
                            <p className="wallet-label">Aurelia Points</p>
                            <h2 className="wallet-amount points">2,450 <span>pts</span></h2>
                            <p className="wallet-subtext">≈ $24.50 off your next booking</p>
                        </div>
                    </div>
                    <BackButton />
                </motion.div>
            )}

            {/* VIEW 4: TRANSACTIONS */}
            {currentView === 'transactions' && (
                <motion.div key="transactions" className="profile-sub-page"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                    <div className="sub-page-header">
                        <h2>Transaction History</h2>
                        <p>Review your past payments and refunds.</p>
                    </div>
                    <div className="sub-page-card no-pad">
                        <div className="transaction-list">
                            <div className="transaction-item">
                                <div className="tx-info">
                                    <strong>Ocean View Resort Booking</strong>
                                    <span>Oct 12, 2025 • Visa ending in 4242</span>
                                </div>
                                <div className="tx-amount negative">-$340.00</div>
                            </div>
                            <div className="transaction-item">
                                <div className="tx-info">
                                    <strong>Wallet Top-up</strong>
                                    <span>Sep 05, 2025 • MasterCard ending in 8853</span>
                                </div>
                                <div className="tx-amount positive">+$100.00</div>
                            </div>
                            <div className="transaction-item">
                                <div className="tx-info">
                                    <strong>City Center Hotel Refund</strong>
                                    <span>Aug 22, 2025 • Processed to Wallet</span>
                                </div>
                                <div className="tx-amount positive">+$45.00</div>
                            </div>
                        </div>
                    </div>
                    <BackButton />
                </motion.div>
            )}

            {/* VIEW 5: SECURITY SETTINGS */}
            {currentView === 'security_settings' && (
                <motion.div key="security_settings" className="profile-sub-page"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                    <div className="sub-page-header">
                        <h2>Security Settings</h2>
                        <p>Protect your account with additional security measures.</p>
                    </div>
                    <div className="sub-page-card">
                        
                        {/* --- EMAIL VERIFICATION SECTION --- */}
                        <div className="settings-row" style={{ alignItems: 'flex-start' }}>
                            <div className="settings-info">
                                <strong>Email Verification</strong>
                                <p style={{ marginTop: '4px' }}>
                                    Status:{' '}
                                    {user.is_verified ? (
                                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>Verified</span>
                                    ) : (
                                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Unverified</span>
                                    )}
                                </p>
                                {/* Display success or error message for resend */}
                                {verifyMessage.text && (
                                    <p style={{ marginTop: '8px', fontSize: '0.85rem', color: verifyMessage.type === 'success' ? '#10b981' : '#ef4444' }}>
                                        {verifyMessage.text}
                                    </p>
                                )}
                            </div>
                            {!user.is_verified && (
                                <button 
                                    className="btn-outline" 
                                    onClick={handleResendEmail} 
                                    disabled={isResending}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    {isResending ? 'Sending...' : 'Resend Email'}
                                </button>
                            )}
                        </div>
                        
                        <hr className="settings-divider"/>

                        {/* --- 2FA SECTION --- */}
                        <div className="settings-row">
                            <div className="settings-info">
                                <strong>Two-Factor Authentication (2FA)</strong>
                                <p>Require a code sent to your email when logging in from unrecognized devices.</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={twoFactor} onChange={handleToggle2FA} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                        
                        <hr className="settings-divider"/>
                        
                        {/* --- ACTIVE SESSIONS SECTION --- */}
                        <div className="settings-row">
                            <div className="settings-info">
                                <strong>Active Sessions</strong>
                                <p>You are currently logged in on 1 device (Windows PC - Chrome).</p>
                            </div>
                            <button className="btn-outline-danger"><LogOut size={16}/> Sign out of all devices</button>
                        </div>

                        {/* --- WHATSAPP VERIFICATION SECTION --- */}
                        {/*<div className="settings-row" style={{ alignItems: 'flex-start' }}>
                            <div className="settings-info">
                                <strong>WhatsApp Verification</strong>
                                <p style={{ marginTop: '4px' }}>
                                    Status:{' '}
                                    {user.is_phone_verified ? (
                                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>Verified</span>
                                    ) : (
                                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Unverified</span>
                                    )}
                                </p>
                                {whatsappMessage.text && (
                                    <p style={{ marginTop: '8px', fontSize: '0.85rem', color: whatsappMessage.type === 'success' ? '#10b981' : '#ef4444' }}>
                                        {whatsappMessage.text}
                                    </p>
                                )}
                            </div>
                            
                            {!user.is_phone_verified && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                                    {!showOtpInput ? (
                                        <>
                                            <input 
                                                type="text" 
                                                placeholder="+94770000000" 
                                                value={phoneInput} 
                                                onChange={(e) => setPhoneInput(e.target.value)}
                                                className="form-input"
                                                style={{ width: '200px' }}
                                            />
                                            <button className="btn-outline" onClick={handleRequestWhatsAppOTP} disabled={isRequestingOtp || !phoneInput}>
                                                {isRequestingOtp ? 'Sending...' : 'Send WhatsApp OTP'}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <input 
                                                type="text" 
                                                placeholder="Enter 6-digit code" 
                                                value={whatsappOtp} 
                                                onChange={(e) => setWhatsappOtp(e.target.value)}
                                                className="form-input"
                                                style={{ width: '200px', letterSpacing: '2px', textAlign: 'center' }}
                                                maxLength={6}
                                            />
                                            <button className="btn-primary" onClick={handleVerifyWhatsAppOTP} disabled={isVerifyingOtp || whatsappOtp.length < 6}>
                                                {isVerifyingOtp ? 'Verifying...' : 'Verify Code'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div> */}

                    </div>
                    <BackButton />
                </motion.div>
            )}

            {/* VIEW 6: TRAVEL COMPANIONS */}
            {currentView === 'travel_companions' && (
                <motion.div key="travel_companions" className="profile-sub-page"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                    <div className="sub-page-header">
                        <h2>Travel Companions</h2>
                        <p>Save details of people you travel with frequently for faster booking.</p>
                    </div>
                    <div className="sub-page-card">
                        {companions.map(comp => (
                            <div key={comp.id} className="companion-card">
                                <div>
                                    <strong>{comp.name}</strong>
                                    <span>{comp.relation} • Born: {comp.dob}</span>
                                </div>
                                <button className="btn-icon-danger"><Trash2 size={18}/></button>
                            </div>
                        ))}
                        <button className="btn-dashed-add mt-4"><Plus size={18}/> Add New Companion</button>
                    </div>
                    <BackButton />
                </motion.div>
            )}

            {/* VIEW 7: CUSTOMIZATION */}
            {currentView === 'customization' && (
                <motion.div key="customization" className="profile-sub-page"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                    <div className="sub-page-header">
                        <h2>Customization Preferences</h2>
                        <p>Set your regional display settings.</p>
                    </div>
                    <div className="sub-page-card">
                        <div className="form-group">
                            <label>Preferred Currency</label>
                            <select className="form-input" defaultValue="USD">
                                <option value="USD">USD ($) - US Dollar</option>
                                <option value="EUR">EUR (€) - Euro</option>
                                <option value="LKR">LKR (Rs) - Sri Lankan Rupee</option>
                            </select>
                        </div>
                        <div className="form-group mt-4">
                            <label>Preferred Language</label>
                            <select className="form-input" defaultValue="EN">
                                <option value="EN">English (US)</option>
                                <option value="FR">Français (France)</option>
                                <option value="ES">Español (Spain)</option>
                            </select>
                        </div>
                        <button className="btn-primary mt-4">Save Preferences</button>
                    </div>
                    <BackButton />
                </motion.div>
            )}

            {/* VIEW 8: EMAIL PREFERENCES */}
            {currentView === 'email_preferences' && (
                <motion.div key="email_preferences" className="profile-sub-page"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                    <div className="sub-page-header">
                        <h2>Email Preferences</h2>
                        <p>Control what emails you receive from Aurelia Travel.</p>
                    </div>
                    <div className="sub-page-card">
                        <div className="settings-row">
                            <div className="settings-info">
                                <strong>Promotions & Deals</strong>
                                <p>Get exclusive offers and travel inspiration.</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={emailPrefs.promos} onChange={(e) => setEmailPrefs({...emailPrefs, promos: e.target.checked})} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                        <hr className="settings-divider"/>
                        <div className="settings-row">
                            <div className="settings-info">
                                <strong>Booking Updates</strong>
                                <p>Essential reminders and updates about your upcoming trips.</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={emailPrefs.bookings} onChange={(e) => setEmailPrefs({...emailPrefs, bookings: e.target.checked})} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                        <hr className="settings-divider"/>
                        <div className="settings-row">
                            <div className="settings-info">
                                <strong>Account Security</strong>
                                <p>Alerts about logins and password changes. (Cannot be disabled)</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={true} disabled />
                                <span className="slider round disabled"></span>
                            </label>
                        </div>
                    </div>
                    <BackButton />
                </motion.div>
            )}

            {/* VIEWS 9-12: INFO & LEGAL (Safety, Disputes, Privacy, Guidelines) */}
            {['safety_center', 'disputes', 'privacy', 'guidelines'].includes(currentView) && (
                <motion.div key="info_views" className="profile-sub-page"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                    <div className="sub-page-header">
                        <h2>{getViewTitle()}</h2>
                        <p>Platform information and resources.</p>
                    </div>
                    <div className="sub-page-card info-card-layout">
                        
                        {currentView === 'safety_center' && (
                            <>
                                <AlertTriangle size={48} color="var(--color-primary)" className="mb-4"/>
                                <h3>Your safety is our priority</h3>
                                <p>If you encounter an emergency during your stay, please contact local authorities immediately. For booking-related emergencies, our 24/7 trust and safety team is available.</p>
                                <button className="btn-primary mt-4">Contact Safety Team</button>
                            </>
                        )}

                        {currentView === 'disputes' && (
                            <>
                                <Scale size={48} color="var(--color-primary)" className="mb-4"/>
                                <h3>Resolution Center</h3>
                                <p>Have an issue with a recent booking, refund, or property? Open a ticket in our resolution center to have an Aurelia agent mediate the issue.</p>
                                <button className="btn-outline mt-4">Open New Ticket</button>
                            </>
                        )}

                        {currentView === 'privacy' && (
                            <>
                                <ShieldCheck size={48} color="var(--color-primary)" className="mb-4"/>
                                <h3>Data & Privacy</h3>
                                <p>We believe your data belongs to you. You can request a full export of your personal data or request account deletion at any time.</p>
                                <div className="button-group mt-4">
                                    <button className="btn-outline"><Download size={16}/> Download My Data</button>
                                    <button className="btn-outline-danger">Delete Account</button>
                                </div>
                            </>
                        )}

                        {currentView === 'guidelines' && (
                            <>
                                <FileText size={48} color="var(--color-primary)" className="mb-4"/>
                                <h3>Community Guidelines</h3>
                                <p>Aurelia relies on honest, respectful reviews. Any content that includes hate speech, spam, or personally identifiable information will be removed.</p>
                                <Link to="/about" className="btn-outline mt-4" style={{textDecoration:'none', display:'inline-block'}}>Read Full Policy</Link>
                            </>
                        )}

                    </div>
                    <BackButton />
                </motion.div>
            )}

            {/* --- 2FA SETUP MODAL --- */}
            {showTwoFactorModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                    <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
                        <h3 style={{fontSize: '1.4rem', fontWeight: 800, marginBottom: '10px'}}>Protect Your Account</h3>
                        <p style={{color: '#64748b', marginBottom: '20px'}}>1. Scan this QR code using Google Authenticator or Authy.</p>
                        
                        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '20px'}}>
                            <img src={qrCodeData.url} alt="2FA QR Code" style={{border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px'}}/>
                        </div>

                        <p style={{color: '#64748b', marginBottom: '10px'}}>2. Enter the 6-digit code from the app to verify.</p>
                        <input 
                            type="text" 
                            placeholder="000000" 
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            style={{width: '100%', padding: '12px', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '20px'}}
                        />

                        <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                            <button className="btn-ghost" onClick={() => setShowTwoFactorModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={confirmEnable2FA} disabled={isVerifying || verificationCode.length < 6}>
                                {isVerifying ? 'Verifying...' : 'Enable 2FA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </AnimatePresence>
      </div>
    </div>
  );
}