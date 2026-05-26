import { useState, useEffect } from 'react';
import { useUser } from '../context/userContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../services/api'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import HotelCard from '../components/ui/HotelCard';

import { useNavigate, Link, useLocation } from 'react-router-dom'; // <-- Add useLocation// <-- Added
import { 
  CreditCard, Wallet, Receipt, User, Shield, Users, 
  Sliders, Mail, Briefcase, Heart, MessageSquare, 
  HelpCircle, ShieldCheck, Scale, FileText, Home, 
  ChevronRight, Loader2, Camera, Check, Plus, Trash2, 
  AlertTriangle, Download, LogOut, CheckCircle2,
  Calendar, MapPin, Clock, Star, X, BedDouble, Ticket, Building2, CornerDownRight, Eye, EyeOff // <-- New icons added
} from 'lucide-react'; 
import './styles/profile.css';
import './styles/my-bookings.css'; // <-- Retained original CSS
import './styles/my-reviews.css';  // <-- Retained original CSS
import './styles/wishlist.css';    // <-- Retained original CSS
import DisputeResolution from './DisputeResolution';

export default function Profile() {
  const { user, refreshUser } = useUser();
  const { wishlist, clearWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for navigation state to open specific tabs directly
  useEffect(() => {
    if (location.state && location.state.view) {
      setCurrentView(location.state.view);
      
      // Optional: Clear the router state so if they refresh the page later, 
      // it doesn't force them back to this tab unexpectedly
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  
  // --- View Navigation State ---
  const [currentView, setCurrentView] = useState('directory');

  const [showPassword, setShowPassword] = useState(false);
  
  // Loading & Actions state
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Email Verification States
  const [isResending, setIsResending] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState({ text: '', type: '' });

  // 2FA States
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState({ url: '', secret: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Bookings States (Merged)
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null); 
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

  // Reviews States (Merged)
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Form & Toggle States
  const [profileData, setProfileData] = useState({
    username: '', email: '', password: '', phone: '', dob: '', address_line_1: '', city: '', country: ''
  });
  const [paymentData, setPaymentData] = useState({
    card_type: '', card_number: '', cvv: '', expiry_date: ''
  });
  
  // Mock States for new sections
  const [twoFactor, setTwoFactor] = useState(false);
  const [companions, setCompanions] = useState([
      { id: 1, name: 'Jane Doe', relation: 'Spouse', dob: '1990-05-15' }
  ]);

  // Preferences States
  const [customizationData, setCustomizationData] = useState({ currency: 'USD', language: 'EN' });
  const [emailPrefs, setEmailPrefs] = useState({ promos: true, bookings: true, account: true });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // --- DATA FETCHING EFFECTS ---
  
  useEffect(() => {
    if (user) {
        // --- BULLETPROOF DATE PARSING ---
        let formattedDob = '';
        
        if (user.dob) {
            try {
                // Scenario 1: The database sends a string that already starts with YYYY-MM-DD (like an ISO string or SQL timestamp)
                if (typeof user.dob === 'string' && user.dob.match(/^\d{4}-\d{2}-\d{2}/)) {
                    formattedDob = user.dob.substring(0, 10);
                } 
                // Scenario 2: The database sends an unusual format, so we force JavaScript to convert it
                else {
                    const d = new Date(user.dob);
                    if (!isNaN(d.getTime())) {
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        formattedDob = `${year}-${month}-${day}`;
                    }
                }
            } catch (e) {
                console.error("Could not parse date:", e);
            }
        }

        // Set the state with the safely formatted date
        setProfileData({
            username: user.username || user.first_name || '', 
            email: user.email || '',
            password: '', 
            phone: user.phone || '', 
            dob: formattedDob, // <-- Now strictly YYYY-MM-DD
            address_line_1: user.address_line_1 || '', 
            city: user.city || '', 
            country: user.country || ''
        });
        
        setTwoFactor(user.is_verified === 1 || user.is_verified === true);
        
        setCustomizationData({
            currency: user.currency || 'USD',
            language: user.language || 'EN'
        });
        
        if (user.email_preferences) {
            setEmailPrefs({
                promos: user.email_preferences.promos ?? true,
                bookings: user.email_preferences.bookings ?? true,
                account: true 
            });
        }
    }
  }, [user]);

  // Fetch Bookings or Reviews only when their specific views are activated
  useEffect(() => {
    if (currentView === 'my_bookings') {
        const fetchBookings = async () => {
            setLoadingBookings(true);
            try {
                const response = await api.get('/bookings/my-bookings');
                let data = [];
                if (Array.isArray(response.data)) data = response.data;
                else if (response.data && Array.isArray(response.data.data)) data = response.data.data;
                setBookings(data);
            } catch (err) { console.error("Failed to fetch bookings:", err); } 
            finally { setLoadingBookings(false); }
        };
        fetchBookings();
    } else if (currentView === 'my_reviews') {
        const fetchMyReviews = async () => {
            setLoadingReviews(true);
            try {
                const res = await api.get('/reviews/mine');
                setReviews(res.data.data || []);
            } catch (err) { console.error("Failed to fetch reviews", err); } 
            finally { setLoadingReviews(false); }
        };
        fetchMyReviews();
    }
  }, [currentView]);

  // --- PREFERENCES ACTIONS ---
  
  const handleSaveCustomization = async (e) => {
      e.preventDefault();
      setSavingPrefs(true);
      try {
          // Send the updated currency and language to your backend
          await api.put(`/users/${user.id || user._id}`, customizationData);
          await refreshUser();
          alert("Customization preferences saved!");
      } catch (error) {
          alert("Failed to save preferences.");
      } finally {
          setSavingPrefs(false);
      }
  };

  const handleToggleEmailPref = async (prefKey, newValue) => {
      // 1. Optimistically update UI
      const updatedPrefs = { ...emailPrefs, [prefKey]: newValue };
      setEmailPrefs(updatedPrefs);
      
      try {
          // 2. Auto-save to backend immediately
          await api.put(`/users/${user.id || user._id}`, { email_preferences: updatedPrefs });
          await refreshUser();
      } catch (error) {
          alert("Failed to update email settings.");
          // 3. Revert UI if backend fails
          setEmailPrefs({ ...emailPrefs, [prefKey]: !newValue });
      }
  };

  // --- ACTIONS ---

  const handleResendEmail = async () => {
    setIsResending(true);
    setVerifyMessage({ text: '', type: '' });
    try {
        const response = await api.post('/auth/resend-verification');
        setVerifyMessage({ text: response.data.message, type: 'success' });
    } catch (error) {
        setVerifyMessage({ text: error.response?.data?.message || 'Failed to resend email.', type: 'error' });
    } finally { setIsResending(false); }
  };

  const handleToggle2FA = async () => {
      if (twoFactor) {
          if(window.confirm("Are you sure you want to disable 2FA? This makes your account less secure.")) {
              try {
                  await api.put(`/users/${user.id || user._id}`, { is_verified: 0 });
                  await refreshUser(); 
                  setTwoFactor(false);
                  alert("Two-Factor Authentication has been disabled.");
              } catch (error) { alert("Failed to disable 2FA. Please try again."); }
          }
          return;
      }
      try {
          const res = await api.post('/auth/2fa/generate');
          if (res.data.success) {
              setQrCodeData({ url: res.data.qrCodeUrl, secret: res.data.secret });
              setShowTwoFactorModal(true); 
          }
      } catch (err) { alert("Could not generate 2FA code."); }
  };

  const confirmEnable2FA = async () => {
      setIsVerifying(true);
      try {
          const res = await api.post('/auth/2fa/verify-enable', { secret: qrCodeData.secret, token: verificationCode });
          if (res.data.success) {
              await api.put(`/users/${user.id || user._id}`, { is_verified: 1 });
              await refreshUser();
              setTwoFactor(true);
              setShowTwoFactorModal(false);
              setVerificationCode('');
              alert("Two-Factor Authentication is now enabled!");
          }
      } catch (err) { alert(err.response?.data?.message || "Invalid code. Try again."); } 
      finally { setIsVerifying(false); }
  };

  

  useEffect(() => {
    if (user) {
        setProfileData({
            username: user.username || user.first_name || '', 
            email: user.email || '',
            password: '', 
            phone: user.phone || '',
            // Safely format the date for the HTML <input type="date">
            dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '', 
            address_line_1: user.address_line_1 || '', 
            city: user.city || '', 
            country: user.country || ''
        });
        
        setTwoFactor(user.is_verified === 1 || user.is_verified === true);
        // ... (Keep your other preferences sync logic here)
    }
  }, [user]);

  // --- FIXED IMAGE UPLOAD ---
  const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploadingImage(true);

      // Package the file exactly how Multer expects it ('image')
      const formData = new FormData();
      formData.append('image', file);
      try {
          // Explicitly set the headers for multipart form data
          const uploadRes = await api.post('/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (uploadRes.data.success && uploadRes.data.url) {
              // Now that we have the Cloudinary URL, save it to the user's profile
              await api.put(`/users/${user.id || user._id}`, { profile_image: uploadRes.data.url });
              
              // Refresh the global user context so the avatar updates instantly in the header
              await refreshUser();
              alert("Profile photo updated successfully!");
          } else {
              alert("Upload failed. Please try again.");
          }
      } catch (err) { 
          console.error("Upload Error:", err);
          alert("Failed to upload image. Make sure it's under 5MB."); 
      } finally { 
          setUploadingImage(false); 
      }
  };

  // --- FIXED PROFILE SAVING ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const payload = { ...profileData };
      
      // Clean up empty fields so we don't break backend validation
      if (!payload.password) delete payload.password;
      if (!payload.dob) delete payload.dob; // Don't send empty strings for dates

      await api.put(`/users/${user.id || user._id}`, payload);
      await refreshUser(); 
      alert("Personal details updated successfully!");
    } catch (err) { 
      console.error(err);
      alert("Failed to update profile."); 
    } finally { 
      setLoadingProfile(false); 
    }
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
        alert("Card saved successfully");
    } catch (err) { alert("Failed to save card"); } 
    finally { setLoadingPayment(false); }
  };

  // --- BOOKINGS & REVIEWS HELPER FUNCTIONS ---
  
  const calculateNights = (start, end) => {
    if(!start || !end) return 1;
    const s = new Date(start); const e = new Date(end);
    return Math.max(1, Math.ceil(Math.abs(e-s)/(1000*60*60*24)));
  };

  const handleOpenReview = (booking) => {
    const targetHotelId = booking.hotel?.id || booking.hotel_id;
    const targetHotelName = booking.hotel?.name || booking.hotel_name || "Hotel";
    if (!targetHotelId) { alert("Unable to load hotel details for this review."); return; }
    setReviewTarget({ bookingId: booking.id, hotelId: targetHotelId, hotelName: targetHotelName });
    setReviewForm({ rating: 5, title: '', comment: '' });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewTarget?.hotelId) return;
    try {
        await api.post('/reviews', { ...reviewForm, booking_id: reviewTarget.bookingId, hotel_id: reviewTarget.hotelId });
        alert("Thank you for your review!");
        setShowReviewModal(false);
    } catch (err) { alert(err.response?.data?.message || "Failed to submit review."); }
  };

  const getStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
        case 'confirmed': return 'status-confirmed';
        case 'completed': return 'status-completed';
        case 'cancelled': return 'status-cancelled';
        default: return 'status-pending';
    }
  };

  const renderStars = (rating) => {
    return (
        <div className="review-stars">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={16} fill={star <= rating ? "#f59e0b" : "none"} color={star <= rating ? "#f59e0b" : "#cbd5e1"} />
            ))}
        </div>
    );
  };

  if (!user) return <div className="profile-not-logged-in">Please sign in.</div>;

  // --- DIRECTORY CONFIGURATION ---
  const directory = [
    {
      title: "Payment info",
      items: [
        { icon: <Wallet size={18} strokeWidth={1.5}/>, label: "Rewards & Wallet", view: 'rewards_wallet' },
        { icon: <CreditCard size={18} strokeWidth={1.5}/>, label: "Payment methods", view: 'payment_methods' },
        { icon: <Receipt size={18} strokeWidth={1.5}/>, label: "Transactions", view: 'transactions' }
      ]
    },
    {
      title: "Manage account",
      items: [
        { icon: <User size={18} strokeWidth={1.5}/>, label: "Personal details", view: 'personal_details' },
        { icon: <Shield size={18} strokeWidth={1.5}/>, label: "Security settings", view: 'security_settings' },
        { icon: <Users size={18} strokeWidth={1.5}/>, label: "Other travelers", view: 'travel_companions' }
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: <Sliders size={18} strokeWidth={1.5}/>, label: "Customization preferences", view: 'customization' },
        { icon: <Mail size={18} strokeWidth={1.5}/>, label: "Email preferences", view: 'email_preferences' }
      ]
    },
    {
      title: "Travel activity",
      items: [
        // Updated to use internal views instead of links
        { icon: <Briefcase size={18} strokeWidth={1.5}/>, label: "Bookings & Trips", view: "my_bookings" },
        { icon: <Heart size={18} strokeWidth={1.5}/>, label: "Saved lists", view: "saved_lists" },
        { icon: <MessageSquare size={18} strokeWidth={1.5}/>, label: "My reviews", view: "my_reviews" }
      ]
    },
    {
      title: "Help and support",
      items: [
        { icon: <HelpCircle size={18} strokeWidth={1.5}/>, label: "Contact Customer Service", link: "/contact" },
    
    // --- UPDATED: These items are now disabled ---
    { 
        icon: <ShieldCheck size={18} strokeWidth={1.5}/>, 
        label: "Safety resource center", 
        view: 'safety_center',
        disabled: true // Add this flag
    },
    { 
        icon: <Scale size={18} strokeWidth={1.5}/>, 
        label: "Dispute resolution", 
        view: 'disputes',
        disabled: true // Add this flag
    }
      ]
    },
    {
      title: "Legal and privacy",
      items: [
        { icon: <ShieldCheck size={18} strokeWidth={1.5}/>, label: "Privacy and data management", view: 'privacy' },
        { icon: <FileText size={18} strokeWidth={1.5}/>, label: "Content guidelines", view: 'guidelines' }
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
          'my_bookings': 'Bookings & Trips', // New
          'saved_lists': 'Saved Lists (Wishlist)', // New
          'my_reviews': 'My Reviews', // New
          'safety_center': 'Safety Resource Center',
          'disputes': 'Dispute Resolution',
          'privacy': 'Privacy & Data',
          'guidelines': 'Content Guidelines'
      };
      return titles[currentView] || '';
  };

  const activeSection = currentView !== 'directory' 
    ? directory.find(section => section.items.some(item => item.view === currentView))
    : null;

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
            <span className={`crumb-link ${currentView === 'directory' ? 'active' : ''}`} onClick={() => setCurrentView('directory')} style={{cursor: 'pointer'}}>
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
            {currentView === 'directory' ? (

                
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
                                        <button 
                                            key={i} 
                                            className={`hub-item ${item.disabled ? 'disabled' : ''}`} 
                                            onClick={() => {
                                                if (item.disabled) {
                                                    alert("This feature is coming soon!");
                                                } else {
                                                    setCurrentView(item.view);
                                                }
                                            }}
                                        >
                                            <div className="hub-item-left">
                                                <span className="hub-icon">{item.icon}</span>
                                                <span className="hub-label">{item.label}</span>
                                            </div>
                                            {!item.disabled && <ChevronRight size={18} className="hub-chevron" strokeWidth={1.5} />}
                                        </button>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                </motion.div>
            ) : (
                /* --- TWO-COLUMN LAYOUT FOR SUB-PAGES --- */
                <motion.div key="sub-page-layout" className="profile-sub-page-layout" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginTop: '20px' }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}>
                    
                    {/* SIDEBAR NAVIGATION */}
                    {activeSection && (
                        <div className="profile-sidebar" style={{ flex: '0 0 280px', backgroundColor: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', position: 'sticky', top: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '8px 8px 16px 8px', color: '#0f172a' }}>{activeSection.title}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {activeSection.items.map((item, idx) => (
                                    item.view ? (
                                        <button 
                                            key={idx}
                                            onClick={() => setCurrentView(item.view)}
                                            style={{ 
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', 
                                                borderRadius: '8px', border: 'none', 
                                                background: currentView === item.view ? '#f8fafc' : 'transparent',
                                                color: currentView === item.view ? '#0f172a' : '#64748b', 
                                                fontWeight: currentView === item.view ? '600' : '400',
                                                cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ color: currentView === item.view ? '#0f172a' : '#94a3b8', display: 'flex' }}>{item.icon}</span>
                                                {item.label}
                                            </div>
                                            <ChevronRight size={16} style={{ color: currentView === item.view ? '#0f172a' : '#cbd5e1' }} />
                                        </button>
                                    ) : null
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MAIN CONTENT AREA */}
                    <div className="profile-main-content" style={{ flex: '1', minWidth: 0 }}>
                        <AnimatePresence mode="wait">
                            
                            {/* ... EXISTING SETTINGS VIEWS ... */}
                            {/* VIEW 1: PERSONAL DETAILS */}
                            {currentView === 'personal_details' && (
                                <motion.div key="personal_details" className="profile-sub-page"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                                    <div className="sub-page-header">
                                        <h2>Personal Details</h2>
                                        <p>Update your information and how we can reach you.</p>
                                    </div>
                                    <div className="sub-page-card">
                                        
                                        {/* --- PROFILE PHOTO UPLOAD SECTION --- */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #e2e8f0' }}>
                                            <div className="hub-avatar-wrapper" style={{ width: '84px', height: '84px', flexShrink: 0 }}>
                                                {uploadingImage ? (
                                                    <div className="hub-avatar loading" style={{ width: '100%', height: '100%' }}><Loader2 className="animate-spin" /></div>
                                                ) : user.profile_image ? (
                                                    <img src={user.profile_image} className="hub-avatar" alt="Profile" style={{ width: '100%', height: '100%' }} />
                                                ) : (
                                                    <div className="hub-avatar text" style={{ width: '100%', height: '100%', fontSize: '2.5rem' }}>{user.username.charAt(0).toUpperCase()}</div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: '700' }}>Profile Photo</h4>
                                                <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '0.9rem' }}>PNG or JPG no larger than 5MB.</p>
                                                <label className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                    <Camera size={16} /> {uploadingImage ? 'Uploading...' : 'Change Photo'}
                                                    {/* This hidden input triggers the file selector */}
                                                    <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleImageUpload} disabled={uploadingImage} hidden/>
                                                </label>
                                            </div>
                                        </div>

                                        {/* --- EXPANDED DETAILS FORM --- */}
                                        <form onSubmit={handleSaveProfile} className="hub-page-form">
                                            <div className="form-group">
                                                <label>Full Name</label>
                                                <input value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})} className="form-input" placeholder="e.g. Jane Doe" required/>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Email Address</label>
                                                    <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="form-input" required/>
                                                </div>
                                                <div className="form-group">
                                                    <label>Phone Number</label>
                                                    <input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="form-input" placeholder="+1 (555) 000-0000"/>
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                <label>Date of Birth</label>
                                                <input 
                                                    type="date" 
                                                    value={profileData.dob || ''} 
                                                    onChange={e => setProfileData({...profileData, dob: e.target.value})} 
                                                    className="form-input"
                                                />
                                            </div>
                                                <div className="form-group">
                                                <label>New Password (Optional)</label>
                                                <div className="password-input-wrapper">
                                                    <input 
                                                        type={showPassword ? "text" : "password"} 
                                                        placeholder="••••••••" 
                                                        value={profileData.password} 
                                                        onChange={e => setProfileData({...profileData, password: e.target.value})} 
                                                        className="form-input" 
                                                        minLength={6}
                                                    />
                                                    <button 
                                                        type="button" 
                                                        className="password-toggle-btn"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        title={showPassword ? "Hide password" : "Show password"}
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Address Line 1</label>
                                                <input value={profileData.address_line_1} onChange={e => setProfileData({...profileData, address_line_1: e.target.value})} className="form-input" placeholder="123 Travel Street"/>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>City</label>
                                                    <input value={profileData.city} onChange={e => setProfileData({...profileData, city: e.target.value})} className="form-input" placeholder="New York"/>
                                                </div>
                                                <div className="form-group">
                                                    <label>Country</label>
                                                    <input value={profileData.country} onChange={e => setProfileData({...profileData, country: e.target.value})} className="form-input" placeholder="United States"/>
                                                </div>
                                            </div>

                                            <div className="form-actions-row">
                                                <button type="submit" className="btn-primary" disabled={loadingProfile}>
                                                    {loadingProfile ? <Loader2 className="animate-spin" size={18}/> : 'Save Changes'}
                                                </button>
                                            </div>
                                        </form>

                                    </div>
                                </motion.div>
                            )}

                            {currentView === 'security_settings' && (
                                <motion.div key="security_settings" className="profile-sub-page"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                                    <div className="sub-page-header">
                                        <h2>Security Settings</h2>
                                        <p>Protect your account with additional security measures and manage your devices.</p>
                                    </div>
                                    
                                    <div className="sub-page-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', backgroundColor: '#f8fafc', border: 'none' }}>
                                        {/* EMAIL VERIFICATION CARD */}
                                        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '50%', color: '#3b82f6', display: 'flex' }}>
                                                    <Mail size={24} strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <strong style={{ fontSize: '1.1rem', color: '#1e293b', display: 'block', marginBottom: '4px' }}>Email Verification</strong>
                                                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                                                        Status:{' '}
                                                        {user.is_verified ? (
                                                            <span style={{ color: '#10b981', fontWeight: '600' }}>Verified</span>
                                                        ) : (
                                                            <span style={{ color: '#ef4444', fontWeight: '600' }}>Unverified</span>
                                                        )}
                                                    </p>
                                                    {verifyMessage.text && <p style={{ marginTop: '8px', fontSize: '0.85rem', color: verifyMessage.type === 'success' ? '#10b981' : '#ef4444' }}>{verifyMessage.text}</p>}
                                                </div>
                                            </div>
                                            {!user.is_verified && <button className="btn-outline" onClick={handleResendEmail} disabled={isResending} style={{ whiteSpace: 'nowrap' }}>{isResending ? 'Sending...' : 'Resend Email'}</button>}
                                        </div>

                                        {/* 2FA CARD */}
                                        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '50%', color: '#10b981', display: 'flex' }}>
                                                    <ShieldCheck size={24} strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <strong style={{ fontSize: '1.1rem', color: '#1e293b', display: 'block', marginBottom: '4px' }}>Two-Factor Authentication (2FA)</strong>
                                                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Require a code sent to your email when logging in from unrecognized devices.</p>
                                                </div>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" checked={twoFactor} onChange={handleToggle2FA} />
                                                <span className="slider round"></span>
                                            </label>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* VIEW 2: PAYMENT METHODS */}
                            {currentView === 'payment_methods' && (
                                <motion.div key="payment_methods" className="profile-sub-page"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                                    <div className="sub-page-header">
                                        <h2>Payment Methods</h2>
                                        <p>Securely manage your saved cards for faster checkouts.</p>
                                    </div>
                                    
                                    {/* Saved Card Display */}
                                    {user.card_type && (
                                        <div className="saved-card-premium">
                                            <div className="card-chip-row">
                                                <div className="chip"></div>
                                                <CheckCircle2 size={24} color="#10b981" />
                                            </div>
                                            <div className="card-number-row">
                                                <span>••••</span><span>••••</span><span>••••</span>
                                                <span className="last-four">{user.card_number?.slice(-4) || "0000"}</span>
                                            </div>
                                            <div className="card-footer-row">
                                                <div className="card-holder">
                                                    <span className="card-label">Card Holder</span>
                                                    <span className="card-value">{user.username}</span>
                                                </div>
                                                <div className="card-brand">
                                                    <strong style={{ fontSize: '1.2rem', fontStyle: 'italic' }}>{user.card_type}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Add New Card Form */}
                                    <div className="sub-page-card" style={{ marginTop: '24px' }}>
                                        <h4 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#0f172a' }}>Add New Card</h4>
                                        <form onSubmit={handleSavePayment} className="hub-page-form">
                                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Card Type</label>
                                                <select value={paymentData.card_type} onChange={e => setPaymentData({...paymentData, card_type: e.target.value})} className="form-input" required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                                    <option value="">Select Brand</option><option value="Visa">Visa</option><option value="MasterCard">MasterCard</option><option value="Amex">American Express</option>
                                                </select>
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Card Number</label>
                                                <input value={paymentData.card_number} onChange={e => setPaymentData({...paymentData, card_number: e.target.value})} placeholder="0000 0000 0000 0000" className="form-input" required maxLength={19} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', letterSpacing: '2px' }}/>
                                            </div>
                                            <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                                                <div className="form-group" style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Expiry Date</label><input value={paymentData.expiry_date} onChange={e => setPaymentData({...paymentData, expiry_date: e.target.value})} placeholder="MM/YY" className="form-input" required maxLength={5} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}/></div>
                                                <div className="form-group" style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>CVV</label><input type="password" value={paymentData.cvv} onChange={e => setPaymentData({...paymentData, cvv: e.target.value})} placeholder="123" className="form-input" required maxLength={4} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}/></div>
                                            </div>
                                            <div className="form-actions-row">
                                                <button type="submit" className="btn-primary" disabled={loadingPayment} style={{ width: '100%', padding: '12px', borderRadius: '6px', fontWeight: '600' }}>
                                                    {loadingPayment ? <Loader2 className="animate-spin" size={18} style={{ margin: '0 auto' }}/> : 'Save Card Securely'}
                                                </button>
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
                                    <div className="wallet-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                                        
                                        {/* Balance Card */}
                                        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '12px', padding: '24px', color: '#fff', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Aurelia Credit</p>
                                                <Wallet size={24} color="#3b82f6" />
                                            </div>
                                            <div>
                                                <h2 style={{ margin: '0 0 12px 0', fontSize: '2.5rem', fontWeight: '800' }}>$145.00</h2>
                                                <button style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.background='rgba(255,255,255,0.2)'} onMouseOut={e => e.target.style.background='rgba(255,255,255,0.1)'}>
                                                    + Top Up Balance
                                                </button>
                                            </div>
                                        </div>

                                        {/* Points Card */}
                                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Aurelia Points</p>
                                                <Star size={24} color="#f59e0b" fill="#f59e0b" />
                                            </div>
                                            <div>
                                                <h2 style={{ margin: '0 0 4px 0', fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>2,450 <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '600' }}>pts</span></h2>
                                                <p style={{ margin: 0, color: '#10b981', fontSize: '0.85rem', fontWeight: '600' }}>≈ $24.50 off your next booking</p>
                                            </div>
                                        </div>

                                    </div>
                                </motion.div>
                            )}

                            {/* VIEW 4: TRANSACTIONS */}
                            {currentView === 'transactions' && (
                                <motion.div key="transactions" className="profile-sub-page"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                                    <div className="sub-page-header">
                                        <h2>Transaction History</h2>
                                        <p>Review your past payments, refunds, and wallet top-ups.</p>
                                    </div>
                                    <div className="sub-page-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            
                                            {/* Transaction 1 */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                                                        <Briefcase size={20} />
                                                    </div>
                                                    <div>
                                                        <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.95rem', marginBottom: '2px' }}>Ocean View Resort Booking</strong>
                                                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Oct 12, 2025 • Visa ending in 4242</span>
                                                    </div>
                                                </div>
                                                <span style={{ fontWeight: '700', color: '#0f172a' }}>-$340.00</span>
                                            </div>

                                            {/* Transaction 2 */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                        <Wallet size={20} />
                                                    </div>
                                                    <div>
                                                        <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.95rem', marginBottom: '2px' }}>Wallet Top-up</strong>
                                                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Sep 05, 2025 • MasterCard ending in 8853</span>
                                                    </div>
                                                </div>
                                                <span style={{ fontWeight: '700', color: '#10b981' }}>+$100.00</span>
                                            </div>

                                            {/* Transaction 3 */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                                                        <Receipt size={20} />
                                                    </div>
                                                    <div>
                                                        <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.95rem', marginBottom: '2px' }}>City Center Hotel Refund</strong>
                                                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Aug 22, 2025 • Processed to Wallet</span>
                                                    </div>
                                                </div>
                                                <span style={{ fontWeight: '700', color: '#10b981' }}>+$45.00</span>
                                            </div>

                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* --- NEW INTEGRATED VIEWS: TRAVEL ACTIVITY --- */}
                            
                            {/* VIEW: MY BOOKINGS */}
                            {currentView === 'my_bookings' && (
                                <motion.div key="my_bookings" className="profile-sub-page"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                                    <div className="sub-page-header">
                                        <h2>Bookings & Trips</h2>
                                        <p>View and manage your upcoming and past reservations.</p>
                                    </div>
                                    
                                    <div className="bookings-feed" style={{ marginTop: '20px' }}>
                                        {loadingBookings ? (
                                            <div className="loading-state">Loading your itineraries...</div>
                                        ) : bookings.length === 0 ? (
                                            <div className="empty-state-card sub-page-card" style={{textAlign: 'center', padding: '40px'}}>
                                                <div className="empty-icon-bg"><Calendar size={40} className="icon-muted" style={{ margin: '0 auto' }}/></div>
                                                <h3>No upcoming trips</h3>
                                                <p>You don't have any bookings yet. Start planning your next escape!</p>
                                                <button className="btn-primary" onClick={() => navigate('/hotel-showcase')} style={{marginTop: '20px'}}>Explore Hotels</button>
                                            </div>
                                        ) : (
                                            bookings.map(booking => {
                                                const hotelImage = booking.hotel?.image || booking.hotel_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80';
                                                const hotelName = booking.hotel?.name || booking.hotel_name || "Hotel Reservation";
                                                const roomTitle = booking.room?.title || booking.room_title || "Standard Room";
                                                const location = booking.hotel?.city || booking.hotel_city || "Destination";
                                                const checkIn = new Date(booking.checkIn || booking.check_in);
                                                const checkOut = new Date(booking.checkOut || booking.check_out);
                                                const nights = calculateNights(checkIn, checkOut);
                                                const totalPrice = Number(booking.totalPrice || booking.total_price || 0);

                                                return (
                                                    <motion.div key={booking.id} className="booking-ticket-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                        <div className="btc-image">
                                                            <img src={hotelImage} alt={hotelName} />
                                                            <div className={`btc-status-badge ${getStatusStyle(booking.status)}`}>{booking.status}</div>
                                                        </div>
                                                        
                                                        <div className="btc-content">
                                                            <div className="btc-header">
                                                                <div>
                                                                    <h3 className="btc-hotel-name">{hotelName}</h3>
                                                                    <span className="btc-location"><MapPin size={14}/> {location}</span>
                                                                </div>
                                                                <div className="btc-price-block">
                                                                    <span className="price-label">Total Amount</span>
                                                                    <span className="price-value">${totalPrice.toLocaleString()}</span>
                                                                </div>
                                                            </div>

                                                            <div className="btc-room-info">
                                                                <span className="room-badge"><BedDouble size={14}/> {roomTitle}</span>
                                                                <span className="guest-badge"><Users size={14}/> {booking.adults || 1} Adults {booking.children > 0 ? `, ${booking.children} Kids` : ''}</span>
                                                            </div>

                                                            <div className="btc-dates-row">
                                                                <div className="date-box">
                                                                    <span className="date-label">Check-In</span>
                                                                    <span className="date-value">{checkIn.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                                </div>
                                                                <div className="date-divider">
                                                                    <div className="line"></div>
                                                                    <span className="nights-pill"><Clock size={12}/> {nights} Nights</span>
                                                                    <div className="line"></div>
                                                                </div>
                                                                <div className="date-box right">
                                                                    <span className="date-label">Check-Out</span>
                                                                    <span className="date-value">{checkOut.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                                </div>
                                                            </div>

                                                            <div className="btc-footer">
                                                                <div className="payment-info">
                                                                    <CreditCard size={14}/> Payment: <strong>{booking.payment_status || 'Paid'}</strong>
                                                                </div>
                                                                <div className="btc-actions">
                                                                    <button className="btn-ghost-small" onClick={() => navigate(`/hotel/${booking.hotel_id || booking.hotel?.id}`)}>View Hotel</button>
                                                                    {(booking.status === 'completed' || booking.status === 'confirmed') && (
                                                                        <button className="btn-primary-small" onClick={() => handleOpenReview(booking)}>
                                                                            <MessageSquare size={14} /> Review
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* VIEW: SAVED LISTS / WISHLIST */}
                            {currentView === 'saved_lists' && (
                                <motion.div key="saved_lists" className="profile-sub-page"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                                    
                                    <div className="sub-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h2>Saved Lists</h2>
                                            <p>{wishlist.length} {wishlist.length === 1 ? 'property' : 'properties'} saved for later.</p>
                                        </div>
                                        {wishlist.length > 0 && (
                                            <button className="btn-outline-danger" onClick={() => { if(window.confirm('Are you sure you want to clear your wishlist?')) clearWishlist(); }}>
                                                <Trash2 size={16} /> Clear All
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="sub-page-card" style={{ background: 'transparent', padding: 0, boxShadow: 'none' }}>
                                        {wishlist.length > 0 ? (
                                            <div className="hotel-grid-modern"> 
                                                {wishlist.map(hotel => (
                                                    <div className="hotel-card-wrapper" key={hotel.id}>
                                                        <HotelCard hotel={hotel} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="empty-state-card" style={{textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '12px'}}>
                                                <Heart size={48} color="#cbd5e1" style={{ margin: '0 auto', marginBottom: '16px' }} />
                                                <h3>Your wishlist is empty</h3>
                                                <p>Save properties you love to view them here.</p>
                                                <button className="btn-primary" onClick={() => navigate('/hotel-showcase')} style={{marginTop: '20px'}}>Explore Hotels</button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* VIEW 7: CUSTOMIZATION */}
                            {currentView === 'customization' && (
                                <motion.div key="customization" className="profile-sub-page"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                                    <div className="sub-page-header">
                                        <h2>Customization Preferences</h2>
                                        <p>Set your regional display settings for pricing and formatting.</p>
                                    </div>
                                    <div className="sub-page-card">
                                        <form onSubmit={handleSaveCustomization}>
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>Preferred Currency</label>
                                                <select 
                                                    className="form-input" 
                                                    value={customizationData.currency}
                                                    onChange={(e) => setCustomizationData({...customizationData, currency: e.target.value})}
                                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                                                >
                                                    <option value="USD">USD ($) - US Dollar</option>
                                                    <option value="EUR">EUR (€) - Euro</option>
                                                    <option value="GBP">GBP (£) - British Pound</option>
                                                    <option value="LKR">LKR (Rs) - Sri Lankan Rupee</option>
                                                    <option value="AUD">AUD ($) - Australian Dollar</option>
                                                </select>
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>Preferred Language</label>
                                                <select 
                                                    className="form-input" 
                                                    value={customizationData.language}
                                                    onChange={(e) => setCustomizationData({...customizationData, language: e.target.value})}
                                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                                                >
                                                    <option value="EN">English (US)</option>
                                                    <option value="EN-GB">English (UK)</option>
                                                    <option value="FR">Français (France)</option>
                                                    <option value="ES">Español (Spain)</option>
                                                    <option value="DE">Deutsch (Germany)</option>
                                                </select>
                                            </div>
                                            <button type="submit" className="btn-primary" disabled={savingPrefs}>
                                                {savingPrefs ? <Loader2 className="animate-spin" size={18}/> : 'Save Preferences'}
                                            </button>
                                        </form>
                                    </div>
                                </motion.div>
                            )}

                            {/* VIEW 8: EMAIL PREFERENCES */}
                            {currentView === 'email_preferences' && (
                                <motion.div key="email_preferences" className="profile-sub-page"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                                    <div className="sub-page-header">
                                        <h2>Email Preferences</h2>
                                        <p>Control what emails you receive from Aurelia Travel. Changes save automatically.</p>
                                    </div>
                                    <div className="sub-page-card" style={{ padding: 0, overflow: 'hidden' }}>
                                        
                                        <div className="settings-row" style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                                            <div className="settings-info">
                                                <strong style={{ fontSize: '1.05rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>Promotions & Deals</strong>
                                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>Get exclusive offers, travel inspiration, and personalized property recommendations.</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" checked={emailPrefs.promos} onChange={(e) => handleToggleEmailPref('promos', e.target.checked)} />
                                                <span className="slider round"></span>
                                            </label>
                                        </div>
                                        
                                        <div className="settings-row" style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                                            <div className="settings-info">
                                                <strong style={{ fontSize: '1.05rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>Booking Updates</strong>
                                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>Essential reminders, itinerary changes, and updates about your upcoming trips.</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" checked={emailPrefs.bookings} onChange={(e) => handleToggleEmailPref('bookings', e.target.checked)} />
                                                <span className="slider round"></span>
                                            </label>
                                        </div>
                                        
                                        <div className="settings-row" style={{ padding: '24px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                                            <div className="settings-info">
                                                <strong style={{ fontSize: '1.05rem', color: '#475569', display: 'block', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    Account Security 
                                                    <span style={{ fontSize: '0.65rem', backgroundColor: '#cbd5e1', color: '#0f172a', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', letterSpacing: '0.5px' }}>REQUIRED</span>
                                                </strong>
                                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>Alerts about logins, password changes, and security notices. This cannot be disabled.</p>
                                            </div>
                                            <label className="toggle-switch" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                                                <input type="checkbox" checked={true} disabled />
                                                <span className="slider round"></span>
                                            </label>
                                        </div>

                                    </div>
                                </motion.div>
                            )}

                            {/* VIEW 9: SAFETY RESOURCE CENTER */}
                            {currentView === 'safety_center' && (
                                <motion.div key="safety_center" className="profile-sub-page"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                                    <div className="sub-page-header">
                                        <h2>Safety Resource Center</h2>
                                        <p>Your safety is our top priority. Access emergency resources and safety guidelines.</p>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {/* Emergency Contact Card */}
                                        <div className="sub-page-card" style={{ borderLeft: '4px solid #ef4444', backgroundColor: '#fef2f2', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                                <div style={{ padding: '12px', backgroundColor: '#fee2e2', borderRadius: '50%', color: '#ef4444' }}>
                                                    <AlertTriangle size={24} />
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: '0 0 8px 0', color: '#7f1d1d', fontSize: '1.15rem', fontWeight: '700' }}>In an Emergency</h3>
                                                    <p style={{ margin: '0 0 16px 0', color: '#991b1b', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                                        If you or someone else is in immediate physical danger, or if there is a medical emergency, please contact local emergency services (police, fire, or ambulance) immediately.
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                        <button className="btn-primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            Call Local Authorities
                                                        </button>
                                                        <button className="btn-outline" style={{ borderColor: '#fca5a5', color: '#b91c1c', backgroundColor: 'transparent' }}>
                                                            Aurelia Trust & Safety Line
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Safety Tips Card */}
                                        <div className="sub-page-card">
                                            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <ShieldCheck size={20} color="#3b82f6"/> Travel Safety Guidelines
                                            </h3>
                                            <ul style={{ paddingLeft: '20px', margin: 0, color: '#475569', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                                <li><strong>Verify your communications:</strong> Always communicate and pay directly through the Aurelia platform. Never wire money or pay outside the app.</li>
                                                <li><strong>Share your itinerary:</strong> Let a trusted friend or family member know your travel plans, accommodation details, and contact numbers.</li>
                                                <li><strong>Research your destination:</strong> Familiarize yourself with the neighborhood and local emergency numbers before you arrive.</li>
                                                <li><strong>Trust your instincts:</strong> If a situation feels unsafe, leave immediately and contact our 24/7 support team.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* VIEW: DISPUTE RESOLUTION */}
                            {currentView === 'disputes' && (
                                <motion.div key="disputes" className="profile-sub-page"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                                    
                                    {/* We reuse the component we built earlier */}
                                    <DisputeResolution />
                                    
                                </motion.div>
                            )}

                            {/* VIEW 11: PRIVACY AND DATA MANAGEMENT */}
                            {currentView === 'privacy' && (
                                <motion.div key="privacy" className="profile-sub-page"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                                    
                                    <div className="sub-page-header">
                                        <h2>Privacy & Data Management</h2>
                                        <p>Control how your data is used, download your information, or manage your account status.</p>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        
                                        {/* Data Export Card */}
                                        <div className="sub-page-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: '250px' }}>
                                                <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '50%', color: '#475569' }}>
                                                    <Download size={24} />
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.05rem', fontWeight: '600' }}>Download Your Data</h3>
                                                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                                        Request a copy of your personal data, including your profile information, booking history, and reviews. The file will be emailed to you in JSON format.
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                                                <Download size={16} /> Request Data Archive
                                            </button>
                                        </div>

                                        {/* Danger Zone: Account Deletion */}
                                        <div className="sub-page-card" style={{ border: '1px solid #fca5a5', backgroundColor: '#fff', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: '#ef4444' }}></div>
                                            <div style={{ paddingLeft: '8px' }}>
                                                <h3 style={{ margin: '0 0 4px 0', color: '#b91c1c', fontSize: '1.05rem', fontWeight: '600' }}>Danger Zone</h3>
                                                <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                                    Permanently delete your Aurelia Travel account and all associated data. This action cannot be undone, and you will lose access to all your bookings and rewards.
                                                </p>
                                                <button className="btn-outline-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                                                    <Trash2 size={16} /> Delete Account
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </motion.div>
                            )}

                            {/* VIEW 12: CONTENT GUIDELINES */}
                            {currentView === 'guidelines' && (
                                <motion.div key="guidelines" className="profile-sub-page"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                                    
                                    <div className="sub-page-header">
                                        <h2>Content & Community Guidelines</h2>
                                        <p>Our standards for keeping Aurelia a safe, helpful, and respectful community for travelers and hosts alike.</p>
                                    </div>
                                    
                                    <div className="sub-page-card" style={{ padding: '0', overflow: 'hidden' }}>
                                        
                                        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                <div style={{ padding: '8px', backgroundColor: '#f0fdf4', color: '#10b981', borderRadius: '8px' }}>
                                                    <Check size={20} strokeWidth={2.5}/>
                                                </div>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Be Honest & Accurate</h3>
                                            </div>
                                            <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', paddingLeft: '44px' }}>
                                                Reviews should represent your genuine experience. Do not post fake reviews, exaggerate claims, or attempt to manipulate a property's rating.
                                            </p>
                                        </div>

                                        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                <div style={{ padding: '8px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '8px' }}>
                                                    <Shield size={20} strokeWidth={2}/>
                                                </div>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Respect Privacy & Safety</h3>
                                            </div>
                                            <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', paddingLeft: '44px' }}>
                                                Never share personally identifiable information (PII) such as full names, phone numbers, or exact addresses of other guests or staff members in your public reviews.
                                            </p>
                                        </div>

                                        <div style={{ padding: '24px', backgroundColor: '#f8fafc' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                <div style={{ padding: '8px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px' }}>
                                                    <AlertTriangle size={20} strokeWidth={2}/>
                                                </div>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Zero Tolerance Policy</h3>
                                            </div>
                                            <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', paddingLeft: '44px' }}>
                                                Hate speech, discriminatory language, threats, and explicit content are strictly prohibited. Violating this policy will result in immediate account termination.
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                            For a complete legal overview, please read our full <Link to="/terms" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>Terms of Service</Link> and <Link to="/privacy-policy" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>Privacy Policy</Link>.
                                        </p>
                                    </div>

                                </motion.div>
                            )}

                            {/* VIEW: MY REVIEWS */}
                            {currentView === 'my_reviews' && (
                                <motion.div key="my_reviews" className="profile-sub-page"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                                    <div className="sub-page-header">
                                        <h2>My Reviews</h2>
                                        <p>Manage your feedback and see property responses.</p>
                                    </div>
                                    
                                    <div className="sub-page-card no-pad" style={{ background: 'transparent', boxShadow: 'none' }}>
                                        {loadingReviews ? (
                                            <div className="loading-state">Loading your reviews...</div>
                                        ) : reviews.length === 0 ? (
                                            <div className="empty-state-card" style={{textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '12px'}}>
                                                <MessageSquare size={48} color="#cbd5e1" style={{ margin: '0 auto', marginBottom: '16px' }} />
                                                <h3>No reviews yet</h3>
                                                <p>You haven't written any reviews for your past stays.</p>
                                                <button className="btn-primary" onClick={() => setCurrentView('my_bookings')} style={{marginTop: '20px'}}>View Past Bookings</button>
                                            </div>
                                        ) : (
                                            <div className="reviews-list">
                                                {reviews.map((review) => (
                                                    <div key={review.id} className="user-review-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                                                        <div className="ur-hotel-info" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                                                            <div className="ur-hotel-thumb" style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {review.hotel_image ? (
                                                                    <img src={review.hotel_image} alt={review.hotel_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <Building2 size={24} color="#94a3b8" />
                                                                )}
                                                            </div>
                                                            <div className="ur-hotel-details">
                                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}><Link to={`/hotel/${review.hotel_id}`} style={{ color: '#0f172a', textDecoration: 'none' }}>{review.hotel_name}</Link></h4>
                                                                <span className="ur-date" style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <Calendar size={14} /> 
                                                                    {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="ur-content">
                                                            {renderStars(review.rating)}
                                                            <h5 className="ur-title" style={{ margin: '10px 0 6px 0', fontSize: '1.05rem' }}>{review.title}</h5>
                                                            <p className="ur-comment" style={{ margin: 0, color: '#475569', lineHeight: '1.5' }}>{review.comment}</p>
                                                        </div>

                                                        {review.hotel_response && (
                                                            <div className="ur-manager-reply" style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                                                                <div className="reply-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#1e293b' }}>
                                                                    <CornerDownRight size={16} />
                                                                    <strong>Response from Property Manager</strong>
                                                                </div>
                                                                <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem' }}>{review.hotel_response}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                            {/* ... End of Travel Activity Views ... */}

                        </AnimatePresence>
                    </div>

                </motion.div>
            )}

            {/* --- MODALS --- */}
            
            {/* 2FA SETUP MODAL */}
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

            {/* REVIEW SUBMISSION MODAL */}
            <AnimatePresence>
                {showReviewModal && (
                    <div className="modal-overlay" onClick={() => setShowReviewModal(false)} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                        <motion.div className="modal-content" onClick={e => e.stopPropagation()} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{backgroundColor: '#fff', padding: '30px', borderRadius: '16px', maxWidth: '500px', width: '100%'}}>
                            <div className="modal-header-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                                <h3 style={{margin: 0, fontSize: '1.3rem'}}>Review: {reviewTarget?.hotelName}</h3>
                                <button className="modal-close-icon" onClick={() => setShowReviewModal(false)} style={{background: 'transparent', border: 'none', cursor: 'pointer'}}><X size={20}/></button>
                            </div>
                            <form onSubmit={handleSubmitReview} className="payment-modal-form">
                                <div className="form-group" style={{marginBottom: '16px'}}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>Your Rating</label>
                                    <div style={{display:'flex', gap:'5px'}}>
                                        {[1,2,3,4,5].map(star => (
                                            <Star 
                                                key={star} size={32} 
                                                fill={star <= reviewForm.rating ? "#f59e0b" : "none"} 
                                                color={star <= reviewForm.rating ? "#f59e0b" : "#cbd5e1"}
                                                style={{cursor:'pointer', transition:'all 0.2s'}}
                                                onClick={() => setReviewForm({...reviewForm, rating: star})}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group" style={{marginBottom: '16px'}}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>Summary</label>
                                    <input className="form-input" style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}} placeholder="e.g., Amazing stay!" value={reviewForm.title} onChange={e => setReviewForm({...reviewForm, title: e.target.value})} required />
                                </div>
                                <div className="form-group" style={{marginBottom: '16px'}}>
                                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>Details</label>
                                    <textarea className="form-input" style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}} placeholder="Tell others about your experience..." rows="4" value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} required />
                                </div>
                                <button type="submit" className="btn-primary full-width" style={{marginTop:'20px', width: '100%', padding: '12px'}}>Submit Review</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </AnimatePresence>
      </div>
    </div>
  );
}