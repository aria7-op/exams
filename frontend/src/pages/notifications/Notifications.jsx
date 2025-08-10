import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/notifications/useNotifications';

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    const data = await fetchNotifications(1, 20);
    if (data) {
      setHasMore(data.pagination.page < data.pagination.pages);
      setPage(1);
    }
  };

  const loadMore = async () => {
    const nextPage = page + 1;
    const data = await fetchNotifications(nextPage, 20);
    if (data) {
      setHasMore(data.pagination.page < data.pagination.pages);
      setPage(nextPage);
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => n.status === 'UNREAD');
      case 'read':
        return notifications.filter(n => n.status === 'read');
      default:
        return notifications;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#ea580c';
      case 'normal': return '#2563eb';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'USER_REGISTERED': return '🎉';
      case 'EMAIL_VERIFIED': return '✅';
      case 'ACCOUNT_STATUS_CHANGED': return '👤';
      case 'BOOKING_CONFIRMED': return '📅';
      case 'BOOKING_CANCELLED': return '❌';
      case 'PAYMENT_SUCCESS': return '💳';
      case 'PAYMENT_FAILED': return '⚠️';
      case 'EXAM_STARTED': return '📝';
      case 'EXAM_COMPLETED': return '🎯';
      case 'CERTIFICATE_READY': return '🏆';
      case 'EXAM_REMINDER': return '⏰';
      case 'SYSTEM_ALERT': return '🚨';
      default: return '🔔';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: 'var(--secondary-900)',
          margin: '0 0 8px 0'
        }}>
          Notifications
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'var(--secondary-600)',
          margin: 0
        }}>
          Stay updated with important events and activities
        </p>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        padding: '16px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid var(--secondary-200)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'read', label: 'Read', count: notifications.length - unreadCount }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: filter === tab.key ? 'var(--primary-500)' : 'var(--secondary-100)',
                color: filter === tab.key ? 'white' : 'var(--secondary-700)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Actions */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--primary-500)',
              background: 'white',
              color: 'var(--primary-600)',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--primary-50)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid var(--secondary-200)',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        {loading && page === 1 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: 'var(--secondary-600)'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: 'var(--secondary-600)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
            <div style={{ fontWeight: '500', marginBottom: '8px' }}>
              {filter === 'unread' ? 'No unread notifications' : 
               filter === 'read' ? 'No read notifications' : 
               'No notifications yet'}
            </div>
            <div style={{ fontSize: '14px' }}>
              {filter === 'all' && "We'll notify you when something important happens"}
            </div>
          </div>
        ) : (
          <>
            {filteredNotifications.map((notification, index) => (
              <div
                key={notification.id}
                style={{
                  padding: '20px',
                  borderBottom: index < filteredNotifications.length - 1 ? '1px solid var(--secondary-100)' : 'none',
                  background: notification.status === 'UNREAD' ? 'var(--primary-50)' : 'white',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  {/* Icon */}
                  <div style={{
                    fontSize: '24px',
                    flexShrink: 0,
                    marginTop: '4px'
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: notification.status === 'UNREAD' ? '600' : '500',
                        color: 'var(--secondary-900)',
                        flex: 1
                      }}>
                        {notification.title}
                      </h3>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: getPriorityColor(notification.priority),
                        flexShrink: 0
                      }}></div>
                    </div>

                    <p style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      color: 'var(--secondary-700)',
                      lineHeight: '1.5'
                    }}>
                      {notification.message}
                    </p>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--secondary-500)'
                      }}>
                        {formatTimeAgo(notification.createdAt)}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {notification.status === 'UNREAD' && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              borderRadius: '6px',
                              border: '1px solid var(--primary-300)',
                              background: 'white',
                              color: 'var(--primary-600)',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            border: '1px solid var(--danger-300)',
                            background: 'white',
                            color: 'var(--danger-600)',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid var(--secondary-100)' }}>
                <button
                  onClick={loadMore}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: '1px solid var(--primary-500)',
                    background: 'white',
                    color: 'var(--primary-600)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Loading...' : 'Load more notifications'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;