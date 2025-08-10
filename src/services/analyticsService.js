const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const prisma = new PrismaClient();

class AnalyticsService {
  /**
   * Get system analytics
   */
  async getSystemAnalytics(options = {}) {
    const { startDate, endDate } = options;

    try {
      const [
        userAnalytics,
        examAnalytics,
        revenueAnalytics,
        performanceAnalytics,
        categoryAnalytics
      ] = await Promise.all([
        this.getUserAnalytics(options),
        this.getExamAnalytics(options),
        this.getRevenueAnalytics(options),
        this.getPerformanceAnalytics(options),
        this.getCategoryAnalytics(options)
      ]);

      return {
        users: userAnalytics,
        exams: examAnalytics,
        revenue: revenueAnalytics,
        performance: performanceAnalytics,
        categories: categoryAnalytics
      };
    } catch (error) {
      logger.error('Get system analytics failed', error);
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(options = {}) {
    const { startDate, endDate, role } = options;

    try {
      const where = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      if (role) {
        where.role = role;
      }

      const [
        totalUsers,
        activeUsers,
        newUsers,
        usersByRole,
        usersByMonth,
        loginStats,
        verificationStats
      ] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.count({
          where: {
            ...where,
            lastLoginAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }),
        prisma.user.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }),
        prisma.user.groupBy({
          by: ['role'],
          where,
          _count: { id: true }
        }),
        prisma.user.groupBy({
          by: ['createdAt'],
          where,
          _count: { id: true }
        }),
        prisma.user.aggregate({
          where: { ...where, lastLoginAt: { not: null } },
          _avg: { loginAttempts: true }
        }),
        prisma.user.groupBy({
          by: ['isEmailVerified'],
          where,
          _count: { id: true }
        })
      ]);

      return {
        totalUsers,
        activeUsers,
        newUsers,
        userGrowth: usersByMonth.map(item => ({
          date: item.createdAt,
          count: item._count.id
        })),
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count.id;
          return acc;
        }, {}),
        averageLoginAttempts: loginStats._avg.loginAttempts || 0,
        verificationRate: totalUsers > 0 
          ? (verificationStats.find(v => v.isEmailVerified)?._count.id || 0) / totalUsers * 100 
          : 0,
        activationRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
      };
    } catch (error) {
      logger.error('Get user analytics failed', error);
      throw error;
    }
  }

  /**
   * Get exam analytics
   */
  async getExamAnalytics(options = {}) {
    const { startDate, endDate, examCategoryId } = options;

    try {
      const where = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      if (examCategoryId) {
        where.examCategoryId = examCategoryId;
      }

      const [
        totalExams,
        activeExams,
        totalAttempts,
        passedAttempts,
        failedAttempts,
        averageScore,
        averageTime,
        attemptsByDate,
        scoreDistribution,
        examsByCategory
      ] = await Promise.all([
        prisma.exam.count({ where }),
        prisma.exam.count({ where: { ...where, isActive: true } }),
        prisma.examAttempt.count(),
        prisma.examAttempt.count({ where: { status: 'COMPLETED', isPassed: true } }),
        prisma.examAttempt.count({ where: { status: 'ABANDONED' } }),
        prisma.examAttempt.aggregate({
          _avg: { percentage: true }
        }),
        prisma.examAttempt.aggregate({
          _avg: { timeSpent: true }
        }),
        prisma.examAttempt.groupBy({
          by: ['createdAt'],
          _count: { id: true }
        }),
        prisma.examAttempt.groupBy({
          by: ['percentage'],
          _count: { id: true }
        }),
        prisma.exam.groupBy({
          by: ['examCategoryId'],
          where,
          _count: { id: true }
        })
      ]);

      return {
        totalExams,
        activeExams,
        totalAttempts,
        passedAttempts,
        failedAttempts,
        passRate: totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0,
        averageScore: averageScore._avg.percentage || 0,
        averageTime: averageTime._avg.timeSpent || 0,
        attemptsByDate: attemptsByDate.map(item => ({
          date: item.createdAt,
          count: item._count.id
        })),
        scoreDistribution: scoreDistribution.map(item => ({
          score: item.percentage,
          count: item._count.id
        })),
        examsByCategory: examsByCategory.reduce((acc, item) => {
          acc[item.examCategoryId] = item._count.id;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Get exam analytics failed', error);
      throw error;
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(options = {}) {
    const { startDate, endDate } = options;

    try {
      const where = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [
        totalRevenue,
        successfulPayments,
        failedPayments,
        revenueByMonth,
        revenueByExam,
        averagePayment,
        paymentMethods
      ] = await Promise.all([
        prisma.payment.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.payment.count({
          where: { ...where, status: 'COMPLETED' }
        }),
        prisma.payment.count({
          where: { ...where, status: 'FAILED' }
        }),
        prisma.payment.groupBy({
          by: ['createdAt'],
          where: { ...where, status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.payment.groupBy({
          by: ['bookingId'],
          where: { 
            ...where, 
            status: 'COMPLETED',
            bookingId: { not: null }
          },
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _avg: { amount: true }
        }),
        prisma.payment.groupBy({
          by: ['paymentMethod'],
          where: { ...where, status: 'COMPLETED' },
          _sum: { amount: true }
        })
      ]);

      return {
        totalRevenue: totalRevenue._sum.amount || 0,
        successfulPayments,
        failedPayments,
        successRate: (successfulPayments + failedPayments) > 0 
          ? (successfulPayments / (successfulPayments + failedPayments)) * 100 
          : 0,
        averagePayment: averagePayment._avg.amount || 0,
        revenueByMonth: revenueByMonth.map(item => ({
          date: item.createdAt,
          amount: item._sum.amount || 0
        })),
        revenueByExam: {}, // Payment model doesn't have examId
        paymentMethods: paymentMethods.reduce((acc, item) => {
          acc[item.paymentMethod] = item._sum.amount || 0;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Get revenue analytics failed', error);
      throw error;
    }
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(options = {}) {
    const { startDate, endDate, examCategoryId } = options;

    try {
      const where = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      if (examCategoryId) {
        where.exam = { examCategoryId };
      }

      const [
        totalAttempts,
        averageScore,
        scoreDistribution,
        timeAnalysis,
        difficultyAnalysis,
        questionAnalysis
      ] = await Promise.all([
        prisma.examAttempt.count({ where }),
        prisma.examAttempt.aggregate({
          where,
          _avg: { percentage: true }
        }),
        prisma.examAttempt.groupBy({
          by: ['percentage'],
          where,
          _count: { id: true }
        }),
        prisma.examAttempt.aggregate({
          where,
          _avg: { timeSpent: true },
          _min: { timeSpent: true },
          _max: { timeSpent: true }
        }),
        this.getDifficultyAnalysis(options),
        this.getQuestionAnalysis(options)
      ]);

      return {
        totalAttempts,
        averageScore: averageScore._avg.percentage || 0,
        scoreDistribution: scoreDistribution.map(item => ({
          score: item.percentage,
          count: item._count.id
        })),
        timeAnalysis: {
          average: timeAnalysis._avg.timeSpent || 0,
          minimum: timeAnalysis._min.timeSpent || 0,
          maximum: timeAnalysis._max.timeSpent || 0
        },
        difficultyAnalysis,
        questionAnalysis
      };
    } catch (error) {
      logger.error('Get performance analytics failed', error);
      throw error;
    }
  }

  /**
   * Get category analytics
   */
  async getCategoryAnalytics(options = {}) {
    const { startDate, endDate } = options;

    try {
      const where = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const categories = await prisma.examCategory.findMany({
        include: {
          _count: {
            select: {
              exams: true,
              questions: true
            }
          },
          exams: {
            where,
            include: {
              _count: {
                select: {
                  attempts: true
                }
              }
            }
          }
        }
      });

      const categoryStats = await Promise.all(
        categories.map(async (category) => {
          const [
            totalAttempts,
            passedAttempts,
            averageScore,
            totalRevenue
          ] = await Promise.all([
            prisma.examAttempt.count({
              where: {
                exam: { examCategoryId: category.id },
                ...where
              }
            }),
            prisma.examAttempt.count({
              where: {
                exam: { examCategoryId: category.id },
                status: 'COMPLETED',
          isPassed: true,
                ...where
              }
            }),
            prisma.examAttempt.aggregate({
              where: {
                exam: { examCategoryId: category.id },
                ...where
              },
              _avg: { percentage: true }
            }),
            // Note: Payment analytics removed as Payment doesn't have direct exam relation
            // Would need to join through ExamBooking to get exam category revenue
            Promise.resolve({ _sum: { amount: 0 } })
          ]);

          return {
            id: category.id,
            name: category.name,
            color: category.color,
            examCount: category._count.exams,
            questionCount: category._count.questions,
            totalAttempts,
            passedAttempts,
            passRate: totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0,
            averageScore: averageScore._avg.percentage || 0,
            totalRevenue: totalRevenue._sum.amount || 0
          };
        })
      );

      return categoryStats;
    } catch (error) {
      logger.error('Get category analytics failed', error);
      throw error;
    }
  }

  /**
   * Get difficulty analysis
   */
  async getDifficultyAnalysis(options = {}) {
    const { startDate, endDate } = options;

    try {
      const where = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const difficultyStats = await prisma.questionResponse.groupBy({
        by: ['questionId'],
        where,
        _count: { id: true },
        _avg: { timeSpent: true }
      });

      const questionDetails = await prisma.question.findMany({
        where: {
          id: { in: difficultyStats.map(stat => stat.questionId) }
        },
        select: {
          id: true,
          difficulty: true,
          marks: true
        }
      });

      const difficultyAnalysis = {
        EASY: { count: 0, averageTime: 0, averageMarks: 0 },
        MEDIUM: { count: 0, averageTime: 0, averageMarks: 0 },
        HARD: { count: 0, averageTime: 0, averageMarks: 0 }
      };

      difficultyStats.forEach(stat => {
        const question = questionDetails.find(q => q.id === stat.questionId);
        if (question) {
          const difficulty = question.difficulty;
          difficultyAnalysis[difficulty].count += stat._count.id;
          difficultyAnalysis[difficulty].averageTime += stat._avg.timeSpent || 0;
          difficultyAnalysis[difficulty].averageMarks += question.marks;
        }
      });

      // Calculate averages
      Object.keys(difficultyAnalysis).forEach(difficulty => {
        if (difficultyAnalysis[difficulty].count > 0) {
          difficultyAnalysis[difficulty].averageTime /= difficultyAnalysis[difficulty].count;
          difficultyAnalysis[difficulty].averageMarks /= difficultyAnalysis[difficulty].count;
        }
      });

      return difficultyAnalysis;
    } catch (error) {
      logger.error('Get difficulty analysis failed', error);
      throw error;
    }
  }

  /**
   * Get question analysis
   */
  async getQuestionAnalysis(options = {}) {
    const { startDate, endDate } = options;

    try {
      const where = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const questionStats = await prisma.questionResponse.groupBy({
        by: ['questionId'],
        where,
        _count: { id: true }
      });

      const topQuestions = await Promise.all(
        questionStats
          .sort((a, b) => b._count.id - a._count.id)
          .slice(0, 10)
          .map(async (stat) => {
            const question = await prisma.question.findUnique({
              where: { id: stat.questionId },
              select: {
                id: true,
                text: true,
                difficulty: true,
                marks: true,
                exam_categories: { select: { name: true } }
              }
            });

            // For now, we'll use a simpler approach since selectedOptions is a String[] array
            const correctResponses = await prisma.questionResponse.count({
              where: {
                questionId: stat.questionId,
                isCorrect: true
              }
            });

            return {
              id: question.id,
              text: question.text.substring(0, 100) + '...',
              difficulty: question.difficulty,
              marks: question.marks,
              category: question.exam_categories.name,
              totalResponses: stat._count.id,
              correctResponses,
              accuracy: stat._count.id > 0 ? (correctResponses / stat._count.id) * 100 : 0
            };
          })
      );

      return topQuestions;
    } catch (error) {
      logger.error('Get question analysis failed', error);
      throw error;
    }
  }

  /**
   * Get real-time analytics
   */
  async getRealTimeAnalytics() {
    try {
      const now = new Date();
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
      const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [
        activeUsers,
        recentAttempts,
        recentPayments,
        systemLoad
      ] = await Promise.all([
        prisma.user.count({
          where: {
            lastLoginAt: { gte: lastHour }
          }
        }),
        prisma.examAttempt.count({
          where: {
            createdAt: { gte: lastHour }
          }
        }),
        prisma.payment.count({
          where: {
            createdAt: { gte: lastHour },
            status: 'COMPLETED'
          }
        }),
        this.getSystemLoad()
      ]);

      return {
        activeUsers,
        recentAttempts,
        recentPayments,
        systemLoad,
        timestamp: now
      };
    } catch (error) {
      logger.error('Get real-time analytics failed', error);
      throw error;
    }
  }

  /**
   * Get system load
   */
  async getSystemLoad() {
    try {
      // In a real implementation, you would get actual system metrics
      // For now, we'll return mock data
      return {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 100
      };
    } catch (error) {
      logger.error('Get system load failed', error);
      return { cpu: 0, memory: 0, disk: 0, network: 0 };
    }
  }
}

module.exports = AnalyticsService; 