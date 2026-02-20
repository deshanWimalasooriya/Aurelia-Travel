import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { CheckCircle, Info, AlertTriangle, XCircle, Bell, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import './styles/NotificationsPage.css'; 

const NotificationsPage = () => {
  const { notifications, markAllAsRead, markAsRead } = useNotifications();

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle className="icon-success" size={24} />;
      case 'warning': return <AlertTriangle className="icon-warning" size={24} />;
      case 'error': return <XCircle className="icon-error" size={24} />;
      default: return <Info className="icon-info" size={24} />;
    }
  };

  return (
    <div className="notifications-page-wrapper">
      <div className="container compact-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">Stay updated on your bookings and alerts.</p>
          </div>
          <button className="mark-all-btn" onClick={markAllAsRead}>
              <Check size={16} /> Mark all read
          </button>
        </div>

        <div className="notification-feed">
          {notifications.length === 0 ? (
              <div className="empty-state-card">
                  <div className="empty-icon-bg">
                      <Bell size={36} className="icon-muted" />
                  </div>
                  <h3>You're all caught up!</h3>
                  <p>No new notifications at this time.</p>
              </div>
          ) : (
              notifications.map((notif) => (
                  <motion.div 
                      key={notif.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`notification-card ${!notif.is_read ? 'unread' : ''}`}
                      onClick={() => markAsRead(notif.id)}
                  >
                      <div className="card-icon-wrapper">{getIcon(notif.type)}</div>
                      <div className="card-content">
                          <h4 className="notif-title">{notif.title}</h4>
                          <p className="notif-message">{notif.message}</p>
                          <span className="notif-time">{new Date(notif.created_at).toLocaleString()}</span>
                      </div>
                      {!notif.is_read && <div className="unread-dot-large"></div>}
                  </motion.div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;