import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/userContext'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import './styles/LoginRegister.css'
import axios from 'axios'

// Simple SVG components for Google/Facebook
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.799 L -6.734 42.379 C -8.804 40.439 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g>
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

export default function Auth(){
  const navigate = useNavigate()
  const { refreshUser } = useUser()
  
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login') 
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  })

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('aurelia_saved_email')
    if (savedEmail) {
      setForm(prev => ({ ...prev, email: savedEmail }))
      setRememberMe(true)
    }
  }, [])

  const handleSocialLogin = (provider) => {
    // Placeholder for social login logic
    console.log(`Initiating ${provider} login...`)
    alert(`${provider} login integration pending backend setup.`)
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Client-side Validation
    if (mode === 'register') {
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters")
            setLoading(false)
            return
        }
    }

    try {
      if (mode === 'login') {
        // Handle "Remember Me" logic
        if (rememberMe) {
            localStorage.setItem('aurelia_saved_email', form.email)
        } else {
            localStorage.removeItem('aurelia_saved_email')
        }

        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email: form.email,
          password: form.password
        }, {
          withCredentials: true
        })

        console.log('Login successful:', response.data)
        await refreshUser()
        navigate('/profile')
      } else {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
          username: form.username,
          email: form.email,
          password: form.password
        }, {
          withCredentials: true
        })

        console.log('Registration successful:', response.data)
        alert('Registration successful! Please login.')
        toggleMode() 
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setError(null)
    setForm(prev => ({ ...prev, username: '', password: '', confirmPassword: '' }))
    setMode(mode === 'login' ? 'register' : 'login')
  }

  return (
    <div className="auth-page-wrapper">
      <div className={`auth-card-container ${mode === 'register' ? 'mode-register' : 'mode-login'}`}>
        
        {/* --- LEFT SIDE: IMAGE & BRANDING --- */}
        <div className="auth-visual-side">
            <div className="visual-overlay">
                <div className="brand-header">
                    <span className="visual-tag">INTELLIGENT CONCIERGE</span>
                </div>
                
                <div className="visual-text-content">
                    <h1 className="visual-heading">
                        {mode === 'login' 
                            ? "Orchestrating your next escape." 
                            : "Redefining the art of travel."}
                    </h1>
                    <p className="visual-subtext">
                        {mode === 'login' 
                            ? "Welcome back. Access your curated itineraries and recover your most valuable asset: your time." 
                            : "Join an elite community of travelers using AI to curate exceptional, logistics-free experiences."}
                    </p>
                </div>

                <div className="glass-testimonial">
                    <p className="quote-text">
                        {mode === 'login' 
                        ? "\"Efficiency is my currency. Aurelia saves me hours of planning without compromising on luxury.\"" 
                        : "\"I stopped planning and started traveling. The AI recommendations are indistinguishable from a human expert.\""}
                    </p>
                    <div className="quote-author">
                        <div className="author-avatar">AV</div>
                        <div>
                            <span className="author-name">Alexander V.</span>
                            <span className="author-role">Founding Partner</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- RIGHT SIDE: FORM --- */}
        <div className="auth-form-side">
            <div className="form-container">
                
                <div className="form-header">
                    <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
                    <p className="sub-header">
                        {mode === 'login' ? "Please enter your details." : "Start your journey today."}
                    </p>
                </div>

                {/* SOCIAL LOGIN BUTTONS */}
                <div className="social-login-group">
                    <button type="button" className="social-btn" onClick={() => handleSocialLogin('google')}>
                        <GoogleIcon />
                        <span>Google</span>
                    </button>
                    <button type="button" className="social-btn" onClick={() => handleSocialLogin('facebook')}>
                        <FacebookIcon />
                        <span>Facebook</span>
                    </button>
                </div>

                <div className="divider">
                    <span>or continue with email</span>
                </div>

                <form onSubmit={submit} className="modern-form">
                    
                    {/* USERNAME (Register Only) */}
                    {mode === 'register' && (
                        <div className="input-group slide-in-element">
                            <label htmlFor="username">Full Name</label>
                            <div className="input-wrapper">
                                {/*<User size={18} className="input-icon"/>*/}
                                <input 
                                    id="username"
                                    name="username"
                                    autoComplete="name"
                                    value={form.username} 
                                    onChange={e=>setForm(f=>({...f, username:e.target.value}))} 
                                    className="modern-input"
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* EMAIL */}
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <div className="input-wrapper">
                            {/*<Mail size={18} className="input-icon"/>*/}
                            <input 
                                id="email"
                                name="email"
                                autoComplete="email" 
                                value={form.email} 
                                onChange={e=>setForm(f=>({...f, email:e.target.value}))} 
                                type="email" 
                                className="modern-input"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    {/* PASSWORD */}
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            {/*<Lock size={18} className="input-icon"/>*/}
                            <input 
                                id="password"
                                name="password"
                                autoComplete={mode === 'login' ? "current-password" : "new-password"}
                                value={form.password} 
                                onChange={e=>setForm(f=>({...f, password:e.target.value}))} 
                                type={showPassword ? "text" : "password"} 
                                className="modern-input"
                                placeholder="••••••••"
                                required
                            />
                            <button 
                                type="button" 
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                        </div>
                    </div>

                    {/* CONFIRM PASSWORD (Register Only) */}
                    {mode === 'register' && (
                        <div className="input-group slide-in-element">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="input-wrapper">
                                {/*<CheckCircle size={18} className="input-icon"/>*/}
                                <input 
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    autoComplete="new-password"
                                    value={form.confirmPassword} 
                                    onChange={e=>setForm(f=>({...f, confirmPassword:e.target.value}))} 
                                    type={showPassword ? "text" : "password"} 
                                    className="modern-input"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* OPTIONS ROW (Remember Me / Forgot Password) */}
                    {mode === 'login' && (
                        <div className="form-options">
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="checkbox-custom"></span>
                                Remember me
                            </label>
                            <button type="button" className="link-btn-small">Forgot password?</button>
                        </div>
                    )}

                    {error && (
                        <div className="error-banner">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button type="submit" className="submit-btn-animated" disabled={loading}>
                        <span>{loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}</span>
                        {!loading && <ArrowRight size={18} />}
                    </button>

                    <p className="bottom-text">
                        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button type="button" onClick={toggleMode} className="link-btn-text">
                            {mode === 'login' ? "Sign up" : "Log in"}
                        </button>
                    </p>

                </form>
            </div>
        </div>

      </div>
    </div>
  )
}