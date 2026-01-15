import { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- DERIVED STATE: Check if user is admin ---
  // This automatically updates whenever 'user' changes.
  // We check for both common patterns: 'role' string or 'isAdmin' boolean.
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;

  const fetchUser = async () => {
    try {
      // Ensure this endpoint returns the 'role' field!
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
    // Pass 'isAdmin' down in the value object
    <UserContext.Provider value={{ user, isAdmin, loading, refreshUser, clearUser }}>
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