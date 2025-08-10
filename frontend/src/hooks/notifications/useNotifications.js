import { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import io from 'socket.io-client';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user?.id) return;

    const socketInstance = io({
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    // Join user room for personalized notifications
    socketInstance.emit('join-user', { userId: user.id });

    // Listen for real-time notifications
    socketInstance.on('notification', (notification) => {
      console.log('🔔 Real-time notification received:', notification);
      
      // Add notification to list
      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id
        });
      }
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Connected to notification server');
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Disconnected from notification server');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?.id]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch notifications on component mount
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      fetchNotificationStats();
    }
  }, [user?.id]);

  const fetchNotifications = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No auth token found');
        return;
      }

      const response = await fetch(`/api/v1/notifications?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setNotifications(data.data.notifications || []);
        } else {
          setNotifications(prev => [...prev, ...(data.data.notifications || [])]);
        }
        return data.data;
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch notifications:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No auth token found for stats');
        return;
      }

      const response = await fetch('/api/v1/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data.unread || 0);
        return data.data;
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch notification stats:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, status: 'read' } 
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
    return false;
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/v1/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, status: 'read' }))
        );
        setUnreadCount(0);
        return true;
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
    return false;
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        if (notification && notification.status === 'UNREAD') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return true;
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
    return false;
  };

  const sendTestNotification = async (testData) => {
    try {
      const response = await fetch('/api/v1/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
    return null;
  };

  return {
    notifications,
    unreadCount,
    loading,
    socket,
    fetchNotifications,
    fetchNotificationStats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendTestNotification
  };
};

export default useNotifications;