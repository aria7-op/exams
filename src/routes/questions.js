const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all questions
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      categoryId, 
      difficulty, 
      type, 
      search,
      tags,
      status 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Apply filters
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          text: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          explanation: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      where.tags = {
        some: {
          name: {
            in: tagArray,
          },
        },
      };
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          category: true,
          tags: true,
          _count: {
            select: {
              examQuestions: true,
            },
          },
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
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: error.message,
    });
  }
});

// Get question by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const question = await prisma.question.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        tags: true,
        examQuestions: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            examQuestions: true,
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    res.json({
      success: true,
      data: question,
      message: 'Question retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question',
      error: error.message,
    });
  }
});

// Create new question
router.post('/', async (req, res) => {
  try {
    const {
      text,
      type,
      difficulty,
      categoryId,
      options,
      correctAnswer,
      explanation,
      tags,
      points,
      timeLimit,
    } = req.body;

    if (!text || !type || !difficulty || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Text, type, difficulty, and category are required',
      });
    }

    // Validate question type and options
    if (type === 'MULTIPLE_CHOICE' && (!options || options.length < 2)) {
      return res.status(400).json({
        success: false,
        message: 'Multiple choice questions must have at least 2 options',
      });
    }

    if (type === 'MULTIPLE_CHOICE' && !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Correct answer is required for multiple choice questions',
      });
    }

    // Check if category exists
    const category = await prisma.examCategory.findUnique({
      where: { id: parseInt(categoryId) },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Create question with tags
    const questionData = {
      text,
      type,
      difficulty,
      categoryId: parseInt(categoryId),
      options: options || [],
      correctAnswer,
      explanation,
      points: points || 1,
      timeLimit: timeLimit || null,
      status: 'ACTIVE',
    };

    if (tags && tags.length > 0) {
      questionData.tags = {
        connectOrCreate: tags.map(tag => ({
          where: { name: tag },
          create: { name: tag },
        })),
      };
    }

    const question = await prisma.question.create({
      data: questionData,
      include: {
        category: true,
        tags: true,
      },
    });

    res.status(201).json({
      success: true,
      data: question,
      message: 'Question created successfully',
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create question',
      error: error.message,
    });
  }
});

// Update question
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      text,
      type,
      difficulty,
      categoryId,
      options,
      correctAnswer,
      explanation,
      tags,
      points,
      timeLimit,
      status,
    } = req.body;

    // Check if question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Validate question type and options
    if (type === 'MULTIPLE_CHOICE' && (!options || options.length < 2)) {
      return res.status(400).json({
        success: false,
        message: 'Multiple choice questions must have at least 2 options',
      });
    }

    if (type === 'MULTIPLE_CHOICE' && !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Correct answer is required for multiple choice questions',
      });
    }

    // Check if category exists
    if (categoryId) {
      const category = await prisma.examCategory.findUnique({
        where: { id: parseInt(categoryId) },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }
    }

    // Update question
    const updateData = {
      text,
      type,
      difficulty,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      options: options || [],
      correctAnswer,
      explanation,
      points: points || 1,
      timeLimit: timeLimit || null,
      status,
    };

    if (tags) {
      // Disconnect all existing tags
      await prisma.question.update({
        where: { id: parseInt(id) },
        data: {
          tags: {
            set: [],
          },
        },
      });

      // Connect new tags
      if (tags.length > 0) {
        updateData.tags = {
          connectOrCreate: tags.map(tag => ({
            where: { name: tag },
            create: { name: tag },
          })),
        };
      }
    }

    const question = await prisma.question.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        category: true,
        tags: true,
      },
    });

    res.json({
      success: true,
      data: question,
      message: 'Question updated successfully',
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question',
      error: error.message,
    });
  }
});

// Delete question
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            examQuestions: true,
          },
        },
      },
    });

    if (!existingQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Check if question is used in exams
    if (existingQuestion._count.examQuestions > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete question that is used in exams',
        data: {
          examCount: existingQuestion._count.examQuestions,
        },
      });
    }

    await prisma.question.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question',
      error: error.message,
    });
  }
});

// Bulk delete questions
router.delete('/bulk', async (req, res) => {
  try {
    const { questionIds } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question IDs array is required',
      });
    }

    // Check if any questions are used in exams
    const questionsInExams = await prisma.examQuestion.findMany({
      where: {
        questionId: {
          in: questionIds.map(id => parseInt(id)),
        },
      },
      select: {
        questionId: true,
      },
    });

    if (questionsInExams.length > 0) {
      const usedQuestionIds = [...new Set(questionsInExams.map(q => q.questionId))];
      return res.status(409).json({
        success: false,
        message: 'Some questions are used in exams and cannot be deleted',
        data: {
          usedQuestionIds,
        },
      });
    }

    await prisma.question.deleteMany({
      where: {
        id: {
          in: questionIds.map(id => parseInt(id)),
        },
      },
    });

    res.json({
      success: true,
      message: 'Questions deleted successfully',
    });
  } catch (error) {
    console.error('Error bulk deleting questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete questions',
      error: error.message,
    });
  }
});

// Search questions
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      OR: [
        {
          text: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          explanation: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          tags: {
            some: {
              name: {
                contains: q,
                mode: 'insensitive',
              },
            },
          },
        },
      ],
    };

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
      message: 'Search completed successfully',
    });
  } catch (error) {
    console.error('Error searching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search questions',
      error: error.message,
    });
  }
});

// Get questions by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10, difficulty, type } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      categoryId: parseInt(categoryId),
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

// Get questions by difficulty
router.get('/difficulty/:difficulty', async (req, res) => {
  try {
    const { difficulty } = req.params;
    const { page = 1, limit = 10, categoryId, type } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      difficulty,
    };

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
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
    console.error('Error fetching questions by difficulty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions by difficulty',
      error: error.message,
    });
  }
});

// Get questions by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10, categoryId, difficulty } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      type,
    };

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (difficulty) {
      where.difficulty = difficulty;
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
    console.error('Error fetching questions by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions by type',
      error: error.message,
    });
  }
});

// Get question tags
router.get('/tags', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
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
      data: tags,
      message: 'Question tags retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching question tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question tags',
      error: error.message,
    });
  }
});

// Get question statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await prisma.question.findUnique({
      where: { id: parseInt(id) },
      include: {
        examQuestions: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            examQuestions: true,
          },
        },
      },
    });

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    res.json({
      success: true,
      data: stats,
      message: 'Question statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching question statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question statistics',
      error: error.message,
    });
  }
});

// Get question bank statistics
router.get('/bank/stats', async (req, res) => {
  try {
    const [totalQuestions, questionsByCategory, questionsByDifficulty, questionsByType] = await Promise.all([
      prisma.question.count(),
      prisma.question.groupBy({
        by: ['categoryId'],
        _count: {
          id: true,
        },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.question.groupBy({
        by: ['difficulty'],
        _count: {
          id: true,
        },
      }),
      prisma.question.groupBy({
        by: ['type'],
        _count: {
          id: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalQuestions,
        questionsByCategory,
        questionsByDifficulty,
        questionsByType,
      },
      message: 'Question bank statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching question bank statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question bank statistics',
      error: error.message,
    });
  }
});

module.exports = router; 