const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const questionRandomizationService = require('./questionRandomizationService');

const prisma = new PrismaClient();

class ExamService {
  /**
   * Create new exam
   */
  async createExam(examData, createdBy) {
    try {
      const {
        title,
        description,
        examCategoryId,
        duration,
        totalMarks,
        passingMarks,
        price,
        isPublic = false,
        isActive = true,
        instructions,
        rules,
        startDate,
        endDate,
        maxAttempts = 1,
        retakeDelay = 0,
        questionCount,
        difficultyDistribution
      } = examData;

      // Validate exam category exists
      const category = await prisma.examCategory.findUnique({
        where: { id: examCategoryId }
      });

      if (!category) {
        return { success: false, message: 'Exam category not found' };
      }

      // Create exam
      const exam = await prisma.exam.create({
        data: {
          title,
          description,
          examCategoryId,
          duration,
          totalMarks,
          passingMarks,
          price,
          isPublic,
          isActive,
          instructions,
          rules,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          maxAttempts,
          retakeDelay,
          questionCount,
          difficultyDistribution,
          createdBy
        },
        include: {
          examCategory: {
            select: { name: true, color: true }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: createdBy,
          action: 'EXAM_CREATED',
          resource: 'EXAM',
          resourceId: exam.id,
          details: {
            examTitle: exam.title,
            category: category.name,
            price: exam.price
          },
          ipAddress: 'system',
          userAgent: 'exam-service'
        }
      });

      return { success: true, exam };
    } catch (error) {
      logger.error('Create exam failed', error);
      return { success: false, message: 'Failed to create exam' };
    }
  }

  /**
   * Get all exams with filters
   */
  async getAllExams(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        categoryId,
        isActive,
        isPublic,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const where = {};

      if (categoryId) where.examCategoryId = categoryId;
      if (isActive !== undefined) where.isActive = isActive;
      if (isPublic !== undefined) where.isPublic = isPublic;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }



      const [exams, total] = await Promise.all([
        prisma.exam.findMany({
          where,
          include: {
            examCategory: {
              select: { name: true, color: true }
            },
            _count: {
              select: { attempts: true, bookings: true }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        prisma.exam.count({ where })
      ]);

      return {
        success: true,
        exams,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get all exams failed', error);
      return { success: false, message: 'Failed to get exams' };
    }
  }

  /**
   * Get exam by ID
   */
  async getExamById(examId) {
    try {
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
          examCategory: {
            select: { name: true, color: true, description: true }
          },
          _count: {
            select: { attempts: true, bookings: true }
          }
        }
      });

      if (!exam) {
        return { success: false, message: 'Exam not found' };
      }

      // Get questions for this exam category
      const questions = await prisma.question.findMany({
        where: {
          examCategoryId: exam.examCategoryId,
          isActive: true,
          isPublic: true
        },
        include: {
          options: {
            select: {
              id: true,
              text: true,
              isCorrect: true
            }
          },
          images: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return { success: true, exam: { ...exam, questions } };
    } catch (error) {
      logger.error('Get exam by ID failed', error);
      return { success: false, message: 'Failed to get exam' };
    }
  }

  /**
   * Update exam
   */
  async updateExam(examId, updateData, updatedBy) {
    try {
      const exam = await prisma.exam.findUnique({
        where: { id: examId }
      });

      if (!exam) {
        return { success: false, message: 'Exam not found' };
      }

      const updatedExam = await prisma.exam.update({
        where: { id: examId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          examCategory: {
            select: { name: true, color: true }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: updatedBy,
          action: 'EXAM_UPDATED',
          resource: 'EXAM',
          resourceId: examId,
          details: {
            examTitle: updatedExam.title,
            changes: updateData
          },
          ipAddress: 'system',
          userAgent: 'exam-service'
        }
      });

      return { success: true, exam: updatedExam };
    } catch (error) {
      logger.error('Update exam failed', error);
      return { success: false, message: 'Failed to update exam' };
    }
  }

  /**
   * Delete exam
   */
  async deleteExam(examId, deletedBy) {
    try {
      const exam = await prisma.exam.findUnique({
        where: { id: examId }
      });

      if (!exam) {
        return { success: false, message: 'Exam not found' };
      }

      // Check if exam has attempts
      const attemptCount = await prisma.examAttempt.count({
        where: { examId }
      });

      if (attemptCount > 0) {
        return { success: false, message: 'Cannot delete exam with existing attempts' };
      }

      await prisma.exam.delete({
        where: { id: examId }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: deletedBy,
          action: 'EXAM_DELETED',
          resource: 'EXAM',
          resourceId: examId,
          details: {
            examTitle: exam.title
          },
          ipAddress: 'system',
          userAgent: 'exam-service'
        }
      });

      return { success: true, message: 'Exam deleted successfully' };
    } catch (error) {
      logger.error('Delete exam failed', error);
      return { success: false, message: 'Failed to delete exam' };
    }
  }

  /**
   * Start exam attempt
   */
  async startExamAttempt(examId, userId) {
    try {
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
          examCategory: true
        }
      });

      if (!exam) {
        return { success: false, message: 'Exam not found' };
      }

      if (!exam.isActive) {
        return { success: false, message: 'Exam is not active' };
      }

      // Check if user has already reached max attempts
      const attemptCount = await prisma.examAttempt.count({
        where: {
          examId,
          userId,
          status: { in: ['IN_PROGRESS', 'COMPLETED'] }
        }
      });

      if (attemptCount >= exam.maxAttempts) {
        return { success: false, message: 'Maximum attempts reached for this exam' };
      }

      // Get questions for this exam category
      logger.info('Getting questions for exam category', {
        examId,
        userId,
        examCategoryId: exam.examCategoryId
      });
      
      const questions = await prisma.question.findMany({
        where: {
          examCategoryId: exam.examCategoryId,
          isActive: true,
          isPublic: true
        },
        include: {
          options: {
            select: {
              id: true,
              text: true,
              isCorrect: true
            }
          },
          images: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      logger.info('Questions found', {
        examId,
        questionsCount: questions.length
      });

      // Create exam attempt
      const attempt = await prisma.examAttempt.create({
        data: {
          examId,
          userId,
          status: 'IN_PROGRESS'
        }
      });

      return {
        success: true,
        attempt: {
          id: attempt.id,
          duration: exam.duration,
          totalQuestions: questions.length
        },
        questions,
        exam: {
          id: exam.id,
          title: exam.title,
          duration: exam.duration,
          totalQuestions: questions.length,
          instructions: exam.instructions,
          rules: exam.rules
        }
      };
    } catch (error) {
      logger.error('Start exam attempt failed', error);
      return { success: false, message: 'Failed to start exam attempt' };
    }
  }

  /**
   * Submit question response
   */
  async submitQuestionResponse(attemptId, questionId, selectedOptions, timeSpent, userId) {
    try {
      const attempt = await prisma.examAttempt.findUnique({
        where: { id: attemptId },
        include: { exam: true }
      });

      if (!attempt) {
        return { success: false, message: 'Attempt not found' };
      }

      if (attempt.userId !== userId) {
        return { success: false, message: 'Unauthorized' };
      }

      if (attempt.status !== 'IN_PROGRESS') {
        return { success: false, message: 'Attempt is not in progress' };
      }

      // Get the question to check if the answer is correct
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { options: true }
      });

      if (!question) {
        return { success: false, message: 'Question not found' };
      }

      // Check if the answer is correct
      const isCorrect = this.checkAnswer(question, selectedOptions);

      // Create or update question response
      const response = await prisma.questionResponse.upsert({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId
          }
        },
        update: {
          selectedOptions,
          timeSpent,
          isCorrect,
          answeredAt: new Date()
        },
        create: {
          attemptId,
          questionId,
          userId,
          selectedOptions,
          timeSpent,
          isCorrect,
          answeredAt: new Date()
        }
      });

      return { success: true, response };
    } catch (error) {
      logger.error('Submit question response failed', error);
      return { success: false, message: 'Failed to submit response' };
    }
  }

