import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import { useUser } from './context/UserContext'


//import Pages
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import HotelDetails from './pages/HotelDetails'
import LoginRegister from './pages/LoginRegister'
import Profile from './pages/Profile'
import TravelPage from './pages/TravelPage'
import TravelPlanPage from './pages/TravelPlanPage'
import TripDashboard from './pages/TripDashboard'
import AboutPage from './pages/About'
import ContactPage from './pages/Contact'
import HotelPage from './pages/HotelPage'
import AdminDashboard from './pages/AdminDashboard'
import HotelSearch from './pages/HotelSearch'
import HotelShowcase from './pages/HotelShowcase'


import './index.css'

function App() {

  // Added 'loading' to prevent redirecting before user data is fetched
  const { user, isAdmin, loading } = useUser()

  if (loading) {
    return <div className="loading-screen">Loading...</div>; // Optional: Or return null
  }

  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/hotel/:id" element={<HotelDetails />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/auth" element={!user ? <LoginRegister /> : <Navigate to="/profile" />} />
          <Route path="/travel-plan" element={user ? <TravelPage /> : <Navigate to="/auth" />} />
          <Route path="/travel-itinerary" element={user ? <TravelPlanPage /> : <Navigate to="/auth" />} />
          <Route path="/trip-dashboard" element={user ? <TripDashboard /> : <Navigate to="/auth" />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/hotels" element={<HotelPage />} />
          <Route path="/hotel-search" element={<HotelSearch />} />
          <Route path="/hotel-showcase" element={<HotelShowcase />} />
          
          {/* PROTECTED ADMIN ROUTE */}
          {/* If isAdmin is true, show Dashboard. Otherwise, redirect to Home */}
          <Route 
            path="/adminDashboard" 
            element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} 
          />
        </Routes>
      </Layout>
    </AuthProvider>
  )
}

export default App