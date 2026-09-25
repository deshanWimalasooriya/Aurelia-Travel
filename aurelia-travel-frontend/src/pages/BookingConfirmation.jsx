import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUser } from '../context/userContext';
import { CheckCircle, CreditCard, User, Calendar, MapPin, Info, Clock, Check } from 'lucide-react';
import './styles/BookingConfirmation.css';

const BookingConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUser();

    // 1. Safely recover the drafted booking data from local storage
    let savedDraft = null;
    try {
        const savedDraftRaw = localStorage.getItem('incompleteBooking');
        if (savedDraftRaw) savedDraft = JSON.parse(savedDraftRaw);
    } catch (err) {
        localStorage.removeItem('incompleteBooking'); // Clear it if corrupted
    }

    // 2. Prioritize fresh navigation state, fallback to the saved draft
    const bookingDetails = location.state || (savedDraft ? savedDraft.details : null);

    // 3. Set steps and IDs cleanly (NO DUPLICATES)
    const isResuming = !location.state && !!savedDraft;
    const [currentStep, setCurrentStep] = useState(isResuming ? 3 : 2);
    const [draftBookingId, setDraftBookingId] = useState(isResuming ? savedDraft.bookingId : null);
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardDetails, setCardDetails] = useState({
        cardType: 'Visa',
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: ''
    });
    const [savedCards, setSavedCards] = useState([]);
    const [selectedSavedCard, setSelectedSavedCard] = useState('');

    useEffect(() => {
        if (user) {
            api.get('/wallet').then(res => setSavedCards(res.data.data || [])).catch(err => console.error(err));
        }
    }, [user]);

    // 4. Redirect if no data is found
    useEffect(() => {
        if (!bookingDetails) navigate('/hotel-showcase');
    }, [bookingDetails, navigate]);

    // 5. THE EARLY RETURN: Stops the page from crashing while it redirects
    if (!bookingDetails) {
        return <div style={{ padding: '100px', textAlign: 'center' }}>Redirecting...</div>;
    }

    // Guest Details Form State (Pre-filled if user is logged in)
    const [guestDetails, setGuestDetails] = useState({
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        email: user?.email || '',
        country: user?.country || 'Sri Lanka',
        phone: user?.phone || '',
        specialRequests: '',
        arrivalTime: ''
    });

    // Keep form synced if user logs in mid-way
    useEffect(() => {
        if (user) {
            setGuestDetails(prev => ({
                ...prev,
                firstName: user.first_name || prev.firstName,
                lastName: user.last_name || prev.lastName,
                email: user.email || prev.email,
                country: user.country || prev.country,
                phone: user.phone || prev.phone
            }));
        }
    }, [user]);

    if (!bookingDetails) return null;
    const { hotel, room, dates, guests, roomQty, totalPrice } = bookingDetails;

    // STEP 2: Save as Incomplete
    const handleNextStep = async () => {
        if (!guestDetails.firstName || !guestDetails.lastName || !guestDetails.email || !guestDetails.country || !guestDetails.phone) {
            alert("Please fill in all required fields (*).");
            return;
        }

        if (paymentMethod === 'card') {
            if (!selectedSavedCard && (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiryDate || !cardDetails.cvv)) {
                alert("Please fill in all card details.");
                return;
            }
        }

        setIsProcessing(true);
        try {
            const bookingPayload = {
                room_id: room.id || room._id,
                check_in: dates.checkIn,
                check_out: dates.checkOut,
                adults: guests.adults,
                children: guests.children,
                room_count: roomQty,
                total_price: totalPrice,
                payment_token: 'tok_cash_on_arrival', 
                payment_provider: paymentMethod,
                status: 'incomplete', 
                // New Fields mapped to Backend
                guest_first_name: guestDetails.firstName,
                guest_last_name: guestDetails.lastName,
                guest_email: guestDetails.email,
                guest_country: guestDetails.country,
                guest_phone: guestDetails.phone,
                special_requests: guestDetails.specialRequests,
                arrival_time: guestDetails.arrivalTime
            };

            // Dynamically choose endpoint based on auth status
            const endpoint = user ? '/bookings' : '/bookings/guest';
            const res = await api.post(endpoint, bookingPayload);
            
            if (res.status === 200 || res.status === 201) {
                const bId = res.data.bookingId;
                setDraftBookingId(bId);
                
                localStorage.setItem('incompleteBooking', JSON.stringify({
                    bookingId: bId,
                    details: bookingDetails
                }));
                
                setCurrentStep(3);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save draft booking.");
        } finally {
            setIsProcessing(false);
        }
    };

    // STEP 3: Confirm and Complete
    const handleConfirmBooking = async () => {
        setIsProcessing(true);
        try {
            const endpoint = user ? `/bookings/${draftBookingId}/confirm` : `/bookings/guest/${draftBookingId}/confirm`; 
            await api.put(endpoint); // Ensure backend has matching route if allowing guest confirms, or just rely on standard update
            
            localStorage.removeItem('incompleteBooking'); 
            alert("🎉 Reservation Completed Successfully!");
            navigate(user ? '/profile' : '/'); 
        } catch (err) {
            alert("Failed to confirm booking.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="booking-confirmation-layout">
            {/* LEFT SIDE: 25% Fixed Booking Summary */}
            <div className="booking-summary-sidebar">
                <div className="summary-card">
                    <h3 className="step-title"><CheckCircle size={18} className="completed-icon"/> Step 1: Your Selection</h3>
                    <img src={room.main_image || hotel.main_image} alt="Room" className="summary-img" />
                    <h2 className="summary-hotel">{hotel.name}</h2>
                    <p className="summary-location"><MapPin size={14}/> {hotel.city}, {hotel.country}</p>
                    <div className="summary-divider"></div>
                    <div className="summary-details">
                        <p><strong>Room:</strong> {room.title} (x{roomQty})</p>
                        <p><strong><Calendar size={14}/> Dates:</strong> {dates.checkIn} to {dates.checkOut}</p>
                        <p><strong><User size={14}/> Guests:</strong> {guests.adults} Adults, {guests.children} Children</p>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-total">
                        <span>Total Price</span>
                        <span className="price">${totalPrice.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: 75% Dynamic Content */}
            <div className="booking-action-area">
                <div className="step-tracker">
                    <div className="step completed"><div className="step-circle">1</div><span>Selection</span></div>
                    <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`}></div>
                    <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                        <div className="step-circle">{currentStep > 2 ? <CheckCircle size={16}/> : '2'}</div>
                        <span>Details & Payment</span>
                    </div>
                    <div className={`step-line ${currentStep === 3 ? 'active' : ''}`}></div>
                    <div className={`step ${currentStep === 3 ? 'active' : ''}`}><div className="step-circle">3</div><span>Confirmation</span></div>
                </div>

                <div className="step-content-container fade-in">
                    {currentStep === 2 && (
                        <div className="step-two-content">
                            
                            {!user && (
                                <div className="guest-login-banner">
                                    <div className="banner-icon-container"><User size={24} color="#fff"/></div>
                                    <div className="banner-text">
                                        <strong>Please sign in, Your account</strong> <span className="blue-link">Not you?</span><br/>
                                        <span>Save time! Sign in to book with your saved details.</span>
                                    </div>
                                    <button className="banner-signin-btn" onClick={() => navigate('/auth')}>Sign in</button>
                                </div>
                            )}

                            {/* User Details Form Block */}
                            <div className="form-section-card">
                                <h2>Enter your details</h2>
                                <div className="info-alert-box">
                                    <Info size={16} color="#475569"/> Almost done! Just fill in the * required info
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label>First name <span className="req">*</span></label>
                                        <input type="text" value={guestDetails.firstName} onChange={e => setGuestDetails({...guestDetails, firstName: e.target.value})} />
                                    </div>
                                    <div className="input-group">
                                        <label>Last name <span className="req">*</span></label>
                                        <input type="text" value={guestDetails.lastName} onChange={e => setGuestDetails({...guestDetails, lastName: e.target.value})} />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Email address <span className="req">*</span></label>
                                    <input type="email" value={guestDetails.email} onChange={e => setGuestDetails({...guestDetails, email: e.target.value})} />
                                    <span className="input-hint">Confirmation email sent to this address</span>
                                </div>

                                <div className="input-group">
                                    <label>Country/Region <span className="req">*</span></label>
                                    <select value={guestDetails.country} onChange={e => setGuestDetails({...guestDetails, country: e.target.value})}>
                                        <option value="Sri Lanka">Sri Lanka</option>
                                        <option value="United States">United States</option>
                                        <option value="United Kingdom">United Kingdom</option>
                                        <option value="Australia">Australia</option>
                                        <option value="India">India</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label>Phone number <span className="req">*</span></label>
                                    <div className="phone-input-row">
                                        <select className="phone-prefix"><option>LK +94</option></select>
                                        <input type="tel" value={guestDetails.phone} onChange={e => setGuestDetails({...guestDetails, phone: e.target.value})} />
                                    </div>
                                    <span className="input-hint">To verify your booking, and for the property to connect if needed</span>
                                </div>
                            </div>

                            {/* Special Requests Block */}
                            <div className="form-section-card">
                                <h2>Special requests</h2>
                                <p className="section-desc">Special requests can't be guaranteed, but the property will do its best to meet your needs. You can always make a special request after your booking is complete.</p>
                                <div className="input-group">
                                    <label>Please write your requests in English. <span className="opt">(optional)</span></label>
                                    <textarea rows="4" value={guestDetails.specialRequests} onChange={e => setGuestDetails({...guestDetails, specialRequests: e.target.value})}></textarea>
                                </div>
                            </div>

                            {/* Arrival Time Block */}
                            <div className="form-section-card">
                                <h2>Your arrival time</h2>
                                <div className="arrival-perks">
                                    <p><CheckCircle size={16} color="#10b981"/> Your room will be ready for check-in between 1:00 PM and 12:00 AM</p>
                                    <p><Clock size={16} color="#10b981"/> 24-hour front desk – help whenever you need it!</p>
                                </div>
                                <div className="input-group">
                                    <label>Add your estimated arrival time <span className="opt">(optional)</span></label>
                                    <select value={guestDetails.arrivalTime} onChange={e => setGuestDetails({...guestDetails, arrivalTime: e.target.value})}>
                                        <option value="">Please select</option>
                                        <option value="14:00 - 15:00">2:00 PM - 3:00 PM</option>
                                        <option value="15:00 - 16:00">3:00 PM - 4:00 PM</option>
                                        <option value="16:00 - 17:00">4:00 PM - 5:00 PM</option>
                                        <option value="Late Night">Late Night (After 8:00 PM)</option>
                                    </select>
                                    <span className="input-hint">Time is for the local property time zone</span>
                                </div>
                            </div>

                            {/* Payment Options Block */}
                            <div className="payment-options">
                                <h3><CreditCard size={18}/> Select Payment Option</h3>
                                <div className={`pay-card ${paymentMethod === 'card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('card')}>
                                    <strong>Pay Now (Credit/Debit)</strong>
                                    <p>Securely pay via Stripe</p>
                                </div>
                                <div className={`pay-card ${paymentMethod === 'arrival' ? 'selected' : ''}`} onClick={() => setPaymentMethod('arrival')}>
                                    <strong>Pay on Arrival</strong>
                                    <p>Reserve now, pay at the property</p>
                                </div>
                            </div>

                            {paymentMethod === 'card' && (
                                <div className="form-section-card fade-in" style={{ marginTop: '20px', borderTop: '2px solid #3b82f6', background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0 }}>Card Details</h3>
                                        {savedCards.length > 0 && (
                                            <select 
                                                value={selectedSavedCard} 
                                                onChange={e => setSelectedSavedCard(e.target.value)}
                                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: '#fff', cursor: 'pointer', fontWeight: '500', color: '#1e293b' }}
                                            >
                                                <option value="">+ Use a new card</option>
                                                {savedCards.map(c => (
                                                    <option key={c.id} value={c.id}>{c.card_brand.toUpperCase()} ending in {c.card_last_four}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    
                                    {!selectedSavedCard ? (
                                        <>
                                            <div className="input-group" style={{ marginTop: '15px' }}>
                                                <label>Card Type</label>
                                                <select value={cardDetails.cardType} onChange={e => setCardDetails({...cardDetails, cardType: e.target.value})}>
                                                    <option value="Visa">Visa</option>
                                                    <option value="MasterCard">MasterCard</option>
                                                    <option value="American Express">American Express</option>
                                                    <option value="Discover">Discover</option>
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label>Name on Card <span className="req">*</span></label>
                                                <input type="text" placeholder="John Doe" value={cardDetails.cardName} onChange={e => setCardDetails({...cardDetails, cardName: e.target.value})} />
                                            </div>
                                            <div className="input-group">
                                                <label>Card Number <span className="req">*</span></label>
                                                <input type="text" placeholder="0000 0000 0000 0000" maxLength="19" value={cardDetails.cardNumber} onChange={e => setCardDetails({...cardDetails, cardNumber: e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim()})} />
                                            </div>
                                            <div className="form-row">
                                                <div className="input-group">
                                                    <label>Expiry Date <span className="req">*</span></label>
                                                    <input type="text" placeholder="MM/YY" maxLength="5" value={cardDetails.expiryDate} onChange={e => setCardDetails({...cardDetails, expiryDate: e.target.value.replace(/[^0-9/]/g, '').replace(/^([2-9])$/g, '0$1').replace(/^(1{1})([3-9]{1})$/g, '0$1/$2').replace(/^0{0,1}[0-9]{1}[0-9]{1}/g, val => val.length === 2 && !val.includes('/') ? val + '/' : val)})} />
                                                </div>
                                                <div className="input-group">
                                                    <label>CVV <span className="req">*</span></label>
                                                    <input type="password" placeholder="123" maxLength="4" value={cardDetails.cvv} onChange={e => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '')})} />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <CheckCircle size={24} color="#10b981" />
                                            <div>
                                                <strong style={{ color: '#0f172a' }}>Using Saved Card</strong>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>Your saved {savedCards.find(c => c.id == selectedSavedCard)?.card_brand} ending in {savedCards.find(c => c.id == selectedSavedCard)?.card_last_four} will be securely charged.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button className="primary-btn" onClick={handleNextStep} disabled={isProcessing} style={{ marginTop: '25px' }}>
                                {isProcessing ? 'Saving Details...' : 'Next Step'}
                            </button>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="step-three-content">
                            <h2>Review & Confirm</h2>
                            <div className="confirmation-box">
                                <p>Your booking is safely drafted. Please review the final details before officially confirming your stay.</p>
                                
                                <div className="detailed-review-section" style={{ marginTop: '20px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
                                    <h4 style={{ marginBottom: '15px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Reservation Summary</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', fontSize: '0.95rem', color: '#475569' }}>
                                        <div><strong>Hotel:</strong> {hotel.name}</div>
                                        <div><strong>Room:</strong> {room.title} (x{roomQty})</div>
                                        <div><strong>Check-in:</strong> {dates.checkIn}</div>
                                        <div><strong>Check-out:</strong> {dates.checkOut}</div>
                                        <div><strong>Guests:</strong> {guests.adults} Adults, {guests.children} Children</div>
                                        <div><strong>Total Price:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>${totalPrice.toLocaleString()}</span></div>
                                    </div>

                                    <h4 style={{ margin: '20px 0 15px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Guest & Payment</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', fontSize: '0.95rem', color: '#475569' }}>
                                        <div><strong>Name:</strong> {guestDetails.firstName} {guestDetails.lastName}</div>
                                        <div><strong>Email:</strong> {guestDetails.email}</div>
                                        <div><strong>Phone:</strong> {guestDetails.phone}</div>
                                        <div><strong>Country:</strong> {guestDetails.country}</div>
                                        <div><strong>Arrival Time:</strong> {guestDetails.arrivalTime || 'Not specified'}</div>
                                        <div><strong>Payment Method:</strong> {paymentMethod === 'card' ? 'Online via Stripe' : 'Pay at Property'}</div>
                                    </div>
                                    {guestDetails.specialRequests && (
                                        <div style={{ marginTop: '15px', fontSize: '0.95rem', color: '#475569' }}>
                                            <strong>Special Requests:</strong> {guestDetails.specialRequests}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="step-three-actions" style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                                <button 
                                    className="secondary-btn" 
                                    onClick={() => setCurrentStep(2)} 
                                    disabled={isProcessing} 
                                    style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                                >
                                    Back to Details
                                </button>
                                <button className="confirm-btn" onClick={handleConfirmBooking} disabled={isProcessing} style={{ flex: 2 }}>
                                    {isProcessing ? 'Finalizing...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingConfirmation;