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
        categoryId, // Handle both field names
        duration,
        totalMarks,
        totalQuestions, // Handle both field names
        passingMarks,
        passingScore, // Handle both field names
        price,
        currency = 'USD',
        isPublic = false,
        isActive = true,
        allowRetakes = false,
        maxRetakes = 1,
        showResults = true,
        showAnswers = false,
        randomizeQuestions = true,
        randomizeOptions = true,
        questionOverlapPercentage = 10.0,
        instructions,
        rules,
        startDate,
        endDate,
        scheduledStart,
        scheduledEnd,
        // Question type distribution
        essayQuestionsCount = 0,
        multipleChoiceQuestionsCount = 0,
        shortAnswerQuestionsCount = 0,
        fillInTheBlankQuestionsCount = 0,
        trueFalseQuestionsCount = 0,
        matchingQuestionsCount = 0,
        orderingQuestionsCount = 0
      } = examData;

      // Use the correct field names
      const finalExamCategoryId = examCategoryId || categoryId;
      const finalPassingMarks = passingMarks || passingScore;
      const finalScheduledStart = scheduledStart || (startDate ? new Date(startDate) : null);
      const finalScheduledEnd = scheduledEnd || (endDate ? new Date(endDate) : null);

      // Calculate totalQuestions from distribution if not provided
      let finalTotalQuestions = totalQuestions;
      if (!finalTotalQuestions) {
        finalTotalQuestions = essayQuestionsCount + multipleChoiceQuestionsCount + 
                             shortAnswerQuestionsCount + fillInTheBlankQuestionsCount + 
                             trueFalseQuestionsCount + matchingQuestionsCount + 
                             orderingQuestionsCount;
      }

      // Calculate totalMarks if not provided
      let finalTotalMarks = totalMarks;
      if (!finalTotalMarks && finalTotalQuestions) {
        // Default to 2 marks per question if not specified
        finalTotalMarks = finalTotalQuestions * 2;
      }

      // Validate exam category exists
      const category = await prisma.examCategory.findUnique({
        where: { id: finalExamCategoryId }
      });

      if (!category) {
        return { success: false, message: 'Exam category not found' };
      }

      // Validate question distribution if specified
      if (essayQuestionsCount > 0 || multipleChoiceQuestionsCount > 0 || 
          shortAnswerQuestionsCount > 0 || fillInTheBlankQuestionsCount > 0 || 
          trueFalseQuestionsCount > 0 || matchingQuestionsCount > 0 || 
          orderingQuestionsCount > 0) {
        
        logger.info('Validating question distribution before exam creation', {
          examCategoryId: finalExamCategoryId,
          distribution: {
            essay: essayQuestionsCount,
            multipleChoice: multipleChoiceQuestionsCount,
            shortAnswer: shortAnswerQuestionsCount,
            fillInTheBlank: fillInTheBlankQuestionsCount,
            trueFalse: trueFalseQuestionsCount,
            matching: matchingQuestionsCount,
            ordering: orderingQuestionsCount
          }
        });

        try {
          const distributionValidation = await questionRandomizationService.validateQuestionDistribution(
            finalExamCategoryId,
            {
              essayQuestionsCount,
              multipleChoiceQuestionsCount,
              shortAnswerQuestionsCount,
              fillInTheBlankQuestionsCount,
              trueFalseQuestionsCount,
              matchingQuestionsCount,
              orderingQuestionsCount
            }
          );

          if (!distributionValidation.isValid) {
            logger.warn('Question distribution validation failed', distributionValidation);
            
            // Create warning message
            const missingTypes = distributionValidation.missingQuestions.map(m => 
              `${m.type}: need ${m.requested}, have ${m.available}`
            ).join(', ');
            
            return { 
              success: false, 
              message: `Insufficient questions for the requested distribution. ${missingTypes}`,
              details: distributionValidation
            };
          }

          if (distributionValidation.warnings.length > 0) {
            logger.warn('Question distribution warnings', distributionValidation.warnings);
          }

          logger.info('✅ Question distribution validation passed', distributionValidation);
        } catch (validationError) {
          logger.error('Question distribution validation error', validationError);
          return { 
            success: false, 
            message: 'Failed to validate question distribution. Please try again.' 
          };
        }
      }

      // Create exam with all fields
      const exam = await prisma.exam.create({
        data: {
          title,
          description,
          examCategoryId: finalExamCategoryId,
          duration,
          totalMarks: finalTotalMarks,
          passingMarks: finalPassingMarks,
          price,
          currency,
          isPublic,
          isActive,
          allowRetakes,
          maxRetakes,
          showResults,
          showAnswers,
          randomizeQuestions,
          randomizeOptions,
          questionOverlapPercentage,
          instructions,
          rules,
          scheduledStart: finalScheduledStart,
          scheduledEnd: finalScheduledEnd,
          totalQuestions: finalTotalQuestions,
          // Question type distribution
          essayQuestionsCount,
          multipleChoiceQuestionsCount,
          shortAnswerQuestionsCount,
          fillInTheBlankQuestionsCount,
          trueFalseQuestionsCount,
          matchingQuestionsCount,
          orderingQuestionsCount,
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

      // Send notification to all students about the new exam
      try {
        if (global.notificationService) {
          logger.info(`🔔 Attempting to send new exam notification for: ${exam.title}`);
          logger.info(`🔔 Global notification service available: ${!!global.notificationService}`);
          logger.info(`🔔 Notification service methods:`, Object.getOwnPropertyNames(Object.getPrototypeOf(global.notificationService)));
          
          const notificationResult = await global.notificationService.notifyStudentsNewExam(exam);
          logger.info(`🔔 New exam notification result:`, notificationResult);
          
          if (notificationResult.success) {
            logger.info(`✅ Successfully notified ${notificationResult.successCount}/${notificationResult.totalStudents} students about new exam`);
          } else {
            logger.error(`❌ Failed to notify students about new exam:`, notificationResult.error);
          }
        } else {
          logger.warn('❌ Notification service not available for new exam notification');
          logger.warn('🔍 Global object keys:', Object.keys(global));
          logger.warn('🔍 Global notificationService:', global.notificationService);
        }
      } catch (notificationError) {
        // Don't fail exam creation if notification fails
        logger.error('❌ Failed to send new exam notification', notificationError);
        logger.error('❌ Notification error stack:', notificationError.stack);
      }

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

      // Format exam data for frontend - map database fields to frontend expected fields
      const formattedExams = exams.map(exam => ({
        ...exam,
        startDate: exam.scheduledStart,
        endDate: exam.scheduledEnd
      }));

      return {
        success: true,
        exams: formattedExams,
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

      // Format exam data for frontend - map database fields to frontend expected fields
      const formattedExam = {
        ...exam,
        startDate: exam.scheduledStart,
        endDate: exam.scheduledEnd
      };

      return { success: true, exam: { ...formattedExam, questions } };
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
      logger.info('Updating exam', { 
        examId, 
        updateData, 
        updatedBy,
        hasScheduledStart: updateData.scheduledStart !== undefined,
        hasScheduledEnd: updateData.scheduledEnd !== undefined,
        hasStartDate: updateData.startDate !== undefined,
        hasEndDate: updateData.endDate !== undefined
      });
      
      const exam = await prisma.exam.findUnique({
        where: { id: examId }
      });

      if (!exam) {
        return { success: false, message: 'Exam not found' };
      }

      // Process date fields - convert frontend format to backend format
      const processedData = { ...updateData };
      
      // Handle startDate -> scheduledStart conversion (prioritize startDate if both exist)
      if (updateData.startDate !== undefined) {
        logger.info('Processing startDate', { 
          original: updateData.startDate, 
          type: typeof updateData.startDate 
        });
        
        try {
          if (updateData.startDate) {
            const parsedDate = new Date(updateData.startDate);
            if (isNaN(parsedDate.getTime())) {
              logger.error('Invalid startDate format', { startDate: updateData.startDate });
              return { success: false, message: 'Invalid start date format' };
            }
            processedData.scheduledStart = parsedDate;
          } else {
            processedData.scheduledStart = null;
          }
        } catch (dateError) {
          logger.error('Error parsing startDate', { startDate: updateData.startDate, error: dateError });
          return { success: false, message: 'Invalid start date format' };
        }
        
        delete processedData.startDate;
        // Remove scheduledStart if it was also provided to avoid conflicts
        if (updateData.scheduledStart !== undefined) {
          delete processedData.scheduledStart;
        }
        logger.info('Converted startDate to scheduledStart', { 
          scheduledStart: processedData.scheduledStart 
        });
      } else if (updateData.scheduledStart !== undefined) {
        // Handle direct scheduledStart updates only if startDate wasn't provided
        logger.info('Processing scheduledStart', { 
          original: updateData.scheduledStart, 
          type: typeof updateData.scheduledStart 
        });
        
        try {
          if (updateData.scheduledStart) {
            const parsedDate = new Date(updateData.scheduledStart);
            if (isNaN(parsedDate.getTime())) {
              logger.error('Invalid scheduledStart format', { scheduledStart: updateData.scheduledStart });
              return { success: false, message: 'Invalid scheduled start date format' };
            }
            processedData.scheduledStart = parsedDate;
          } else {
            processedData.scheduledStart = null;
          }
        } catch (dateError) {
          logger.error('Error parsing scheduledStart', { scheduledStart: updateData.scheduledStart, error: dateError });
          return { success: false, message: 'Invalid scheduled start date format' };
        }
        
        logger.info('Processed scheduledStart', { 
          scheduledStart: processedData.scheduledStart 
        });
      }
      
      // Handle endDate -> scheduledEnd conversion (prioritize endDate if both exist)
      if (updateData.endDate !== undefined) {
        logger.info('Processing endDate', { 
          original: updateData.endDate, 
          type: typeof updateData.endDate 
        });
        
        try {
          if (updateData.endDate) {
            const parsedDate = new Date(updateData.endDate);
            if (isNaN(parsedDate.getTime())) {
              logger.error('Invalid endDate format', { endDate: updateData.endDate });
              return { success: false, message: 'Invalid end date format' };
            }
            processedData.scheduledEnd = parsedDate;
          } else {
            processedData.scheduledEnd = null;
          }
        } catch (dateError) {
          logger.error('Error parsing endDate', { endDate: updateData.endDate, error: dateError });
          return { success: false, message: 'Invalid end date format' };
        }
        
        delete processedData.endDate;
        // Remove scheduledEnd if it was also provided to avoid conflicts
        if (updateData.scheduledEnd !== undefined) {
          delete processedData.scheduledEnd;
        }
        logger.info('Converted endDate to scheduledEnd', { 
          scheduledEnd: processedData.scheduledEnd 
        });
      } else if (updateData.scheduledEnd !== undefined) {
        // Handle direct scheduledEnd updates only if endDate wasn't provided
        logger.info('Processing scheduledEnd', { 
          original: updateData.scheduledEnd, 
          type: typeof updateData.scheduledEnd 
        });
        
        try {
          if (updateData.scheduledEnd) {
            const parsedDate = new Date(updateData.scheduledEnd);
            if (isNaN(parsedDate.getTime())) {
              logger.error('Invalid scheduledEnd format', { scheduledEnd: updateData.scheduledEnd });
              return { success: false, message: 'Invalid scheduled end date format' };
            }
            processedData.scheduledEnd = parsedDate;
          } else {
            processedData.scheduledEnd = null;
          }
        } catch (dateError) {
          logger.error('Error parsing scheduledEnd', { scheduledEnd: updateData.scheduledEnd, error: dateError });
          return { success: false, message: 'Invalid scheduled end date format' };
        }
        
        logger.info('Processed scheduledEnd', { 
          scheduledEnd: processedData.scheduledEnd 
        });
      }
      
      // Validate that end date is after start date if both are provided
      if (processedData.scheduledStart && processedData.scheduledEnd) {
        if (processedData.scheduledEnd <= processedData.scheduledStart) {
          logger.error('End date must be after start date', { 
            scheduledStart: processedData.scheduledStart, 
            scheduledEnd: processedData.scheduledEnd 
          });
          return { success: false, message: 'End date must be after start date' };
        }
        logger.info('Date validation passed', { 
          scheduledStart: processedData.scheduledStart, 
          scheduledEnd: processedData.scheduledEnd 
        });
      }

      // Add updatedAt timestamp
      processedData.updatedAt = new Date();

      logger.info('Final processed data for update', { 
        processedData,
        scheduledStart: processedData.scheduledStart,
        scheduledEnd: processedData.scheduledEnd,
        scheduledStartType: typeof processedData.scheduledStart,
        scheduledEndType: typeof processedData.scheduledEnd
      });

      const updatedExam = await prisma.exam.update({
        where: { id: examId },
        data: processedData,
        include: {
          examCategory: {
            select: { name: true, color: true }
          }
        }
      });

      logger.info('Exam updated successfully', { 
        examId, 
        updatedExam,
        storedScheduledStart: updatedExam.scheduledStart,
        storedScheduledEnd: updatedExam.scheduledEnd
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
   * Start exam attempt for a user
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

      if (attemptCount >= exam.maxRetakes) {
        return { success: false, message: 'Maximum attempts reached for this exam' };
      }

      // Get questions using the question randomization service with proper distribution
      logger.info('Getting questions for exam with distribution', {
        examId,
        userId,
        examCategoryId: exam.examCategoryId,
        totalQuestions: exam.totalQuestions,
        questionDistribution: {
          essay: exam.essayQuestionsCount,
          multipleChoice: exam.multipleChoiceQuestionsCount,
          shortAnswer: exam.shortAnswerQuestionsCount,
          fillInTheBlank: exam.fillInTheBlankQuestionsCount,
          trueFalse: exam.trueFalseQuestionsCount,
          matching: exam.matchingQuestionsCount,
          ordering: exam.orderingQuestionsCount
        }
      });
      
      // Use the question randomization service to get questions with proper distribution
      const questions = await questionRandomizationService.generateRandomQuestions({
        examId,
        userId,
        questionCount: exam.totalQuestions || 10,
        examCategoryId: exam.examCategoryId,
        overlapPercentage: exam.questionOverlapPercentage || 10.0,
        // Pass the exact question type distribution from the exam
        essayQuestionsCount: exam.essayQuestionsCount || 0,
        multipleChoiceQuestionsCount: exam.multipleChoiceQuestionsCount || 0,
        shortAnswerQuestionsCount: exam.shortAnswerQuestionsCount || 0,
        fillInTheBlankQuestionsCount: exam.fillInTheBlankQuestionsCount || 0,
        trueFalseQuestionsCount: exam.trueFalseQuestionsCount || 0,
        matchingQuestionsCount: exam.matchingQuestionsCount || 0,
        orderingQuestionsCount: exam.orderingQuestionsCount || 0
      });
      
      logger.info('Questions generated with distribution', {
        examId,
        questionsCount: questions.length,
        requestedCount: exam.totalQuestions,
        actualCount: questions.length,
        questionTypeDistribution: questions.reduce((acc, q) => {
          acc[q.type] = (acc[q.type] || 0) + 1;
          return acc;
        }, {})
      });

      // Create exam attempt
      const attempt = await prisma.examAttempt.create({
        data: {
          examId,
          userId,
          status: 'IN_PROGRESS'
        }
      });

      // Send exam started notification
      try {
        if (global.notificationService) {
          await global.notificationService.notifyExamStarted({
            id: attempt.id,
            userId,
            examId,
            exam: {
              id: exam.id,
              title: exam.title,
              duration: exam.duration
            }
          });
          logger.info(`🔔 Sent exam started notification to user ${userId}`);
        }
      } catch (notificationError) {
        logger.warn('Failed to send exam started notification:', notificationError);
        // Continue without notification - this is not critical
      }

      return {
        success: true,
        attempt: {
          id: attempt.id,
          duration: exam.duration,
          totalQuestions: exam.totalQuestions
        },
        questions,
        exam: {
          id: exam.id,
          title: exam.title,
          duration: exam.duration,
          totalQuestions: exam.totalQuestions,
          instructions: exam.instructions,
          rules: exam.rules,
          // Add question distribution fields
          multipleChoiceQuestionsCount: exam.multipleChoiceQuestionsCount || 0,
          fillInTheBlankQuestionsCount: exam.fillInTheBlankQuestionsCount || 0,
          essayQuestionsCount: exam.essayQuestionsCount || 0,
          shortAnswerQuestionsCount: exam.shortAnswerQuestionsCount || 0,
          trueFalseQuestionsCount: exam.trueFalseQuestionsCount || 0,
          matchingQuestionsCount: exam.matchingQuestionsCount || 0,
          orderingQuestionsCount: exam.orderingQuestionsCount || 0
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
  async submitQuestionResponse(attemptId, questionId, selectedOptions, timeSpent, userId, essayAnswer = null) {
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
      let isCorrect = false;
      
      if (question.type === 'FILL_IN_THE_BLANK') {
        // For fill-in-the-blank questions, we need to check text matching
        // The user's answer is stored in essayAnswer field
        isCorrect = this.checkFillInTheBlankAnswer(question, essayAnswer);
      } else {
        // For other question types, use the standard checkAnswer method
        isCorrect = this.checkAnswer(question, selectedOptions);
      }

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
          essayAnswer: essayAnswer || undefined,
          answeredAt: new Date()
        },
        create: {
          attemptId,
          questionId,
          userId,
          selectedOptions,
          timeSpent,
          isCorrect,
          essayAnswer: essayAnswer || undefined,
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

      logger.info('Attempt loaded for completion', { 
        attemptId, 
        hasExam: !!attempt?.exam, 
        examTitle: attempt?.exam?.title,
        responsesCount: attempt?.responses?.length || 0,
        responses: attempt?.responses?.map(r => ({
          id: r.id,
          questionId: r.questionId,
          isCorrect: r.isCorrect,
          selectedOptions: r.selectedOptions
        }))
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
        responsesCount: attempt.responses.length,
        responses: attempt.responses.map(r => ({
          questionId: r.questionId,
          isCorrect: r.isCorrect,
          selectedOptions: r.selectedOptions
        }))
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
      logger.info('Certificate generation check', { 
        attemptId, 
        isPassed, 
        percentage, 
        passingMarks: attempt.exam.passingMarks,
        examTitle: attempt.exam.title 
      });
      
      // Certificate will be generated later when user requests it
      if (isPassed) {
        logger.info('Exam passed - certificate can be requested later', { 
          attemptId, 
          percentage, 
          passingMarks: attempt.exam.passingMarks 
        });
      } else {
        logger.info('No certificate created - attempt did not pass', { 
          attemptId, 
          percentage, 
          passingMarks: attempt.exam.passingMarks 
        });
      }

      const result = {
        success: true,
        attempt: {
          ...updatedAttempt,
          exam: attempt.exam // Include exam data for notifications and WebSocket
        },
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
          // Pass the original attempt object that includes exam data for notification
          await global.notificationService.notifyExamCompleted(attempt, result.results);
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

      logger.info('completeExamAttempt completed successfully', { 
        attemptId, 
        certificateCreated: !!certificate,
        certificateId: certificate?.id,
        certificateNumber: certificate?.certificateNumber
      });
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

      // Handle different question types
      if (question.type === 'FILL_IN_THE_BLANK') {
        // For fill-in-the-blank, selectedOptions should be option IDs that the user selected
        // We need to check if the selected options match the correct options
        const correctOptionIds = question.options
          .filter(option => option && option.isCorrect)
          .map(option => option.id)
          .sort();
        
        const sortedSelectedOptions = selectedOptions.sort();
        
        // Compare the arrays
        return JSON.stringify(sortedSelectedOptions) === JSON.stringify(correctOptionIds);
      } else {
        // For other question types (multiple choice, single choice, etc.)
        // Get correct option IDs from the question options
        const correctOptionIds = question.options
          .filter(option => option && option.isCorrect)
          .map(option => option.id)
          .sort();
        
        // Sort the selected options for comparison
        const sortedSelectedOptions = selectedOptions.sort();
        
        // Compare the arrays
        return JSON.stringify(sortedSelectedOptions) === JSON.stringify(correctOptionIds);
      }
    } catch (error) {
      logger.error('Error checking answer:', error);
      return false;
    }
  }

  /**
   * Check fill-in-the-blank answer
   */
  checkFillInTheBlankAnswer(question, essayAnswer) {
    try {
      // Validate inputs
      if (!question || !question.options || !Array.isArray(question.options)) {
        logger.error('Invalid question object in checkFillInTheBlankAnswer', { question });
        return false;
      }

      if (!essayAnswer || typeof essayAnswer !== 'string') {
        logger.error('Invalid essayAnswer in checkFillInTheBlankAnswer', { essayAnswer });
        return false;
      }

      // Parse the essay answer format: "Blank 1: answer1 | Blank 2: answer2 | ..."
      const blankAnswers = essayAnswer.split(' | ').map(part => {
        const match = part.match(/^Blank \d+: (.+)$/);
        return match ? match[1].trim() : '';
      }).filter(answer => answer.length > 0);

      // Check if we have the right number of answers
      const correctOptions = question.options.filter(option => option && option.isCorrect);
      if (blankAnswers.length !== correctOptions.length) {
        return false;
      }

      // Check each blank answer against the correct option
      let correctBlanks = 0;
      correctOptions.forEach((correctOption, index) => {
        const userAnswer = blankAnswers[index];
        if (userAnswer && userAnswer.toLowerCase() === correctOption.text.toLowerCase()) {
          correctBlanks++;
        }
      });

      // Consider the answer correct if all blanks are filled correctly
      return correctBlanks === correctOptions.length;
    } catch (error) {
      logger.error('Error checking fill-in-the-blank answer:', error);
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
      
      // Handle status mapping for frontend compatibility
      if (status === 'passed') {
        where.isPassed = true;
        where.status = 'COMPLETED';
      } else if (status === 'failed') {
        where.isPassed = false;
        where.status = 'COMPLETED';
      } else if (status) {
        where.status = status;
      }

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
   * Get user certificates with pagination and filters
   */
  async getUserCertificates(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        examId,
        sortBy = 'issuedAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const where = { userId };

      if (examId) where.examId = examId;

      const [certificates, total] = await Promise.all([
        prisma.certificate.findMany({
          where,
          include: {
            exam: {
              include: { examCategory: true }
            },
            attempt: {
              select: {
                id: true,
                percentage: true,
                completedAt: true
              }
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        prisma.certificate.count({ where })
      ]);

      // Add username to each certificate
      const certificatesWithUsername = certificates.map(cert => ({
        ...cert,
        userName: `${cert.user.firstName} ${cert.user.lastName}`,
        userEmail: cert.user.email
      }));

      return {
        success: true,
        certificates: certificatesWithUsername,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get user certificates failed', error);
      return { success: false, message: 'Failed to get certificates' };
    }
  }

  /**
   * Generate certificate for an exam attempt
   */
  async generateCertificate(attemptId, userId) {
    try {
      const attempt = await prisma.examAttempt.findUnique({
        where: { id: attemptId },
        include: {
          exam: true,
          certificate: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!attempt) {
        return { success: false, message: 'Attempt not found' };
      }

      if (attempt.userId !== userId) {
        return { success: false, message: 'Unauthorized' };
      }

      if (attempt.status !== 'COMPLETED') {
        return { success: false, message: 'Attempt must be completed to generate certificate' };
      }

      if (!attempt.isPassed) {
        return { success: false, message: 'Only passed attempts can generate certificates' };
      }

      if (attempt.certificate) {
        return { success: false, message: 'Certificate already exists for this attempt' };
      }

      // Create certificate
      const certificate = await prisma.certificate.create({
        data: {
          userId,
          examId: attempt.examId,
          attemptId,
          certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: "EARNED",
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        },
        include: {
          exam: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Add username to certificate response
      const certificateWithUsername = {
        ...certificate,
        userName: `${attempt.user.firstName} ${attempt.user.lastName}`,
        userEmail: attempt.user.email
      };

      return {
        success: true,
        certificate: certificateWithUsername
      };
    } catch (error) {
      logger.error('Generate certificate failed', error);
      return { success: false, message: 'Failed to generate certificate' };
    }
  }

  /**
   * Download certificate
   */
  async downloadCertificate(certificateId, userId) {
    try {
      const certificate = await prisma.certificate.findUnique({
        where: { id: certificateId },
        include: {
          exam: true,
          attempt: true
        }
      });

      if (!certificate) {
        return { success: false, message: 'Certificate not found' };
      }

      if (certificate.userId !== userId) {
        return { success: false, message: 'Unauthorized' };
      }

      // For now, return a mock PDF buffer
      // In a real implementation, you would generate an actual PDF
      const mockPdfBuffer = Buffer.from('Mock PDF content for certificate');
      
      return {
        success: true,
        pdfBuffer: mockPdfBuffer,
        filename: `certificate-${certificate.certificateNumber}.pdf`
      };
    } catch (error) {
      logger.error('Download certificate failed', error);
      return { success: false, message: 'Failed to download certificate' };
    }
  }

  /**
   * Auto-generate certificates for existing passed exams
   */
  async autoGenerateCertificates(userId) {
    try {
      // Find all completed, passed attempts without certificates
      const attempts = await prisma.examAttempt.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          isPassed: true,
          certificate: null
        },
        include: {
          exam: true
        }
      });

      let generatedCount = 0;
      for (const attempt of attempts) {
        try {
          await prisma.certificate.create({
            data: {
              userId,
              examId: attempt.examId,
              attemptId: attempt.id,
              certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              issuedAt: new Date(),
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
            }
          });
          generatedCount++;
        } catch (certError) {
          logger.error('Failed to generate certificate for attempt', { attemptId: attempt.id, error: certError });
        }
      }

      return {
        success: true,
        message: `Generated ${generatedCount} certificates`,
        generatedCount
      };
    } catch (error) {
      logger.error('Auto-generate certificates failed', error);
      return { success: false, message: 'Failed to auto-generate certificates' };
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

      // Format exam data for frontend - map database fields to frontend expected fields
      const formattedExams = exams.map(exam => ({
        ...exam,
        startDate: exam.scheduledStart,
        endDate: exam.scheduledEnd
      }));

      return {
        success: true,
        exams: formattedExams,
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
        _avg: { 
          percentage: true, 
          obtainedMarks: true,
          totalMarks: true,
          timeSpent: true
        }
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

      // Find completed attempts stats
      const completedStats = stats.find(s => s.status === 'COMPLETED');

      return {
        success: true,
        stats: {
          totalAttempts,
          passedAttempts,
          certificates,
          passRate: totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0,
          averageScore: completedStats?._avg.obtainedMarks || 0,
          averagePercentage: completedStats?._avg.percentage || 0,
          averageTimeSpent: completedStats?._avg.timeSpent || 0
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

  /**
   * Get exam attempt by ID
   */
  async getExamAttempt(attemptId, userId) {
    try {
      const attempt = await prisma.examAttempt.findFirst({
        where: {
          id: attemptId,
          userId
        },
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              totalMarks: true,
              passingMarks: true,
              duration: true
            }
          },
          responses: {
            include: {
              question: {
                select: {
                  id: true,
                  text: true,
                  type: true,
                  marks: true
                }
              }
            }
          }
        }
      });

      if (!attempt) {
        return null;
      }

      return attempt;
    } catch (error) {
      logger.error('Get exam attempt failed', error);
      throw error;
    }
  }
}

module.exports = new ExamService();