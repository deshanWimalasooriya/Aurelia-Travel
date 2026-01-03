import { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom' // ✅ Import useNavigate

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate() // ✅ Initialize hook

  // 1. CHECK SESSION
  const checkAuth = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/me', {
        withCredentials: true 
      });

      if (res.data.success) {
        // Handle nested structure from backend
        const userData = res.data.user || (res.data.data && res.data.data.user) || res.data.data;
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  // 2. LOGIN FUNCTION (Auto-Redirects to Profile)
  const login = async (credentials) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', credentials, {
        withCredentials: true 
      });

      if (res.data.success) {
        const validUser = res.data.user || (res.data.data && res.data.data.user) || res.data.data;
        
        if (validUser) {
            setUser(validUser);
            // ✅ AUTOMATIC NAVIGATION
            navigate('/profile'); 
            return { success: true };
        }
      }
    } catch (err) {
      console.error("Login Error:", err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Login failed' 
      };
    }
  }

  // 3. LOGOUT FUNCTION (Auto-Redirects to Auth)
  const logout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error(err);
    } finally {
      // Always clear user and redirect, even if API failed
      setUser(null);
      // ✅ AUTOMATIC NAVIGATION
      navigate('/auth'); 
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}