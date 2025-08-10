import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingAPI, examAPI, userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import BillModal from '../../components/BillModal';

const TestBookings = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: '',
    examCategoryId: '',
    startDate: '',
    endDate: ''
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    userId: '',
    examId: '',
    scheduledAt: '',
    attemptsAllowed: 1,
    notes: ''
  });

  // Fetch bookings data
  const { 
    data: bookingsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn: () => bookingAPI.getAllBookings(filters),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch users for scheduling
  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => userAPI.getAllUsers({ limit: 100 }),
  });

  // Fetch exams for scheduling
  const { data: examsData } = useQuery({
    queryKey: ['admin-exams'],
    queryFn: () => examAPI.getAllExams({ limit: 100 }),
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (bookingData) => bookingAPI.createAdminBooking(bookingData),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['admin-bookings']);
      toast.success('Test scheduled successfully!');
      setShowScheduleModal(false);
      setScheduleData({ userId: '', examId: '', scheduledAt: '', attemptsAllowed: 1, notes: '' });
      
      // Show bill if available
      if (response.data?.data?.bill) {
        setCurrentBill(response.data.data.bill);
        setShowBill(true);
      }
    },
    onError: (error) => {
      console.error('❌ Booking creation error:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to schedule test');
    }
  });

  const bookings = bookingsData?.data?.data?.bookings || [];
  const pagination = bookingsData?.data?.data?.pagination;
  const users = usersData?.data?.data?.users || [];
  const exams = examsData?.data?.data?.exams || [];



  // Handle booking status update
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await bookingAPI.updateBooking(bookingId, { status: newStatus });
      toast.success('Booking status updated successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to update booking status');
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingAPI.cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  // Handle schedule test modal
  const handleScheduleTest = () => {
    setShowScheduleModal(true);
  };

  // Handle close bill modal
  const handleCloseBill = () => {
    setShowBill(false);
    setCurrentBill(null);
  };

  // Handle confirm scheduling
  const handleConfirmScheduling = () => {
    if (!scheduleData.userId || !scheduleData.examId || !scheduleData.scheduledAt) {
      toast.error('Please fill in all required fields');
      return;
    }

    const bookingPayload = {
      userId: scheduleData.userId,
      examId: scheduleData.examId,
      scheduledAt: scheduleData.scheduledAt,
      ...(scheduleData.notes && { notes: scheduleData.notes })
    };

    console.log('🔍 Creating admin booking with payload:', bookingPayload);
    createBookingMutation.mutate(bookingPayload);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format time for display
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'badge-success';
      case 'CONFIRMED':
      case 'SCHEDULED':
        return 'badge-primary';
      case 'PENDING':
        return 'badge-warning';
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <h3>Error loading bookings</h3>
        <p>{error.message}</p>
        <button className="btn btn-primary" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="data-table-container">
        <div className="data-table-header">
          <h2 className="data-table-title">Test Bookings</h2>
          <div className="data-table-actions">
            <button className="btn btn-primary" onClick={handleScheduleTest}>
              📅 Schedule Test
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-container" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="form-select"
            style={{ minWidth: '150px' }}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="form-input"
            placeholder="Start Date"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="form-input"
            placeholder="End Date"
          />

          <button 
            className="btn btn-secondary" 
            onClick={() => setFilters({ status: '', examCategoryId: '', startDate: '', endDate: '' })}
          >
            Clear Filters
          </button>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading bookings...</p>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Test</th>
                  <th>Category</th>
                  <th>Scheduled Date</th>
                  <th>Scheduled Time</th>
                  <th>Attempts</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--secondary-900)' }}>
                          {booking.user?.firstName} {booking.user?.lastName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--secondary-600)' }}>
                          {booking.user?.email}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>
                          {booking.exam?.title}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-secondary">
                          {booking.exam?.examCategory?.name}
                        </span>
                      </td>
                      <td>
                        {booking.scheduledAt ? formatDate(booking.scheduledAt) : 'Not scheduled'}
                      </td>
                      <td>
                        {booking.scheduledAt ? formatTime(booking.scheduledAt) : '-'}
                      </td>
                      <td>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: '600', color: '#059669' }}>
                            {booking.attemptsUsed || 0}/{booking.attemptsAllowed || 1}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {booking.attemptsUsed >= (booking.attemptsAllowed || 1) ? 'No attempts left' : 'Attempts remaining'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                          {booking.status === 'COMPLETED' ? '✅ COMPLETED' :
                           booking.status === 'CONFIRMED' ? '✅ CONFIRMED' :
                           booking.status === 'PENDING' ? '⏳ PENDING' :
                           booking.status === 'CANCELLED' ? '❌ CANCELLED' :
                           booking.status === 'SCHEDULED' ? '📅 SCHEDULED' : booking.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          booking.payment?.status === 'PAID' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {booking.payment?.status || 'PENDING'}
                        </span>
                      </td>
                      <td>
                        <div className="data-table-actions-cell">
                          {booking.status === 'PENDING' && (
                            <>
                              <button 
                                className="btn btn-success" 
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                              >
                                ✅ Confirm
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={() => handleCancelBooking(booking.id)}
                              >
                                🗑️ Cancel
                              </button>
                            </>
                          )}
                          {booking.status === 'CONFIRMED' && (
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              onClick={() => handleStatusUpdate(booking.id, 'SCHEDULED')}
                            >
                              📅 Schedule
                            </button>
                          )}
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            👁️ View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.total > 0 && (
              <div className="pagination-container" style={{ marginTop: '20px', textAlign: 'center' }}>
                <div className="pagination-info">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
                </div>
                <div className="pagination-controls" style={{ marginTop: '10px' }}>
                  <button 
                    className="btn btn-secondary" 
                    disabled={!pagination.hasPrev}
                    onClick={() => handleFilterChange('page', pagination.page - 1)}
                  >
                    Previous
                  </button>
                  <span style={{ margin: '0 10px' }}>
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button 
                    className="btn btn-secondary" 
                    disabled={!pagination.hasNext}
                    onClick={() => handleFilterChange('page', pagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Schedule Test Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
                Schedule Test for User
              </h2>
              <button 
                onClick={() => setShowScheduleModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Select User *</label>
                <select
                  className="form-select"
                  value={scheduleData.userId}
                  onChange={(e) => setScheduleData({ ...scheduleData, userId: e.target.value })}
                  required
                >
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Select Test *</label>
                <select
                  className="form-select"
                  value={scheduleData.examId}
                  onChange={(e) => setScheduleData({ ...scheduleData, examId: e.target.value })}
                  required
                >
                  <option value="">Choose a test...</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} - {exam.examCategory?.name} (${exam.price})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={scheduleData.scheduledAt}
                  onChange={(e) => setScheduleData({ ...scheduleData, scheduledAt: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Number of Attempts Allowed *</label>
                <select
                  className="form-select"
                  value={scheduleData.attemptsAllowed}
                  onChange={(e) => setScheduleData({ ...scheduleData, attemptsAllowed: parseInt(e.target.value) })}
                  required
                >
                  <option value={1}>1 Attempt</option>
                  <option value={2}>2 Attempts</option>
                  <option value={3}>3 Attempts</option>
                  <option value={4}>4 Attempts</option>
                  <option value={5}>5 Attempts</option>
                  <option value={6}>6 Attempts</option>
                  <option value={7}>7 Attempts</option>
                  <option value={8}>8 Attempts</option>
                  <option value={9}>9 Attempts</option>
                  <option value={10}>10 Attempts</option>
                </select>
                <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  The user will be able to take this exam up to {scheduleData.attemptsAllowed} time{scheduleData.attemptsAllowed > 1 ? 's' : ''}
                </small>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-input"
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                  placeholder="Any special notes or requirements..."
                  rows="3"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowScheduleModal(false)}
                disabled={createBookingMutation.isPending}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleConfirmScheduling}
                disabled={createBookingMutation.isPending}
              >
                {createBookingMutation.isPending ? 'Scheduling...' : 'Schedule Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {showBill && (
        <BillModal
          bill={currentBill}
          onClose={handleCloseBill}
          onPrint={() => {
            handleCloseBill();
            // Refresh the bookings list to show updated status
            queryClient.invalidateQueries(['admin-bookings']);
            toast.success('Payment processed and bill printed successfully!');
          }}
        />
      )}
    </div>
  );
};

export default TestBookings; 