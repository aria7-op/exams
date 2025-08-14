const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const examService = require('../services/examService');
const { validateExamAttempt } = require('../validators/examValidator');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Start an exam attempt
router.post('/start', auth, async (req, res) => {
  try {
    const { examId } = req.body;
    const userId = req.user.id;

    const result = await examService.startExamAttempt(examId, userId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Exam attempt started successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Submit an answer
router.post('/:attemptId/responses', auth, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOptions, timeSpent } = req.body;
    const userId = req.user.id;

    const response = await examService.submitQuestionResponse(attemptId, questionId, selectedOptions, timeSpent, userId);
    res.status(200).json({
      success: true,
      message: 'Answer submitted successfully',
      data: response
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Submit an exam attempt
router.post('/:attemptId/submit', auth, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    // First, submit all answers
    if (answers && typeof answers === 'object') {
      for (const [questionId, selectedOptionIndex] of Object.entries(answers)) {
        // Convert the selected option index to option ID
        // We need to get the question to find the correct option ID
        const question = await prisma.question.findUnique({
          where: { id: questionId },
          include: { options: true }
        });
        
        if (question && question.options[selectedOptionIndex]) {
          const selectedOptionId = question.options[selectedOptionIndex].id;
          await examService.submitQuestionResponse(attemptId, questionId, [selectedOptionId], 0, userId);
        }
      }
    }

    // Then complete the attempt
    const result = await examService.completeExamAttempt(attemptId, userId);
    res.status(200).json({
      success: true,
      message: 'Exam submitted successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Complete an exam attempt
router.post('/:attemptId/complete', auth, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;
    const { responses } = req.body;

    console.log('📝 Route handler - Received request:', {
      attemptId,
      userId,
      responsesCount: responses ? responses.length : 0,
      responses: responses
    });

    const result = await examService.completeExamAttempt(attemptId, userId, responses);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Exam completed successfully',
        data: {
          score: result.results.score,
          maxMarks: result.results.totalQuestions,
          percentage: result.results.percentage,
          isPassed: result.results.isPassed,
          totalQuestions: result.results.totalQuestions,
          correctAnswers: result.results.correctAnswers,
          wrongAnswers: result.results.wrongAnswers,
          unanswered: result.results.unanswered,
          totalTimeSpent: result.results.totalTimeSpent,
          averageTimePerQuestion: result.results.averageTimePerQuestion,
          timeEfficiency: result.results.timeEfficiency,
          accuracy: result.results.accuracy,
          speedScore: result.results.speedScore,
          consistencyScore: result.results.consistencyScore,
          difficultyScore: result.results.difficultyScore,
          grade: result.results.grade,
          easyCorrect: result.results.easyCorrect,
          easyTotal: result.results.easyTotal,
          mediumCorrect: result.results.mediumCorrect,
          mediumTotal: result.results.mediumTotal,
          hardCorrect: result.results.hardCorrect,
          hardTotal: result.results.hardTotal,
          attempt: result.attempt,
          examScore: result.examScore,
          certificate: result.certificate
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get attempt details/results
router.get('/:attemptId', auth, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    const result = await examService.getExamResults(attemptId, userId);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Get user's exam history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const history = await examService.getUserExamHistory(userId, { page, limit, status });
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 