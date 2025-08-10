import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { examAPI, categoryAPI, bookingAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import BillModal from '../../components/BillModal';

const AvailableTests = () => {
  console.log('🎯 AvailableTests Component - RENDERING');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  console.log('🎯 AvailableTests Component - User:', user);
  console.log('🎯 AvailableTests Component - User role:', user?.role);
  console.log('🎯 AvailableTests Component - User ID:', user?.id);
  console.log('🎯 AvailableTests Component - User enabled condition:', !!user);
  const queryClient = useQueryClient();
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [showBill, setShowBill] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);


  // Fetch user's booked tests
  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    error: bookingsError
  } = useQuery({
    queryKey: ['user-bookings'],
    queryFn: () => {
      console.log('🔍 Fetching user bookings...');
      console.log('🔍 Current user:', user);
      console.log('🔍 Auth token exists:', !!localStorage.getItem('token'));
      const result = bookingAPI.getMyBookings();
      console.log('🔍 API call result:', result);
      return result;
    },
    enabled: !!user, // Only run query if user is authenticated
    refetchInterval: 60000, // Refetch every minute
  });

  console.log('📊 AvailableTests Component Debug:', {
    bookingsData,
    bookingsLoading,
    bookingsError,
    bookings: bookingsData?.data?.data?.bookings || []
  });

  // Fetch categories for filter options
  const {
    data: categoriesData,
    isLoading: categoriesLoading
  } = useQuery({
    queryKey: ['exam-categories'],
    queryFn: () => {
      console.log('🔍 Fetching exam categories...');
      return categoryAPI.getAllCategories();
    },
  });

  console.log('📊 Categories Debug:', {
    categoriesData,
    categoriesLoading,
    categories: categoriesData?.data?.data || []
  });

  console.log('📊 Bookings Debug:', {
    bookingsData,
    bookingsLoading,
    bookingsError,
    bookings: bookingsData?.data?.data?.bookings || []
  });
  
  console.log('🔍 Full bookingsData object:', bookingsData);
  console.log('🔍 bookingsData.data:', bookingsData?.data);
  console.log('🔍 bookingsData.data?.bookings:', bookingsData?.data?.bookings);

  // Extract data from API responses
  const bookings = bookingsData?.data?.data?.bookings || [];
  
  console.log('🔍 Extracted bookings:', bookings);
  console.log('🔍 Bookings length:', bookings.length);
  console.log('🔍 First booking:', bookings[0]);
  const categories = categoriesData?.data?.data || [];

  // Debug logging
  console.log('AvailableTests state:', {
    bookingsCount: bookings.length
  });

  // Handle bill display
  const handleShowBill = (bill) => {
    setCurrentBill(bill);
    setShowBill(true);
  };

  const handleCloseBill = () => {
    setShowBill(false);
    setCurrentBill(null);
  };

  // Filter booked tests based on selected filters
  const filteredTests = bookings.filter(booking => {
    const test = booking.exam;
    console.log('🔍 Filtering booking:', booking.id, 'test:', test.title);
    console.log('🔍 Filter subject:', filterSubject, 'test subject:', test.examCategory?.name);
    console.log('🔍 Filter difficulty:', filterDifficulty, 'test difficulty:', test.difficulty);
    
    const matchesSubject = filterSubject === 'all' || test.examCategory?.name === filterSubject;
    const matchesDifficulty = filterDifficulty === 'all' || test.difficulty === filterDifficulty;
    
    console.log('🔍 Matches subject:', matchesSubject, 'matches difficulty:', matchesDifficulty);
    
    return matchesSubject && matchesDifficulty;
  });
  
  console.log('🔍 Filtered tests:', filteredTests);
  console.log('🔍 Filtered tests length:', filteredTests.length);



  // Handle loading state
  if (bookingsLoading || categoriesLoading) {
    return (
      <div className="fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
            Available Tests
          </h1>
          <p style={{ color: '#64748b' }}>
            Loading available tests...
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="dashboard-card" style={{ opacity: 0.6 }}>
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>Loading...</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (bookingsError) {
    return (
      <div className="fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
            Available Tests
          </h1>
          <p style={{ color: '#64748b' }}>
            Error loading available tests. Please try again later.
          </p>
        </div>
        <div className="error-container">
          <h3>Error loading tests</h3>
          <p>Failed to load available tests. Please try again later.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
          My Booked Tests
        </h1>
        <p style={{ color: '#64748b' }}>
          View and manage your scheduled tests
        </p>
      </div>

      {/* Filters */}
      <div className="data-table" style={{ marginBottom: '2rem' }}>
        <div className="table-header">
          <div className="table-title">Filters</div>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select 
              className="form-select"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <select 
              className="form-select"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      {filteredTests.length === 0 ? (
        <div className="data-table">
          <div className="table-header">
            <div className="table-title">No Booked Tests</div>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>
              You don't have any booked tests yet.
            </p>
            <p style={{ color: '#64748b' }}>
              Contact your administrator to schedule a test for you.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          {filteredTests.map((booking) => {
            const test = booking.exam;
            return (
            <div key={booking.id} className="dashboard-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                    {test.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                    {test.description || 'No description available'}
                  </p>
                </div>
                <span className={`status-badge ${
                  test.difficulty === 'Advanced' ? 'status-active' :
                  test.difficulty === 'Intermediate' ? 'status-pending' : 'status-inactive'
                }`}>
                  {test.difficulty || 'Not specified'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Subject</div>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{test.examCategory?.name || 'Unknown'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Duration</div>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{test.duration || 0} min</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Questions</div>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{test.questionCount || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Status</div>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: booking.status === 'COMPLETED' ? '#dcfce7' :
                                    booking.status === 'CONFIRMED' ? '#dbeafe' :
                                    booking.status === 'PENDING' ? '#fef3c7' :
                                    booking.status === 'CANCELLED' ? '#fee2e2' : '#f3f4f6',
                      color: booking.status === 'COMPLETED' ? '#166534' :
                           booking.status === 'CONFIRMED' ? '#1e40af' :
                           booking.status === 'PENDING' ? '#92400e' :
                           booking.status === 'CANCELLED' ? '#991b1b' : '#374151',
                      border: `1px solid ${
                        booking.status === 'COMPLETED' ? '#bbf7d0' :
                        booking.status === 'CONFIRMED' ? '#bfdbfe' :
                        booking.status === 'PENDING' ? '#fde68a' :
                        booking.status === 'CANCELLED' ? '#fecaca' : '#d1d5db'
                      }`
                    }}>
                      {booking.status === 'COMPLETED' ? '✅ COMPLETED' :
                       booking.status === 'CONFIRMED' ? '✅ CONFIRMED' :
                       booking.status === 'PENDING' ? '⏳ PENDING' :
                       booking.status === 'CANCELLED' ? '❌ CANCELLED' : booking.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Scheduled</div>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>
                    {booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleDateString() : 'Not scheduled'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Price</div>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>
                    {test.currency} {test.price}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    console.log('Button clicked for test:', test.title);
                    console.log('Starting exam for booking:', booking.id);
                    console.log('Exam ID:', test.id);
                    
                    // Temporarily disabled scheduled time validation for testing
                    // const now = new Date();
                    // const scheduledTime = new Date(booking.scheduledAt);
                    // const timeDiff = scheduledTime.getTime() - now.getTime();
                    // const hoursDiff = timeDiff / (1000 * 60 * 60);
                    
                    // if (hoursDiff > 1) {
                    //   toast.error(`This exam is scheduled for ${scheduledTime.toLocaleString()}. Please wait until the scheduled time.`);
                    //   return;
                    // }
                    
                    // if (hoursDiff < -2) {
                    //   toast.error('This exam was scheduled more than 2 hours ago. Please contact your administrator.');
                    //   return;
                    // }
                    
                    // Navigate to exam interface
                    navigate(`/exam/${test.id}`);
                  }}
                >
                  Start Test
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    // Generate bill for this booking
                    const bill = {
                      billNumber: `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      billDate: new Date(),
                      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                      booking: {
                        id: booking.id,
                        scheduledAt: booking.scheduledAt,
                        status: booking.status
                      },
                      exam: {
                        id: test.id,
                        title: test.title,
                        description: test.description,
                        category: test.examCategory?.name || 'Unknown',
                        duration: test.duration,
                        totalMarks: test.totalMarks
                      },
                      customer: {
                        id: user.id,
                        name: `${user.firstName} ${user.lastName}`,
                        email: user.email
                      },
                      amount: {
                        subtotal: test.price || 0,
                        tax: 0,
                        total: test.price || 0,
                        currency: test.currency || 'USD'
                      },
                      payment: null,
                      status: 'PENDING'
                    };
                    handleShowBill(bill);
                  }}
                >
                  📄 View Bill
                </button>
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Bill Modal */}
      {showBill && (
        <BillModal
          bill={currentBill}
          onClose={handleCloseBill}
          onPrint={() => {
            toast.success('Bill printed successfully!');
          }}
        />
      )}
    </div>
  );
};

export default AvailableTests; 