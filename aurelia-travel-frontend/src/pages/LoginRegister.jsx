import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/userContext'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import './styles/LoginRegister.css'
import axios from 'axios'

export default function Auth(){
  const navigate = useNavigate()
  const { refreshUser } = useUser()
  
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login') 
  
  // Added confirmPassword to state
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  })
  
  const [showPassword, setShowPassword] = useState(false)

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
    setForm({ username: '', email: '', password: '', confirmPassword: '' })
    setMode(mode === 'login' ? 'register' : 'login')
  }

  return (
    <div className="auth-page-wrapper">
      <div className={`auth-split-container ${mode === 'register' ? 'slide-active' : ''}`}>
        
        {/* --- VISUAL SIDE --- */}
        <div className="auth-visual-side">
            <div className="visual-overlay">
                <div className="brand-content fade-in-text">
                    <span className="visual-tag">INTELLIGENT CONCIERGE</span>
                    <h1>
                        {mode === 'login' 
                            ? "Orchestrating your next escape." 
                            : "Redefining the art of travel."}
                    </h1>
                    <p>
                        {mode === 'login' 
                            ? "Welcome back. Access your curated itineraries and recover your most valuable asset: your time." 
                            : "Join an elite community of travelers using AI to curate exceptional, logistics-free experiences."}
                    </p>
                </div>
                <div className="glass-testimonial fade-in-text">
                    <p className="quote-text">
                        {mode === 'login' 
                        ? "\"Efficiency is my currency. Aurelia saves me hours of planning without compromising on luxury.\"" 
                        : "\"I stopped planning and started traveling. The AI recommendations are indistinguishable from a human expert.\""}
                    </p>
                    <div className="quote-author">
                        <span className="author-name">— Alexander V.</span>
                        <span className="author-role">Founding Partner</span>
                    </div>
                </div>
            </div>
        </div>

        {/* --- FORM SIDE --- */}
        <div className="auth-form-side">
            <div className="form-content-wrapper fade-in-form">
                
                <div className="form-header">
                    <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
                    <p className="sub-header">
                        {mode === 'login' ? "New to Aurelia?" : "Already have an account?"}
                        <button onClick={toggleMode} className="link-btn">
                            {mode === 'login' ? "Create an account" : "Sign in"}
                        </button>
                    </p>
                </div>

                <form onSubmit={submit} className="modern-form">
                    
                    {/* USERNAME (Register Only) */}
                    {mode === 'register' && (
                        <div className="input-group slide-in">
                            <div className="icon-wrapper"><User size={20} /></div>
                            <input 
                                id="username"
                                name="username"
                                autoComplete="name"
                                value={form.username} 
                                onChange={e=>setForm(f=>({...f, username:e.target.value}))} 
                                className="modern-input"
                                placeholder=" "
                                required
                            />
                            <label htmlFor="username" className="floating-label">Full Name</label>
                        </div>
                    )}

                    {/* EMAIL (Autocomplete Enabled) */}
                    <div className="input-group">
                        <div className="icon-wrapper"><Mail size={20} /></div>
                        <input 
                            id="email"
                            name="email"
                            autoComplete="email" 
                            value={form.email} 
                            onChange={e=>setForm(f=>({...f, email:e.target.value}))} 
                            type="email" 
                            className="modern-input" 
                            placeholder=" "
                            required
                        />
                        <label htmlFor="email" className="floating-label">Email Address</label>
                    </div>

                    {/* PASSWORD (Autocomplete Enabled) */}
                    <div className="input-group">
                        <div className="icon-wrapper"><Lock size={20} /></div>
                        <input 
                            id="password"
                            name="password"
                            // Different autocomplete for login vs register
                            autoComplete={mode === 'login' ? "current-password" : "new-password"}
                            value={form.password} 
                            onChange={e=>setForm(f=>({...f, password:e.target.value}))} 
                            type={showPassword ? "text" : "password"} 
                            className="modern-input" 
                            placeholder=" "
                            required
                        />
                        <label htmlFor="password" className="floating-label">Password</label>
                        <button 
                            type="button" 
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                    </div>

                    {/* CONFIRM PASSWORD (Register Only) */}
                    {mode === 'register' && (
                        <div className="input-group slide-in">
                            <div className="icon-wrapper"><CheckCircle size={20} /></div>
                            <input 
                                id="confirmPassword"
                                name="confirmPassword"
                                autoComplete="new-password"
                                value={form.confirmPassword} 
                                onChange={e=>setForm(f=>({...f, confirmPassword:e.target.value}))} 
                                type={showPassword ? "text" : "password"} 
                                className="modern-input" 
                                placeholder=" "
                                required
                            />
                            <label htmlFor="confirmPassword" className="floating-label">Confirm Password</label>
                        </div>
                    )}

                    {error && (
                        <div className="error-banner">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button type="submit" className="submit-btn-animated" disabled={loading}>
                        <span>{loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Get Started')}</span>
                        {!loading && <ArrowRight size={20} />}
                    </button>

                </form>
            </div>
        </div>

      </div>
    </div>
  )
} 