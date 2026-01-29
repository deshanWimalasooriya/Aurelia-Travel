import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// --- Context Providers ---
import { AuthProvider } from './context/AuthContext';
import { UserProvider, useUser } from './context/userContext';

// --- Layouts ---
import Layout from './components/layout/Layout';
import MasterAdminLayout from './pages/admin/MasterAdminLayout'; // ✅ New Master Admin Layout
import DashboardLayout from './pages/admin/DashboardLayout';     // 🏨 Old Hotel Manager Layout

// --- Master Admin Pages (NEW) ---
import MasterDashboardOverview from './pages/admin/MasterDashboardOverview';
import MasterDashboardUsers from './pages/admin/MasterDashboardUsers';
import MasterDashboardHotels from './pages/admin/MasterDashboardHotels';
import MasterDashboardBookings from './pages/admin/MasterDashboardBookings';
import MasterDashboardReviews from './pages/admin/MasterDashboardReviews';
import MasterDashboardFinance from './pages/admin/MasterDashboardFinance';

// --- Hotel Manager Pages (OLD) ---
import DashboardOverview from './pages/admin/DashboardOverview';
import DashboardRooms from './pages/admin/DashboardRooms';
import DashboardHotel from './pages/admin/DashboardHotels';
// import DashboardBookings from './pages/admin/DashboardBookings'; // ⚠️ Check for duplicate name conflicts if needed
import DashboardAnalytics from './pages/admin/DashboardAnalytics';
import DashboardCustomers from './pages/admin/DashboardCustomers';

// --- Public Pages ---
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import HotelDetails from './pages/HotelDetails';
import LoginRegister from './pages/LoginRegister';
import Profile from './pages/Profile';
import TravelPage from './pages/TravelPage';
import TravelPlanPage from './pages/TravelPlanPage';
import TripDashboard from './pages/TripDashboard';
import AboutPage from './pages/About';
import ContactPage from './pages/Contact';
import HotelPage from './pages/HotelPage';
import HotelSearch from './pages/HotelSearch';
import HotelShowcase from './pages/HotelShowcase';

// --- Global Styles ---
import './index.css';

// ==========================================
// Main Routing Logic
// ==========================================
const AppRoutes = () => {
  const { user, isAdmin, isManager, loading } = useUser();

  if (loading) return <div className="loading-screen">Loading Aurelia Travel...</div>;

  return (
    <Routes>

      {/* ========================================================= */}
      {/* 1. MASTER ADMIN DASHBOARD (New System)                   */}
      {/* Path: /admin/...                                         */}
      {/* ========================================================= */}
      <Route 
        path="/admin" 
        element={isAdmin ? <MasterAdminLayout /> : <Navigate to="/" replace />}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<MasterDashboardOverview />} />
        <Route path="users" element={<MasterDashboardUsers />} />
        <Route path="hotels" element={<MasterDashboardHotels />} />
        <Route path="bookings" element={<MasterDashboardBookings />} />
        <Route path="reviews" element={<MasterDashboardReviews />} />
        <Route path="finance" element={<MasterDashboardFinance />} />
      </Route>

      {/* ========================================================= */}
      {/* 2. HOTEL MANAGER DASHBOARD (Legacy/Manager System)       */}
      {/* Path: /manager/... (Renamed from /admin to avoid conflict)*/}
      {/* ========================================================= */}
      <Route
        path="/manager"
        element={(isAdmin || isManager) ? <DashboardLayout /> : <Navigate to="/" replace />}
      >
        <Route index element={<DashboardOverview />} />
        <Route path="rooms" element={<DashboardRooms />} />
        <Route path="hotels" element={<DashboardHotel />} />
        <Route path="bookings" element={<MasterDashboardBookings />} /> {/* Reusing Master or use separate component */}
        <Route path="analytics" element={<DashboardAnalytics />} />
        <Route path="customers" element={<DashboardCustomers />} />
      </Route>

      {/* ========================================================= */}
      {/* 3. PUBLIC & USER ROUTES (Main Site)                      */}
      {/* ========================================================= */}
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              {/* Public Pages */}
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

              {/* Protected User Pages */}
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
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
};

// ==========================================
// Root App Component
// ==========================================
function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </AuthProvider>
  );
}

export default App;