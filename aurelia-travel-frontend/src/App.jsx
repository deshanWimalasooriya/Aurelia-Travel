import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { UserProvider, useUser } from './context/UserContext' // Added UserProvider
import Layout from './components/layout/Layout'

// --- Import Pages ---
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
import AdminDashboard from './pages/AdminDashboard' // Old admin dash (optional)
import HotelSearch from './pages/HotelSearch'
import HotelShowcase from './pages/HotelShowcase'

// --- Import Admin Components ---
import DashboardLayout from './pages/admin/DashboardLayout'
import DashboardOverview from './pages/admin/DashboardOverview'
import DashboardRooms from './pages/admin/DashboardRooms'

import './index.css'

// Helper component to access Context safely inside the Provider
const AppRoutes = () => {
  const { user, isAdmin, loading } = useUser(); // Using useUser context we fixed earlier

  if (loading) return <div className="loading-screen">Loading Aurelia Travel...</div>;

  return (
    <Routes>
      
      {/* --- ADMIN DASHBOARD ROUTES (New System) --- */}
      {/* These run outside the main Layout so they have their own Sidebar */}
      <Route path="/admin" element={isAdmin ? <DashboardLayout /> : <Navigate to="/" />}>
          <Route index element={<DashboardOverview />} />
          <Route path="rooms" element={<DashboardRooms />} />
          {/* Add bookings, reviews, etc. here later */}
      </Route>

      {/* --- MAIN APP ROUTES (With Navbar/Footer) --- */}
      {/* We wrap these in a wildcard route so they share the main Layout */}
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/hotel/:id" element={<HotelDetails />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/hotels" element={<HotelPage />} />
            <Route path="/hotel-search" element={<HotelSearch />} />
            <Route path="/hotel-showcase" element={<HotelShowcase />} />

            {/* Auth Routes */}
            <Route path="/auth" element={!user ? <LoginRegister /> : <Navigate to="/profile" />} />
            
            {/* Protected User Routes */}
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
            <Route path="/travel-plan" element={user ? <TravelPage /> : <Navigate to="/auth" />} />
            <Route path="/travel-itinerary" element={user ? <TravelPlanPage /> : <Navigate to="/auth" />} />
            <Route path="/trip-dashboard" element={user ? <TripDashboard /> : <Navigate to="/auth" />} />

            {/* Old Admin Route (Keep for backward compatibility if needed) */}
            <Route path="/adminDashboard" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
          </Routes>
        </Layout>
      } />

    </Routes>
  );
};

function App() {
  return (
    // 1. Wrap Providers
    <UserProvider>
      <AuthProvider>
         {/* 2. Render Routes */}
         <AppRoutes />
      </AuthProvider>
    </UserProvider>
  )
}

export default App