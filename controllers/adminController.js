const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');
const AdminService = require('../services/adminService');
const UserService = require('../services/userService');
const examService = require('../services/examService');
const examBookingService = require('../services/examBookingService');
const QuestionService = require('../services/questionService');
const AnalyticsService = require('../services/analyticsService');
const FileUploadService = require('../services/fileUploadService');
const { validateUserCreation, validateUserUpdate, validateBulkUserImport } = require('../validators/adminValidator');

const prisma = new PrismaClient();
const adminService = new AdminService();
const userService = new UserService();
const questionService = new QuestionService();
const analyticsService = new AnalyticsService();
const fileUploadService = new FileUploadService();

class AdminController {
  /**
   * Get admin dashboard statistics
   */
  async getDashboardStats(req, res) {
    try {
      const stats = await adminService.getDashboardStatistics();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get dashboard stats failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get dashboard statistics'
        }
      });
    }
  }

  // ========================================
  // USER MANAGEMENT
  // ========================================

  /**
   * Create new user (admin only)
   */
  async createUser(req, res) {
    try {
      const { error, value } = validateUserCreation(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.details
          }
        });
      }

      const result = await userService.createUser(value, req.user.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user: result.user }
      });
    } catch (error) {
      logger.error('Create user failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create user'
        }
      });
    }
  }

  /**
   * Get all users with pagination and filters
   */
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, role, isActive, search, sortBy, sortOrder } = req.query;

      const queryOptions = {
        page: parseInt(page),
        limit: parseInt(limit),
        role,
        search,
        sortBy,
        sortOrder
      };

      // Only add isActive if it's provided
      if (isActive !== undefined) {
        queryOptions.isActive = isActive === 'true';
      }

      const result = await userService.getAllUsers(queryOptions);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get all users failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get users'
        }
      });
    }
  }

  /**
   * Get user details
   */
  async getUserDetails(req, res) {
    try {
      const { userId } = req.params;

      const user = await userService.getUserDetails(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'User not found'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Get user details failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get user details'
        }
      });
    }
  }

  /**
   * Update user
   */
  async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const { error, value } = validateUserUpdate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.details
          }
        });
      }

      const result = await userService.updateUser(userId, value, req.user.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: { user: result.user }
      });
    } catch (error) {
      logger.error('Update user failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update user'
        }
      });
    }
  }

  /**
   * Deactivate/Activate user
   */
  async toggleUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { isActive, reason } = req.body;

      const result = await userService.toggleUserStatus(userId, isActive, reason, req.user.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: { user: result.user }
      });
    } catch (error) {
      logger.error('Toggle user status failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update user status'
        }
      });
    }
  }

  /**
   * Bulk import users
   */
  async bulkImportUsers(req, res) {
    try {
      const { error, value } = validateBulkUserImport(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.details
          }
        });
      }

      const result = await userService.bulkImportUsers(value.users, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Bulk import completed',
        data: result
      });
    } catch (error) {
      logger.error('Bulk import users failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to import users'
        }
      });
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(req, res) {
    try {
      const { startDate, endDate, role } = req.query;

      const analytics = await analyticsService.getUserAnalytics({
        startDate,
        endDate,
        role
      });

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Get user analytics failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get user analytics'
        }
      });
    }
  }

  // ========================================
  // EXAM CATEGORY MANAGEMENT
  // ========================================

  /**
   * Create exam category
   */
  async createExamCategory(req, res) {
    try {
      const { name, description, icon, color, sortOrder } = req.body;

      const category = await prisma.examCategory.create({
        data: {
          name,
          description,
          icon,
          color,
          sortOrder: sortOrder || 0
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'EXAM_CATEGORY_CREATED',
          resource: 'EXAM_CATEGORY',
          resourceId: category.id,
          details: { categoryName: name },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.status(201).json({
        success: true,
        message: 'Exam category created successfully',
        data: { category }
      });
    } catch (error) {
      logger.error('Create exam category failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create exam category'
        }
      });
    }
  }

  /**
   * Get all exam categories
   */
  async getAllExamCategories(req, res) {
    try {
      const { isActive } = req.query;

      const where = {};
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const categories = await prisma.examCategory.findMany({
        where,
        include: {
          _count: {
            select: {
              exams: true,
              questions: true
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      });

      res.status(200).json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      logger.error('Get exam categories failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get exam categories'
        }
      });
    }
  }

  /**
   * Update exam category
   */
  async updateExamCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const { name, description, icon, color, sortOrder, isActive } = req.body;

      const category = await prisma.examCategory.update({
        where: { id: categoryId },
        data: {
          name,
          description,
          icon,
          color,
          sortOrder,
          isActive
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'EXAM_CATEGORY_UPDATED',
          resource: 'EXAM_CATEGORY',
          resourceId: categoryId,
          details: { categoryName: name },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.status(200).json({
        success: true,
        message: 'Exam category updated successfully',
        data: { category }
      });
    } catch (error) {
      logger.error('Update exam category failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update exam category'
        }
      });
    }
  }

  /**
   * Delete exam category
   */
  async deleteExamCategory(req, res) {
    try {
      const { categoryId } = req.params;

      // Check if category has exams or questions
      const category = await prisma.examCategory.findUnique({
        where: { id: categoryId },
        include: {
          _count: {
            select: {
              exams: true,
              questions: true
            }
          }
        }
      });

      if (category._count.exams > 0 || category._count.questions > 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Cannot delete category with existing exams or questions'
          }
        });
      }

      await prisma.examCategory.delete({
        where: { id: categoryId }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'EXAM_CATEGORY_DELETED',
          resource: 'EXAM_CATEGORY',
          resourceId: categoryId,
          details: { categoryName: category.name },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.status(200).json({
        success: true,
        message: 'Exam category deleted successfully'
      });
    } catch (error) {
      logger.error('Delete exam category failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete exam category'
        }
      });
    }
  }

  // ========================================
  // QUESTION MANAGEMENT
  // ========================================

  /**
   * Create new question
   */
  async createQuestion(req, res) {
    try {
      let questionData;
      let images = [];

      // Handle FormData if present (for file uploads)
      if (req.body.questionData) {
        try {
          questionData = JSON.parse(req.body.questionData);
        } catch (parseError) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Invalid question data format'
            }
          });
        }
      } else {
        questionData = req.body;
      }

      // Handle file uploads if present
      if (req.files && req.files.length > 0) {
        try {
          // Process uploaded images
          const uploadedImages = await fileUploadService.uploadQuestionImages(req.files, null);
          images = uploadedImages;
        } catch (uploadError) {
          logger.error('Image upload failed', uploadError);
          return res.status(400).json({
            success: false,
            error: {
              message: 'Failed to upload images',
              details: uploadError.message
            }
          });
        }
      }

      // Add images to question data
      questionData.images = images;

      const result = await questionService.createQuestion(questionData, req.user.id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || 'Failed to create question',
          error: result.error
        });
      }

      res.status(201).json({
        success: true,
        message: 'Question created successfully',
        data: { question: result.question }
      });
    } catch (error) {
      logger.error('Create question failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create question'
        }
      });
    }
  }

  /**
   * Bulk create questions
   */
  async bulkCreateQuestions(req, res) {
    try {
      const { questions } = req.body;

      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Questions must be a non-empty array'
          }
        });
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const questionData of questions) {
        try {
          const result = await questionService.createQuestion(questionData, req.user.id);
          if (result.success) {
            successCount++;
            results.push({ success: true, question: result.question });
          } else {
            errorCount++;
            results.push({ success: false, error: result.message });
          }
        } catch (error) {
          errorCount++;
          results.push({ success: false, error: error.message });
        }
      }

      res.status(200).json({
        success: true,
        message: `Bulk operation completed. ${successCount} questions created successfully, ${errorCount} failed.`,
        data: {
          createdCount: successCount,
          errorCount,
          results
        }
      });
    } catch (error) {
      logger.error('Bulk create questions failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create questions'
        }
      });
    }
  }

  /**
   * Get all questions with filters
   */
  async getAllQuestions(req, res) {
    try {
      const { page = 1, limit = 20, examCategoryId, difficulty, type, isActive, search } = req.query;

      const questions = await questionService.getAllQuestions({
        page: parseInt(page),
        limit: parseInt(limit),
        examCategoryId,
        difficulty,
        type,
        isActive: isActive === 'true' ? true : (isActive === 'false' ? false : true), // Default to true
        search
      });

      res.status(200).json({
        success: true,
        data: questions
      });
    } catch (error) {
      logger.error('Get all questions failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get questions'
        }
      });
    }
  }

  /**
   * Update question
   */
  async updateQuestion(req, res) {
    try {
      const { questionId } = req.params;

      const result = await questionService.updateQuestion(questionId, req.body, req.user.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Question updated successfully',
        data: { question: result.question }
      });
    } catch (error) {
      logger.error('Update question failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update question'
        }
      });
    }
  }

  /**
   * Delete question
   */
  async deleteQuestion(req, res) {
    try {
      const { questionId } = req.params;

      const result = await questionService.deleteQuestion(questionId, req.user.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error) {
      logger.error('Delete question failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete question'
        }
      });
    }
  }

  /**
   * Bulk import questions
   */
  async bulkImportQuestions(req, res) {
    try {
      const result = await questionService.bulkImportQuestions(req.body.questions, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Questions imported successfully',
        data: result
      });
    } catch (error) {
      logger.error('Bulk import questions failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to import questions'
        }
      });
    }
  }

  /**
   * Get question analytics
   */
  async getQuestionAnalytics(req, res) {
    try {
      const { examCategoryId, startDate, endDate } = req.query;

      const analytics = await questionService.getQuestionAnalytics({
        examCategoryId,
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Get question analytics failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get question analytics'
        }
      });
    }
  }

  // ========================================
  // EXAM MANAGEMENT
  // ========================================

  /**
   * Create exam
   */
  async createExam(req, res) {
    try {
      // Validate exam data
      const { validateExamCreation } = require('../validators/examValidator');
      const { error, value } = validateExamCreation(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.details
          }
        });
      }

      const result = await examService.createExam(value, req.user.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        message: 'Exam created successfully',
        data: { exam: result.exam }
      });
    } catch (error) {
      logger.error('Create exam failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create exam'
        }
      });
    }
  }

  /**
   * Get all exams with filters
   */
  async getAllExams(req, res) {
    try {
      const { page = 1, limit = 20, examCategoryId, isActive, isPublic, search } = req.query;

      const exams = await examService.getAllExams({
        page: parseInt(page),
        limit: parseInt(limit),
        categoryId: examCategoryId,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        isPublic: isPublic !== undefined ? isPublic === 'true' : undefined,
        search
      });

      res.status(200).json({
        success: true,
        data: exams
      });
    } catch (error) {
      logger.error('Get all exams failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get exams'
        }
      });
    }
  }

  /**
   * Get exam details (admin)
   */
  async getExamDetails(req, res) {
    try {
      const { examId } = req.params;

      const result = await examService.getExamById(examId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: {
            message: result.message || 'Exam not found'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { exam: result.exam }
      });
    } catch (error) {
      logger.error('Get exam details failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get exam details'
        }
      });
    }
  }

  /**
   * Update exam
   */
  async updateExam(req, res) {
    try {
      const { examId } = req.params;

      // Validate exam update data
      const { validateExamUpdate } = require('../validators/examValidator');
      const { error, value } = validateExamUpdate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.details
          }
        });
      }

      const result = await examService.updateExam(examId, value, req.user.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Exam updated successfully',
        data: { exam: result.exam }
      });
    } catch (error) {
      logger.error('Update exam failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update exam'
        }
      });
    }
  }

  /**
   * Delete exam
   */
  async deleteExam(req, res) {
    try {
      const { examId } = req.params;

      const result = await examService.deleteExam(examId, req.user.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Exam deleted successfully'
      });
    } catch (error) {
      logger.error('Delete exam failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete exam'
        }
      });
    }
  }

  /**
   * Approve exam
   */
  async approveExam(req, res) {
    try {
      const { examId } = req.params;
      const approvedBy = req.user.id;

      const result = await examService.approveExam(examId, approvedBy);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Exam approved successfully',
        data: { exam: result.exam }
      });
    } catch (error) {
      logger.error('Approve exam failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to approve exam'
        }
      });
    }
  }

  /**
   * Revoke exam approval
   */
  async revokeExamApproval(req, res) {
    try {
      const { examId } = req.params;
      const revokedBy = req.user.id;

      const result = await examService.revokeExamApproval(examId, revokedBy);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Exam approval revoked successfully',
        data: { exam: result.exam }
      });
    } catch (error) {
      logger.error('Revoke exam approval failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to revoke exam approval'
        }
      });
    }
  }

  /**
   * Approve booking for exam start
   */
  async approveBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const approvedBy = req.user.id;

      console.log('Admin Controller: Approving booking:', bookingId, 'by user:', approvedBy);
      const result = await examBookingService.approveBooking(bookingId, approvedBy);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Booking approved successfully',
        data: { booking: result.booking }
      });
    } catch (error) {
      logger.error('Approve booking failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to approve booking'
        }
      });
    }
  }

  /**
   * Revoke booking approval
   */
  async revokeBookingApproval(req, res) {
    try {
      const { bookingId } = req.params;
      const revokedBy = req.user.id;

      const result = await examBookingService.revokeBookingApproval(bookingId, revokedBy);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Booking approval revoked successfully',
        data: { booking: result.booking }
      });
    } catch (error) {
      logger.error('Revoke booking approval failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to revoke booking approval'
        }
      });
    }
  }

  /**
   * Get exam analytics
   */
  async getExamAnalytics(req, res) {
    try {
      const { examId, startDate, endDate } = req.query;

      const analytics = await examService.getExamAnalytics({
        examId,
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Get exam analytics failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get exam analytics'
        }
      });
    }
  }

  /**
   * Add question to exam
   */
  async addQuestionToExam(req, res) {
    try {
      const { examId } = req.params;
      const { questionId } = req.body;

      if (!questionId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Question ID is required'
          }
        });
      }

      const result = await examService.addQuestionToExam(examId, questionId, req.user.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Question added to exam successfully',
        data: result.data
      });
    } catch (error) {
      logger.error('Add question to exam failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to add question to exam'
        }
      });
    }
  }

  // ========================================
  // SYSTEM ADMINISTRATION
  // ========================================

  /**
   * Get system health
   */
  async getSystemHealth(req, res) {
    try {
      const health = await adminService.getSystemHealth();

      res.status(200).json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Get system health failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get system health'
        }
      });
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(req, res) {
    try {
      const { page = 1, limit = 50, userId, action, resource, startDate, endDate } = req.query;

      const logs = await adminService.getAuditLogs({
        page: parseInt(page),
        limit: parseInt(limit),
        userId,
        action,
        resource,
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      logger.error('Get audit logs failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get audit logs'
        }
      });
    }
  }

  /**
   * Get system analytics
   */
  async getSystemAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const analytics = await analyticsService.getSystemAnalytics({
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Get system analytics failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get system analytics'
        }
      });
    }
  }

  async bulkBookExamForAllUsers(req, res) {
    try {
      const { examId } = req.params;
      const { scheduledAt, confirm = false, notes } = req.body || {};
      const result = await examBookingService.createBookingsForAllUsers(examId, {
        scheduledAt,
        confirm: Boolean(confirm),
        notes,
        createdBy: req.user?.id || 'system'
      });
      const status = result.success ? 200 : 400;
      return res.status(status).json({ success: result.success, ...result });
    } catch (error) {
      logger.error('Bulk book exam for all users failed', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  /**
   * Export data
   */
  async exportData(req, res) {
    try {
      const { type, format, filters } = req.body;

      const result = await adminService.exportData(type, format, filters);

      res.status(200).json({
        success: true,
        message: 'Data exported successfully',
        data: result
      });
    } catch (error) {
      logger.error('Export data failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to export data'
        }
      });
    }
  }

  /**
   * Backup system
   */
  async backupSystem(req, res) {
    try {
      const result = await adminService.createSystemBackup();

      res.status(200).json({
        success: true,
        message: 'System backup created successfully',
        data: result
      });
    } catch (error) {
      logger.error('System backup failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create system backup'
        }
      });
    }
  }

  /**
   * Test essay scoring system
   */
  async testEssayScoring(req, res) {
    try {
      const { studentAnswer, correctAnswer, maxMarks, questionData } = req.body;

      if (!studentAnswer || !correctAnswer || !maxMarks) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Student answer, correct answer, and max marks are required'
          }
        });
      }

      const EssayScoringService = require('../services/essayScoringService');
      const essayScoringService = new EssayScoringService();

      const result = await essayScoringService.scoreEssay(
        studentAnswer,
        correctAnswer,
        maxMarks,
        questionData || {}
      );

      res.status(200).json({
        success: true,
        message: 'Essay scored successfully',
        data: result
      });
    } catch (error) {
      logger.error('Essay scoring test failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to score essay'
        }
      });
    }
  }

  // ========================================
  // REPORTS
  // ========================================

  /**
   * Get per-student per-exam scores (latest completed attempt per exam)
   */
  async getStudentExamScores(req, res) {
    try {
      const { startDate, endDate, examCategoryId } = req.query;

      // Fetch students
      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, firstName: true, lastName: true, email: true }
      });

      // Fetch exams (optionally filtered by category)
      const exams = await prisma.exam.findMany({
        where: examCategoryId ? { examCategoryId } : undefined,
        select: { id: true, title: true }
      });

      if (students.length === 0 || exams.length === 0) {
        return res.status(200).json({
          success: true,
          data: { students, exams, scores: [] }
        });
      }

      // Fetch attempts within optional date range and for target exams
      const attempts = await prisma.examAttempt.findMany({
        where: {
          status: 'COMPLETED',
          examId: { in: exams.map(e => e.id) },
          ...(startDate || endDate
            ? { completedAt: { gte: startDate ? new Date(startDate) : undefined, lte: endDate ? new Date(endDate) : undefined } }
            : {})
        },
        select: {
          id: true,
          userId: true,
          examId: true,
          obtainedMarks: true,
          totalMarks: true,
          percentage: true,
          completedAt: true
        },
        orderBy: { completedAt: 'desc' }
      });

      // Reduce to latest attempt per (userId, examId)
      const latestByPair = new Map();
      for (const a of attempts) {
        const key = `${a.userId}:${a.examId}`;
        if (!latestByPair.has(key)) {
          latestByPair.set(key, a);
        }
      }

      const scores = Array.from(latestByPair.values()).map(a => ({
        userId: a.userId,
        examId: a.examId,
        obtainedMarks: a.obtainedMarks,
        totalMarks: a.totalMarks,
        percentage: a.percentage,
        completedAt: a.completedAt
      }));

      return res.status(200).json({
        success: true,
        data: { students, exams, scores }
      });
    } catch (error) {
      logger.error('Get student exam scores failed', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch student exam scores',
        error: error?.message
      });
    }
  }
}

module.exports = new AdminController(); 
