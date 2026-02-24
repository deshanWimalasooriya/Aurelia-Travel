import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MapPin, BedDouble, CheckCircle, ChevronRight, ChevronLeft,
    Plus, Trash2, Loader2, UploadCloud, Home, Bath, X, Star, CreditCard, Users, ShieldCheck, Globe,
    CheckCircle2, MinusCircle, List, Clock, Ban, ShieldAlert, FileText
} from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/userContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './styles/property-onboarding.css';

// Fix Leaflet Default Icon Issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map Helper Component
const LocationMarker = ({ setPosition }) => {
    useMapEvents({ click(e) { setPosition(e.latlng.lat, e.latlng.lng); } });
    return null;
};
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => { map.flyTo(center, map.getZoom()); }, [center, map]);
    return null;
};

// --- NEW STRUCTURED STEPS ---
const SECTIONS = [
    {
        id: 'property', title: '1. Property Setup',
        steps: [
            { id: 1, title: 'Property Type' },
            { id: 2, title: 'Listing Size' },
            { id: 3, title: 'Location' },
            { id: 4, title: 'Basic Details' },
            { id: 5, title: 'Amenities' },
            { id: 6, title: 'Services & Languages' },
            { id: 7, title: 'House Rules' }
        ]
    },
    {
        id: 'rooms', title: '2. Room Details',
        steps: [ { id: 8, title: 'Manage Rooms' } ]
    },
    {
        id: 'photos', title: '3. Media Gallery',
        steps: [ { id: 9, title: 'Property Photos' } ]
    },
    {
        id: 'final', title: '4. Finalization',
        steps: [
            { id: 10, title: 'Payments' },
            { id: 11, title: 'Review Details' },
            { id: 12, title: 'Publish' }
        ]
    }
];

