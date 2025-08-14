const express = require('express');
const examBookingController = require('../controllers/examBookingController');
const calendarController = require('../controllers/calendarController');
const { auth, studentOnly, adminOnly, adminOrModerator } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Admin routes (must come BEFORE student routes to avoid conflicts)
router.get('/admin/all', adminOrModerator, examBookingController.getAllBookings);
router.post('/admin/create', adminOrModerator, examBookingController.createBookingForUser);
router.patch('/admin/:bookingId/status', adminOrModerator, examBookingController.updateBookingStatus);
router.get('/admin/analytics', adminOrModerator, examBookingController.getBookingAnalytics);

// Calendar routes for admins/moderators
router.get('/admin/calendar', adminOrModerator, calendarController.getCalendarBookings);
router.get('/admin/calendar/overview', adminOrModerator, calendarController.getCalendarOverview);
router.get('/admin/calendar/stats', adminOrModerator, calendarController.getCalendarStats);
router.get('/admin/calendar/weekly/:date', adminOrModerator, calendarController.getWeeklyCalendar);
router.get('/admin/calendar/monthly/:date', adminOrModerator, calendarController.getMonthlyCalendar);
router.get('/admin/calendar/availability/:date', adminOrModerator, calendarController.getDateAvailability);
router.get('/admin/calendar/categories', adminOrModerator, calendarController.getExamCategories);
router.post('/admin/calendar/conflicts', adminOrModerator, calendarController.checkConflicts);
router.patch('/admin/calendar/:bookingId/reschedule', adminOrModerator, calendarController.rescheduleBooking);
router.patch('/admin/calendar/:bookingId/status', adminOrModerator, calendarController.updateBookingStatus);

// Student routes
router.use(studentOnly);

// Booking management
router.post('/', examBookingController.createBooking);
router.get('/', examBookingController.getUserBookings);
router.get('/stats', examBookingController.getBookingStats);
router.get('/available-exams', examBookingController.getAvailableExams);
router.get('/:bookingId', examBookingController.getBooking);
router.put('/:bookingId', examBookingController.updateBooking);
router.delete('/:bookingId', examBookingController.cancelBooking);

// Exam taking
router.post('/:bookingId/start-exam', examBookingController.startExam);

module.exports = router; 