import { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- DERIVED STATE ---
  // 1. Check if user is Admin
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;
  
  // 2. Check if user is Hotel Manager (New Logic)
  const isManager = user?.role === 'HotelManager' || user?.isManager === true;

  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        withCredentials: true
      });
      
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setUser(null);
      } else {
        console.log('Session check error:', err.message);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const clearUser = () => {
    setUser(null);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    // Pass 'isManager' down in the value object
    <UserContext.Provider value={{ user, isAdmin, isManager, loading, refreshUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};