export default function PropertyOnboarding() {
    const navigate = useNavigate();
    const { refreshUser } = useUser();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [dbAmenities, setDbAmenities] = useState([]); 
    const [newAmenityText, setNewAmenityText] = useState('');

    // --- EXPANDED STATE ---
    const [propData, setPropData] = useState({
        type: '', category: 'Standard', listingStyle: 'single', propertyCount: 1,
        name: '', description: '', starRating: 3,
        lat: 6.9271, lng: 79.8612, 
        address: '', city: '', province: '', country: '', postalCode: '',
        amenities: [], services: [], languages: [], payments: [],
        
        checkIn: '14:00', checkOut: '11:00', rules: '', cancellationPolicy: '24',
        
        petsAllowed: false, 
        smokingAllowed: false, 
        partiesAllowed: false,
        damageDeposit: 0,
        minAge: 18
    });

    const [rooms, setRooms] = useState([]);
    const [showRoomModal, setShowRoomModal] = useState(false);
    
    const [roomForm, setRoomForm] = useState({
        title: '', type: 'Standard', view: 'City View', price: '', quantity: 1, adults: 2,
        roomAmenities: [], customFeatures: '', 
        bathroomType: 'Private En-suite', bathroomAmenities: [], roomImages: []
    });

    const [hotelFiles, setHotelFiles] = useState([]);

    useEffect(() => {
        api.get('/amenities') 
            .then(res => {
                const rawAm = Array.isArray(res.data) ? res.data : (res.data.data || []);
                const normalized = rawAm.map(a => ({ ...a, id: a.id || a._id, name: a.name }));
                setDbAmenities(normalized);
            }).catch(err => console.warn("Global amenities fetch failed:", err));
    }, []);

    const moveToSelected = (id) => {
        if (!propData.amenities.some(a => String(a) === String(id))) {
            setPropData(prev => ({ ...prev, amenities: [...prev.amenities, id] }));
        }
    };

    const moveToAvailable = (id) => {
        setPropData(prev => ({ ...prev, amenities: prev.amenities.filter(a => String(a) !== String(id)) }));
    };

    const addNewAmenity = () => {
        if (!newAmenityText.trim()) return;
        const name = newAmenityText.trim();
        const existing = dbAmenities.find(a => a.name.toLowerCase() === name.toLowerCase());
        if (existing) {
            moveToSelected(existing.id); 
        } else {
            const tempId = name; 
            setDbAmenities(prev => [...prev, { id: tempId, name: name }]); 
            setPropData(prev => ({ ...prev, amenities: [...prev.amenities, tempId] }));
        }
        setNewAmenityText('');
    };

    const selectedList = dbAmenities.filter(am => propData.amenities.some(id => String(id) === String(am.id)));
    const availableList = dbAmenities.filter(am => !propData.amenities.some(id => String(id) === String(am.id)));

    const activeSection = SECTIONS.find(sec => sec.steps.some(s => s.id === currentStep))?.id;

    const handleMapClick = async (lat, lng) => {
        setPropData(prev => ({ ...prev, lat, lng }));
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const data = await res.json();
            if (data && data.address) {
                setPropData(prev => ({
                    ...prev,
                    address: data.address.road || data.display_name.split(',')[0] || prev.address,
                    city: data.address.city || data.address.town || data.address.state_district || prev.city,
                    province: data.address.state || prev.province,
                    country: data.address.country || prev.country,
                    postalCode: data.address.postcode || prev.postalCode
                }));
            }
        } catch (err) { console.error("Geocoding failed", err); }
    };

    const toggleArrayItem = (field, item) => {
        setPropData(prev => ({
            ...prev,
            [field]: prev[field].includes(item) ? prev[field].filter(i => i !== item) : [...prev[field], item]
        }));
    };

    const toggleRoomAmenity = (item) => {
        setRoomForm(prev => ({
            ...prev,
            roomAmenities: prev.roomAmenities.includes(item) 
                ? prev.roomAmenities.filter(i => i !== item) 
                : [...prev.roomAmenities, item]
        }));
    };

    const toggleBathroomAmenity = (item) => {
        setRoomForm(prev => ({
            ...prev,
            bathroomAmenities: prev.bathroomAmenities.includes(item) 
                ? prev.bathroomAmenities.filter(i => i !== item) 
                : [...prev.bathroomAmenities, item]
        }));
    };

    const handleRoomImageSelect = (e) => {
        setRoomForm(prev => ({ ...prev, roomImages: [...prev.roomImages, ...Array.from(e.target.files)] }));
    };

    const saveRoom = () => {
        if (!roomForm.title || !roomForm.price) return alert("Title and Price are required.");
        setRooms([...rooms, { ...roomForm, id: Date.now() }]);
        setShowRoomModal(false);
        setRoomForm({ 
            title: '', type: 'Standard', view: 'City View', price: '', quantity: 1, adults: 2, 
            roomAmenities: [], customFeatures: '', 
            bathroomType: 'Private En-suite', bathroomAmenities: [], roomImages: [] 
        });
    };

    const handleHotelFileSelect = (e) => {
        setHotelFiles(prev => [...prev, ...Array.from(e.target.files)]);
    };

    const handleLaunchProperty = async () => {
        setIsSubmitting(true);
        try {
            await api.put('/users/upgrade-to-manager');

            let uploadedHotelImages = [];
            if (hotelFiles.length > 0) {
                const uploadData = new FormData();
                hotelFiles.forEach(file => uploadData.append('images', file));
                const res = await api.post('/upload/bulk', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
                uploadedHotelImages = res.data.images.map((img, i) => ({ url: img.url, isPrimary: i === 0 }));
            }

            const compiledRules = `
                <ul>
                    <li><strong>Minimum Age:</strong> ${propData.minAge}</li>
                    <li><strong>Damage Deposit:</strong> $${propData.damageDeposit}</li>
                    <li><strong>Pets:</strong> ${propData.petsAllowed ? 'Allowed' : 'Not Allowed'}</li>
                    <li><strong>Smoking:</strong> ${propData.smokingAllowed ? 'Allowed' : 'Not Allowed'}</li>
                    <li><strong>Parties:</strong> ${propData.partiesAllowed ? 'Allowed' : 'Not Allowed'}</li>
                </ul>
                ${propData.rules ? `<p><strong>Additional Rules:</strong> ${propData.rules}</p>` : ''}
            `;

            // 2. Create Clean Structured Hotel Payload 
            const hotelPayload = {
                name: propData.name, 
                description: propData.description, // No more HTML compiling here!
                property_type: propData.type,
                star_rating: propData.starRating,
                address_line_1: propData.address, city: propData.city, country: propData.country, postal_code: propData.postalCode,
                latitude: propData.lat, longitude: propData.lng,
                check_in_time: propData.checkIn, check_out_time: propData.checkOut,
                cancellation_policy_hours: parseInt(propData.cancellationPolicy) || 24, 
                
                // NEW STRUCTURED FIELDS
                pets_allowed: propData.petsAllowed,
                smoking_allowed: propData.smokingAllowed,
                parties_allowed: propData.partiesAllowed,
                min_age: parseInt(propData.minAge),
                damage_deposit: parseFloat(propData.damageDeposit) || 0,
                services: propData.services,
                languages: propData.languages,
                accepted_payments: propData.payments,
                custom_rules: propData.rules,

                images: uploadedHotelImages.length > 0 ? uploadedHotelImages : [{ url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', isPrimary: true }],
                amenities: propData.amenities
            };
            const hotelRes = await api.post('/hotels', hotelPayload);
            const newHotelId = hotelRes.data.data ? hotelRes.data.data.id : hotelRes.data.hotelId;

            // 3. Create Clean Structured Rooms
            for (const room of rooms) {
                let uploadedRoomImages = [];
                if (room.roomImages && room.roomImages.length > 0) {
                    const rUploadData = new FormData();
                    room.roomImages.forEach(file => rUploadData.append('images', file));
                    const rRes = await api.post('/upload/bulk', rUploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    uploadedRoomImages = rRes.data.images.map((img, i) => ({ url: img.url, isPrimary: i === 0 }));
                }

                await api.post('/rooms', {
                    hotel_id: newHotelId, 
                    title: room.title, 
                    room_type: room.type, 
                    base_price_per_night: Number(room.price), 
                    total_quantity: Number(room.quantity), 
                    max_adults: Number(room.adults),
                    
                    // NEW STRUCTURED FIELDS
                    view_type: room.view,
                    bathroom_type: room.bathroomType,
                    custom_features: room.customFeatures,
                    room_amenities: room.roomAmenities,
                    bathroom_amenities: room.bathroomAmenities,

                    images: uploadedRoomImages
                });
            }

            await refreshUser();
            alert("🎉 Property Launched Successfully!");
            navigate('/admin');

        } catch (err) {
            console.error(err);
            alert("Launch failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="wizard-layout">
            {/* --- LEFT SIDEBAR --- */}
            <div className="wizard-sidebar">
                <div className="ws-brand">Aurelia<span>Partners</span></div>
                <div className="ws-stepper-scroll">
                    {SECTIONS.map((section) => (
                        <div key={section.id} className="ws-section-group">
                            <h4 className={`ws-section-title ${activeSection === section.id ? 'active-title' : ''}`}>
                                {section.title}
                            </h4>
                            <AnimatePresence>
                                {activeSection === section.id && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }} 
                                        animate={{ height: 'auto', opacity: 1 }} 
                                        exit={{ height: 0, opacity: 0 }}
                                        className="ws-steps-container"
                                    >
                                        {section.steps.map((step) => (
                                            <div key={step.id} className={`ws-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
                                                <div className="ws-step-indicator">{currentStep > step.id ? <CheckCircle size={14} /> : step.id}</div>
                                                <span className="ws-step-title">{step.title}</span>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
                <button className="ws-exit" onClick={() => navigate('/profile')}>Exit Setup</button>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="wizard-main">
                <div className="wizard-content">
                    <AnimatePresence mode="wait">
                        
                        {/* 1. PROPERTY TYPE */}
                        {currentStep === 1 && (
                            <motion.div key="s1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="step-view">
                                <h1>What kind of place will you host?</h1>
                                <p className="sub-text">Select the category that best describes your property.</p>
                                <div className="grid-cards">
                                    {['Hotel', 'Villa', 'Resort', 'Apartment', 'Guest House', 'Boutique Hotel'].map(type => (
                                        <div key={type} className={`selection-card ${propData.type === type ? 'selected' : ''}`} onClick={() => setPropData({...propData, type})}>
                                            <Home size={32} /> <span>{type}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* 2. LISTING SIZE */}
                        {currentStep === 2 && (
                            <motion.div key="s2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="step-view">
                                <h1>How many properties are you listing?</h1>
                                <div className="radio-group-vertical mt-4">
                                    <label className={`radio-card ${propData.listingStyle === 'single' ? 'active' : ''}`}>
                                        <input type="radio" name="lstyle" checked={propData.listingStyle === 'single'} onChange={() => setPropData({...propData, listingStyle: 'single', propertyCount: 1})} />
                                        <div><strong>One Property</strong><p>A single location with one or multiple rooms.</p></div>
                                    </label>
                                    <label className={`radio-card ${propData.listingStyle === 'multiple' ? 'active' : ''}`}>
                                        <input type="radio" name="lstyle" checked={propData.listingStyle === 'multiple'} onChange={() => setPropData({...propData, listingStyle: 'multiple'})} />
                                        <div><strong>Multiple Properties</strong><p>A portfolio of different locations or branches.</p></div>
                                    </label>
                                </div>
                                {propData.listingStyle === 'multiple' && (
                                    <div className="form-group mt-4 slide-down">
                                        <label>How many properties in this batch?</label>
                                        <input type="number" min="2" value={propData.propertyCount} onChange={e=>setPropData({...propData, propertyCount: e.target.value})} className="form-input"/>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* 3. LOCATION */}
                        {currentStep === 3 && (
                            <motion.div key="s3" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="step-view map-step-view">
                                <div className="location-split">
                                    <div className="address-form-side">
                                        <h2>Confirm Address</h2>
                                        <p className="sub-text">Pin on the map to auto-fill, or type below.</p>
                                        <div className="form-group"><label>Street Address</label><input value={propData.address} onChange={e=>setPropData({...propData, address: e.target.value})} className="form-input"/></div>
                                        <div className="form-group"><label>City</label><input value={propData.city} onChange={e=>setPropData({...propData, city: e.target.value})} className="form-input"/></div>
                                        <div className="form-group"><label>State / Province</label><input value={propData.province} onChange={e=>setPropData({...propData, province: e.target.value})} className="form-input"/></div>
                                        <div className="form-row">
                                            <div className="form-group"><label>Country</label><input value={propData.country} onChange={e=>setPropData({...propData, country: e.target.value})} className="form-input"/></div>
                                            <div className="form-group"><label>Postal Code</label><input value={propData.postalCode} onChange={e=>setPropData({...propData, postalCode: e.target.value})} className="form-input"/></div>
                                        </div>
                                    </div>
                                    <div className="map-box">
                                        <MapContainer center={[propData.lat, propData.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <LocationMarker setPosition={handleMapClick} />
                                            <Marker position={[propData.lat, propData.lng]} />
                                            <MapUpdater center={[propData.lat, propData.lng]} />
                                        </MapContainer>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* 4. BASIC INFO */}
                        {currentStep === 4 && (
                            <motion.div key="s4" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="step-view">
                                <h1>Tell us about your property</h1>
                                <div className="form-group mt-4">
                                    <label>Property Name</label>
                                    <input placeholder="e.g. The Grand Ocean Resort" value={propData.name} onChange={e=>setPropData({...propData, name: e.target.value})} className="form-input" style={{fontSize:'1.2rem', padding:'16px'}}/>
                                </div>
                                <div className="form-group mt-4">
                                    <label>Official Star Rating</label>
                                    <div className="star-rating-selector">
                                        {[1,2,3,4,5].map(star => (
                                            <button key={star} className={`star-btn ${propData.starRating >= star ? 'active' : ''}`} onClick={() => setPropData({...propData, starRating: star})}>
                                                <Star size={24} fill={propData.starRating >= star ? "currentColor" : "none"}/>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group mt-4">
                                    <label>Description</label>
                                    <textarea placeholder="Describe what makes your property unique..." rows={5} value={propData.description} onChange={e=>setPropData({...propData, description: e.target.value})} className="form-input"/>
                                </div>
                            </motion.div>
                        )}

                        {/* 5. AMENITIES */}
                        {currentStep === 5 && (
                            <motion.div key="s5" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="step-view">
                                <h1>What can guests use at your hotel?</h1>
                                <p className="sub-text">Select all the facilities available on-site.</p>
                                
                                <div className="form-section no-border">
                                <h4 className="section-heading"><CheckCircle2 size={18}/> Amenities</h4>
                                <div style={{display:'flex', gap:'10px', marginBottom:'20px', alignItems: 'center'}}>
                                    <input className="form-input" placeholder="Create new amenity..." value={newAmenityText} onChange={e => setNewAmenityText(e.target.value)} style={{maxWidth: '300px'}}/>
                                    <button type="button" className="btn-ghost" onClick={addNewAmenity}>Add Custom</button>
                                </div>
                                <div className="transfer-container">
                                    <div className="transfer-column">
                                        <div className="transfer-header"><span>Selected ({selectedList.length})</span><CheckCircle2 size={16} /></div>
                                        <div className="transfer-list">
                                            {selectedList.map(am => (
                                                <div key={am.id} className="transfer-item selected-item" onClick={() => moveToAvailable(am.id)}>
                                                    <span>{am.name}</span><MinusCircle size={14} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="transfer-controls"></div>
                                    <div className="transfer-column">
                                        <div className="transfer-header"><span>Available ({availableList.length})</span><List size={16} /></div>
                                        <div className="transfer-list">
                                            {availableList.map(am => (
                                                <div key={am.id} className="transfer-item available-item" onClick={() => moveToSelected(am.id)}>
                                                    <span>{am.name}</span><Plus size={14} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </motion.div>
                        )}

                        {/* 6. SERVICES & LANGUAGES */}
                        {currentStep === 6 && (
                            <motion.div key="s6" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="step-view">
                                <h1>Guest Services & Staff Languages</h1>
                                <p className="sub-text">Highlight the hospitality services and languages your team offers to make guests feel at home.</p>
                                
                                <h3 className="section-subtitle">
                                    <ShieldCheck size={20} color="var(--color-primary)"/> Premium Services
                                </h3>
                                <div className="pill-grid">
                                    {['Room Service', '24/7 Front Desk', 'Airport Shuttle', 'Daily Housekeeping', 'Laundry', 'Concierge', 'Valet Parking', 'Tour Desk'].map(srv => (
                                        <label key={srv} className={`checkbox-pill ${propData.services.includes(srv) ? 'active' : ''}`}>
                                            <input type="checkbox" hidden checked={propData.services.includes(srv)} onChange={() => toggleArrayItem('services', srv)}/>
                                            {propData.services.includes(srv) && <CheckCircle2 size={16} />}
                                            {srv}
                                        </label>
                                    ))}
                                </div>

                                <hr className="divider" />

                                <h3 className="section-subtitle">
                                    <Globe size={20} color="#10b981"/> Languages Spoken
                                </h3>
                                <div className="pill-grid">
                                    {['English', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic', 'Hindi', 'Japanese', 'Russian', 'Italian'].map(lang => (
                                        <label key={lang} className={`checkbox-pill ${propData.languages.includes(lang) ? 'active' : ''}`}>
                                            <input type="checkbox" hidden checked={propData.languages.includes(lang)} onChange={() => toggleArrayItem('languages', lang)}/>
                                            {propData.languages.includes(lang) && <CheckCircle2 size={16} />}
                                            {lang}
                                        </label>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* 7. HOUSE RULES & POLICIES */}
                        {currentStep === 7 && (
                            <motion.div key="s7" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="step-view">
                                <h1>Policies & House Rules</h1>
                                <p className="sub-text">Set clear expectations to ensure a smooth stay for your guests.</p>
                                
                                <h3 className="mt-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-dark)', fontSize: '1.1rem', marginBottom: '16px' }}>
                                    <Clock size={20} color="var(--color-primary)" /> Timing & Cancellations
                                </h3>
                                <div className="form-row">
                                    <div className="form-group"><label>Check-in Time (From)</label><input type="time" value={propData.checkIn} onChange={e=>setPropData({...propData, checkIn: e.target.value})} className="form-input"/></div>
                                    <div className="form-group"><label>Check-out Time (Until)</label><input type="time" value={propData.checkOut} onChange={e=>setPropData({...propData, checkOut: e.target.value})} className="form-input"/></div>
                                </div>
                                
                                <div className="form-row mt-4">
                                    <div className="form-group">
                                        <label>Free Cancellation Window (Hours)</label>
                                        <div style={{ position: 'relative' }}>
                                            <ShieldAlert size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input type="number" min="0" value={propData.cancellationPolicy} onChange={e=>setPropData({...propData, cancellationPolicy: e.target.value})} className="form-input" style={{ paddingLeft: '44px' }} placeholder="24"/>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Minimum Check-in Age</label>
                                        <input type="number" min="18" value={propData.minAge} onChange={e=>setPropData({...propData, minAge: e.target.value})} className="form-input"/>
                                    </div>
                                </div>

                                <hr className="divider" />

                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-dark)', fontSize: '1.1rem', marginBottom: '16px' }}>
                                    <Ban size={20} color="#ef4444" /> Strict Allowances
                                </h3>
                                
                                <div className="pill-grid" style={{ marginBottom: '20px' }}>
                                    <label className={`checkbox-pill ${propData.petsAllowed ? 'active' : ''}`}>
                                        <input type="checkbox" hidden checked={propData.petsAllowed} onChange={() => setPropData({...propData, petsAllowed: !propData.petsAllowed})}/>
                                        {propData.petsAllowed ? <CheckCircle2 size={16} /> : <Ban size={16} color={propData.petsAllowed ? "inherit" : "#94a3b8"}/>}
                                        Pets Allowed
                                    </label>
                                    <label className={`checkbox-pill ${propData.smokingAllowed ? 'active' : ''}`}>
                                        <input type="checkbox" hidden checked={propData.smokingAllowed} onChange={() => setPropData({...propData, smokingAllowed: !propData.smokingAllowed})}/>
                                        {propData.smokingAllowed ? <CheckCircle2 size={16} /> : <Ban size={16} color={propData.smokingAllowed ? "inherit" : "#94a3b8"}/>}
                                        Smoking Allowed
                                    </label>
                                    <label className={`checkbox-pill ${propData.partiesAllowed ? 'active' : ''}`}>
                                        <input type="checkbox" hidden checked={propData.partiesAllowed} onChange={() => setPropData({...propData, partiesAllowed: !propData.partiesAllowed})}/>
                                        {propData.partiesAllowed ? <CheckCircle2 size={16} /> : <Ban size={16} color={propData.partiesAllowed ? "inherit" : "#94a3b8"}/>}
                                        Parties/Events Allowed
                                    </label>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Damage Deposit Required ($)</label>
                                        <input type="number" min="0" value={propData.damageDeposit} onChange={e=>setPropData({...propData, damageDeposit: e.target.value})} className="form-input" placeholder="0 for none"/>
                                    </div>
                                </div>

                                <div className="form-group mt-4">
                                    <label>Additional Custom Rules (Optional)</label>
                                    <textarea placeholder="e.g., Quiet hours strictly from 10 PM to 6 AM." rows={3} value={propData.rules} onChange={e=>setPropData({...propData, rules: e.target.value})} className="form-input"/>
                                </div>
                            </motion.div>
                        )}

                        {/* 8. ROOMS */}
                        {currentStep === 8 && (
                            <motion.div key="s8" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="step-view">
                                <h1>Set up your rooms</h1>
                                <p className="sub-text">Define the specific units available for booking.</p>

                                {rooms.map((room, idx) => (
                                    <div key={idx} className="room-summary-card">
                                        <div>
                                            <h4>{room.title} <span className="badge">{room.type}</span></h4>
                                            <p>${room.price}/night • {room.quantity} available • Max {room.adults} Adults</p>
                                            <small style={{color:'var(--text-muted)'}}>{room.roomImages.length} images attached</small>
                                        </div>
                                        <button className="icon-btn-danger" onClick={() => setRooms(rooms.filter(r => r.id !== room.id))}><Trash2 size={16}/></button>
                                    </div>
                                ))}

                                <button className="add-room-trigger" onClick={() => setShowRoomModal(true)}>
                                    <Plus size={20}/> Add a Room Type
                                </button>
                            </motion.div>
                        )}

                        {/* 9. PHOTOS */}
                        {currentStep === 9 && (
                            <motion.div key="s9" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="step-view">
                                <h1>Overall Property Photos</h1>
                                <p className="sub-text">Upload exterior and facility photos (room photos are handled in the room setup).</p>
                                
                                <div className="upload-dropzone">
                                    <input type="file" multiple accept="image/*" onChange={handleHotelFileSelect} />
                                    <UploadCloud size={40} color="#3b82f6" />
                                    <span>Drag & drop or click to upload photos</span>
                                </div>

                                <div className="file-preview-grid">
                                    {hotelFiles.map((file, idx) => (
                                        <div key={idx} className="file-preview-item">
                                            <img src={URL.createObjectURL(file)} alt="preview" />
                                            <button className="remove-img-btn" onClick={() => setHotelFiles(hotelFiles.filter((_, i) => i !== idx))}><X size={14}/></button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* 10. PAYMENTS */}
                        {currentStep === 10 && (
                            <motion.div key="s10" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="step-view">
                                <h1>How can guests pay?</h1>
                                <p className="sub-text">Select all accepted payment methods at your property.</p>
                                <div className="payment-grid mt-4">
                                    {['Credit Card (Visa/Mastercard)', 'Cash on Arrival', 'Bank Transfer', 'PayPal', 'Crypto', 'AliPay'].map(method => (
                                        <label key={method} className={`payment-card ${propData.payments.includes(method) ? 'active' : ''}`}>
                                            <input type="checkbox" hidden checked={propData.payments.includes(method)} onChange={() => toggleArrayItem('payments', method)}/>
                                            <CreditCard size={24}/>
                                            <span>{method}</span>
                                        </label>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* 11. COMPREHENSIVE REVIEW LISTING (NEW STEP) */}
                        {currentStep === 11 && (
                            <motion.div key="s11" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="step-view summary-step-view">
                                <h1>Review Your Listing</h1>
                                <p className="sub-text">Please verify all details across your entire property configuration before publishing.</p>

                                <div className="summary-hero">
                                    <h2>{propData.name || "Unnamed Property"}</h2>
                                    <div className="star-display">
                                        {[...Array(propData.starRating || 1)].map((_, i) => <Star key={i} size={22} fill="#f59e0b" color="#f59e0b" />)}
                                    </div>
                                </div>

                                <div className="summary-card" style={{ marginBottom: '20px' }}>
                                    <h4><FileText size={18}/> About the Property</h4>
                                    <p style={{fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0}}>{propData.description || 'No description provided.'}</p>
                                </div>

                                <div className="summary-grid">
                                    {/* Core & Location */}
                                    <div className="summary-card">
                                        <h4><MapPin size={18}/> Location & Setup</h4>
                                        <div className="summary-item"><span className="label">Type</span><span className="value">{propData.type || 'Not set'}</span></div>
                                        <div className="summary-item"><span className="label">Structure</span><span className="value">{propData.listingStyle === 'single' ? 'Single Property' : `Multiple (${propData.propertyCount})`}</span></div>
                                        <div className="summary-item" style={{alignItems: 'flex-start', marginTop: '12px'}}><span className="label">Address</span><span className="value" style={{textAlign: 'right'}}>{propData.address}<br/>{propData.city}, {propData.province}<br/>{propData.country} - {propData.postalCode}</span></div>
                                    </div>

                                    {/* Operations & Rules */}
                                    <div className="summary-card">
                                        <h4><Clock size={18}/> Operations & Policies</h4>
                                        <div className="summary-item"><span className="label">Check-in / Out</span><span className="value">{propData.checkIn} - {propData.checkOut}</span></div>
                                        <div className="summary-item"><span className="label">Cancellation</span><span className="value">{propData.cancellationPolicy} Hrs</span></div>
                                        <div className="summary-item"><span className="label">Min Age</span><span className="value">{propData.minAge}+</span></div>
                                        <div className="summary-item"><span className="label">Damage Deposit</span><span className="value">${propData.damageDeposit || 0}</span></div>
                                        <div className="summary-item"><span className="label">Pets Allowed</span><span className="value">{propData.petsAllowed ? '✅ Yes' : '❌ No'}</span></div>
                                        <div className="summary-item"><span className="label">Smoking Allowed</span><span className="value">{propData.smokingAllowed ? '✅ Yes' : '❌ No'}</span></div>
                                        <div className="summary-item"><span className="label">Parties Allowed</span><span className="value">{propData.partiesAllowed ? '✅ Yes' : '❌ No'}</span></div>
                                    </div>

                                    {/* Offerings (Amenities, Services, Languages, Custom Rules) */}
                                    <div className="summary-card span-2" style={{ gridColumn: '1 / -1' }}>
                                        <h4><ShieldCheck size={18}/> Guest Experience Offerings</h4>
                                        <div className="summary-item" style={{alignItems: 'flex-start'}}><span className="label">Amenities ({selectedList.length})</span><span className="value" style={{maxWidth: '75%', textAlign: 'right'}}>{selectedList.length > 0 ? selectedList.map(a => a.name).join(', ') : 'None selected'}</span></div>
                                        <div className="summary-item" style={{alignItems: 'flex-start'}}><span className="label">Premium Services ({propData.services.length})</span><span className="value" style={{maxWidth: '75%', textAlign: 'right'}}>{propData.services.length > 0 ? propData.services.join(', ') : 'None selected'}</span></div>
                                        <div className="summary-item" style={{alignItems: 'flex-start'}}><span className="label">Staff Languages ({propData.languages.length})</span><span className="value" style={{maxWidth: '75%', textAlign: 'right'}}>{propData.languages.length > 0 ? propData.languages.join(', ') : 'None selected'}</span></div>
                                        {propData.rules && <div className="summary-item" style={{alignItems: 'flex-start', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0'}}><span className="label">Custom Rules</span><span className="value" style={{maxWidth: '75%', fontStyle: 'italic', textAlign: 'right'}}>{propData.rules}</span></div>}
                                    </div>

                                    {/* Rooms Detailed List */}
                                    <div className="summary-card span-2" style={{ gridColumn: '1 / -1' }}>
                                        <h4><BedDouble size={18}/> Configured Rooms ({rooms.length})</h4>
                                        {rooms.length === 0 ? <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0}}>No rooms added yet. Properties perform better with specific rooms listed.</p> : (
                                            <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px'}}>
                                                {rooms.map((room, idx) => (
                                                    <div key={idx} style={{background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                        <div>
                                                            <strong style={{color: 'var(--color-dark)', fontSize: '1.05rem'}}>{room.title}</strong> <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>({room.type} • {room.view})</span>
                                                            <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', gap: '12px'}}>
                                                                <span>👥 Max {room.adults} Adults</span>
                                                                <span>🔑 {room.quantity} Unit(s) Available</span>
                                                                <span>✨ {room.roomAmenities.length + room.bathroomAmenities.length} Features</span>
                                                            </div>
                                                        </div>
                                                        <div style={{fontWeight: '800', fontSize: '1.2rem', color: 'var(--color-primary)'}}>${room.price}<span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>/nt</span></div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Media & Financials */}
                                    <div className="summary-card span-2" style={{ gridColumn: '1 / -1' }}>
                                        <h4><CreditCard size={18}/> Payments & Media Assets</h4>
                                        <div className="summary-item"><span className="label">Accepted Payments</span><span className="value">{propData.payments.length > 0 ? propData.payments.join(', ') : 'None selected'}</span></div>
                                        <div className="summary-item"><span className="label">Overall Property Photos</span><span className="value">{hotelFiles.length} uploaded</span></div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* 12. PUBLISH (SHIFTED) */}
                        {currentStep === 12 && (
                            <motion.div key="s12" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="step-view text-center">
                                <CheckCircle size={80} color="#10b981" style={{margin: '0 auto'}}/>
                                <h1 style={{marginTop:'20px'}}>Ready to go live!</h1>
                                <p className="sub-text" style={{maxWidth:'500px', margin:'0 auto'}}>
                                    You have successfully reviewed your dossier. You are about to publish <strong>{propData.name || 'your property'}</strong> with <strong>{rooms.length} room types</strong> to Aurelia Travel.
                                </p>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* BOTTOM NAVIGATION BAR */}
                <div className="wizard-footer">
                    <button className="btn-wizard-back" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 1}>
                        <ChevronLeft size={20}/> Back
                    </button>
                    
                    {/* CHANGED: Next button logic shifted to accommodate the new 12th step */}
                    {currentStep < 12 ? (
                        <button className="btn-wizard-next" onClick={() => setCurrentStep(prev => prev + 1)}>
                            Next <ChevronRight size={20}/>
                        </button>
                    ) : (
                        <button className="btn-wizard-publish" onClick={handleLaunchProperty} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : 'Launch Property'}
                        </button>
                    )}
                </div>
            </div>

            {/* ROOM CREATION MODAL */}
            {showRoomModal && (
                <div className="room-setup-modal-overlay">
                    <div className="room-setup-modal">
                        <div className="rsm-header">
                            <h2>Room Details</h2>
                            <button onClick={() => setShowRoomModal(false)}><X size={24}/></button>
                        </div>
                        
                        <div className="rsm-body">
                            <div className="form-group"><label>Room Title</label><input placeholder="e.g. Deluxe Ocean Suite" value={roomForm.title} onChange={e=>setRoomForm({...roomForm, title: e.target.value})} className="form-input"/></div>
                            
                            <div className="form-row mt-4">
                                <div className="form-group">
                                    <label>Room Type</label>
                                    <select value={roomForm.type} onChange={e=>setRoomForm({...roomForm, type: e.target.value})} className="form-input">
                                        <option>Standard</option><option>Deluxe</option><option>Suite</option><option>Villa</option><option>Family Room</option><option>Studio</option><option>Penthouse</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Room View</label>
                                    <select value={roomForm.view} onChange={e=>setRoomForm({...roomForm, view: e.target.value})} className="form-input">
                                        <option>City View</option><option>Ocean View</option><option>Garden View</option><option>Mountain View</option><option>Pool View</option><option>No Specific View</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row mt-4">
                                <div className="form-group"><label>Price/Night ($)</label><input type="number" value={roomForm.price} onChange={e=>setRoomForm({...roomForm, price: e.target.value})} className="form-input"/></div>
                                <div className="form-group"><label>Quantity</label><input type="number" value={roomForm.quantity} onChange={e=>setRoomForm({...roomForm, quantity: e.target.value})} className="form-input"/></div>
                                <div className="form-group"><label>Max Adults</label><input type="number" value={roomForm.adults} onChange={e=>setRoomForm({...roomForm, adults: e.target.value})} className="form-input"/></div>
                            </div>
                            
                            <hr className="divider" />
                            <h4><BedDouble size={18}/> Inside the Room</h4>
                            <p className="sub-text" style={{margin: '0 0 12px 0', fontSize: '0.85rem'}}>Select all features available in this specific room.</p>
                            
                            <div className="pill-grid" style={{marginBottom: '16px'}}>
                                {['Air Conditioning', 'Flat-screen TV', 'Balcony', 'Minibar', 'Coffee Maker', 'Work Desk', 'Safe', 'Seating Area', 'Kitchenette'].map(item => (
                                    <label key={item} className={`checkbox-pill ${roomForm.roomAmenities.includes(item) ? 'active' : ''}`} style={{padding: '8px 14px', fontSize: '0.85rem'}}>
                                        <input type="checkbox" hidden checked={roomForm.roomAmenities.includes(item)} onChange={() => toggleRoomAmenity(item)}/>
                                        {roomForm.roomAmenities.includes(item) && <CheckCircle2 size={14} />}
                                        {item}
                                    </label>
                                ))}
                            </div>
                            
                            <div className="form-group">
                                <label>Other Custom Room Features</label>
                                <input placeholder="e.g. Private plunge pool, Soundproofing..." value={roomForm.customFeatures} onChange={e=>setRoomForm({...roomForm, customFeatures: e.target.value})} className="form-input"/>
                            </div>

                            <hr className="divider" />
                            <h4><Bath size={18}/> Bathroom Setup</h4>
                            
                            <div className="form-group mt-2">
                                <label>Bathroom Type</label>
                                <select value={roomForm.bathroomType} onChange={e=>setRoomForm({...roomForm, bathroomType: e.target.value})} className="form-input">
                                    <option>Private En-suite</option><option>Shared Bathroom</option>
                                </select>
                            </div>

                            <div className="pill-grid" style={{marginBottom: '10px', marginTop: '16px'}}>
                                {['Free Toiletries', 'Hairdryer', 'Bathtub', 'Walk-in Shower', 'Towels', 'Bathrobe', 'Slippers', 'Bidet'].map(item => (
                                    <label key={item} className={`checkbox-pill ${roomForm.bathroomAmenities.includes(item) ? 'active' : ''}`} style={{padding: '8px 14px', fontSize: '0.85rem'}}>
                                        <input type="checkbox" hidden checked={roomForm.bathroomAmenities.includes(item)} onChange={() => toggleBathroomAmenity(item)}/>
                                        {roomForm.bathroomAmenities.includes(item) && <CheckCircle2 size={14} />}
                                        {item}
                                    </label>
                                ))}
                            </div>

                            <hr className="divider" />
                            <h4>📸 Room Photos</h4>
                            <div className="upload-dropzone" style={{padding: '30px 20px'}}>
                                <input type="file" multiple accept="image/*" onChange={handleRoomImageSelect} />
                                <span>Click to attach photos for this room</span>
                            </div>
                            <div className="file-preview-grid mt-2">
                                {roomForm.roomImages.map((file, idx) => (
                                    <div key={idx} className="file-preview-item">
                                        <img src={URL.createObjectURL(file)} alt="preview" />
                                        <button type="button" className="remove-img-btn" onClick={() => setRoomForm(prev => ({...prev, roomImages: prev.roomImages.filter((_, i) => i !== idx)}))}><X size={14}/></button>
                                    </div>
                                ))}
                            </div>

                        </div>
                        <div className="rsm-footer">
                            <button className="btn-wizard-next w-100" onClick={saveRoom}>Save Room</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}