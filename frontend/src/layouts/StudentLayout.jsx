import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from '../components/notifications/NotificationCenter';

const StudentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', path: '/student', icon: '📊' },
    { name: 'Available Tests', path: '/student/tests', icon: '📝' },
    { name: 'Test History', path: '/student/history', icon: '📈' },
    { name: 'Certificates', path: '/student/certificates', icon: '🏆' },
    { name: 'Profile', path: '/student/profile', icon: '👤' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const currentNav = navigation.find(nav => nav.path === location.pathname);
    return currentNav ? currentNav.name : 'Student Portal';
  };

  return (
    <div className="student-layout">
      {/* Mobile Menu Toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1001,
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
          fontSize: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        ☰
      </button>

      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          opacity: 0,
          visibility: 'hidden',
          transition: 'all 0.3s ease'
        }}
      ></div>

      {/* Sidebar */}
      <div className={`student-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="student-sidebar-header">
          <div className="student-sidebar-logo">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--success-500), var(--success-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'white'
            }}>
              🎓
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>
                MockTest Pro
              </div>
              <div style={{ fontSize: '12px', color: 'var(--success-200)', marginTop: '2px' }}>
                Student Portal
              </div>
            </div>
          </div>
        </div>

        <nav className="student-sidebar-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `student-nav-item ${isActive ? 'active' : ''}`
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 32px',
                color: 'var(--success-200)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                borderLeft: '4px solid transparent',
                fontSize: '16px',
                fontWeight: '500',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span>{item.name}</span>
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
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '24px 32px',
          borderTop: '1px solid var(--success-600)',
          background: 'linear-gradient(180deg, transparent, var(--success-700))',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* User Profile - Clickable */}
          <button
            onClick={() => navigate('/student/profile')}
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
              boxSizing: 'border-box'
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
              background: 'linear-gradient(135deg, var(--success-500), var(--success-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: 'white',
              fontWeight: '600',
              flexShrink: 0
            }}>
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'S'}
            </div>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--success-200)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Student
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--success-200)', flexShrink: 0 }}>
              👤
            </div>
          </button>
          
          {/* Logout Button */}
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
      <div className="student-main">
        {/* Header */}
        <header className="student-header">
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
                e.target.style.borderColor = 'var(--success-500)';
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
                background: 'linear-gradient(135deg, var(--success-600), var(--secondary-700))',
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
                Your learning journey continues
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Notifications */}
            <NotificationCenter />

            {/* Study Timer */}
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
              ⏱️
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout; 