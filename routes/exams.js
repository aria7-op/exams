const express = require('express');
const examController = require('../controllers/examController');
const { auth, studentOnly } = require('../middleware/auth');

const router = express.Router();

// Public routes (no authentication required)
router.get('/categories', examController.getExamCategories);

// Protected routes (require authentication)
router.use(auth);

// Exam browsing and details
router.get('/available', examController.getAvailableExams);
router.get('/upcoming', examController.getUpcomingExams);

// User-specific routes (must come before /:examId routes)
router.get('/history', examController.getUserExamHistory);
router.get('/stats', examController.getUserExamStats);
router.get('/analytics', examController.getUserExamAnalytics);
router.get('/certificates', examController.getUserCertificates);
router.get('/recommendations', examController.getExamRecommendations);

// Exam-specific routes
router.get('/:examId', examController.getExamDetails);

// Exam attempts (student only)
router.use(studentOnly);

// Exam taking
router.post('/:examId/start', examController.startExam);
router.post('/attempts/:attemptId/responses', examController.submitQuestionResponse);
router.post('/attempts/:attemptId/complete', examController.completeExam);
router.get('/attempts/:attemptId', examController.getExamAttempt);
router.post('/attempts/:attemptId/resume', examController.resumeExam);

// Results and history
router.get('/attempts/:attemptId/results', examController.getExamResults);

// Certificates
router.post('/attempts/:attemptId/generate-certificate', examController.generateCertificate);
router.get('/certificates/:certificateId/download', examController.downloadCertificate);
router.post('/certificates/auto-generate', examController.autoGenerateCertificates);

// Leaderboards
router.get('/:examId/leaderboard', examController.getExamLeaderboard);

// Recommendations and progress
router.get('/:examId/progress', examController.getExamProgress);
router.post('/attempts/:attemptId/progress', examController.saveExamProgress);

// Issue reporting
router.post('/attempts/:attemptId/report-issue', examController.reportExamIssue);

module.exports = router; 