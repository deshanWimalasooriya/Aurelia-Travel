import { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        withCredentials: true
      });
      
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (err) {
      // ✅ FIX: Check specifically for 401 (Not Logged In)
      if (err.response && err.response.status === 401) {
        // This is normal! We just set user to null silently.
        // No console.error() here, so your console stays clean.
        setUser(null);
      } else {
        // Only log REAL errors (like server crashes)
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
    <UserContext.Provider value={{ user, loading, refreshUser, clearUser }}>
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