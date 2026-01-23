import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MasterAdminLayout from './admin/MasterAdminLayout';
import MasterDashboardOverview from './admin/MasterDashboardOverview';
import { Toaster, toast } from 'react-hot-toast';

const MasterAdmin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      toast.error('Access denied! Admin only.');
      navigate('/');
    }
  }, [navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <MasterDashboardOverview />;
      case 'analytics':
        return <div style={{ color: 'white', padding: '2rem' }}>Analytics Coming Soon...</div>;
      case 'bookings':
        return <div style={{ color: 'white', padding: '2rem' }}>Booking Management Coming Soon...</div>;
      case 'users':
        return <div style={{ color: 'white', padding: '2rem' }}>User Management Coming Soon...</div>;
      case 'hotels':
        return <div style={{ color: 'white', padding: '2rem' }}>Hotel Management Coming Soon...</div>;
      case 'finance':
        return <div style={{ color: 'white', padding: '2rem' }}>Financial Control Coming Soon...</div>;
      case 'reviews':
        return <div style={{ color: 'white', padding: '2rem' }}>Review Management Coming Soon...</div>;
      case 'support':
        return <div style={{ color: 'white', padding: '2rem' }}>Support Tickets Coming Soon...</div>;
      case 'security':
        return <div style={{ color: 'white', padding: '2rem' }}>Security Hub Coming Soon...</div>;
      case 'reports':
        return <div style={{ color: 'white', padding: '2rem' }}>Reports & Export Coming Soon...</div>;
      case 'settings':
        return <div style={{ color: 'white', padding: '2rem' }}>System Settings Coming Soon...</div>;
      default:
        return <MasterDashboardOverview />;
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <MasterAdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </MasterAdminLayout>
    </>
  );
};

export default MasterAdmin;
