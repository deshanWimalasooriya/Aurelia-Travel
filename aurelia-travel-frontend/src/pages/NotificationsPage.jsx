import React, { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { CheckCircle, Info, AlertTriangle, XCircle, Bell, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import './styles/NotificationsPage.css'; 

const NotificationsPage = () => {
  const { notifications, markAllAsRead, markAsRead } = useNotifications();

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle className="text-green-500" size={24} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={24} />;
      case 'error': return <XCircle className="text-red-500" size={24} />;
      default: return <Info className="text-blue-500" size={24} />;
    }
  };

  return (
    <div className="notifications-page container">
      <div className="page-header">
        <h1>Notifications</h1>
        <button className="mark-all-btn" onClick={markAllAsRead}>
            <Check size={16} /> Mark all read
        </button>
      </div>

      <div className="notification-feed">
        {notifications.length === 0 ? (
            <div className="empty-state">
                <Bell size={48} className="text-gray-300 mb-4" />
                <p>No notifications yet</p>
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
                    <div className="icon-wrapper">{getIcon(notif.type)}</div>
                    <div className="content">
                        <h4>{notif.title}</h4>
                        <p>{notif.message}</p>
                        <span className="time">{new Date(notif.created_at).toLocaleString()}</span>
                    </div>
                    {!notif.is_read && <div className="unread-dot"></div>}
                </motion.div>
            ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;