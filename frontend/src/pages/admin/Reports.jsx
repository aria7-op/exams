import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Reports = () => {
  const { user: currentUser } = useAuth();
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [exportFormat, setExportFormat] = useState('pdf');

  // Fetch comprehensive analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics-comprehensive'],
    queryFn: async () => {
      const [dashboardStats, userAnalytics, examAnalytics, questionAnalytics] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getUserAnalytics(),
        adminAPI.getExamAnalytics(),
        adminAPI.getQuestionAnalytics()
      ]);
      
      return {
        dashboard: dashboardStats?.data,
        users: userAnalytics?.data,
        exams: examAnalytics?.data,
        questions: questionAnalytics?.data
      };
    },
    refetchInterval: 60000
  });

  // Export report mutation
  const exportReportMutation = useMutation({
    mutationFn: (exportData) => adminAPI.exportData(exportData),
    onSuccess: (data) => {
      toast.success('Report exported successfully!');
      // Handle file download
      if (data?.data?.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.data.downloadUrl;
        link.download = `report-${reportType}-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to export report');
    }
  });

  const handleExportReport = () => {
    exportReportMutation.mutate({
      reportType,
      dateRange,
      format: exportFormat,
      includeCharts: true
    });
  };

  const data = analyticsData || {};
  const stats = data.dashboard?.overview || {};
  const userStats = data.users || {};
  const examStats = data.exams || {};
  const questionStats = data.questions || {};

  if (analyticsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', color: 'var(--secondary-600)' }}>Loading reports...</div>
      </div>
    );
  }

  const renderOverviewReport = () => (
    <div>
      <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-title">Total Users</div>
            <div className="dashboard-card-icon primary">👥</div>
          </div>
          <div className="dashboard-card-value">{stats.totalUsers || 0}</div>
          <div className="dashboard-card-description">
            {userStats.newUsers || 0} new users this period
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-title">Total Exams</div>
            <div className="dashboard-card-icon success">📝</div>
          </div>
          <div className="dashboard-card-value">{stats.totalExams || 0}</div>
          <div className="dashboard-card-description">
            {examStats.activeExams || 0} active exams
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-title">Total Questions</div>
            <div className="dashboard-card-icon warning">❓</div>
          </div>
          <div className="dashboard-card-value">{stats.totalQuestions || 0}</div>
          <div className="dashboard-card-description">
            {questionStats.activeQuestions || 0} active questions
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-title">Total Attempts</div>
            <div className="dashboard-card-icon danger">📊</div>
          </div>
          <div className="dashboard-card-value">{stats.totalAttempts || 0}</div>
          <div className="dashboard-card-description">
            {examStats.recentAttempts || 0} recent attempts
          </div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Performance Summary</h3>
        </div>
        <div className="chart-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid var(--secondary-200)' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--primary-600)' }}>
                {examStats.averageScore || 0}%
              </div>
              <div style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Average Score</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid var(--secondary-200)' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--success-600)' }}>
                {examStats.passRate || 0}%
              </div>
              <div style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Pass Rate</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid var(--secondary-200)' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--warning-600)' }}>
                {examStats.averageCompletionTime || 0} min
              </div>
              <div style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Avg Completion Time</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid var(--secondary-200)' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--danger-600)' }}>
                {examStats.abandonmentRate || 0}%
              </div>
              <div style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Abandonment Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserReport = () => (
    <div>
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">User Demographics</h3>
        </div>
        <div className="chart-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '16px', border: '1px solid var(--secondary-200)' }}>
              <h4 style={{ marginBottom: '12px', color: 'var(--secondary-900)' }}>User Roles</h4>
              {userStats.usersByRole?.map((role, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--secondary-700)' }}>{role.role}</span>
                  <span style={{ fontWeight: '600', color: 'var(--primary-600)' }}>{role.count}</span>
                </div>
              )) || (
                <div style={{ color: 'var(--secondary-600)', textAlign: 'center', padding: '20px' }}>
                  No role data available
                </div>
              )}
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '16px', border: '1px solid var(--secondary-200)' }}>
              <h4 style={{ marginBottom: '12px', color: 'var(--secondary-900)' }}>User Status</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--secondary-700)' }}>Active Users</span>
                <span style={{ fontWeight: '600', color: 'var(--success-600)' }}>{userStats.activeUsers || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--secondary-700)' }}>New Users</span>
                <span style={{ fontWeight: '600', color: 'var(--primary-600)' }}>{userStats.newUsers || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--secondary-700)' }}>Verified Users</span>
                <span style={{ fontWeight: '600', color: 'var(--info-600)' }}>{userStats.verifiedUsers || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExamReport = () => (
    <div>
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Exam Performance Analysis</h3>
        </div>
        <div className="chart-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '16px', border: '1px solid var(--secondary-200)' }}>
              <h4 style={{ marginBottom: '12px', color: 'var(--secondary-900)' }}>Exam Statistics</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--secondary-700)' }}>Total Exams</span>
                <span style={{ fontWeight: '600', color: 'var(--primary-600)' }}>{stats.totalExams || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--secondary-700)' }}>Active Exams</span>
                <span style={{ fontWeight: '600', color: 'var(--success-600)' }}>{examStats.activeExams || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--secondary-700)' }}>Completed Exams</span>
                <span style={{ fontWeight: '600', color: 'var(--info-600)' }}>{examStats.completedExams || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--secondary-700)' }}>Average Score</span>
                <span style={{ fontWeight: '600', color: 'var(--warning-600)' }}>{examStats.averageScore || 0}%</span>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '16px', border: '1px solid var(--secondary-200)' }}>
              <h4 style={{ marginBottom: '12px', color: 'var(--secondary-900)' }}>Recent Exam Attempts</h4>
              {examStats.recentAttempts ? (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {examStats.recentAttempts.slice(0, 5).map((attempt, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '4px 0',
                      borderBottom: index < 4 ? '1px solid var(--secondary-200)' : 'none'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '500' }}>{attempt.examTitle}</div>
                        <div style={{ fontSize: '10px', color: 'var(--secondary-600)' }}>{attempt.userName}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary-600)' }}>{attempt.score}%</div>
                        <div style={{ fontSize: '10px', color: 'var(--secondary-600)' }}>
                          {new Date(attempt.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--secondary-600)', textAlign: 'center', padding: '20px' }}>
                  No recent attempts
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuestionReport = () => (
    <div>
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Question Bank Analysis</h3>
        </div>
        <div className="chart-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '16px', border: '1px solid var(--secondary-200)' }}>
              <h4 style={{ marginBottom: '12px', color: 'var(--secondary-900)' }}>Question Statistics</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--secondary-700)' }}>Total Questions</span>
                <span style={{ fontWeight: '600', color: 'var(--primary-600)' }}>{stats.totalQuestions || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--secondary-700)' }}>Active Questions</span>
                <span style={{ fontWeight: '600', color: 'var(--success-600)' }}>{questionStats.activeQuestions || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--secondary-700)' }}>Average Difficulty</span>
                <span style={{ fontWeight: '600', color: 'var(--warning-600)' }}>{questionStats.averageDifficulty || 'Medium'}</span>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '16px', border: '1px solid var(--secondary-200)' }}>
              <h4 style={{ marginBottom: '12px', color: 'var(--secondary-900)' }}>Question Types</h4>
              {questionStats.questionsByType?.map((type, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--secondary-700)' }}>{type.type}</span>
                  <span style={{ fontWeight: '600', color: 'var(--primary-600)' }}>{type.count}</span>
                </div>
              )) || (
                <div style={{ color: 'var(--secondary-600)', textAlign: 'center', padding: '20px' }}>
                  No type data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportContent = () => {
    switch (reportType) {
      case 'overview':
        return renderOverviewReport();
      case 'users':
        return renderUserReport();
      case 'exams':
        return renderExamReport();
      case 'questions':
        return renderQuestionReport();
      default:
        return renderOverviewReport();
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="data-table-container">
        <div className="data-table-header">
          <h2 className="data-table-title">Reports & Analytics</h2>
          <div className="data-table-actions">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--secondary-300)',
                borderRadius: '6px',
                marginRight: '12px'
              }}
            >
              <option value="overview">Overview Report</option>
              <option value="users">User Report</option>
              <option value="exams">Exam Report</option>
              <option value="questions">Question Report</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--secondary-300)',
                borderRadius: '6px',
                marginRight: '12px'
              }}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--secondary-300)',
                borderRadius: '6px',
                marginRight: '12px'
              }}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
            <button 
              className="btn btn-primary"
              onClick={handleExportReport}
              disabled={exportReportMutation.isLoading}
            >
              {exportReportMutation.isLoading ? 'Exporting...' : '📊 Export Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {renderReportContent()}

      {/* Report Summary */}
      <div className="chart-container" style={{ marginTop: '32px' }}>
        <div className="chart-header">
          <h3 className="chart-title">Report Summary</h3>
        </div>
        <div className="chart-content">
          <div style={{ background: 'white', borderRadius: '8px', padding: '16px', border: '1px solid var(--secondary-200)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--primary-600)' }}>
                  {stats.totalUsers || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-600)' }}>Total Users</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--success-600)' }}>
                  {stats.totalExams || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-600)' }}>Total Exams</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--warning-600)' }}>
                  {stats.totalQuestions || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-600)' }}>Total Questions</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--danger-600)' }}>
                  {stats.totalAttempts || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-600)' }}>Total Attempts</div>
              </div>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--secondary-200)', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>
                Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 