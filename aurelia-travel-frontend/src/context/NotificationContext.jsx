import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useUser } from './userContext';
import { io } from "socket.io-client"; // npm install socket.io-client

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Connect Socket
      const socket = io("http://localhost:5000", {
        withCredentials: true, // ✅ Forces cookies to be sent
        transports: ['websocket', 'polling'] // ✅ Fallback if websocket drops // Ensure token is stored in LS or use cookie logic
      });

      socket.on("notification", (newNotif) => {
        // Play Sound (Optional)
        // new Audio('/ding.mp3').play().catch(()=>{}); 
        
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      return () => socket.disconnect();
    }
  }, [user]);

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await api.put(`/notifications/${id}/read`);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
    await api.put('/notifications/read-all');
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);