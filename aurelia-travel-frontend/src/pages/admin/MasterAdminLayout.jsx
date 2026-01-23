import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Hotel, DollarSign, ShoppingCart, 
  MessageSquare, Star, Settings, Shield, FileText, Bell,
  TrendingUp, Menu, X, LogOut, Search
} from 'lucide-react';
import './styles/masterAdmin.css';

const MasterAdminLayout = ({ children, activeTab, onTabChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const navigationSections = [
    {
      title: 'Main',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp, badge: null },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'bookings', label: 'Bookings', icon: ShoppingCart, badge: 23 },
        { id: 'users', label: 'Users', icon: Users, badge: null },
        { id: 'hotels', label: 'Hotels', icon: Hotel, badge: null },
        { id: 'finance', label: 'Finance', icon: DollarSign, badge: 5 },
      ]
    },
    {
      title: 'Content',
      items: [
        { id: 'reviews', label: 'Reviews', icon: Star, badge: 12 },
        { id: 'support', label: 'Support', icon: MessageSquare, badge: 8 },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'security', label: 'Security', icon: Shield, badge: null },
        { id: 'reports', label: 'Reports', icon: FileText, badge: null },
        { id: 'settings', label: 'Settings', icon: Settings, badge: null },
      ]
    }
  ];

  return (
    <div className="master-admin-container">
      {/* Sidebar */}
      <motion.aside 
        className={`master-sidebar ${sidebarOpen ? 'open' : ''}`}
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Logo Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">✈️</div>
            <div className="logo-text">
              <h2>Aurelia</h2>
              <p>Master Control</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navigationSections.map((section, idx) => (
            <div key={idx} className="nav-section">
              <div className="nav-section-title">{section.title}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => onTabChange(item.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="nav-item-icon" size={20} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="nav-item-badge">{item.badge}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="master-content">
        {children}
      </main>
    </div>
  );
};

export default MasterAdminLayout;