  /**
   * Complete exam attempt
   */
  async completeExamAttempt(attemptId, userId) {
    try {
      logger.info('Starting completeExamAttempt', { attemptId, userId });
      
      const attempt = await prisma.examAttempt.findUnique({
        where: { id: attemptId },
        include: {
          exam: true,
          responses: {
            include: { question: true }
          }
        }
      });

      if (!attempt) {
        logger.error('Attempt not found', { attemptId });
        return { success: false, message: 'Attempt not found' };
      }

      if (attempt.userId !== userId) {
        logger.error('Unauthorized attempt completion', { attemptId, userId, attemptUserId: attempt.userId });
        return { success: false, message: 'Unauthorized' };
      }

      if (attempt.status !== 'IN_PROGRESS') {
        logger.error('Attempt is not in progress', { attemptId, status: attempt.status });
        return { success: false, message: 'Attempt is not in progress' };
      }

      // Calculate score
      let correctAnswers = 0;
      let totalScore = 0;
      const totalQuestions = attempt.responses.length;

      logger.info('Calculating score', { 
        totalQuestions, 
        responsesCount: attempt.responses.length 
      });

      for (const response of attempt.responses) {
        logger.info('Processing response', { 
          questionId: response.questionId, 
          isCorrect: response.isCorrect,
          selectedOptions: response.selectedOptions 
        });
        
        // Use the isCorrect field from the database response
        if (response.isCorrect) {
          correctAnswers++;
          totalScore += 1; // Each question is worth 1 point
        }
      }

      const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const isPassed = percentage >= (attempt.exam.passingMarks || 50); // Default to 50% if not specified

      logger.info('Score calculation completed', { 
        correctAnswers, 
        totalScore, 
        percentage, 
        isPassed 
      });

      // Update attempt
      logger.info('Updating attempt', { 
        attemptId, 
        totalMarks: totalQuestions, 
        obtainedMarks: totalScore, 
        percentage, 
        isPassed 
      });
      
      const updatedAttempt = await prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalMarks: totalQuestions,
          obtainedMarks: totalScore,
          percentage,
          isPassed
        }
      });

      logger.info('Attempt updated successfully', { attemptId });

      // Create certificate if passed
      let certificate = null;
      if (isPassed) {
        logger.info('Creating certificate for passed attempt', { attemptId });
        certificate = await prisma.certificate.create({
          data: {
            userId,
            examId: attempt.examId,
            attemptId,
            certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
          }
        });
        logger.info('Certificate created', { certificateId: certificate.id });
      }

      const result = {
        success: true,
        attempt: updatedAttempt,
        certificate,
        results: {
          totalQuestions,
          correctAnswers,
          score: totalScore,
          percentage,
          isPassed
        }
      };

      // Send exam completion notification
      if (global.notificationService && result.success) {
        try {
          await global.notificationService.notifyExamCompleted(result.attempt, result.results);
          logger.info('Exam completion notification sent', { 
            attemptId, 
            userId, 
            score: result.results.percentage 
          });
        } catch (notificationError) {
          logger.error('Failed to send exam completion notification', {
            attemptId,
            userId,
            error: notificationError.message
          });
        }
      }

      logger.info('completeExamAttempt completed successfully', { attemptId });
      return result;
    } catch (error) {
      logger.error('Complete exam attempt failed', { 
        attemptId, 
        userId, 
        error: error.message, 
        stack: error.stack 
      });
      return { success: false, message: 'Failed to complete attempt' };
    }
  }

  /**
   * Check if answer is correct
   */
  checkAnswer(question, selectedOptions) {
    try {
      // Validate inputs
      if (!question || !question.options || !Array.isArray(question.options)) {
        logger.error('Invalid question object in checkAnswer', { question });
        return false;
      }

      if (!selectedOptions || !Array.isArray(selectedOptions)) {
        logger.error('Invalid selectedOptions in checkAnswer', { selectedOptions });
        return false;
      }

      // Get correct option IDs from the question options
      const correctOptionIds = question.options
        .filter(option => option && option.isCorrect)
        .map(option => option.id)
        .sort();
      
      // Sort the selected options for comparison
      const sortedSelectedOptions = selectedOptions.sort();
      
      // Compare the arrays
      return JSON.stringify(sortedSelectedOptions) === JSON.stringify(correctOptionIds);
    } catch (error) {
      logger.error('Error checking answer:', error);
      return false;
    }
  }

  /**
   * Get exam results
   */
  async getExamResults(attemptId, userId) {
    try {
      const attempt = await prisma.examAttempt.findUnique({
        where: { id: attemptId },
        include: {
          exam: {
            include: { examCategory: true }
          },
          responses: {
            include: { question: true }
          },
          certificate: true
        }
      });

      if (!attempt) {
        return { success: false, message: 'Attempt not found' };
      }

      if (attempt.userId !== userId) {
        return { success: false, message: 'Unauthorized' };
      }

      return { success: true, attempt };
    } catch (error) {
      logger.error('Get exam results failed', error);
      return { success: false, message: 'Failed to get results' };
    }
  }

  /**
   * Get user exam history
   */
  async getUserExamHistory(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        examId,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const where = { userId };

      if (examId) where.examId = examId;
      if (status) where.status = status;

      const [attempts, total] = await Promise.all([
        prisma.examAttempt.findMany({
          where,
          include: {
            exam: {
              include: { examCategory: true }
            },
            certificate: true
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        prisma.examAttempt.count({ where })
      ]);

      return {
        success: true,
        attempts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get user exam history failed', error);
      return { success: false, message: 'Failed to get exam history' };
    }
  }

  /**
   * Get available exams for a user
   */
  async getAvailableExamsForUser(userId, options = {}) {
    try {
      const {
        examCategoryId,
        page = 1,
        limit = 10,
        search
      } = options;

      const skip = (page - 1) * limit;
      const where = {
        isActive: true,
        isPublic: true
      };

      if (examCategoryId) where.examCategoryId = examCategoryId;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [exams, total] = await Promise.all([
        prisma.exam.findMany({
          where,
          include: {
            examCategory: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.exam.count({ where })
      ]);

      return {
        success: true,
        exams,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get available exams for user failed', error);
      return { success: false, message: 'Failed to get available exams' };
    }
  }

  /**
   * Get user exam statistics
   */
  async getUserExamStats(userId) {
    try {
      const stats = await prisma.examAttempt.groupBy({
        by: ['status'],
        where: { userId },
        _count: { id: true },
        _avg: { percentage: true, score: true }
      });

      const totalAttempts = await prisma.examAttempt.count({
        where: { userId }
      });

      const passedAttempts = await prisma.examAttempt.count({
        where: { userId, isPassed: true }
      });

      const certificates = await prisma.certificate.count({
        where: { userId, isActive: true }
      });

      return {
        success: true,
        stats: {
          totalAttempts,
          passedAttempts,
          certificates,
          passRate: totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0,
          averageScore: stats.find(s => s.status === 'COMPLETED')?._avg.score || 0,
          averagePercentage: stats.find(s => s.status === 'COMPLETED')?._avg.percentage || 0
        }
      };
    } catch (error) {
      logger.error('Get user exam stats failed', error);
      return { success: false, message: 'Failed to get exam stats' };
    }
  }

  /**
   * Get exam analytics
   */
  async getExamAnalytics(options = {}) {
    try {
      const { examId, startDate, endDate } = options;
      
      // Build where clause
      let whereClause = {};
      
      if (examId) {
        whereClause.examId = examId;
      }
      
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          whereClause.createdAt.lte = new Date(endDate);
        }
      }

      // Get exam attempts analytics
      const [
        totalAttempts,
        completedAttempts,
        passedAttempts,
        averageScore,
        examStats
      ] = await Promise.all([
        // Total attempts
        prisma.examAttempt.count({
          where: whereClause
        }),
        
        // Completed attempts
        prisma.examAttempt.count({
          where: { ...whereClause, status: 'COMPLETED' }
        }),
        
        // Passed attempts
        prisma.examAttempt.count({
          where: { ...whereClause, isPassed: true }
        }),
        
        // Average score
        prisma.examAttempt.aggregate({
          where: { ...whereClause, status: 'COMPLETED' },
          _avg: { percentage: true, obtainedMarks: true, totalMarks: true }
        }),
        
        // Exam-specific stats
        examId ? prisma.exam.findUnique({
          where: { id: examId },
          include: {
            _count: {
              select: {
                attempts: true,
                questions: true
              }
            },
            attempts: {
              where: { status: 'COMPLETED' },
              select: {
                percentage: true,
                obtainedMarks: true,
                totalMarks: true,
                isPassed: true,
                createdAt: true
              }
            }
          }
        }) : null
      ]);

      // Calculate completion rate
      const completionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;
      
      // Calculate pass rate
      const passRate = completedAttempts > 0 ? (passedAttempts / completedAttempts) * 100 : 0;

      // Prepare response
      const analytics = {
        totalAttempts,
        completedAttempts,
        passedAttempts,
        completionRate: Math.round(completionRate * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        averageObtainedMarks: Math.round((averageScore._avg.obtainedMarks || 0) * 100) / 100,
        averageTotalMarks: Math.round((averageScore._avg.totalMarks || 0) * 100) / 100,
        averagePercentage: Math.round((averageScore._avg.percentage || 0) * 100) / 100
      };

      // Add exam-specific data if requested
      if (examStats && examId) {
        analytics.examDetails = {
          id: examStats.id,
          title: examStats.title,
          totalQuestions: examStats._count.questions,
          totalAttempts: examStats._count.attempts,
          recentAttempts: examStats.attempts.slice(-10) // Last 10 attempts
        };
      }

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      logger.error('Get exam analytics failed', error);
      return { success: false, message: 'Failed to get exam analytics' };
    }
  }
}

module.exports = new ExamService(); 