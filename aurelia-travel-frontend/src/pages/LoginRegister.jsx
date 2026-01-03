import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import './styles/loginRegister.css'

const LoginRegister = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  // State for error handling
  const [error, setError] = useState('') 
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('') // Clear error when typing
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // ==========================
        // 1. FIX: SEND EMAIL & PASSWORD
        // ==========================
        
        // ❌ OLD ERROR WAS HERE: 
        // login({ id: 1, name: "John Doe", email: formData.email }); 

        // ✅ CORRECT CODE:
        const result = await login({ 
          email: formData.email, 
          password: formData.password 
        });

        if (result && result.success) {
          navigate('/profile'); 
        } else {
          setError(result?.message || 'Login failed. Please check your credentials.');
        }

      } else {
        // ==========================
        // 2. REGISTER LOGIC
        // ==========================
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        // Register API Call
        await axios.post('http://localhost:5000/api/auth/register', {
            username: formData.name,
            email: formData.email,
            password: formData.password
        });

        // Auto-Login after Register
        const loginResult = await login({ 
            email: formData.email, 
            password: formData.password 
        });

        if (loginResult && loginResult.success) {
            navigate('/profile');
        }
      }
    } catch (err) {
      console.error("Form Submit Error:", err);
      const msg = err.response?.data?.message || "An error occurred";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-tabs">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`auth-tab ${isLogin ? 'active' : ''}`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
          >
            Register
          </button>
        </div>

        {/* Error Message */}
        {error && <div style={{ 
            color: '#dc2626', 
            backgroundColor: '#fee2e2', 
            padding: '10px', 
            borderRadius: '6px', 
            marginBottom: '15px',
            fontSize: '0.9rem',
            textAlign: 'center'
        }}>
            {error}
        </div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                required={!isLogin}
                placeholder="John Doe"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              required
              placeholder="name@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-input"
              required
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="form-input"
                required={!isLogin}
                placeholder="••••••••"
              />
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="auth-switch">
          <p className="auth-switch-text">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="auth-switch-link"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginRegister