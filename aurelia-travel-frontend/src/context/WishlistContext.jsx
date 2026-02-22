import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; // Use your existing axios instance
import { useUser } from './userContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const { user } = useUser();
    const [wishlist, setWishlist] = useState([]);
    
    // Fetch wishlist when user logs in
    useEffect(() => {
        if (user) fetchWishlist();
        else setWishlist([]);
    }, [user]);

    const fetchWishlist = async () => {
        try {
            const res = await api.get('/wishlist');
            if(res.data.success) setWishlist(res.data.data);
        } catch (err) { console.error(err); }
    };

    const toggleWishlist = async (hotel) => {
        if (!user) {
            alert("Please login to save hotels.");
            return;
        }

        // Optimistic UI Update
        const exists = wishlist.find(w => w.id === hotel.id);
        if (exists) {
            setWishlist(prev => prev.filter(w => w.id !== hotel.id));
        } else {
            setWishlist(prev => [hotel, ...prev]);
        }

        try {
            await api.post('/wishlist/toggle', { hotelId: hotel.id });
            // Re-fetch to ensure sync (optional)
            // fetchWishlist(); 
        } catch (err) {
            console.error("Wishlist error", err);
            // Revert on error
            fetchWishlist();
        }
    };

    const clearWishlist = async () => {
        setWishlist([]);
        try { await api.delete('/wishlist'); } 
        catch (err) { fetchWishlist(); }
    };

    const isInWishlist = (hotelId) => {
        return wishlist.some(item => item.id === parseInt(hotelId));
    };

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, clearWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => useContext(WishlistContext);