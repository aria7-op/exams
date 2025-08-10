const express = require('express');
const adminController = require('../controllers/adminController');
const { auth, adminOnly, superAdminOnly, adminOrModerator, adminOrSuperAdmin } = require('../middleware/auth');
const FileUploadService = require('../services/fileUploadService');

const router = express.Router();
const fileUploadService = new FileUploadService();

// All routes require admin or moderator authentication
router.use(auth, adminOrModerator);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// ========================================
// USER MANAGEMENT
// ========================================
router.post('/users', adminController.createUser);
router.get('/users', adminController.getAllUsers);
router.get('/users/analytics', adminController.getUserAnalytics);
router.get('/users/:userId', adminController.getUserDetails);
router.put('/users/:userId', adminController.updateUser);
router.patch('/users/:userId/status', adminOrSuperAdmin, adminController.toggleUserStatus);
router.post('/users/bulk-import', adminOrSuperAdmin, adminController.bulkImportUsers);

// ========================================
// EXAM CATEGORY MANAGEMENT
// ========================================
router.post('/exam-categories', adminController.createExamCategory);
router.get('/exam-categories', adminController.getAllExamCategories);
router.put('/exam-categories/:categoryId', adminController.updateExamCategory);
router.delete('/exam-categories/:categoryId', adminOrSuperAdmin, adminController.deleteExamCategory);

// ========================================
// QUESTION MANAGEMENT
// ========================================
router.post('/questions', fileUploadService.getImageUploadMiddleware().array('images', 5), adminController.createQuestion);
router.get('/questions', adminController.getAllQuestions);
router.put('/questions/:questionId', adminController.updateQuestion);
router.delete('/questions/:questionId', adminOrSuperAdmin, adminController.deleteQuestion);
router.post('/questions/bulk', adminController.bulkCreateQuestions);
router.post('/questions/bulk-import', adminController.bulkImportQuestions);
router.get('/questions/analytics', adminController.getQuestionAnalytics);

// ========================================
// EXAM MANAGEMENT
// ========================================
router.post('/exams', adminOrSuperAdmin, adminController.createExam);
router.get('/exams', adminController.getAllExams);
router.put('/exams/:examId', adminOrSuperAdmin, adminController.updateExam);
router.delete('/exams/:examId', adminOrSuperAdmin, adminController.deleteExam);
router.patch('/exams/:examId/approve', adminOrSuperAdmin, adminController.approveExam);
router.post('/exams/:examId/questions', adminOrSuperAdmin, adminController.addQuestionToExam);
router.get('/exams/analytics', adminController.getExamAnalytics);

// ========================================
// ESSAY TESTING
// ========================================
router.post('/test-essay', adminController.testEssayScoring);

// ========================================
// SYSTEM ADMINISTRATION
// ========================================
router.get('/system/health', adminOrSuperAdmin, adminController.getSystemHealth);
router.get('/system/audit-logs', adminOrSuperAdmin, adminController.getAuditLogs);
router.get('/system/analytics', adminOrSuperAdmin, adminController.getSystemAnalytics);
router.post('/system/export', adminOrSuperAdmin, adminController.exportData);
router.post('/system/backup', superAdminOnly, adminController.backupSystem);

module.exports = router; 