import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext';
import { UserProvider, useUser } from './context/userContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'; // Your auth guard

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
import NotificationsPage from './pages/NotificationsPage'

// --- Import Admin/Manager Components ---
import DashboardLayout from './pages/admin/DashboardLayout'
import DashboardOverview from './pages/admin/DashboardOverview'
import DashboardRooms from './pages/admin/DashboardRooms'
import DashboardHotel from './pages/admin/DashboardHotels'
import DashboardBookings from './pages/admin/DashboardBookings'
import DashboardAnalytics from './pages/admin/DashboardAnalytics'
import DashboardCustomers from './pages/admin/DashboardCustomers'
import ManagerFinance from './pages/admin/ManagerFinance'

import SuperAdminLayout from './pages/aurelia_admin/SuperAdminLayout'; // Super Admin
// Super Admin Pages
import SuperOverview from './pages/aurelia_admin/SuperOverview';
import SuperHotels from './pages/aurelia_admin/SuperHotels';
import SuperUsers from './pages/aurelia_admin/SuperUsers';
import SuperFinance from './pages/aurelia_admin/SuperFinance';
import SuperReviews from './pages/aurelia_admin/SuperReviews';
import SuperSettings from './pages/aurelia_admin/SuperSettings';

import './index.css'

// Helper component to access Context safely inside the Provider
const AppRoutes = () => {
  // ✅ Extract isManager from context
  const { user, isAdmin, isManager, loading } = useUser(); 

  if (loading) return <div className="loading-screen">Loading Aurelia Travel...</div>;

  return (
    <Routes>
      {/* SUPER ADMIN ROUTES (New) */}
      <Route path="/superAdmin" element={<ProtectedRoute role="admin"><SuperAdminLayout /></ProtectedRoute>}>
          <Route index element={<SuperOverview />} />
          <Route path="hotels" element={<SuperHotels />} />
          <Route path="users" element={<SuperUsers />} />
          <Route path="finance" element={<SuperFinance />} />
          <Route path="reviews" element={<SuperReviews />} />   {/* NEW */}
          <Route path="settings" element={<SuperSettings />} /> {/* NEW */}
      </Route>


      {/* --- HOTEL MANAGEMENT DASHBOARD ROUTES --- */}
      {/* Guard: Allow if user is Admin OR HotelManager */}
      <Route path="/admin" element={(isAdmin || isManager) ? <DashboardLayout /> : <Navigate to="/" />}>
          <Route index element={<DashboardOverview />} />
          <Route path="rooms" element={<DashboardRooms />} />
          <Route path="hotels" element={<DashboardHotel />} />
          <Route path="bookings" element={<DashboardBookings />} />
          <Route path="analytics" element={<DashboardAnalytics />} />
          <Route path="customers" element={<DashboardCustomers />} />
          <Route path="finance" element={<ManagerFinance />} />
      </Route>

      {/* --- MAIN APP ROUTES --- */}
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
            <Route path="/notifications" element={user ? <NotificationsPage /> : <Navigate to="/auth" />} />

            {/* Auth Routes */}
            <Route path="/auth" element={!user ? <LoginRegister /> : <Navigate to="/profile" />} />
            
            {/* Protected User Routes */}
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
            <Route path="/travel-plan" element={user ? <TravelPage /> : <Navigate to="/auth" />} />
            <Route path="/travel-itinerary" element={user ? <TravelPlanPage /> : <Navigate to="/auth" />} />
            <Route path="/trip-dashboard" element={user ? <TripDashboard /> : <Navigate to="/auth" />} />

            {/* Old Legacy Admin Route */}
            <Route path="/adminDashboard" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
          </Routes>
        </Layout>
      } />

    </Routes>
  );
};

function App() {
  return (
    <UserProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </UserProvider>
  )
}

export default App