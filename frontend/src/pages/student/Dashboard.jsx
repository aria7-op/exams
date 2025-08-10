import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, analyticsAPI, examAPI } from '../../services/api';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch real student data
  const { 
    data: studentProfile, 
    isLoading: profileLoading, 
    error: profileError 
  } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: () => userAPI.getProfile(),
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute
  });

  const { 
    data: studentAnalytics, 
    isLoading: analyticsLoading, 
    error: analyticsError 
  } = useQuery({
    queryKey: ['student-analytics', user?.id, selectedPeriod],
    queryFn: () => analyticsAPI.getUserAnalytics(user?.id),
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute
  });

  const { 
    data: recentAttempts, 
    isLoading: attemptsLoading, 
    error: attemptsError 
  } = useQuery({
    queryKey: ['recent-attempts', user?.id],
    queryFn: () => analyticsAPI.getRecentActivities(),
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute
  });

  const { 
    data: upcomingExams, 
    isLoading: examsLoading, 
    error: examsError 
  } = useQuery({
    queryKey: ['upcoming-exams'],
    queryFn: () => examAPI.getUpcomingExams(),
    refetchInterval: 60000, // Refetch every minute
  });

  // Extract data from API responses
  const profile = studentProfile?.data?.data?.user || {};
  const analytics = studentAnalytics?.data?.data || {};
  const attempts = recentAttempts?.data?.data?.recentAttempts || [];
  const exams = upcomingExams?.data?.data?.exams || [];

  // Calculate derived stats from user analytics
  const totalTests = analytics.overview?.totalAttempts || 0;
  const averageScore = analytics.overview?.averageScore || 0;
  const completedTests = analytics.overview?.completedAttempts || 0;
  const completionRate = analytics.overview?.completionRate || 0;
  const certificates = 0; // Not available in current API
  const streak = 0; // Not available in current API

  const stats = [
    { id: 1, title: 'Overall Score', value: `${averageScore}%`, change: '+5%', icon: '📊', color: 'primary', trend: 'up' },
    { id: 2, title: 'Tests Completed', value: `${completedTests}/${totalTests}`, change: `${completionRate}%`, icon: '✅', color: 'success', trend: 'up' },
    { id: 3, title: 'Study Streak', value: `${streak} days`, change: '+2', icon: '🔥', color: 'warning', trend: 'up' },
    { id: 4, title: 'Certificates', value: `${certificates}`, change: '+1', icon: '🏆', color: 'danger', trend: 'up' }
  ];

  // Transform recent attempts to match UI format
  const recentTests = attempts.map(attempt => ({
    id: attempt.id,
    title: attempt.exam?.title || 'Unknown Exam',
    category: attempt.exam?.examCategory?.name || 'Unknown Category',
    score: attempt.percentage || 0,
    date: new Date(attempt.createdAt).toLocaleDateString(),
    status: attempt.status || 'completed',
    timeSpent: `${Math.round(attempt.timeSpent / 60)} min`
  })) || [];

  // Transform upcoming exams to match UI format
  const upcomingTests = exams.map(exam => ({
    id: exam.id,
    title: exam.title,
    category: exam.examCategory?.name || 'Unknown Category',
    date: new Date(exam.scheduledStart).toLocaleDateString(),
    time: new Date(exam.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    duration: `${exam.duration} min`,
    questions: exam.questionCount || 0
  })) || [];

  // Category performance from analytics
  const categoryPerformance = analytics.performance?.categoryPerformance?.map(cat => ({
    category: cat.categoryName || 'Unknown',
    tests: cat.attemptCount || 0,
    avgScore: cat.averageScore || 0,
    improvement: '+8%', // This would need to be calculated from historical data
    color: 'var(--primary-500)'
  })) || [];

  // Achievements from analytics (not available in current API, using mock data)
  const achievements = [
    {
      id: 1,
      title: 'First Test',
      description: 'Completed your first exam',
      icon: '🎯',
      date: new Date().toLocaleDateString(),
      type: 'milestone'
    },
    {
      id: 2,
      title: 'Perfect Score',
      description: 'Achieved 100% on an exam',
      icon: '⭐',
      date: new Date().toLocaleDateString(),
      type: 'achievement'
    }
  ];

  // Study progress from analytics (using trends data)
  const studyProgress = analytics.trends?.attemptsByDay?.map(day => ({
    day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    hours: day.attempts || 0,
    tests: day.attempts || 0
  })) || [];

  const maxHours = studyProgress.length > 0 ? Math.max(...studyProgress.map(p => p.hours)) : 1;

  // Handle errors
  if (profileError || analyticsError || attemptsError || examsError) {
    return (
      <div className="error-container">
        <h3>Error loading dashboard</h3>
        <p>Failed to load student data. Please try again later.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  const isLoading = profileLoading || analyticsLoading || attemptsLoading || examsLoading;

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--success-500)';
    if (score >= 80) return 'var(--warning-500)';
    if (score >= 70) return 'var(--danger-500)';
    return 'var(--secondary-500)';
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'var(--success-500)',
      pending: 'var(--warning-500)',
      failed: 'var(--danger-500)'
    };
    return colors[status] || 'var(--secondary-500)';
  };

  return (
    <div>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, var(--success-600), var(--success-700))',
        borderRadius: '24px',
        padding: '40px',
        marginBottom: '40px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '12px' }}>
                {isLoading ? 'Loading...' : `Welcome back, ${profile.firstName || 'Student'}! 🎓`}
              </h1>
              <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '24px' }}>
                {isLoading ? 'Loading your progress...' : 'Keep up the great work! You\'re making excellent progress in your studies.'}
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{
                  padding: '12px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  🆔 {isLoading ? 'Loading...' : (profile.studentId || profile.id || 'N/A')}
                </div>
                <div style={{
                  padding: '12px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  📅 Member since {isLoading ? 'Loading...' : (profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : 'N/A')}
                </div>
                <div style={{
                  padding: '12px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  🎯 Level: {isLoading ? 'Loading...' : (profile.level || 'Beginner')}
                </div>
              </div>
            </div>
            
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              backdropFilter: 'blur(10px)',
              border: '3px solid rgba(255, 255, 255, 0.3)'
            }}>
              {isLoading ? '⏳' : (profile.avatar || '👨‍🎓')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
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
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            
            <button 
              onClick={() => navigate('/student/tests')}
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
              📝 Take New Test
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
        {isLoading ? (
          // Loading skeleton for stats
          [1, 2, 3, 4].map(i => (
            <div key={i} className="dashboard-card" style={{
              background: 'linear-gradient(135deg, white 0%, var(--secondary-50) 100%)',
              border: '2px solid var(--secondary-200)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div className="dashboard-card-header">
                <h3 className="dashboard-card-title">Loading...</h3>
                <div className="dashboard-card-icon primary">⏳</div>
              </div>
              <div className="dashboard-card-value">--</div>
              <p className="dashboard-card-description">Loading data...</p>
            </div>
          ))
        ) : (
          stats.map((stat) => (
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
              </span> from last period
            </p>
          </div>
          ))
        )}
      </div>

      {/* Tabs Section */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '40px',
        boxShadow: 'var(--shadow-lg)',
        border: '2px solid var(--secondary-200)'
      }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '2px solid var(--secondary-200)', paddingBottom: '16px' }}>
          {['overview', 'performance', 'achievements', 'study'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'capitalize',
                backgroundColor: activeTab === tab ? 'var(--success-500)' : 'var(--secondary-100)',
                color: activeTab === tab ? 'white' : 'var(--secondary-700)'
              }}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'performance' && '📈 Performance'}
              {tab === 'achievements' && '🏆 Achievements'}
              {tab === 'study' && '📚 Study Progress'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            {/* Recent Tests */}
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '24px' }}>
                Recent Test Results
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {isLoading ? (
                  // Loading skeleton for recent tests
                  [1, 2, 3].map(i => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '20px',
                      borderRadius: '16px',
                      backgroundColor: 'var(--secondary-50)',
                      border: '2px solid var(--secondary-200)',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--secondary-300)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        color: 'white',
                        fontWeight: '700'
                      }}>
                        --
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '8px' }}>
                          Loading...
                        </h4>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--secondary-600)' }}>
                          <span>📚 Loading...</span>
                          <span>📅 Loading...</span>
                          <span>⏱️ Loading...</span>
                        </div>
                      </div>
                      <div style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--secondary-300)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        Loading
                      </div>
                    </div>
                  ))
                ) : recentTests.length === 0 ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--secondary-600)',
                    fontSize: '16px'
                  }}>
                    No recent test results found. Take your first test to see your results here!
                  </div>
                ) : (
                  recentTests.map((test) => (
                  <div key={test.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--secondary-50)',
                    border: '2px solid var(--secondary-200)',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      backgroundColor: getScoreColor(test.score),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      color: 'white',
                      fontWeight: '700'
                    }}>
                      {test.score}%
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '8px' }}>
                        {test.title}
                      </h4>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--secondary-600)' }}>
                        <span>📚 {test.category}</span>
                        <span>📅 {test.date}</span>
                        <span>⏱️ {test.timeSpent}</span>
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: getStatusColor(test.status),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {test.status}
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Tests */}
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '24px' }}>
                Upcoming Tests
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {isLoading ? (
                  // Loading skeleton for upcoming tests
                  [1, 2].map(i => (
                    <div key={i} style={{
                      padding: '20px',
                      borderRadius: '16px',
                      backgroundColor: 'var(--secondary-50)',
                      border: '2px solid var(--secondary-200)',
                      transition: 'all 0.3s ease'
                    }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '12px' }}>
                        Loading...
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Category:</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--success-600)' }}>Loading...</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Date:</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--secondary-900)' }}>Loading...</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Time:</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--secondary-900)' }}>Loading...</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Duration:</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--warning-600)' }}>Loading...</span>
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm" style={{ width: '100%' }} disabled>
                        ⏳ Loading...
                      </button>
                    </div>
                  ))
                ) : upcomingTests.length === 0 ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--secondary-600)',
                    fontSize: '16px'
                  }}>
                    No upcoming tests scheduled. Check back later for new tests!
                  </div>
                ) : (
                  upcomingTests.map((test) => (
                  <div key={test.id} style={{
                    padding: '20px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--secondary-50)',
                    border: '2px solid var(--secondary-200)',
                    transition: 'all 0.3s ease'
                  }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '12px' }}>
                      {test.title}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Category:</span>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--success-600)' }}>{test.category}</span>
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
                        <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Duration:</span>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--warning-600)' }}>{test.duration}</span>
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                      📝 Start Preparation
                    </button>
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '24px' }}>
              Category Performance
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              {categoryPerformance.map((cat, index) => (
                <div key={index} style={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--secondary-50)',
                  border: '2px solid var(--secondary-200)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: cat.color
                  }}></div>
                  
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '16px' }}>
                    {cat.category}
                  </h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Tests Taken:</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-600)' }}>{cat.tests}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Average Score:</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--success-600)' }}>{cat.avgScore}%</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Improvement:</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--success-600)' }}>{cat.improvement}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '24px' }}>
              Recent Achievements
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {achievements.map((achievement) => (
                <div key={achievement.id} style={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--secondary-50)',
                  border: '2px solid var(--secondary-200)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--success-500), var(--success-600))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: 'white'
                  }}>
                    {achievement.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '8px' }}>
                      {achievement.title}
                    </h4>
                    <p style={{ fontSize: '14px', color: 'var(--secondary-600)', marginBottom: '8px' }}>
                      {achievement.description}
                    </p>
                    <span style={{ fontSize: '12px', color: 'var(--secondary-500)' }}>
                      🕒 {achievement.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'study' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '24px' }}>
              Weekly Study Progress
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              {/* Study Hours Chart */}
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '20px' }}>
                  Study Hours
                </h4>
                <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-around', gap: '8px', height: '200px', padding: '20px' }}>
                  {studyProgress.map((day, index) => (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '40px',
                        height: `${(day.hours / maxHours) * 160}px`,
                        backgroundColor: 'var(--success-500)',
                        borderRadius: '8px 8px 0 0',
                        transition: 'all 0.3s ease',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-25px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--success-600)'
                        }}>
                          {day.hours}h
                        </div>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--secondary-600)' }}>
                        {day.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tests Taken */}
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '20px' }}>
                  Tests Completed
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {studyProgress.map((day, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--secondary-50)',
                      border: '1px solid var(--secondary-200)'
                    }}>
                      <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--secondary-700)' }}>
                        {day.day}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>
                          {day.tests} tests
                        </span>
                        {day.tests > 0 && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--success-500)'
                          }}></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <button
            onClick={() => navigate('/student/tests')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '24px',
              border: '2px solid var(--secondary-200)',
              borderRadius: '16px',
              backgroundColor: 'var(--secondary-50)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left',
              width: '100%'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'white'
            }}>
              📝
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '4px' }}>
                Take New Test
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--secondary-600)', margin: 0 }}>
                Browse available tests
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/student/history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '24px',
              border: '2px solid var(--secondary-200)',
              borderRadius: '16px',
              backgroundColor: 'var(--secondary-50)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left',
              width: '100%'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--success-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'white'
            }}>
              📊
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '4px' }}>
                View History
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--secondary-600)', margin: 0 }}>
                Check past results
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/student/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '24px',
              border: '2px solid var(--secondary-200)',
              borderRadius: '16px',
              backgroundColor: 'var(--secondary-50)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left',
              width: '100%'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--warning-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'white'
            }}>
              👤
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '4px' }}>
                Update Profile
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--secondary-600)', margin: 0 }}>
                Manage your account
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard; 