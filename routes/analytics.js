const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const [
      totalUsers,
      totalExams,
      totalQuestions,
      totalAttempts,
      recentAttempts,
      userGrowth,
      examAttemptsByDay,
      topCategoriesData,
      averageScores
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total exams
      prisma.exam.count(),
      
      // Total questions
      prisma.question.count(),
      
      // Total attempts
      prisma.examAttempt.count(),
      
      // Recent attempts
      prisma.examAttempt.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          exam: {
            select: {
              title: true,
              examCategory: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
      
      // User growth over time
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Exam attempts by day
      prisma.examAttempt.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Top categories
      prisma.exam.groupBy({
        by: ['examCategoryId'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      }),
      
      // Average scores
      prisma.examAttempt.aggregate({
        where: {
          status: 'COMPLETED',
          percentage: {
            gt: 0,
          },
        },
        _avg: {
          percentage: true,
        },
      }),
    ]);

    // Fetch category names for top categories
    const categoryIds = topCategoriesData.map(cat => cat.examCategoryId);
    const categories = await prisma.examCategory.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Combine top categories data with category names
    const topCategories = topCategoriesData.map(cat => {
      const category = categories.find(c => c.id === cat.examCategoryId);
      return {
        categoryId: cat.examCategoryId,
        categoryName: category ? category.name : 'Unknown',
        count: cat._count.id,
      };
    });

    const analytics = {
      overview: {
        totalUsers,
        totalExams,
        totalQuestions,
        totalAttempts,
        averageScore: Math.round((averageScores._avg.percentage || 0) * 100) / 100,
      },
      recentActivity: {
        recentAttempts,
      },
      trends: {
        userGrowth,
        examAttemptsByDay,
      },
      topCategories,
    };

    res.json({
      success: true,
      data: analytics,
      message: 'Dashboard analytics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message,
    });
  }
});

