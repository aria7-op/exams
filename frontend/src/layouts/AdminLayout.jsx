import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from '../components/notifications/NotificationCenter';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin, isAdmin } = useAuth();

  const navigation = [
    { name: 'Dashboard', path: '/admin', icon: '📊', roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] },
    { name: 'Categories', path: '/admin/categories', icon: '📚', roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'], disabledFor: ['MODERATOR'] },
    { name: 'Tests', path: '/admin/tests', icon: '📝', roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'], disabledFor: ['MODERATOR'] },
    { name: 'Questions', path: '/admin/questions', icon: '❓', roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] },
    { name: 'Users', path: '/admin/users', icon: '👥', roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] },
    { name: 'Test Bookings', path: '/admin/bookings', icon: '📅', roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] },
    { name: 'Exam Calendar', path: '/admin/calendar', icon: '🗓️', roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'] },
    { name: 'Reports', path: '/admin/reports', icon: '📈', roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'], disabledFor: ['MODERATOR'] },
    { name: 'Analytics', path: '/admin/analytics', icon: '📊', roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'], disabledFor: ['MODERATOR'] },
    { name: 'Settings', path: '/admin/settings', icon: '⚙️', roles: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'], disabledFor: ['MODERATOR'] }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const currentNav = navigation.find(nav => nav.path === location.pathname);
    return currentNav ? currentNav.name : 'Admin Panel';
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'white'
            }}>
              🎯
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>
                MockTest Pro
              </div>
              <div style={{ fontSize: '12px', color: 'var(--secondary-300)', marginTop: '2px' }}>
                Admin Panel
              </div>
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {navigation
            .filter(item => !item.roles || item.roles.includes(user?.role))
            .map((item) => {
              const isDisabled = item.disabledFor && item.disabledFor.includes(user?.role);
              return (
                <div
                  key={item.name}
                  style={{
                    position: 'relative',
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                  }}
                  title={isDisabled ? 'Access restricted for your role' : ''}
                >
                  <NavLink
                    to={isDisabled ? '#' : item.path}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault();
                        return false;
                      }
                    }}
                    className={({ isActive }) => 
                      `admin-nav-item ${isActive ? 'active' : ''}`
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px 32px',
                      color: isDisabled ? 'var(--secondary-500)' : 'var(--secondary-300)',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      borderLeft: '4px solid transparent',
                      fontSize: '16px',
                      fontWeight: '500',
                      position: 'relative',
                      overflow: 'hidden',
                      pointerEvents: isDisabled ? 'none' : 'auto'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <span>{item.name}</span>
                    {isDisabled && (
                      <span style={{
                        fontSize: '12px',
                        color: 'var(--secondary-500)',
                        marginLeft: 'auto'
                      }}>
                        🔒
                      </span>
                    )}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                      transform: 'translateX(-100%)',
                      transition: 'transform 0.5s ease'
                    }}></div>
                  </NavLink>
                </div>
              );
            })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '24px 32px',
          borderTop: '1px solid var(--secondary-700)',
          background: 'linear-gradient(180deg, transparent, var(--secondary-800))',
          width: '100%',
          boxSizing: 'border-box',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          {/* User Profile - Clickable */}
          <button
            onClick={() => navigate('/admin/profile')}
            style={{
              width: '100%',
              maxWidth: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              color: 'white',
              textAlign: 'left',
              boxSizing: 'border-box',
              overflow: 'hidden',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: 'white',
              fontWeight: '600',
              flexShrink: 0
            }}>
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--secondary-300)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.role}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--secondary-300)', flexShrink: 0 }}>
              👤
            </div>
          </button>
          
          {/* Logout Button - Fixed width */}
          <button
            onClick={handleLogout}
            style={{
              width: 'auto',
              minWidth: '120px',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                border: '2px solid var(--secondary-300)',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '20px'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--primary-500)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--secondary-300)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              ☰
            </button>
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: 'var(--secondary-900)', 
                margin: 0,
                background: 'linear-gradient(135deg, var(--primary-600), var(--secondary-700))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {getPageTitle()}
              </h1>
              <p style={{ 
                fontSize: '14px', 
                color: 'var(--secondary-600)', 
                margin: '4px 0 0 0',
                fontWeight: '500'
              }}>
                Manage your mock test platform
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Notifications */}
            <NotificationCenter />

            {/* Settings */}
            <button style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              border: '2px solid var(--secondary-300)',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '20px'
            }}>
              ⚙️
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 