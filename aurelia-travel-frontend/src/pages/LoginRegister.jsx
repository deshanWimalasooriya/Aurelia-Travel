import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/userContext'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react'
import './styles/LoginRegister.css'
import axios from 'axios'

// --- STANDARD MINIMAL SVGS FOR BRANDS ---
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M23.745 12.27c0-.827-.074-1.623-.214-2.393H12v4.524h6.586a5.61 5.61 0 0 1-2.434 3.684v3.06h3.945c2.308-2.124 3.648-5.253 3.648-8.875Z"/>
    <path fill="#34A853" d="M12 24c3.303 0 6.073-1.096 8.096-2.964l-3.945-3.06c-1.094.733-2.493 1.168-4.151 1.168-3.195 0-5.901-2.158-6.864-5.062H1.05v3.165A11.996 11.996 0 0 0 12 24Z"/>
    <path fill="#FBBC05" d="M5.136 14.082a7.195 7.195 0 0 1-.382-2.082c0-.72.13-1.423.382-2.082V6.753H1.05A11.99 11.99 0 0 0 0 12c0 1.936.463 3.766 1.282 5.418l3.854-3.336Z"/>
    <path fill="#EA4335" d="M12 4.835c1.796 0 3.403.618 4.67 1.826l3.504-3.504C18.068 1.196 15.298 0 12 0 7.37 0 3.196 2.68 1.05 6.753l3.854 3.336c.963-2.904 3.669-5.254 6.864-5.254Z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

