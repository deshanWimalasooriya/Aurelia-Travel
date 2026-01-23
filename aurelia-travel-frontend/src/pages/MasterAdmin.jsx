import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MasterAdminLayout from './admin/MasterAdminLayout'
import MasterDashboardOverview from './admin/MasterDashboardOverview'
import { Toaster } from 'react-hot-toast'

const MasterAdmin = () => {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<MasterAdminLayout />}>
          <Route index element={<MasterDashboardOverview />} />
          <Route path="analytics" element={<ComingSoon title="Analytics" />} />
          <Route path="bookings" element={<ComingSoon title="Bookings Management" />} />
          <Route path="users" element={<ComingSoon title="User Management" />} />
          <Route path="hotels" element={<ComingSoon title="Hotel Management" />} />
          <Route path="finance" element={<ComingSoon title="Financial Control" />} />
          <Route path="reviews" element={<ComingSoon title="Review Management" />} />
          <Route path="support" element={<ComingSoon title="Support Tickets" />} />
          <Route path="security" element={<ComingSoon title="Security Hub" />} />
          <Route path="reports" element={<ComingSoon title="Reports & Export" />} />
          <Route path="settings" element={<ComingSoon title="System Settings" />} />
        </Route>
      </Routes>
    </>
  )
}

// Placeholder component for unbuilt sections
const ComingSoon = ({ title }) => {
  return (
    <div className="fade-in" style={{ color: 'white', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{title}</h1>
      <p style={{ color: '#94a3b8' }}>This section is under development. Check back soon!</p>
    </div>
  )
}

export default MasterAdmin
