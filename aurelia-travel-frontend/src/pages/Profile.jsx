import { useState, useEffect } from 'react';
import { useUser } from '../context/userContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  CreditCard, Wallet, Receipt, User, Shield, Users, 
  Sliders, Mail, Briefcase, Heart, MessageSquare, 
  HelpCircle, ShieldCheck, Scale, FileText, Home, 
  ChevronRight, Loader2, Camera, Check
} from 'lucide-react'; 
import './styles/profile.css';

export default function Profile() {
  const { user, refreshUser } = useUser();
  const navigate = useNavigate();
  
  // --- NEW: View Navigation State ---
  // 'directory' | 'personal_details' | 'payment_methods'
  const [currentView, setCurrentView] = useState('directory');
  
  // Loading & Actions state
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Form States
  const [profileData, setProfileData] = useState({
    username: '', email: '', password: '', address_line_1: '', city: '', country: ''
  });
  const [paymentData, setPaymentData] = useState({
    card_type: '', card_number: '', cvv: '', expiry_date: ''
  });

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

  // --- ACTIONS ---
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
      setCurrentView('directory'); // Go back to main directory after saving
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
        setCurrentView('directory'); // Go back to main directory after saving
    } catch (err) { alert("Failed to save card"); } 
    finally { setLoadingPayment(false); }
  };

  const handleBecomeManager = async () => {
      if(!window.confirm("Confirm registration as a Hotel Manager?")) return;
      setIsUpgrading(true);
      try {
          const res = await api.put('/users/upgrade-to-manager', {});
          if(res.data.success) {
              await refreshUser(); 
              alert("🎉 Congratulations! You are now a Partner.");
              navigate('/admin'); 
          }
      } catch (err) { alert("Failed to upgrade."); } 
      finally { setIsUpgrading(false); }
  };

  if (!user) return <div className="profile-not-logged-in">Please sign in.</div>;

  // --- DIRECTORY CONFIGURATION ---
  const directory = [
    {
      title: "Payment info",
      items: [
        { icon: <Wallet size={18} strokeWidth={1.5}/>, label: "Rewards & Wallet", action: () => alert("Rewards coming soon!") },
        { icon: <CreditCard size={18} strokeWidth={1.5}/>, label: "Payment methods", action: () => setCurrentView('payment_methods') },
        { icon: <Receipt size={18} strokeWidth={1.5}/>, label: "Transactions", action: () => alert("Transaction history coming soon!") }
      ]
    },
    {
      title: "Manage account",
      items: [
        { icon: <User size={18} strokeWidth={1.5}/>, label: "Personal details", action: () => setCurrentView('personal_details') },
        { icon: <Shield size={18} strokeWidth={1.5}/>, label: "Security settings", action: () => alert("Security settings coming soon!") },
        { icon: <Users size={18} strokeWidth={1.5}/>, label: "Other travelers", action: () => alert("Travel companions coming soon!") }
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: <Sliders size={18} strokeWidth={1.5}/>, label: "Customization preferences", action: () => alert("Preferences coming soon!") },
        { icon: <Mail size={18} strokeWidth={1.5}/>, label: "Email preferences", action: () => alert("Email settings coming soon!") }
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
        { icon: <ShieldCheck size={18} strokeWidth={1.5}/>, label: "Safety resource center", action: () => alert("Safety center coming soon!") },
        { icon: <Scale size={18} strokeWidth={1.5}/>, label: "Dispute resolution", action: () => alert("Dispute center coming soon!") }
      ]
    },
    {
      title: "Legal and privacy",
      items: [
        { icon: <ShieldCheck size={18} strokeWidth={1.5}/>, label: "Privacy and data management", action: () => alert("Privacy settings coming soon!") },
        { icon: <FileText size={18} strokeWidth={1.5}/>, label: "Content guidelines", action: () => alert("Guidelines coming soon!") }
      ]
    }
  ];

  if (user.role !== 'hotel_manager' && user.role !== 'admin') {
      directory.push({
          title: "Manage your property",
          items: [
              // Change from action to a link pointing to the new page
              { icon: <Home size={18} strokeWidth={1.5}/>, label: "List your property", link: "/list-property" }
          ]
      });
  }

  // Determine the Title of the current active view for the Breadcrumb
  const getViewTitle = () => {
      if (currentView === 'personal_details') return 'Personal Details';
      if (currentView === 'payment_methods') return 'Payment Methods';
      return '';
  };

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
            <span 
                className={`crumb-link ${currentView === 'directory' ? 'active' : ''}`}
                onClick={() => setCurrentView('directory')}
            >
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
            {/* --- VIEW 1: MAIN DIRECTORY GRID --- */}
            {currentView === 'directory' && (
                <motion.div 
                    key="directory"
                    className="profile-hub-grid"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                >
                    {directory.map((section, index) => (
                        <div key={index} className="hub-card">
                            <h3>{section.title}</h3>
                            <div className="hub-list">
                                {section.items.map((item, i) => (
                                    item.link ? (
                                        <Link to={item.link} key={i} className="hub-item">
                                            <div className="hub-item-left">
                                                <span className="hub-icon">{item.icon}</span>
                                                <span className="hub-label">{item.label}</span>
                                            </div>
                                            <ChevronRight size={18} className="hub-chevron" strokeWidth={1.5} />
                                        </Link>
                                    ) : (
                                        <button key={i} className="hub-item" onClick={item.action}>
                                            <div className="hub-item-left">
                                                <span className="hub-icon">{item.icon}</span>
                                                <span className="hub-label">{item.label}</span>
                                            </div>
                                            <ChevronRight size={18} className="hub-chevron" strokeWidth={1.5} />
                                        </button>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* --- VIEW 2: PERSONAL DETAILS --- */}
            {currentView === 'personal_details' && (
                <motion.div 
                    key="personal_details"
                    className="profile-sub-page"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}
                >
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

            {/* --- VIEW 3: PAYMENT METHODS --- */}
            {currentView === 'payment_methods' && (
                <motion.div 
                    key="payment_methods"
                    className="profile-sub-page"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}
                >
                    <div className="sub-page-header">
                        <h2>Payment Methods</h2>
                        <p>Securely add or remove payment cards for faster bookings.</p>
                    </div>

                    <div className="sub-page-card">
                        {user.card_type && (
                            <div className="saved-card-box mb-4">
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <div>
                                        <strong style={{display:'block', fontSize: '1.1rem'}}>{user.card_type}</strong>
                                        <span style={{color:'var(--text-muted)'}}>•••• {user.card_number?.slice(-4) || "0000"}</span>
                                    </div>
                                    <Check size={24} color="#10b981"/>
                                </div>
                            </div>
                        )}
                        
                        <h4 style={{marginTop: '30px', marginBottom: '16px'}}>Add New Card</h4>
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
        </AnimatePresence>

      </div>
    </div>
  );
}