export default function Auth(){
  const navigate = useNavigate()
  const { refreshUser } = useUser()
  const { checkAuth } = useAuth()
  
  // --- UI STATES ---
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login') // 'login', 'register', or 'forgot'
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // --- 2FA STATES ---
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')

  // --- FORGOT PASSWORD STATES ---
  const [forgotStep, setForgotStep] = useState(1) // 1: Email, 2: Code, 3: New Pass
  const [resetCode, setResetCode] = useState('')
  const [codeFailed, setCodeFailed] = useState(false) // Triggers the resend option
  
  // --- FORM DATA STATE ---
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
    console.log(`Initiating ${provider} login...`)
    alert(`${provider} login integration pending backend setup.`)
  }

  // ==========================================
  // HANDLER: FORGOT PASSWORD FLOW
  // ==========================================
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCodeFailed(false);

    try {
        if (forgotStep === 1) {
            // Step 1: Request the reset code to email
            await axios.post('http://localhost:5000/api/auth/forgot-password', { email: form.email });
            setForgotStep(2);
        } else if (forgotStep === 2) {
            // Step 2: Verify the 6-digit code
            await axios.post('http://localhost:5000/api/auth/verify-reset-code', { email: form.email, code: resetCode });
            setForgotStep(3);
        } else if (forgotStep === 3) {
            // Step 3: Set the new password
            if (form.password !== form.confirmPassword) {
                setError("Passwords do not match");
                setLoading(false);
                return;
            }
            if (form.password.length < 6) {
                setError("Password must be at least 6 characters");
                setLoading(false);
                return;
            }
            await axios.post('http://localhost:5000/api/auth/reset-password', {
                email: form.email, 
                code: resetCode, 
                newPassword: form.password
            });
            alert('Password reset successful! Please log in with your new password.');
            toggleMode('login'); // Send them back to normal login
        }
    } catch (err) {
        setError(err.response?.data?.message || 'An error occurred. Please try again.');
        if (forgotStep === 2) setCodeFailed(true); // Show "Resend Code" prompt if verification fails
    } finally {
        setLoading(false);
    }
  };

  // ==========================================
  // HANDLER: STANDARD LOGIN & REGISTER FLOW
  // ==========================================
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Pre-flight checks for Registration
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
        
        // --- 2FA Login Check ---
        if (!requires2FA) {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
              email: form.email,
              password: form.password
            }, {
              withCredentials: true
            });

            // If backend says 2FA is required, pause login and show code input
            if (response.data.requires2FA) {
                setRequires2FA(true);
                setLoading(false);
                return; 
            }
        } else {
            // Submit the 2FA code
            await axios.post('http://localhost:5000/api/auth/verify-2fa-login', {
                email: form.email,
                token: twoFactorCode
            }, {
                withCredentials: true
            });
        }

        // Login Successful (either skipped 2FA or passed it)
        if (rememberMe) {
            localStorage.setItem('aurelia_saved_email', form.email)
        } else {
            localStorage.removeItem('aurelia_saved_email')
        }

        await refreshUser()
        await checkAuth()
        navigate('/profile')
        
      } else {
        // --- Registration Flow ---
        await axios.post('http://localhost:5000/api/auth/register', {
          username: form.username,
          email: form.email,
          password: form.password
        }, {
          withCredentials: true
        })

        alert('Registration successful! Please login.')
        toggleMode('login') 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // HANDLER: TOGGLE MODES (Resets all states)
  // ==========================================
  const toggleMode = (specificMode) => {
    setError(null)
    setRequires2FA(false) 
    setTwoFactorCode('')
    setForgotStep(1)
    setResetCode('')
    setCodeFailed(false)
    setForm(prev => ({ ...prev, username: '', password: '', confirmPassword: '' }))
    
    if (typeof specificMode === 'string') {
        setMode(specificMode)
    } else {
        setMode(mode === 'login' ? 'register' : 'login')
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className={`auth-card-container ${mode === 'register' ? 'mode-register' : 'mode-login'}`}>
        
        {/* ==========================================
            LEFT SIDE: IMAGE & BRANDING 
        ========================================== */}
        <div className="auth-visual-side">
            <div className="visual-overlay">
                <div className="brand-header">
                    <span className="visual-tag">INTELLIGENT CONCIERGE</span>
                </div>
                
                <div className="visual-text-content">
                    <h1 className="visual-heading">
                        {mode === 'login' && "Orchestrating your next escape."}
                        {mode === 'register' && "Redefining the art of travel."}
                        {mode === 'forgot' && "Regain your access."}
                    </h1>
                    <p className="visual-subtext">
                        {mode === 'login' && "Welcome back. Access your curated itineraries and recover your most valuable asset: your time."}
                        {mode === 'register' && "Join an elite community of travelers using AI to curate exceptional, logistics-free experiences."}
                        {mode === 'forgot' && "Securely reset your password and get back to planning your next journey."}
                    </p>
                </div>

                <div className="glass-testimonial">
                    <p className="quote-text">
                        {mode === 'login' || mode === 'forgot'
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

        {/* ==========================================
            RIGHT SIDE: DYNAMIC FORM 
        ========================================== */}
        <div className="auth-form-side">
            <div className="form-container">
                
                {/* Form Header */}
                <div className="form-header">
                    <h2>
                        {mode === 'forgot' ? 'Reset Password' : 
                        (requires2FA ? 'Two-Step Verification' : 
                        (mode === 'login' ? 'Welcome back' : 'Create account'))}
                    </h2>
                    <p className="sub-header">
                        {mode === 'forgot' ? (
                            forgotStep === 1 ? "Enter your email to receive a recovery code." :
                            forgotStep === 2 ? "Enter the 6-digit code sent to your email." :
                            "Create a strong, secure new password."
                        ) : requires2FA ? "Enter the 6-digit code from your authenticator app." : 
                        (mode === 'login' ? "Please enter your details to sign in." : "Start your journey with us today.")}
                    </p>
                </div>

                {/* Social Login (Hidden during 2FA or Forgot Password) */}
                {!requires2FA && mode !== 'forgot' && (
                    <>
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
                        <div className="divider"><span>or continue with email</span></div>
                    </>
                )}

                {/* --- FORM BEGINS --- */}
                <form onSubmit={mode === 'forgot' ? handleForgotSubmit : submit} className="modern-form">
                    
                    {/* SECTION 1: FORGOT PASSWORD FLOW */}
                    {mode === 'forgot' && (
                        <>
                            {forgotStep === 1 && (
                                <div className="input-group">
                                    <label htmlFor="email">Email Address</label>
                                    <div className="input-wrapper">
                                        <Mail size={18} className="input-icon"/>
                                        <input id="email" value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))} type="email" className="modern-input with-icon" placeholder="you@example.com" required />
                                    </div>
                                </div>
                            )}

                            {forgotStep === 2 && (
                                <div className="input-group slide-in-element">
                                    <label htmlFor="resetCode">6-Digit Reset Code</label>
                                    <div className="input-wrapper">
                                        <ShieldCheck size={18} className="input-icon" color="#2563eb" />
                                        <input id="resetCode" value={resetCode} onChange={e=>setResetCode(e.target.value)} type="text" maxLength={6} className="modern-input with-icon" placeholder="000000" style={{ letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 'bold' }} required />
                                    </div>
                                </div>
                            )}

                            {forgotStep === 3 && (
                                <>
                                    <div className="input-group slide-in-element">
                                        <label htmlFor="password">New Password</label>
                                        <div className="input-wrapper">
                                            <Lock size={18} className="input-icon"/>
                                            <input id="password" value={form.password} onChange={e=>setForm(f=>({...f, password:e.target.value}))} type={showPassword ? "text" : "password"} className="modern-input with-icon" placeholder="••••••••" required />
                                        </div>
                                    </div>
                                    <div className="input-group slide-in-element">
                                        <label htmlFor="confirmPassword">Confirm New Password</label>
                                        <div className="input-wrapper">
                                            <CheckCircle size={18} className="input-icon"/>
                                            <input id="confirmPassword" value={form.confirmPassword} onChange={e=>setForm(f=>({...f, confirmPassword:e.target.value}))} type={showPassword ? "text" : "password"} className="modern-input with-icon" placeholder="••••••••" required />
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* SECTION 2: STANDARD LOGIN & REGISTER FLOW */}
                    {!requires2FA && mode !== 'forgot' && (
                        <>
                            {mode === 'register' && (
                                <div className="input-group slide-in-element">
                                    <label htmlFor="username">Full Name</label>
                                    <div className="input-wrapper">
                                        <User size={18} className="input-icon"/>
                                        <input id="username" name="username" autoComplete="name" value={form.username} onChange={e=>setForm(f=>({...f, username:e.target.value}))} className="modern-input with-icon" placeholder="e.g. John Doe" required />
                                    </div>
                                </div>
                            )}

                            <div className="input-group">
                                <label htmlFor="email">Email Address</label>
                                <div className="input-wrapper">
                                    <Mail size={18} className="input-icon"/>
                                    <input id="email" name="email" autoComplete="email" value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))} type="email" className="modern-input with-icon" placeholder="you@example.com" required />
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon"/>
                                    <input id="password" name="password" autoComplete={mode === 'login' ? "current-password" : "new-password"} value={form.password} onChange={e=>setForm(f=>({...f, password:e.target.value}))} type={showPassword ? "text" : "password"} className="modern-input with-icon" placeholder="••••••••" required />
                                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </div>
                            </div>

                            {mode === 'register' && (
                                <div className="input-group slide-in-element">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <div className="input-wrapper">
                                        <CheckCircle size={18} className="input-icon"/>
                                        <input id="confirmPassword" name="confirmPassword" autoComplete="new-password" value={form.confirmPassword} onChange={e=>setForm(f=>({...f, confirmPassword:e.target.value}))} type={showPassword ? "text" : "password"} className="modern-input with-icon" placeholder="••••••••" required />
                                    </div>
                                </div>
                            )}

                            {mode === 'login' && (
                                <div className="form-options">
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                        <span className="checkbox-custom"></span>
                                        Remember me
                                    </label>
                                    <button type="button" onClick={() => toggleMode('forgot')} className="link-btn-small">Forgot password?</button>
                                </div>
                            )}
                        </>
                    )}

                    {/* SECTION 3: 2FA FLOW */}
                    {requires2FA && mode !== 'forgot' && (
                        <div className="input-group slide-in-element">
                            <label htmlFor="twoFactorCode">Authenticator Code</label>
                            <div className="input-wrapper">
                                <ShieldCheck size={18} className="input-icon" color="#2563eb" />
                                <input id="twoFactorCode" name="twoFactorCode" value={twoFactorCode} onChange={e=>setTwoFactorCode(e.target.value)} type="text" maxLength={6} className="modern-input with-icon" placeholder="000000" style={{ letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 'bold' }} required />
                            </div>
                        </div>
                    )}

                    {/* Global Error Display */}
                    {error && (
                        <div className="error-banner">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* DYNAMIC SUBMIT BUTTON */}
                    <button 
                        type="submit" 
                        className="submit-btn-animated" 
                        disabled={loading || (requires2FA && twoFactorCode.length < 6) || (mode === 'forgot' && forgotStep === 2 && resetCode.length < 6)}
                    >
                        <span>
                            {loading ? 'Processing...' : 
                             mode === 'forgot' ? (forgotStep === 1 ? 'Get Code' : forgotStep === 2 ? 'Verify Code' : 'Reset Password') :
                             requires2FA ? 'Verify Code' : 
                             (mode === 'login' ? 'Sign In' : 'Create Account')}
                        </span>
                        {!loading && <ArrowRight size={18} />}
                    </button>
                    
                    {/* --- BOTTOM ACTIONS & TOGGLES --- */}
                    {mode === 'forgot' ? (
                        <div style={{textAlign: 'center', marginTop: '15px'}}>
                             {forgotStep === 2 && codeFailed && (
                                 <button type="button" onClick={() => { setForgotStep(1); setError(null); }} className="link-btn-text" style={{display: 'block', margin: '0 auto 10px'}}>
                                     Incorrect code. Click here to resend.
                                 </button>
                             )}
                             <button type="button" onClick={() => toggleMode('login')} className="link-btn-text">
                                 Back to login
                             </button>
                        </div>
                    ) : requires2FA ? (
                         <div style={{textAlign: 'center', marginTop: '15px'}}>
                             <button type="button" onClick={() => setRequires2FA(false)} className="link-btn-text">
                                 Cancel and return to login
                             </button>
                         </div>
                    ) : (
                        <p className="bottom-text">
                            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                            <button type="button" onClick={() => toggleMode()} className="link-btn-text">
                                {mode === 'login' ? "Sign up" : "Log in"}
                            </button>
                        </p>
                    )}

                </form>
            </div>
        </div>

      </div>
    </div>
  )
}