const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all exam categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.examCategory.findMany({
      include: {
        _count: {
          select: {
            exams: true,
            questions: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: categories,
      message: 'Exam categories retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching exam categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam categories',
      error: error.message,
    });
  }
});

// Get exam category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.examCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        exams: {
          include: {
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
        questions: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            exams: true,
            questions: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Exam category not found',
      });
    }

    res.json({
      success: true,
      data: category,
      message: 'Exam category retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching exam category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam category',
      error: error.message,
    });
  }
});

// Create new exam category
router.post('/', async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    // Check if category already exists
    const existingCategory = await prisma.examCategory.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists',
      });
    }

    const category = await prisma.examCategory.create({
      data: {
        name,
        description,
        color,
        icon,
      },
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Exam category created successfully',
    });
  } catch (error) {
    console.error('Error creating exam category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create exam category',
      error: error.message,
    });
  }
});

// Update exam category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    // Check if category exists
    const existingCategory = await prisma.examCategory.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Exam category not found',
      });
    }

    // Check if name is already taken by another category
    const nameExists = await prisma.examCategory.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        id: {
          not: parseInt(id),
        },
      },
    });

    if (nameExists) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists',
      });
    }

    const category = await prisma.examCategory.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        color,
        icon,
      },
    });

    res.json({
      success: true,
      data: category,
      message: 'Exam category updated successfully',
    });
  } catch (error) {
    console.error('Error updating exam category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update exam category',
      error: error.message,
    });
  }
});

// Delete exam category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await prisma.examCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            exams: true,
            questions: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Exam category not found',
      });
    }

    // Check if category has associated exams or questions
    if (existingCategory._count.exams > 0 || existingCategory._count.questions > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete category with associated exams or questions',
        data: {
          examsCount: existingCategory._count.exams,
          questionsCount: existingCategory._count.questions,
        },
      });
    }

    await prisma.examCategory.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: 'Exam category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting exam category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete exam category',
      error: error.message,
    });
  }
});

// Get exams by category
router.get('/:id/exams', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      categoryId: parseInt(id),
    };

    if (status) {
      where.status = status;
    }

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        include: {
          category: true,
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.exam.count({ where }),
    ]);

    res.json({
      success: true,
      data: exams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      message: 'Exams retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching exams by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exams by category',
      error: error.message,
    });
  }
});

// Get questions by category
router.get('/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, difficulty, type } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      categoryId: parseInt(id),
    };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (type) {
      where.type = type;
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          category: true,
          tags: true,
        },
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.question.count({ where }),
    ]);

    res.json({
      success: true,
      data: questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      message: 'Questions retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching questions by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions by category',
      error: error.message,
    });
  }
});

// Get category statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await prisma.examCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            exams: true,
            questions: true,
          },
        },
        exams: {
          include: {
            _count: {
              select: {
                attempts: true,
              },
            },
          },
        },
        questions: {
          select: {
            difficulty: true,
            type: true,
          },
        },
      },
    });

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Exam category not found',
      });
    }

    // Calculate additional statistics
    const totalAttempts = stats.exams.reduce((sum, exam) => sum + exam._count.attempts, 0);
    const difficultyDistribution = stats.questions.reduce((acc, question) => {
      acc[question.difficulty] = (acc[question.difficulty] || 0) + 1;
      return acc;
    }, {});
    const typeDistribution = stats.questions.reduce((acc, question) => {
      acc[question.type] = (acc[question.type] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        ...stats,
        totalAttempts,
        difficultyDistribution,
        typeDistribution,
      },
      message: 'Category statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching category statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category statistics',
      error: error.message,
    });
  }
});

module.exports = router; 