// Get exam analytics
router.get('/exams/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const [
      exam,
      attempts,
      attemptsByDay,
      scoreDistribution,
      completionRate,
      averageTime,
      topPerformers
    ] = await Promise.all([
      // Exam details
      prisma.exam.findUnique({
        where: { id: parseInt(examId) },
        include: {
          examCategory: true,
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      }),
      
      // All attempts
      prisma.examAttempt.findMany({
        where: {
          examId: parseInt(examId),
          createdAt: {
            gte: startDate,
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      
      // Attempts by day
      prisma.examAttempt.groupBy({
        by: ['createdAt'],
        where: {
          examId: parseInt(examId),
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Score distribution
      prisma.examAttempt.groupBy({
        by: ['percentage'],
        where: {
          examId: parseInt(examId),
          status: 'COMPLETED',
          percentage: {
            gt: 0,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          percentage: 'asc',
        },
      }),
      
      // Completion rate
      prisma.examAttempt.groupBy({
        by: ['status'],
        where: {
          examId: parseInt(examId),
        },
        _count: {
          id: true,
        },
      }),
      
      // Average completion time
      prisma.examAttempt.aggregate({
        where: {
          examId: parseInt(examId),
          status: 'COMPLETED',
          timeSpent: {
            gt: 0,
          },
        },
        _avg: {
          timeSpent: true,
        },
      }),
      
      // Top performers
      prisma.examAttempt.findMany({
        where: {
          examId: parseInt(examId),
          status: 'COMPLETED',
          percentage: {
            gt: 0,
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          percentage: 'desc',
        },
        take: 10,
      }),
    ]);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Calculate analytics
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(attempt => attempt.status === 'COMPLETED').length;
    const averageScore = completedAttempts > 0 
      ? attempts.filter(attempt => attempt.status === 'COMPLETED')
          .reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / completedAttempts
      : 0;

    const analytics = {
      exam,
      overview: {
        totalAttempts,
        completedAttempts,
        completionRate: totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0,
        averageScore: Math.round(averageScore * 100) / 100,
        averageTime: Math.round((averageTime._avg.timeSpent || 0) / 60), // in minutes
      },
      trends: {
        attemptsByDay,
      },
      performance: {
        scoreDistribution,
        topPerformers,
      },
      completionRate,
    };

    res.json({
      success: true,
      data: analytics,
      message: 'Exam analytics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching exam analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam analytics',
      error: error.message,
    });
  }
});

// Get user analytics
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const [
      user,
      attempts,
      attemptsByDay,
      categoryPerformance,
      scoreTrends,
      recentActivity
    ] = await Promise.all([
      // User details
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      
      // All attempts
      prisma.examAttempt.findMany({
        where: {
          userId: userId,
          createdAt: {
            gte: startDate,
          },
        },
        include: {
          exam: {
            select: {
              title: true,
              examCategory: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      
      // Attempts by day
      prisma.examAttempt.groupBy({
        by: ['createdAt'],
        where: {
          userId: userId,
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Performance by category
      prisma.examAttempt.groupBy({
        by: ['examId'],
        where: {
          userId: userId,
          status: 'COMPLETED',
          percentage: {
            gt: 0,
          },
        },
        _avg: {
          percentage: true,
        },
      }),
      
      // Score trends
      prisma.examAttempt.findMany({
        where: {
          userId: userId,
          status: 'COMPLETED',
          percentage: {
            gt: 0,
          },
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          percentage: true,
          createdAt: true,
          exam: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Recent activity
      prisma.examAttempt.findMany({
        where: {
          userId: userId,
        },
        include: {
          exam: {
            select: {
              title: true,
              examCategory: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Calculate analytics
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(attempt => attempt.status === 'COMPLETED').length;
    const averageScore = completedAttempts > 0 
      ? attempts.filter(attempt => attempt.status === 'COMPLETED')
          .reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / completedAttempts
      : 0;

    const analytics = {
      user,
      overview: {
        totalAttempts,
        completedAttempts,
        completionRate: totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0,
        averageScore: Math.round(averageScore * 100) / 100,
      },
      trends: {
        attemptsByDay,
        scoreTrends,
      },
      performance: {
        categoryPerformance,
      },
      recentActivity,
    };

    res.json({
      success: true,
      data: analytics,
      message: 'User analytics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: error.message,
    });
  }
});

// Get question analytics
router.get('/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const [
      question,
      usageStats,
      difficultyAnalysis,
      examUsage
    ] = await Promise.all([
      // Question details
      prisma.question.findUnique({
        where: { id: parseInt(questionId) },
        include: {
          examCategory: true,
          tags: true,
          examQuestions: {
            include: {
              exam: {
                select: {
                  id: true,
                  title: true,
                  examCategory: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      
      // Usage statistics
      prisma.examQuestion.groupBy({
        by: ['examId'],
        where: {
          questionId: parseInt(questionId),
        },
        _count: {
          id: true,
        },
        include: {
          exam: {
            select: {
              title: true,
              examCategory: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      
      // Difficulty analysis
      prisma.question.findUnique({
        where: { id: parseInt(questionId) },
        select: {
          difficulty: true,
          type: true,
          points: true,
        },
      }),
      
      // Exam usage
      prisma.examQuestion.findMany({
        where: {
          questionId: parseInt(questionId),
        },
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              examCategory: {
                select: {
                  name: true,
                },
              },
              _count: {
                select: {
                  attempts: true,
                },
              },
            },
          },
        },
      }),
    ]);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    const analytics = {
      question,
      usage: {
        totalExams: usageStats.length,
        examUsage: usageStats,
      },
      difficulty: {
        level: difficultyAnalysis.difficulty,
        type: difficultyAnalysis.type,
        points: difficultyAnalysis.points,
      },
      examUsage,
    };

    res.json({
      success: true,
      data: analytics,
      message: 'Question analytics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching question analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question analytics',
      error: error.message,
    });
  }
});

// Get performance analytics
router.get('/performance', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const [
      overallStats,
      categoryPerformance,
      difficultyPerformance,
      timePerformance,
      topPerformers
    ] = await Promise.all([
      // Overall performance stats
      prisma.examAttempt.aggregate({
        where: {
          status: 'COMPLETED',
          percentage: {
            gt: 0,
          },
          createdAt: {
            gte: startDate,
          },
        },
        _avg: {
          percentage: true,
          timeSpent: true,
        },
        _count: {
          id: true,
        },
      }),
      
      // Performance by category
      prisma.examAttempt.groupBy({
        by: ['examId'],
        where: {
          status: 'COMPLETED',
          percentage: {
            gt: 0,
          },
          createdAt: {
            gte: startDate,
          },
        },
        _avg: {
          percentage: true,
        },
      }),
      
      // Performance by difficulty
      prisma.examAttempt.groupBy({
        by: ['examId'],
        where: {
          status: 'COMPLETED',
          percentage: {
            gt: 0,
          },
          createdAt: {
            gte: startDate,
          },
        },
        _avg: {
          percentage: true,
        },
      }),
      
      // Time performance
      prisma.examAttempt.aggregate({
        where: {
          status: 'COMPLETED',
          timeSpent: {
            gt: 0,
          },
          createdAt: {
            gte: startDate,
          },
        },
        _avg: {
          timeSpent: true,
        },
        _min: {
          timeSpent: true,
        },
        _max: {
          timeSpent: true,
        },
      }),
      
      // Top performers
      prisma.examAttempt.groupBy({
        by: ['userId'],
        where: {
          status: 'COMPLETED',
          percentage: {
            gt: 0,
          },
          createdAt: {
            gte: startDate,
          },
        },
        _avg: {
          percentage: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _avg: {
            percentage: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    const analytics = {
      overview: {
        totalAttempts: overallStats._count.id,
        averageScore: Math.round((overallStats._avg.percentage || 0) * 100) / 100,
        averageTime: Math.round((overallStats._avg.timeSpent || 0) / 60), // in minutes
      },
      categoryPerformance,
      difficultyPerformance,
      timePerformance: {
        average: Math.round((timePerformance._avg.timeSpent || 0) / 60),
        min: Math.round((timePerformance._min.timeSpent || 0) / 60),
        max: Math.round((timePerformance._max.timeSpent || 0) / 60),
      },
      topPerformers,
    };

    res.json({
      success: true,
      data: analytics,
      message: 'Performance analytics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance analytics',
      error: error.message,
    });
  }
});

// Get real-time analytics
router.get('/realtime', async (req, res) => {
  try {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      activeUsers,
      recentAttempts,
      recentRegistrations,
      systemStats
    ] = await Promise.all([
      // Active users (users who logged in within last hour)
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: lastHour,
          },
        },
      }),
      
      // Recent exam attempts
      prisma.examAttempt.findMany({
        where: {
          createdAt: {
            gte: lastHour,
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          exam: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
      
      // Recent user registrations
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: lastDay,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
      
      // System statistics
      prisma.examAttempt.aggregate({
        where: {
          createdAt: {
            gte: lastHour,
          },
        },
        _count: {
          id: true,
        },
      }),
    ]);

    const analytics = {
      activeUsers,
      recentActivity: {
        recentAttempts,
        recentRegistrations,
      },
      systemStats: {
        attemptsLastHour: systemStats._count.id,
      },
      timestamp: now.toISOString(),
    };

    res.json({
      success: true,
      data: analytics,
      message: 'Real-time analytics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching real-time analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch real-time analytics',
      error: error.message,
    });
  }
});

// Get trend analytics
router.get('/trends', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const [
      userGrowth,
      examAttempts,
      scoreTrends,
      categoryTrends
    ] = await Promise.all([
      // User growth trend
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Exam attempts trend
      prisma.examAttempt.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Score trends
      prisma.examAttempt.findMany({
        where: {
          status: 'COMPLETED',
          percentage: {
            gt: 0,
          },
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          percentage: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Category trends
      prisma.examAttempt.groupBy({
        by: ['examId'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        include: {
          exam: {
            select: {
              examCategory: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const analytics = {
      userGrowth,
      examAttempts,
      scoreTrends,
      categoryTrends,
    };

    res.json({
      success: true,
      data: analytics,
      message: 'Trend analytics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching trend analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trend analytics',
      error: error.message,
    });
  }
});

// Get analytics KPIs
router.get('/kpis', async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalExams,
      totalAttempts,
      averageScore,
      monthlyGrowth,
      weeklyActivity,
      completionRate,
      topCategories
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total exams
      prisma.exam.count(),
      
      // Total attempts
      prisma.examAttempt.count(),
      
      // Average score
      prisma.examAttempt.aggregate({
        where: {
          status: 'COMPLETED',
          percentage: {
            gt: 0,
          },
        },
        _avg: {
          percentage: true,
        },
      }),
      
      // Monthly user growth
      prisma.user.count({
        where: {
          createdAt: {
            gte: lastMonth,
          },
        },
      }),
      
      // Weekly activity
      prisma.examAttempt.count({
        where: {
          createdAt: {
            gte: lastWeek,
          },
        },
      }),
      
      // Completion rate
      prisma.examAttempt.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      }),
      
      // Top categories
      prisma.exam.groupBy({
        by: ['examCategoryId'],
        _count: {
          id: true,
        },
        include: {
          examCategory: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Calculate completion rate
    const totalAttemptsCount = completionRate.reduce((sum, item) => sum + item._count.id, 0);
    const completedAttemptsCount = completionRate.find(item => item.status === 'COMPLETED')?._count.id || 0;
    const completionRatePercentage = totalAttemptsCount > 0 ? (completedAttemptsCount / totalAttemptsCount) * 100 : 0;

    const kpis = {
      overview: {
        totalUsers,
        totalExams,
        totalAttempts,
        averageScore: Math.round((averageScore._avg.percentage || 0) * 100) / 100,
      },
      growth: {
        monthlyGrowth,
        weeklyActivity,
      },
      performance: {
        completionRate: Math.round(completionRatePercentage * 100) / 100,
      },
      topCategories,
    };

    res.json({
      success: true,
      data: kpis,
      message: 'KPIs retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KPIs',
      error: error.message,
    });
  }
});

module.exports = router; 