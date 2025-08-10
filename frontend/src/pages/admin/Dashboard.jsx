import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsAPI, adminAPI, categoryAPI, userAPI, examAPI, questionAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socketService';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [realTimeActivities, setRealTimeActivities] = useState([]);

  // WebSocket event handlers for real-time updates
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Handle exam attempts
    const handleExamAttemptStarted = (data) => {
      queryClient.invalidateQueries(['dashboard-stats']);
      setRealTimeActivities(prev => [{
        id: Date.now(),
        type: 'exam_attempt_started',
        message: `Exam attempt started by ${data.userName}`,
        time: 'Just now',
        user: data.userName
      }, ...prev.slice(0, 9)]);
    };

    const handleExamAttemptCompleted = (data) => {
      queryClient.invalidateQueries(['dashboard-stats']);
      setRealTimeActivities(prev => [{
        id: Date.now(),
        type: 'exam_attempt_completed',
        message: `Exam completed by ${data.userName}`,
        time: 'Just now',
        user: data.userName
      }, ...prev.slice(0, 9)]);
    };

    // Handle bookings
    const handleBookingCreated = (data) => {
      queryClient.invalidateQueries(['dashboard-stats']);
      setRealTimeActivities(prev => [{
        id: Date.now(),
        type: 'booking_created',
        message: `New booking created by ${data.userName}`,
        time: 'Just now',
        user: data.userName
      }, ...prev.slice(0, 9)]);
    };

    // Handle payments
    const handlePaymentProcessed = (data) => {
      queryClient.invalidateQueries(['dashboard-stats']);
      setRealTimeActivities(prev => [{
        id: Date.now(),
        type: 'payment_processed',
        message: `Payment processed: $${data.amount}`,
        time: 'Just now',
        user: data.userName
      }, ...prev.slice(0, 9)]);
    };

    // Handle user activity
    const handleUserLogin = (data) => {
      setRealTimeActivities(prev => [{
        id: Date.now(),
        type: 'user_login',
        message: `${data.userName} logged in`,
        time: 'Just now',
        user: data.userName
      }, ...prev.slice(0, 9)]);
    };

    const handleUserLogout = (data) => {
      setRealTimeActivities(prev => [{
        id: Date.now(),
        type: 'user_logout',
        message: `${data.userName} logged out`,
        time: 'Just now',
        user: data.userName
      }, ...prev.slice(0, 9)]);
    };

    // Set up event listeners
    socketService.onExamAttemptStarted(handleExamAttemptStarted);
    socketService.onExamAttemptCompleted(handleExamAttemptCompleted);
    socketService.onBookingCreated(handleBookingCreated);
    socketService.onPaymentProcessed(handlePaymentProcessed);
    socketService.onUserLogin(handleUserLogin);
    socketService.onUserLogout(handleUserLogout);

    // Cleanup event listeners
    return () => {
      socketService.offExamAttemptStarted(handleExamAttemptStarted);
      socketService.offExamAttemptCompleted(handleExamAttemptCompleted);
      socketService.offBookingCreated(handleBookingCreated);
      socketService.offPaymentProcessed(handlePaymentProcessed);
      socketService.offUserLogin(handleUserLogin);
      socketService.offUserLogout(handleUserLogout);
    };
  }, [isAuthenticated, user, queryClient]);

  // Fetch data from APIs
  const { data: categoriesData, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => adminAPI.getAllCategories(),
  });

  const { data: usersData, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: () => adminAPI.getAllUsers(),
  });

  const { data: examsData, error: examsError } = useQuery({
    queryKey: ['exams'],
    queryFn: () => adminAPI.getAllExams(),
  });

  const { data: questionsData, error: questionsError } = useQuery({
    queryKey: ['questions'],
    queryFn: () => adminAPI.getAllQuestions(),
  });

  // Calculate stats from fetched data
  console.log('Categories Data:', categoriesData);
  console.log('Users Data:', usersData);
  console.log('Exams Data:', examsData);
  console.log('Questions Data:', questionsData);
  
  // Log any errors
  if (categoriesError) console.error('Categories Error:', categoriesError);
  if (usersError) console.error('Users Error:', usersError);
  if (examsError) console.error('Exams Error:', examsError);
  if (questionsError) console.error('Questions Error:', questionsError);
  
  const totalCategories = categoriesData?.data?.data?.categories?.length || 0;
  const totalStudents = usersData?.data?.data?.users?.filter(user => user.role === 'STUDENT')?.length || 0;
  const activeTests = examsData?.data?.data?.exams?.filter(exam => exam.isActive)?.length || 0;
  const totalQuestions = questionsData?.data?.data?.questions?.length || 0;

  console.log('Calculated Stats:', {
    totalCategories,
    totalStudents,
    activeTests,
    totalQuestions
  });

  // Stats array with real data
  const stats = [
    { id: 1, title: 'Total Categories', value: totalCategories.toString(), change: '+2', icon: '📚', color: 'primary' },
    { id: 2, title: 'Active Tests', value: activeTests.toString(), change: '+8', icon: '📝', color: 'success' },
    { id: 3, title: 'Total Students', value: totalStudents.toString(), change: '+12', icon: '👥', color: 'warning' },
    { id: 4, title: 'Questions Bank', value: totalQuestions.toString(), change: '+45', icon: '❓', color: 'danger' }
  ];

  // Combine real-time activities with static activities
  const recentActivities = [
    ...realTimeActivities,
    { id: 1, type: 'test_created', message: 'New JavaScript Test created', time: '2 hours ago', user: 'Admin' },
    { id: 2, type: 'student_registered', message: 'New student registered: John Doe', time: '4 hours ago', user: 'System' },
    { id: 3, type: 'test_completed', message: 'Mathematics Test completed by 15 students', time: '6 hours ago', user: 'System' },
    { id: 4, type: 'category_added', message: 'New category "Web Development" added', time: '1 day ago', user: 'Admin' },
    { id: 5, type: 'question_added', message: '50 new questions added to Programming category', time: '2 days ago', user: 'Admin' }
  ];

  const upcomingTests = [
    { id: 1, title: 'Advanced JavaScript', category: 'Programming', date: '2024-01-15', time: '10:00 AM', students: 25 },
    { id: 2, title: 'Calculus Fundamentals', category: 'Mathematics', date: '2024-01-16', time: '02:00 PM', students: 18 },
    { id: 3, title: 'Physics Mechanics', category: 'Science', date: '2024-01-17', time: '09:00 AM', students: 22 },
    { id: 4, title: 'English Grammar', category: 'Language', date: '2024-01-18', time: '11:00 AM', students: 15 }
  ];

  const quickActions = [
    { id: 1, title: 'Create New Test', description: 'Set up a new mock test', icon: '➕', action: () => navigate('/admin/tests'), color: 'primary' },
    { id: 2, title: 'Add Questions', description: 'Add questions to question bank', icon: '❓', action: () => navigate('/admin/questions'), color: 'success' },
    { id: 3, title: 'Manage Categories', description: 'Create or edit test categories', icon: '📚', action: () => navigate('/admin/categories'), color: 'warning' },
    { id: 4, title: 'Book Test', description: 'Schedule test for students', icon: '📅', action: () => navigate('/admin/bookings'), color: 'danger' }
  ];

  const getActivityIcon = (type) => {
    const icons = {
      test_created: '📝',
      student_registered: '👤',
      test_completed: '✅',
      category_added: '📚',
      question_added: '❓',
      exam_attempt_started: '🚀',
      exam_attempt_completed: '🏁',
      booking_created: '📅',
      payment_processed: '💰',
      user_login: '🔐',
      user_logout: '🚪'
    };
    return icons[type] || '📋';
  };

  const getActivityColor = (type) => {
    const colors = {
      test_created: 'var(--primary-500)',
      student_registered: 'var(--success-500)',
      test_completed: 'var(--warning-500)',
      category_added: 'var(--danger-500)',
      question_added: 'var(--secondary-500)',
      exam_attempt_started: 'var(--info-500)',
      exam_attempt_completed: 'var(--success-500)',
      booking_created: 'var(--warning-500)',
      payment_processed: 'var(--success-500)',
      user_login: 'var(--primary-500)',
      user_logout: 'var(--secondary-500)'
    };
    return colors[type] || 'var(--secondary-500)';
  };

  // Don't render until authenticated
  if (!isAuthenticated || !user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        fontSize: '18px',
        color: 'var(--text-secondary)'
      }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
        borderRadius: '20px',
        padding: '40px',
        marginBottom: '40px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '12px' }}>
            Welcome back, {user?.firstName || 'Administrator'}! 👋
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '32px' }}>
            Here's what's happening with your mock test platform today
          </p>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '500',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)'
              }}
            >
              <option value="all">All Activities</option>
              <option value="tests">Tests Only</option>
              <option value="students">Students Only</option>
              <option value="categories">Categories Only</option>
            </select>
            
            <button 
              onClick={() => navigate('/admin/reports')}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
            >
              📊 View Analytics
            </button>
          </div>
        </div>
        
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          zIndex: 1
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          zIndex: 1
        }}></div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        {stats.map((stat) => (
          <div key={stat.id} className="dashboard-card" style={{
            background: 'linear-gradient(135deg, white 0%, var(--secondary-50) 100%)',
            border: '2px solid var(--secondary-200)'
          }}>
            <div className="dashboard-card-header">
              <h3 className="dashboard-card-title">{stat.title}</h3>
              <div className={`dashboard-card-icon ${stat.color}`} style={{
                fontSize: '32px',
                width: '80px',
                height: '80px'
              }}>
                {stat.icon}
              </div>
            </div>
            <div className="dashboard-card-value" style={{ fontSize: '48px' }}>{stat.value}</div>
            <p className="dashboard-card-description" style={{ fontSize: '16px' }}>
              <span style={{ color: 'var(--success-600)', fontWeight: '600' }}>
                {stat.change}
              </span> from last month
            </p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', marginBottom: '40px' }}>
        {/* Recent Activities */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)',
          border: '2px solid var(--secondary-200)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--secondary-900)', margin: 0 }}>
              Recent Activities
            </h3>
            <button className="btn btn-primary btn-sm">
              View All
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentActivities.map((activity) => (
              <div key={activity.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px',
                borderRadius: '16px',
                backgroundColor: 'var(--secondary-50)',
                border: '1px solid var(--secondary-200)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: getActivityColor(activity.type),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'white'
                }}>
                  {getActivityIcon(activity.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--secondary-900)', marginBottom: '4px' }}>
                    {activity.message}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--secondary-600)' }}>
                    <span>👤 {activity.user}</span>
                    <span>🕒 {activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)',
          border: '2px solid var(--secondary-200)'
        }}>
          <h3 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '24px' }}>
            Quick Actions
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  border: '2px solid var(--secondary-200)',
                  borderRadius: '16px',
                  backgroundColor: 'var(--secondary-50)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-4px)';
                  e.target.style.boxShadow = 'var(--shadow-xl)';
                  e.target.style.borderColor = 'var(--primary-500)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.borderColor = 'var(--secondary-200)';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: `var(--${action.color}-500)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'white'
                }}>
                  {action.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '4px' }}>
                    {action.title}
                  </h4>
                  <p style={{ fontSize: '14px', color: 'var(--secondary-600)', margin: 0 }}>
                    {action.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Tests */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: 'var(--shadow-lg)',
        border: '2px solid var(--secondary-200)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--secondary-900)', margin: 0 }}>
            Upcoming Tests
          </h3>
          <button className="btn btn-primary btn-sm">
            Schedule New Test
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {upcomingTests.map((test) => (
            <div key={test.id} style={{
              padding: '24px',
              border: '2px solid var(--secondary-200)',
              borderRadius: '16px',
              backgroundColor: 'var(--secondary-50)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, var(--primary-500), var(--primary-600))'
              }}></div>
              
              <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '12px' }}>
                {test.title}
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Category:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--primary-600)' }}>{test.category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Date:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--secondary-900)' }}>{test.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Time:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--secondary-900)' }}>{test.time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Students:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--success-600)' }}>{test.students}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                  View Details
                </button>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 