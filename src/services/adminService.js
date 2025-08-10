const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const prisma = new PrismaClient();

class AdminService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStatistics() {
    try {
      const [
        totalUsers,
        totalExams,
        totalQuestions,
        totalAttempts,
        totalRevenue,
        recentUsers,
        recentExams,
        recentAttempts,
        userGrowth,
        examPerformance,
        categoryStats
      ] = await Promise.all([
        prisma.user.count(),
        prisma.exam.count(),
        prisma.question.count(),
        prisma.examAttempt.count(),
        prisma.payment.aggregate({
          _sum: { amount: true }
        }),
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true
          }
        }),
        prisma.exam.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            examCategory: { select: { name: true } },
            price: true,
            createdAt: true
          }
        }),
        prisma.examAttempt.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true } },
            exam: { select: { title: true } }
          }
        }),
        this.getUserGrowthStats(),
        this.getExamPerformanceStats(),
        this.getCategoryStatistics()
      ]);

      return {
        overview: {
          totalUsers,
          totalExams,
          totalQuestions,
          totalAttempts,
          totalRevenue: totalRevenue._sum.amount || 0
        },
        recent: {
          users: recentUsers,
          exams: recentExams,
          attempts: recentAttempts
        },
        analytics: {
          userGrowth,
          examPerformance,
          categoryStats
        }
      };
    } catch (error) {
      logger.error('Get dashboard statistics failed', error);
      throw error;
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth() {
    try {
      const [
        databaseStatus,
        activeUsers,
        systemLoad,
        errorCount,
        uptime
      ] = await Promise.all([
        this.checkDatabaseConnection(),
        this.getActiveUsersCount(),
        this.getSystemLoad(),
        this.getErrorCount(),
        this.getSystemUptime()
      ]);

      return {
        status: databaseStatus && activeUsers > 0 ? 'healthy' : 'degraded',
        database: databaseStatus,
        activeUsers,
        systemLoad,
        errorCount,
        uptime,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Get system health failed', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(options = {}) {
    const { page = 1, limit = 50, userId, action, resource, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    try {
      const where = {};

      if (userId) {
        where.userId = userId;
      }

      if (action) {
        where.action = action;
      }

      if (resource) {
        where.resource = resource;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.auditLog.count({ where })
      ]);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Get audit logs failed', error);
      throw error;
    }
  }

  /**
   * Export data
   */
  async exportData(type, format, filters) {
    try {
      let data;
      let filename;

      switch (type) {
        case 'users':
          data = await this.exportUsers(filters);
          filename = `users_${Date.now()}.${format}`;
          break;
        case 'exams':
          data = await this.exportExams(filters);
          filename = `exams_${Date.now()}.${format}`;
          break;
        case 'questions':
          data = await this.exportQuestions(filters);
          filename = `questions_${Date.now()}.${format}`;
          break;
        case 'attempts':
          data = await this.exportAttempts(filters);
          filename = `attempts_${Date.now()}.${format}`;
          break;
        case 'payments':
          data = await this.exportPayments(filters);
          filename = `payments_${Date.now()}.${format}`;
          break;
        default:
          throw new Error('Invalid export type');
      }

      // Convert to requested format
      let exportData;
      switch (format) {
        case 'json':
          exportData = JSON.stringify(data, null, 2);
          break;
        case 'csv':
          exportData = this.convertToCSV(data);
          break;
        case 'xlsx':
          exportData = await this.convertToXLSX(data);
          break;
        default:
          throw new Error('Invalid export format');
      }

      return {
        filename,
        data: exportData,
        format,
        recordCount: Array.isArray(data) ? data.length : 1
      };
    } catch (error) {
      logger.error('Export data failed', error);
      throw error;
    }
  }

  /**
   * Create system backup
   */
  async createSystemBackup() {
    try {
      const backupData = {
        timestamp: new Date(),
        version: process.env.APP_VERSION || '1.0.0',
        data: {
          users: await prisma.user.findMany(),
          exams: await prisma.exam.findMany(),
          questions: await prisma.question.findMany(),
          categories: await prisma.examCategory.findMany(),
          attempts: await prisma.examAttempt.findMany(),
          payments: await prisma.payment.findMany()
        }
      };

      const backupId = `backup_${Date.now()}`;
      const backupPath = `./backups/${backupId}.json`;

      // In a real implementation, you would save this to a file or cloud storage
      // For now, we'll just return the backup data
      return {
        backupId,
        timestamp: backupData.timestamp,
        size: JSON.stringify(backupData).length,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Create system backup failed', error);
      throw error;
    }
  }

  // Helper methods

  /**
   * Check database connection
   */
  async checkDatabaseConnection() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get active users count
   */
  async getActiveUsersCount() {
    try {
      const activeUsers = await prisma.user.count({
        where: {
          isActive: true,
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });
      return activeUsers;
    } catch (error) {
      logger.error('Get active users count failed', error);
      return 0;
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
        disk: Math.random() * 100
      };
    } catch (error) {
      logger.error('Get system load failed', error);
      return { cpu: 0, memory: 0, disk: 0 };
    }
  }

  /**
   * Get error count
   */
  async getErrorCount() {
    try {
      const errorCount = await prisma.auditLog.count({
        where: {
          action: {
            contains: 'ERROR'
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });
      return errorCount;
    } catch (error) {
      logger.error('Get error count failed', error);
      return 0;
    }
  }

  /**
   * Get system uptime
   */
  async getSystemUptime() {
    try {
      // In a real implementation, you would track actual uptime
      // For now, we'll return a mock value
      return {
        uptime: process.uptime(),
        startTime: new Date(Date.now() - process.uptime() * 1000)
      };
    } catch (error) {
      logger.error('Get system uptime failed', error);
      return { uptime: 0, startTime: new Date() };
    }
  }

  /**
   * Get user growth statistics
   */
  async getUserGrowthStats() {
    try {
      const userGrowth = await prisma.user.groupBy({
        by: ['createdAt'],
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      });

      return userGrowth.map(item => ({
        date: item.createdAt,
        count: item._count.id
      }));
    } catch (error) {
      logger.error('Get user growth stats failed', error);
      return [];
    }
  }

  /**
   * Get exam performance statistics
   */
  async getExamPerformanceStats() {
    try {
      const examPerformance = await prisma.examAttempt.groupBy({
        by: ['examId'],
        _count: { id: true },
        _avg: { percentage: true }
      });

      return examPerformance.map(item => ({
        examId: item.examId,
        attempts: item._count.id,
        averageScore: item._avg.percentage || 0
      }));
    } catch (error) {
      logger.error('Get exam performance stats failed', error);
      return [];
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStatistics() {
    try {
      const categoryStats = await prisma.examCategory.findMany({
        include: {
          _count: {
            select: {
              exams: true,
              questions: true
            }
          }
        }
      });

      return categoryStats.map(category => ({
        id: category.id,
        name: category.name,
        examCount: category._count.exams,
        questionCount: category._count.questions
      }));
    } catch (error) {
      logger.error('Get category statistics failed', error);
      return [];
    }
  }

  /**
   * Export users
   */
  async exportUsers(filters = {}) {
    try {
      const where = {};
      if (filters.role) where.role = filters.role;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true,
          lastLoginAt: true
        }
      });

      return users;
    } catch (error) {
      logger.error('Export users failed', error);
      throw error;
    }
  }

  /**
   * Export exams
   */
  async exportExams(filters = {}) {
    try {
      const where = {};
      if (filters.examCategoryId) where.examCategoryId = filters.examCategoryId;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;

      const exams = await prisma.exam.findMany({
        where,
        include: {
          examCategory: {
            select: { name: true }
          }
        }
      });

      return exams;
    } catch (error) {
      logger.error('Export exams failed', error);
      throw error;
    }
  }

  /**
   * Export questions
   */
  async exportQuestions(filters = {}) {
    try {
      const where = {};
      if (filters.examCategoryId) where.examCategoryId = filters.examCategoryId;
      if (filters.difficulty) where.difficulty = filters.difficulty;
      if (filters.type) where.type = filters.type;

      const questions = await prisma.question.findMany({
        where,
        include: {
          options: true,
          examCategory: {
            select: { name: true }
          }
        }
      });

      return questions;
    } catch (error) {
      logger.error('Export questions failed', error);
      throw error;
    }
  }

  /**
   * Export attempts
   */
  async exportAttempts(filters = {}) {
    try {
      const where = {};
      if (filters.status) where.status = filters.status;
      if (filters.examId) where.examId = filters.examId;

      const attempts = await prisma.examAttempt.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          exam: {
            select: {
              title: true,
              examCategory: {
                select: { name: true }
              }
            }
          }
        }
      });

      return attempts;
    } catch (error) {
      logger.error('Export attempts failed', error);
      throw error;
    }
  }

  /**
   * Export payments
   */
  async exportPayments(filters = {}) {
    try {
      const where = {};
      if (filters.status) where.status = filters.status;
      if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) };
      if (filters.endDate) where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };

      const payments = await prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          exam: {
            select: {
              title: true
            }
          }
        }
      });

      return payments;
    } catch (error) {
      logger.error('Export payments failed', error);
      throw error;
    }
  }

  /**
   * Convert data to CSV
   */
  convertToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Convert data to XLSX
   */
  async convertToXLSX(data) {
    // In a real implementation, you would use a library like 'xlsx'
    // For now, we'll return the data as JSON
    return JSON.stringify(data);
  }
}

module.exports = AdminService; 