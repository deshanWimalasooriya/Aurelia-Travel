import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import { AuthProvider } from './context/AuthContext'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ✅ FIX: BrowserRouter must be the top-level parent */}
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <GoogleOAuthProvider clientId="809939730510-4iorg9k6fk7nrder6s08c8f6po8efhlv.apps.googleusercontent.com">
            <App />
          </GoogleOAuthProvider>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)