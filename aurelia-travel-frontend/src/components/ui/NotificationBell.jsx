import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import './styles/NotificationBell.css';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'error': return <XCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const handleItemClick = (notif) => {
    if (!notif.is_read) markAsRead(notif.id);
    if (notif.link) {
        navigate(notif.link);
        setIsOpen(false);
    }
  };

  return (
    <div className="notif-wrapper" ref={dropdownRef}>
      <button className="notif-btn" onClick={() => setIsOpen(!isOpen)}>
        <Bell size={22} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && <button onClick={markAllAsRead}>Mark all read</button>}
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="empty-notif">No new notifications</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => handleItemClick(n)}>
                  <div className="notif-icon">{getIcon(n.type)}</div>
                  <div className="notif-content">
                    <p className="notif-title">{n.title}</p>
                    <p className="notif-msg">{n.message}</p>
                    <span className="notif-time">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  {!n.is_read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;