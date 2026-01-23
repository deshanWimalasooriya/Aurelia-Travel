import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { UserProvider, useUser } from './context/userContext'
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
import AdminDashboard from './pages/AdminDashboard'
import HotelSearch from './pages/HotelSearch'
import HotelShowcase from './pages/HotelShowcase'

// --- Import Admin/Manager Components ---
import DashboardLayout from './pages/admin/DashboardLayout'
import DashboardOverview from './pages/admin/DashboardOverview'
import DashboardRooms from './pages/admin/DashboardRooms'
import DashboardHotel from './pages/admin/DashboardHotels'
import DashboardBookings from './pages/admin/DashboardBookings'
import DashboardAnalytics from './pages/admin/DashboardAnalytics'
import DashboardCustomers from './pages/admin/DashboardCustomers'

// ✅ Master Admin Page
import MasterAdmin from './pages/admin/MasterAdminLayout'

import './index.css'

const AppRoutes = () => {
  const { user, isAdmin, isManager, loading } = useUser()

  if (loading) return <div className="loading-screen">Loading Aurelia Travel...</div>

  return (
    <Routes>
      {/* ✅ MASTER ADMIN (Same permission as System Admin) */}
      <Route
        path="/master-admin"
        element={isAdmin ? <MasterAdmin /> : <Navigate to="/" replace />}
      />

      {/* --- HOTEL MANAGEMENT DASHBOARD ROUTES --- */}
      <Route
        path="/admin"
        element={(isAdmin || isManager) ? <DashboardLayout /> : <Navigate to="/" replace />}
      >
        <Route index element={<DashboardOverview />} />
        <Route path="rooms" element={<DashboardRooms />} />
        <Route path="hotels" element={<DashboardHotel />} />
        <Route path="bookings" element={<DashboardBookings />} />
        <Route path="analytics" element={<DashboardAnalytics />} />
        <Route path="customers" element={<DashboardCustomers />} />
      </Route>

      {/* --- MAIN APP ROUTES --- */}
      <Route
        path="/*"
        element={
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
              <Route
                path="/auth"
                element={!user ? <LoginRegister /> : <Navigate to="/profile" replace />}
              />

              {/* Protected User Routes */}
              <Route
                path="/profile"
                element={user ? <Profile /> : <Navigate to="/auth" replace />}
              />
              <Route
                path="/travel-plan"
                element={user ? <TravelPage /> : <Navigate to="/auth" replace />}
              />
              <Route
                path="/travel-itinerary"
                element={user ? <TravelPlanPage /> : <Navigate to="/auth" replace />}
              />
              <Route
                path="/trip-dashboard"
                element={user ? <TripDashboard /> : <Navigate to="/auth" replace />}
              />

              {/* Old Legacy Admin Route */}
              <Route
                path="/adminDashboard"
                element={isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />}
              />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <UserProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </UserProvider>
  )
}

export default App
