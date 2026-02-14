import { useState, useEffect } from 'react';
import platformService from '../../services/platformService';
import { Search, MapPin, Power, Mail } from 'lucide-react';
import './styles/super-hotels.css';

const SuperHotels = () => {
    // 1. Initialize as empty array
    const [hotels, setHotels] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // 2. Load Data on Mount
    useEffect(() => {
        loadHotels();
    }, []);

    const loadHotels = async () => {
        setLoading(true);
        try {
            const data = await platformService.getHotels();
            
            // 3. Safety Check: Ensure we received an array
            if (Array.isArray(data)) {
                setHotels(data);
                console.log("Hotels Loaded:", data.length);
            } else {
                console.error("API Error: Expected array but got:", data);
                setHotels([]);
            }
        } catch (err) { 
            console.error("Failed to load hotels:", err); 
            setHotels([]); 
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (hotel) => {
        const action = hotel.is_active ? 'BAN' : 'ACTIVATE';
        if(!window.confirm(`Are you sure you want to ${action} this hotel?`)) return;
        
        try {
            await platformService.updateHotelStatus(hotel.id, !hotel.is_active);
            await loadHotels(); // Reload data to reflect changes
        } catch (err) { 
            alert("Action failed. Please try again."); 
            console.error(err);
        }
    };

    // 4. Safe Filtering
    const filtered = hotels.filter(h => 
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        (h.manager_name && h.manager_name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div>
            <div className="sa-header-row">
                <h1 className="sa-page-title" style={{marginBottom:0}}>Manage Hotels</h1>
                <div className="sa-search-wrapper">
                    <Search size={18} className="sa-search-icon"/>
                    <input 
                        className="sa-search-input"
                        placeholder="Search hotels or managers..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="sa-table-card">
                <table className="sa-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Manager</th>
                            <th>Status</th>
                            <th style={{textAlign: 'right'}}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" style={{textAlign: 'center', padding: '30px', color: '#64748b'}}>
                                    Loading Hotels...
                                </td>
                            </tr>
                        ) : filtered.length > 0 ? (
                            filtered.map(hotel => (
                                <tr key={hotel.id}>
                                    <td>
                                        <div className="sa-hotel-name">{hotel.name}</div>
                                        <div className="sa-hotel-sub">
                                            <MapPin size={14}/> {hotel.city}, {hotel.country}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{hotel.manager_name || 'No Manager'}</div>
                                        <div className="sa-hotel-sub">
                                            <Mail size={14}/> {hotel.manager_email || 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={hotel.is_active ? 'sa-badge-active' : 'sa-badge-banned'}>
                                            {hotel.is_active ? 'Active' : 'Banned'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button 
                                            onClick={() => toggleStatus(hotel)}
                                            className={`sa-btn-action ${hotel.is_active ? 'sa-btn-ban' : 'sa-btn-activate'}`}
                                        >
                                            <Power size={14}/> {hotel.is_active ? 'Ban Hotel' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{textAlign: 'center', padding: '30px', color: '#64748b'}}>
                                    No hotels found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SuperHotels;