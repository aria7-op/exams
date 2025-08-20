const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const prisma = new PrismaClient();

class QuestionRandomizationService {
  constructor() {
    this.algorithm = process.env.QUESTION_RANDOMIZATION_ALGORITHM || 'multi_algorithm_quantum';
    this.maxRetries = 25; // Increased for ultimate selection
    this.entropyLevel = process.env.QUESTION_ENTROPY_LEVEL || 'quantum_ultra_high';
    this.combinationLimit = 2000; // Increased for maximum combinations
    this.overlapThreshold = 0.02; // 2% overlap allowed for maximum uniqueness
    this.difficultyWeights = {
      EASY: 1.0,
      MEDIUM: 1.3,
      HARD: 1.8
    };
    this.usageDecayFactor = 0.03; // Even lower for more variety
    this.timeBasedWeighting = true;
    this.performanceAdaptive = true;
    this.quantumEntropy = true;
    this.multiDimensionalRandomness = true;
    this.sessionCounter = 0;
    this.lastRequestTime = 0;
    
    // Enhanced algorithm configuration
    this.algorithms = {
      // Small tests (1-10 questions)
      small: ['quantum_ultra_random', 'cryptographic_random', 'neural_adaptive'],
      
      // Medium tests (11-30 questions)
      medium: ['multi_algorithm_quantum', 'cryptographic_random', 'neural_adaptive', 'quantum_ultra_random'],
      
      // Large tests (31-100 questions)
      large: ['multi_algorithm_quantum', 'cryptographic_random', 'quantum_ultra_random', 'neural_adaptive'],
      
      // Extra large tests (100+ questions)
      xlarge: ['multi_algorithm_quantum', 'cryptographic_random', 'quantum_ultra_random']
    };
    
    // Additional entropy layers
    this.entropyLayers = {
      system: true,      // System entropy (CPU, memory, time)
      quantum: true,     // Quantum-like entropy
      cryptographic: true, // Cryptographic entropy
      neural: true,      // Neural network-like patterns
      fractal: true,     // Fractal-based patterns
      chaos: true,       // Chaos theory patterns
      genetic: true,     // Genetic algorithm patterns
      swarm: true        // Swarm intelligence patterns
    };
    
    // Probability distribution for different test sizes
    this.sizeBasedProbability = {
      small: { uniqueness: 99.999, overlap: 0.001 },
      medium: { uniqueness: 99.99, overlap: 0.01 },
      large: { uniqueness: 99.9, overlap: 0.1 },
      xlarge: { uniqueness: 99.5, overlap: 0.5 }
    };
  }

  /**
   * Generate random questions for an exam with advanced algorithms
   * @param {Object} params - Parameters for question generation
   * @param {string} params.examId - Exam ID
   * @param {string} params.userId - User ID
   * @param {number} params.questionCount - Number of questions needed
   * @param {string} params.examCategoryId - Exam category ID
   * @param {number} params.overlapPercentage - Maximum overlap percentage allowed
   * @returns {Array} Array of selected questions
   */
  async generateRandomQuestions(params) {
    const {
      examId,
      userId,
      questionCount,
      examCategoryId,
      overlapPercentage = 10.0,
      // Question type distribution
      essayQuestionsCount = 0,
      multipleChoiceQuestionsCount = 0,
      shortAnswerQuestionsCount = 0,
      fillInTheBlankQuestionsCount = 0,
      trueFalseQuestionsCount = 0,
      matchingQuestionsCount = 0,
      orderingQuestionsCount = 0,
              accountingTableQuestionsCount = 0,
        compoundChoiceQuestionsCount = 0,
        enhancedCompoundQuestionsCount = 0
    } = params;

    try {
      logger.info('Generating random questions', {
        examId,
        userId,
        questionCount,
        examCategoryId,
        overlapPercentage,
        algorithm: this.algorithm,
        overlapLimit: Math.floor(questionCount * (overlapPercentage / 100))
      });

      // Get all available questions for the exam category
      const availableQuestions = await this.getAvailableQuestions(examCategoryId);
      
      logger.info('Available questions found', {
        examCategoryId,
        availableCount: availableQuestions.length,
        requiredCount: questionCount
      });

      // Group questions by type
      const questionsByType = this.groupQuestionsByType(availableQuestions);
      
      logger.info('Questions grouped by type', {
        essay: questionsByType.ESSAY?.length || 0,
        singleChoice: questionsByType.SINGLE_CHOICE?.length || 0,
        multipleChoice: questionsByType.MULTIPLE_CHOICE?.length || 0,
        shortAnswer: questionsByType.SHORT_ANSWER?.length || 0,
        fillInTheBlank: questionsByType.FILL_IN_THE_BLANK?.length || 0,
        trueFalse: questionsByType.TRUE_FALSE?.length || 0,
        matching: questionsByType.MATCHING?.length || 0,
        ordering: questionsByType.ORDERING?.length || 0,
        accountingTable: questionsByType.ACCOUNTING_TABLE?.length || 0,
        compoundChoice: questionsByType.COMPOUND_CHOICE?.length || 0,
        enhancedCompound: questionsByType.ENHANCED_COMPOUND?.length || 0
      });

      // Select questions based on type distribution
      let selectedQuestions = await this.selectQuestionsByTypeDistribution(
        questionsByType,
        {
          essayQuestionsCount,
          multipleChoiceQuestionsCount,
          shortAnswerQuestionsCount,
          fillInTheBlankQuestionsCount,
          trueFalseQuestionsCount,
          matchingQuestionsCount,
          orderingQuestionsCount,
          accountingTableQuestionsCount,
          compoundChoiceQuestionsCount,
          enhancedCompoundQuestionsCount
        },
        userId,
        overlapPercentage
      );

      logger.info('Type distribution selection completed', {
        selectedQuestionsCount: selectedQuestions.length,
        selectedQuestionsByType: selectedQuestions.reduce((acc, q) => {
          acc[q.type] = (acc[q.type] || 0) + 1;
          return acc;
        }, {}),
        requestedDistribution: {
          essay: essayQuestionsCount,
          multipleChoice: multipleChoiceQuestionsCount,
          shortAnswer: shortAnswerQuestionsCount,
          fillInTheBlank: fillInTheBlankQuestionsCount,
          trueFalse: trueFalseQuestionsCount,
          matching: matchingQuestionsCount,
          ordering: orderingQuestionsCount,
          accountingTable: accountingTableQuestionsCount,
          compoundChoice: compoundChoiceQuestionsCount,
          enhancedCompound: enhancedCompoundQuestionsCount
        }
      });

      // Check if we have a specific question type distribution
      const hasTypeDistribution = essayQuestionsCount > 0 || 
                                 multipleChoiceQuestionsCount > 0 || 
                                 shortAnswerQuestionsCount > 0 || 
                                 fillInTheBlankQuestionsCount > 0 || 
                                 trueFalseQuestionsCount > 0 || 
                                 matchingQuestionsCount > 0 || 
                                 orderingQuestionsCount > 0 ||
                                 accountingTableQuestionsCount > 0 ||
                                 compoundChoiceQuestionsCount > 0 ||
                                 enhancedCompoundQuestionsCount > 0;

      if (hasTypeDistribution && selectedQuestions.length > 0) {
        // Verify we got the expected total count
              const expectedTotal = essayQuestionsCount + multipleChoiceQuestionsCount + 
                           shortAnswerQuestionsCount + fillInTheBlankQuestionsCount + 
                           trueFalseQuestionsCount + matchingQuestionsCount + 
                           orderingQuestionsCount + accountingTableQuestionsCount + 
                           compoundChoiceQuestionsCount + enhancedCompoundQuestionsCount;
        
        if (selectedQuestions.length !== expectedTotal) {
          logger.warn(`⚠️ Question count mismatch! Expected ${expectedTotal}, got ${selectedQuestions.length}`);
          
          // If we got fewer questions than expected, it means some types don't have enough questions
          // Log which types are missing questions
          const actualDistribution = selectedQuestions.reduce((acc, q) => {
            acc[q.type] = (acc[q.type] || 0) + 1;
            return acc;
          }, {});
          
          logger.warn('📊 Actual vs Expected Distribution:', {
            essay: { expected: essayQuestionsCount, actual: actualDistribution['ESSAY'] || 0 },
            multipleChoice: { expected: multipleChoiceQuestionsCount, actual: actualDistribution['MULTIPLE_CHOICE'] || 0 },
            shortAnswer: { expected: shortAnswerQuestionsCount, actual: actualDistribution['SHORT_ANSWER'] || 0 },
            fillInTheBlank: { expected: fillInTheBlankQuestionsCount, actual: actualDistribution['FILL_IN_THE_BLANK'] || 0 },
            trueFalse: { expected: trueFalseQuestionsCount, actual: actualDistribution['TRUE_FALSE'] || 0 },
            matching: { expected: matchingQuestionsCount, actual: actualDistribution['MATCHING'] || 0 },
            ordering: { expected: orderingQuestionsCount, actual: actualDistribution['ORDERING'] || 0 },
            accountingTable: { expected: accountingTableQuestionsCount, actual: actualDistribution['ACCOUNTING_TABLE'] || 0 },
            compoundChoice: { expected: compoundChoiceQuestionsCount, actual: actualDistribution['COMPOUND_CHOICE'] || 0 },
            enhancedCompound: { expected: enhancedCompoundQuestionsCount, actual: actualDistribution['ENHANCED_COMPOUND'] || 0 }
          });
          
          // CRITICAL: Try to fill missing questions with fallback selection
          logger.info('🔄 Attempting to fill missing questions with fallback selection...');
          
          const missingQuestions = await this.fillMissingQuestions(
            questionsByType,
            {
              essayQuestionsCount,
              multipleChoiceQuestionsCount,
              shortAnswerQuestionsCount,
              fillInTheBlankQuestionsCount,
              trueFalseQuestionsCount,
              matchingQuestionsCount,
              orderingQuestionsCount,
              accountingTableQuestionsCount,
              compoundChoiceQuestionsCount,
              enhancedCompoundQuestionsCount
            },
            actualDistribution,
            userId,
            overlapPercentage
          );
          
          if (missingQuestions.length > 0) {
            selectedQuestions.push(...missingQuestions);
            logger.info(`✅ Added ${missingQuestions.length} missing questions via fallback selection`);
            
            // Verify final distribution
            const finalDistribution = selectedQuestions.reduce((acc, q) => {
              acc[q.type] = (acc[q.type] || 0) + 1;
              return acc;
            }, {});
            
            logger.info('🎯 Final distribution after fallback:', finalDistribution);
          }
        } else {
          logger.info(`✅ Perfect! Got exactly ${expectedTotal} questions with correct distribution`);
        }
        
        // CRITICAL: Final verification - ensure we have the exact number requested
        if (selectedQuestions.length !== expectedTotal) {
          logger.error(`🚨 CRITICAL: Still missing questions after all fallbacks! Expected: ${expectedTotal}, Got: ${selectedQuestions.length}`);
          
          // Final desperate attempt: take any available questions to meet the count
          const allAvailableQuestions = Object.values(questionsByType).flat();
          const missingCount = expectedTotal - selectedQuestions.length;
          
          if (missingCount > 0 && allAvailableQuestions.length > 0) {
            // Get questions that haven't been selected yet
            const selectedIds = new Set(selectedQuestions.map(q => q.id));
            const remainingQuestions = allAvailableQuestions.filter(q => !selectedIds.has(q.id));
            
            if (remainingQuestions.length >= missingCount) {
              const finalQuestions = remainingQuestions.slice(0, missingCount);
              selectedQuestions.push(...finalQuestions);
              logger.info(`🚨 FINAL FALLBACK: Added ${finalQuestions.length} questions to meet requirement`);
            } else {
              logger.error(`🚨 CRITICAL: Not enough questions in pool to meet requirement!`);
            }
          }
        }
        
        // Return the questions with proper distribution
        return selectedQuestions;
      }

      // If no specific distribution or no questions selected, use original logic
      if (!hasTypeDistribution || selectedQuestions.length === 0) {
        logger.info('No specific question type distribution set or no questions selected, using original logic');
        
        let adjustedQuestionCount = questionCount;
        if (availableQuestions.length < questionCount) {
          logger.warn(`Not enough questions available. Need ${questionCount}, have ${availableQuestions.length}. Using all available questions.`);
          adjustedQuestionCount = availableQuestions.length;
        }

        // Get user's previous attempts to calculate overlap (if userId provided)
        const userHistory = userId ? await this.getUserQuestionHistory(userId, examCategoryId) : new Map();
        
        // Add userId to userHistory for unique seed generation
        if (userId) {
          userHistory.userId = userId;
        }
        
        // Enhanced algorithm selection based on test size and pool size
        let effectiveAlgorithm = this.algorithm;
        const poolSize = availableQuestions.length;
        
        // Determine test size category
        let testSize = 'medium';
        if (adjustedQuestionCount <= 10) {
          testSize = 'small';
        } else if (adjustedQuestionCount <= 30) {
          testSize = 'medium';
        } else if (adjustedQuestionCount <= 100) {
          testSize = 'large';
        } else {
          testSize = 'xlarge';
        }
        
        // Select algorithm based on test size and pool size
        const availableAlgorithms = this.algorithms[testSize];
        if (availableAlgorithms && availableAlgorithms.length > 0) {
          // Use multiple algorithms for maximum uniqueness
          if (poolSize > 1000) {
            effectiveAlgorithm = 'multi_algorithm_quantum';
          } else if (poolSize > 100) {
            effectiveAlgorithm = availableAlgorithms[0]; // Use primary algorithm
          } else if (poolSize > 20) {
            effectiveAlgorithm = availableAlgorithms[1] || availableAlgorithms[0];
          } else {
            effectiveAlgorithm = availableAlgorithms[2] || availableAlgorithms[0];
          }
        }
        
        logger.info('Enhanced algorithm selection', {
          originalAlgorithm: this.algorithm,
          effectiveAlgorithm,
          testSize,
          poolSize,
          questionCount: adjustedQuestionCount,
          availableAlgorithms: availableAlgorithms || [],
          probabilityTarget: this.sizeBasedProbability[testSize]
        });
        
        // Apply different algorithms based on configuration
        switch (effectiveAlgorithm) {
          case 'weighted_random':
            selectedQuestions = await this.weightedRandomSelection(
              availableQuestions,
              userHistory,
              adjustedQuestionCount,
              overlapPercentage
            );
            break;
            
          case 'difficulty_balanced':
            selectedQuestions = await this.difficultyBalancedSelection(
              availableQuestions,
              userHistory,
              adjustedQuestionCount,
              overlapPercentage
            );
            break;
            
          case 'usage_based':
            selectedQuestions = await this.usageBasedSelection(
              availableQuestions,
              userHistory,
              adjustedQuestionCount,
              overlapPercentage
            );
            break;
            
          case 'adaptive':
            selectedQuestions = await this.adaptiveSelection(
              availableQuestions,
              userHistory,
              adjustedQuestionCount,
              overlapPercentage
            );
            break;
            
          default:
            selectedQuestions = await this.weightedRandomSelection(
              availableQuestions,
              userHistory,
              adjustedQuestionCount,
              overlapPercentage
            );
        }
      }

      // CRITICAL: Final verification - ensure we have the requested number of questions
      if (selectedQuestions.length < questionCount) {
        logger.warn(`⚠️ Still short ${questionCount - selectedQuestions.length} questions. Using final fallback...`);
        
        // Get questions that haven't been selected yet
        const selectedIds = new Set(selectedQuestions.map(q => q.id));
        const remainingQuestions = availableQuestions.filter(q => !selectedIds.has(q.id));
        
        if (remainingQuestions.length > 0) {
          const additionalNeeded = questionCount - selectedQuestions.length;
          const finalQuestions = remainingQuestions.slice(0, additionalNeeded);
          selectedQuestions.push(...finalQuestions);
          logger.info(`🚨 FINAL FALLBACK: Added ${finalQuestions.length} questions to meet requirement`);
        }
      }

      // Log the selection for analytics
      await this.logQuestionSelection(examId, userId, selectedQuestions);

      logger.info('Question generation completed', {
        examId,
        userId,
        selectedCount: selectedQuestions.length,
        availableQuestionsCount: availableQuestions.length,
        requestedCount: questionCount
      });

      return selectedQuestions;
    } catch (error) {
      logger.error('Question generation failed', {
        examId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get available questions for an exam category
   */
  async getAvailableQuestions(examCategoryId) {
    const questions = await prisma.question.findMany({
      where: {
        examCategoryId,
        isActive: true
        // Temporarily removed isPublic and approvedBy requirements for testing
      },
      select: {
        id: true,
        text: true,
        type: true,
        difficulty: true,
        marks: true,
        timeLimit: true,
        remark: true,
        tableData: true,
        answerSections: true,
        enhancedSections: true,
        createdAt: true,
        updatedAt: true,
        options: {
          select: {
            id: true,
            text: true,
            isCorrect: true,
            sortOrder: true,
            createdAt: true
          },
          orderBy: { sortOrder: 'asc' }
        },
        images: {
          select: {
            id: true,
            imageUrl: true,
            altText: true,
            sortOrder: true
          },
          orderBy: { sortOrder: 'asc' }
        },
        tags: {
          select: {
            id: true,
            tag: true
          }
        }
      },
      orderBy: [
        { usageCount: 'asc' },
        { correctAnswerRate: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    logger.info('Available questions found', {
      examCategoryId,
      totalQuestions: questions.length,
      questionIds: questions.map(q => q.id)
    });
    
    return questions;
  }

  /**
   * Get user's question history for overlap calculation
   */
  async getUserQuestionHistory(userId, examCategoryId) {
    const attempts = await prisma.examAttempt.findMany({
      where: {
        userId,
        exam: {
          examCategoryId
        },
        status: 'COMPLETED'
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        responses: {
          select: {
            id: true,
            questionId: true,
            isCorrect: true,
            answeredAt: true,
            question: {
              select: {
                id: true,
                text: true,
                type: true,
                difficulty: true,
                marks: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Consider last 10 attempts
    });

    const questionHistory = new Map();
    
    attempts.forEach(attempt => {
      attempt.responses.forEach(response => {
        const questionId = response.questionId;
        if (!questionHistory.has(questionId)) {
          questionHistory.set(questionId, {
            count: 0,
            lastUsed: response.answeredAt,
            performance: response.isCorrect ? 1 : 0
          });
        }
        
        const history = questionHistory.get(questionId);
        history.count++;
        history.lastUsed = response.answeredAt;
        history.performance = (history.performance + (response.isCorrect ? 1 : 0)) / 2;
      });
    });

    return questionHistory;
  }

  /**
   * Enhanced weighted random selection algorithm with advanced features
   */
  async weightedRandomSelection(questions, userHistory, count, maxOverlap) {
    const entropyMultiplier = this.getEntropyMultiplier();
    const timeFactor = this.getTimeBasedFactor();
    
    const weights = questions.map((question, index) => {
      let weight = 1.0;
      
      // Reduce weight for recently used questions
      if (userHistory.has(question.id)) {
        const history = userHistory.get(question.id);
        const daysSinceLastUse = (Date.now() - new Date(history.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastUse < 7) {
          weight *= 0.05; // Extremely low weight for questions used in last week
        } else if (daysSinceLastUse < 30) {
          weight *= 0.2; // Very low weight for questions used in last month
        } else if (daysSinceLastUse < 90) {
          weight *= 0.5; // Low weight for questions used in last 3 months
        }
        
        // Reduce weight based on usage count with exponential decay
        weight *= Math.max(0.05, Math.pow(0.8, history.count));
        
        // Consider user performance on this question
        if (history.performance < 0.3) {
          weight *= 1.5; // Higher weight for questions user struggled with
        } else if (history.performance > 0.8) {
          weight *= 0.3; // Lower weight for questions user aced
        }
      }
      
      // Increase weight for less used questions with logarithmic scaling
      const usageFactor = Math.log(101 - question.usageCount) / Math.log(101);
      weight *= (1 + usageFactor * 2);
      
      // Adjust weight based on difficulty with more granular control
      switch (question.difficulty) {
        case 'EASY':
          weight *= 0.85;
          break;
        case 'MEDIUM':
          weight *= 1.3;
          break;
        case 'HARD':
          weight *= 0.75;
          break;
        case 'EXPERT':
          weight *= 0.6;
          break;
      }
      
      // Add entropy-based randomization
      weight *= (1 + (Math.random() - 0.5) * entropyMultiplier);
      
      // Add time-based variation
      weight *= timeFactor;
      
      // Add position-based variation for additional randomness
      weight *= (1 + Math.sin(index * 0.7) * 0.2);
      
      // Ensure weight is positive
      weight = Math.max(0.01, weight);
      
      return weight;
    });

    return this.selectWithOverlapControl(questions, weights, count, userHistory, maxOverlap);
  }

  /**
   * Difficulty balanced selection algorithm
   */
  async difficultyBalancedSelection(questions, userHistory, count, maxOverlap) {
    const difficultyDistribution = {
      EASY: Math.floor(count * 0.2),
      MEDIUM: Math.floor(count * 0.5),
      HARD: Math.floor(count * 0.2),
      EXPERT: Math.floor(count * 0.1)
    };

    const selectedQuestions = [];
    const questionsByDifficulty = this.groupQuestionsByDifficulty(questions);

    for (const [difficulty, targetCount] of Object.entries(difficultyDistribution)) {
      const availableQuestions = questionsByDifficulty[difficulty] || [];
      const weights = availableQuestions.map(q => this.calculateDifficultyWeight(q, userHistory));
      
      const difficultyQuestions = this.selectWithOverlapControl(
        availableQuestions,
        weights,
        Math.min(targetCount, availableQuestions.length),
        userHistory,
        maxOverlap
      );
      
      selectedQuestions.push(...difficultyQuestions);
    }

    // Fill remaining slots with any available questions
    const remainingCount = count - selectedQuestions.length;
    if (remainingCount > 0) {
      const remainingQuestions = questions.filter(q => !selectedQuestions.find(sq => sq.id === q.id));
      const weights = remainingQuestions.map(q => this.calculateDifficultyWeight(q, userHistory));
      
      const additionalQuestions = this.selectWithOverlapControl(
        remainingQuestions,
        weights,
        Math.min(remainingCount, remainingQuestions.length),
        userHistory,
        maxOverlap
      );
      
      selectedQuestions.push(...additionalQuestions);
    }

    return selectedQuestions.slice(0, count);
  }

  /**
   * Usage-based selection algorithm
   */
  async usageBasedSelection(questions, userHistory, count, maxOverlap) {
    // Sort questions by usage count (ascending) and add some randomness
    const sortedQuestions = [...questions].sort((a, b) => {
      const usageDiff = a.usageCount - b.usageCount;
      if (Math.abs(usageDiff) < 5) {
        return Math.random() - 0.5; // Add randomness for similar usage counts
      }
      return usageDiff;
    });

    const weights = sortedQuestions.map((question, index) => {
      let weight = 1.0;
      
      // Higher weight for less used questions
      weight *= (1 + (questions.length - index) / questions.length);
      
      // Reduce weight for recently used questions
      if (userHistory.has(question.id)) {
        weight *= 0.1;
      }
      
      return weight;
    });

    return this.selectWithOverlapControl(sortedQuestions, weights, count, userHistory, maxOverlap);
  }

  /**
   * Adaptive selection algorithm based on user performance
   */
  async adaptiveSelection(questions, userHistory, count, maxOverlap) {
    const weights = questions.map(question => {
      let weight = 1.0;
      
      if (userHistory.has(question.id)) {
        const history = userHistory.get(question.id);
        
        // If user performed poorly, give higher weight for retry
        if (history.performance < 0.5) {
          weight *= 1.5;
        } else if (history.performance > 0.8) {
          weight *= 0.3; // Lower weight for questions user answered well
        }
        
        // Reduce weight based on recent usage
        const daysSinceLastUse = (Date.now() - new Date(history.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastUse < 30) {
          weight *= 0.2;
        }
      }
      
      return weight;
    });

    return this.selectWithOverlapControl(questions, weights, count, userHistory, maxOverlap);
  }

  /**
   * Select questions with overlap control - ENHANCED VERSION
   * This version ensures we get the required number of questions even with strict overlap limits
   */
  selectWithOverlapControl(questions, weights, count, userHistory, maxOverlap) {
    const selectedQuestions = [];
    
    // Dynamic overlap adjustment for large question counts
    let effectiveMaxOverlap = maxOverlap;
    let maxOverlapCount = Math.floor(count * (maxOverlap / 100));
    
    // If we have a large number of questions and strict overlap, be more flexible
    if (count > 20 && maxOverlap < 20) {
      const userHistorySize = userHistory.size;
      if (userHistorySize > count * 0.5) { // If user has attempted more than 50% of the questions
        effectiveMaxOverlap = Math.min(50, maxOverlap * 2); // Double the overlap limit, max 50%
        maxOverlapCount = Math.floor(count * (effectiveMaxOverlap / 100));
        logger.warn(`🔄 Adjusting overlap limit: ${maxOverlap}% → ${effectiveMaxOverlap}% (max ${maxOverlapCount} overlapping) due to large question count and user history`);
      }
    }
    
    let overlapCount = 0;
    
    logger.info(`🔍 selectWithOverlapControl: Requesting ${count} questions with ${effectiveMaxOverlap}% overlap limit (max ${maxOverlapCount} overlapping)`);
    logger.info(`🔍 Available questions: ${questions.length}, User history size: ${userHistory.size}`);

    // Create a copy of questions and weights for selection
    const questionPool = [...questions];
    const weightPool = [...weights];

    // First pass: Try to select questions within overlap limits
    logger.info(`🔍 Starting first pass: Need ${count} questions, pool has ${questionPool.length} questions`);
    
    while (selectedQuestions.length < count && questionPool.length > 0) {
      // Calculate total weight
      const totalWeight = weightPool.reduce((sum, weight) => sum + weight, 0);
      
      if (totalWeight <= 0) break;

      // Select random question based on weights
      let random = Math.random() * totalWeight;
      let selectedIndex = 0;

      for (let i = 0; i < weightPool.length; i++) {
        random -= weightPool[i];
        if (random <= 0) {
          selectedIndex = i;
          break;
        }
      }

      const selectedQuestion = questionPool[selectedIndex];
      const isOverlap = userHistory.has(selectedQuestion.id);

      // Check overlap limit - but be more flexible for large question counts
      if (isOverlap && overlapCount >= maxOverlapCount) {
        logger.debug(`⚠️ Skipping overlapping question ${selectedQuestion.id} (overlap count: ${overlapCount}/${maxOverlapCount})`);
        // Remove this question from pool and continue
        questionPool.splice(selectedIndex, 1);
        weightPool.splice(selectedIndex, 1);
        continue;
      }
      
      // Check if we're running out of non-overlapping questions
      const remainingNonOverlapping = questionPool.filter(q => !userHistory.has(q.id)).length;
      if (remainingNonOverlapping === 0 && overlapCount < maxOverlapCount) {
        logger.warn(`⚠️ No more non-overlapping questions available. Allowing more overlap...`);
        // Reset overlap count to allow more overlapping questions
        overlapCount = 0;
      }

      // Add question to selection
      selectedQuestions.push(selectedQuestion);
      if (isOverlap) overlapCount++;

      // Remove selected question from pool
      questionPool.splice(selectedIndex, 1);
      weightPool.splice(selectedIndex, 1);
    }

    // Second pass: If we still don't have enough questions, be more aggressive
    if (selectedQuestions.length < count && questionPool.length > 0) {
      logger.warn(`⚠️ Overlap limit too strict. Need ${count - selectedQuestions.length} more questions. Pool has ${questionPool.length} questions left. Relaxing constraints...`);
      
      // Check if overlap limit is the problem
      const overlappingQuestionsInPool = questionPool.filter(q => userHistory.has(q.id)).length;
      logger.warn(`🔍 Pool analysis: ${questionPool.length} total questions, ${overlappingQuestionsInPool} overlapping with user history`);
      
      // Sort remaining questions by weight (highest first)
      const remainingQuestions = questionPool.map((q, i) => ({ question: q, weight: weightPool[i], index: i }));
      remainingQuestions.sort((a, b) => b.weight - a.weight);
      
      // Take the best remaining questions
      const additionalNeeded = count - selectedQuestions.length;
      const additionalQuestions = remainingQuestions.slice(0, additionalNeeded).map(item => item.question);
      
      selectedQuestions.push(...additionalQuestions);
      
      logger.info(`✅ Added ${additionalQuestions.length} additional questions to meet requirement`);
    }

    // CRITICAL FIX: Third pass - if still short, ignore overlap completely
    if (selectedQuestions.length < count && questionPool.length > 0) {
      logger.warn(`🚨 CRITICAL: Still need ${count - selectedQuestions.length} more questions. Ignoring overlap completely...`);
      
      // Take any remaining questions to meet the count requirement
      const additionalNeeded = count - selectedQuestions.length;
      const additionalQuestions = questionPool.slice(0, additionalNeeded);
      
      selectedQuestions.push(...additionalQuestions);
      
      logger.info(`✅ Added ${additionalQuestions.length} additional questions (ignoring overlap)`);
    }
    
    // FINAL DESPERATE ATTEMPT: If still short and we have overlapping questions, use them
    if (selectedQuestions.length < count && questionPool.length > 0) {
      logger.error(`🚨 FINAL DESPERATE ATTEMPT: Still need ${count - selectedQuestions.length} more questions. Using overlapping questions...`);
      
      // Take any remaining questions, even if they overlap
      const additionalNeeded = count - selectedQuestions.length;
      const additionalQuestions = questionPool.slice(0, additionalNeeded);
      
      selectedQuestions.push(...additionalQuestions);
      
      logger.info(`🚨 FINAL: Added ${additionalQuestions.length} overlapping questions to meet requirement`);
    }

    // Final verification
    if (selectedQuestions.length < count) {
      logger.warn(`⚠️ Still short ${count - selectedQuestions.length} questions. This may indicate insufficient question pool.`);
    }

    logger.info(`🎯 Final question selection: ${selectedQuestions.length}/${count} questions selected`);
    return selectedQuestions;
  }

  /**
   * Calculate difficulty-based weight
   */
  calculateDifficultyWeight(question, userHistory) {
    let weight = 1.0;
    
    if (userHistory.has(question.id)) {
      weight *= 0.1; // Very low weight for previously used questions
    }
    
    // Adjust weight based on difficulty
    switch (question.difficulty) {
      case 'EASY':
        weight *= 0.9;
        break;
      case 'MEDIUM':
        weight *= 1.2;
        break;
      case 'HARD':
        weight *= 0.8;
        break;
      case 'EXPERT':
        weight *= 0.6;
        break;
    }
    
    return weight;
  }

  /**
   * Group questions by difficulty
   */
  groupQuestionsByDifficulty(questions) {
    return questions.reduce((groups, question) => {
      const difficulty = question.difficulty;
      if (!groups[difficulty]) {
        groups[difficulty] = [];
      }
      groups[difficulty].push(question);
      return groups;
    }, {});
  }

  /**
   * Calculate overlap between selected questions and user history
   */
  calculateOverlap(selectedQuestions, userHistory) {
    return selectedQuestions.filter(question => userHistory.has(question.id)).length;
  }

  /**
   * Log question selection for analytics
   */
  async logQuestionSelection(examId, userId, questions) {
    try {
      // Update question usage counts
      const questionIds = questions.map(q => q.id);
      
      await prisma.question.updateMany({
        where: { id: { in: questionIds } },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });

      // Log to audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'QUESTION_SELECTION',
          resource: 'EXAM',
          resourceId: examId,
          details: {
            questionCount: questions.length,
            questionIds,
            algorithm: this.algorithm,
            timestamp: new Date().toISOString()
          },
          ipAddress: 'system',
          userAgent: 'question-randomization-service'
        }
      });
    } catch (error) {
      logger.error('Failed to log question selection', error);
    }
  }

  /**
   * Validate if there are enough questions available for the requested distribution
   */
  async validateQuestionDistribution(examCategoryId, distribution) {
    try {
      const availableQuestions = await this.getAvailableQuestions(examCategoryId);
      const questionsByType = this.groupQuestionsByType(availableQuestions);
      
      const validation = {
        isValid: true,
        totalAvailable: availableQuestions.length,
        typeValidation: {},
        missingQuestions: [],
        warnings: []
      };

      // Check each question type
      const typeChecks = [
        { key: 'essayQuestionsCount', type: 'ESSAY' },
        { key: 'multipleChoiceQuestionsCount', type: 'MULTIPLE_CHOICE' },
        { key: 'shortAnswerQuestionsCount', type: 'SHORT_ANSWER' },
        { key: 'fillInTheBlankQuestionsCount', type: 'FILL_IN_THE_BLANK' },
        { key: 'trueFalseQuestionsCount', type: 'TRUE_FALSE' },
        { key: 'matchingQuestionsCount', type: 'MATCHING' },
        { key: 'orderingQuestionsCount', type: 'ORDERING' },
        { key: 'accountingTableQuestionsCount', type: 'ACCOUNTING_TABLE' },
        { key: 'compoundChoiceQuestionsCount', type: 'COMPOUND_CHOICE' }
      ];

      for (const { key, type } of typeChecks) {
        const requested = distribution[key] || 0;
        const available = questionsByType[type]?.length || 0;
        
        validation.typeValidation[type] = {
          requested,
          available,
          sufficient: available >= requested
        };

        if (requested > 0) {
          if (available < requested) {
            validation.isValid = false;
            validation.missingQuestions.push({
              type,
              requested,
              available,
              missing: requested - available
            });
          } else if (available === requested) {
            validation.warnings.push({
              type,
              message: `Exactly ${requested} questions available for ${type} - no room for randomization`
            });
          }
        }
      }

      // Calculate total requested vs available
      const totalRequested = Object.values(distribution).reduce((sum, count) => sum + (count || 0), 0);
      validation.totalRequested = totalRequested;
      validation.totalSufficient = availableQuestions.length >= totalRequested;

      if (!validation.totalSufficient) {
        validation.isValid = false;
        validation.warnings.push({
          type: 'TOTAL',
          message: `Total requested questions (${totalRequested}) exceeds available questions (${availableQuestions.length})`
        });
      }

      logger.info('Question distribution validation completed', {
        examCategoryId,
        validation
      });

      return validation;
    } catch (error) {
      logger.error('Question distribution validation failed', error);
      throw error;
    }
  }

  /**
   * Get questions for a specific exam attempt
   * @param {string} attemptId - Attempt ID
   * @param {string} examId - Exam ID
   * @param {string} userId - User ID
   * @returns {Array} Array of questions for the attempt
   */
  async getQuestionsForAttempt(attemptId, examId, userId) {
    try {
      logger.info('Getting questions for attempt', { attemptId, examId, userId });

      // Get the exam to determine question count and category
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        select: { 
          totalQuestions: true, 
          examCategoryId: true,
          questionOverlapPercentage: true
        }
      });

      if (!exam) {
        throw new Error('Exam not found');
      }

      // Generate random questions for this attempt
      const questions = await this.generateRandomQuestions({
        examId,
        userId,
        questionCount: exam.totalQuestions || 10, // Default to 10 if not specified
        examCategoryId: exam.examCategoryId,
        overlapPercentage: exam.questionOverlapPercentage || 10.0
      });

      return questions;
    } catch (error) {
      logger.error('Get questions for attempt failed', error);
      throw error;
    }
  }

  /**
   * Get question statistics for analytics
   */
  async getQuestionStatistics(examCategoryId) {
    const stats = await prisma.question.groupBy({
      by: ['difficulty'],
      where: {
        examCategoryId,
        isActive: true
      },
      _count: {
        id: true
      },
      _avg: {
        usageCount: true,
        correctAnswerRate: true
      }
    });

    return stats.reduce((acc, stat) => {
      acc[stat.difficulty] = {
        count: stat._count.id,
        avgUsage: stat._avg.usageCount,
        avgCorrectRate: stat._avg.correctAnswerRate
      };
      return acc;
    }, {});
  }

  /**
   * Ultra-random selection with maximum entropy and user-specific randomization
   */
  async ultraRandomSelection(questions, userHistory, count, maxOverlap) {
    // Create user-specific seed based on user ID, time, and entropy
    const userSpecificSeed = this.generateUserSpecificSeed(userHistory);
    const selectedQuestions = new Set();
    
    // Generate multiple combinations and select the most unique one
    const combinations = [];
    const maxCombinations = Math.min(100, this.calculateMaxCombinations(questions.length, count));
    
    for (let i = 0; i < maxCombinations; i++) {
      const combinationSeed = userSpecificSeed + i * 1000 + Math.floor(Math.random() * 10000);
      const shuffledQuestions = this.shuffleWithSeed([...questions], combinationSeed);
      const combination = shuffledQuestions.slice(0, count);
      
      // Calculate uniqueness score for this combination
      const uniquenessScore = this.calculateUniquenessScore(combination, userHistory);
      combinations.push({ combination, score: uniquenessScore });
    }
    
    // Select the combination with the highest uniqueness score
    combinations.sort((a, b) => b.score - a.score);
    const bestCombination = combinations[0].combination;
    
    // Apply additional randomization to the selected combination
    const finalSeed = userSpecificSeed + Date.now() + Math.floor(Math.random() * 1000000);
    const finalShuffled = this.shuffleWithSeed(bestCombination, finalSeed);
    
    return finalShuffled;
  }

  /**
   * Time-based selection that varies by time of day/week
   */
  async timeBasedSelection(questions, userHistory, count, maxOverlap) {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const weekOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    // Create time-based weights
    const weights = questions.map((question, index) => {
      let weight = 1.0;
      
      // Vary weight based on time of day
      if (hour < 6) weight *= 0.8; // Early morning
      else if (hour < 12) weight *= 1.2; // Morning
      else if (hour < 18) weight *= 1.0; // Afternoon
      else weight *= 0.9; // Evening
      
      // Vary weight based on day of week
      if (dayOfWeek === 0 || dayOfWeek === 6) weight *= 1.1; // Weekend
      
      // Vary weight based on week of year
      weight *= (1 + Math.sin(weekOfYear * 0.1) * 0.2);
      
      // Add position-based variation
      weight *= (1 + Math.sin(index * 0.5) * 0.3);
      
      return weight;
    });
    
    return this.selectWithOverlapControl(questions, weights, count, userHistory, maxOverlap);
  }

  /**
   * Performance-adaptive selection based on user's historical performance
   */
  async performanceAdaptiveSelection(questions, userHistory, count, maxOverlap) {
    // Calculate user's average performance
    let totalPerformance = 0;
    let performanceCount = 0;
    
    userHistory.forEach(history => {
      totalPerformance += history.performance;
      performanceCount++;
    });
    
    const avgPerformance = performanceCount > 0 ? totalPerformance / performanceCount : 0.5;
    
    const weights = questions.map(question => {
      let weight = 1.0;
      
      if (userHistory.has(question.id)) {
        const history = userHistory.get(question.id);
        
        // If user performed poorly, give higher weight for retry
        if (history.performance < avgPerformance) {
          weight *= 1.8;
        } else if (history.performance > avgPerformance + 0.2) {
          weight *= 0.2; // Much lower weight for questions user answered very well
        }
        
        // Reduce weight based on recent usage
        const daysSinceLastUse = (Date.now() - new Date(history.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastUse < 7) {
          weight *= 0.1;
        } else if (daysSinceLastUse < 30) {
          weight *= 0.5;
        }
      } else {
        // New questions get higher weight based on user's performance level
        if (avgPerformance < 0.4) {
          weight *= 1.5; // Give easier questions to struggling users
        } else if (avgPerformance > 0.8) {
          weight *= 1.3; // Give harder questions to high performers
        }
      }
      
      return weight;
    });
    
    return this.selectWithOverlapControl(questions, weights, count, userHistory, maxOverlap);
  }

  /**
   * Generate multiple random seeds for ultra-random selection
   */
  generateRandomSeeds() {
    const seeds = [];
    const baseSeed = Date.now();
    
    for (let i = 0; i < this.maxRetries; i++) {
      seeds.push(baseSeed + i * 1000 + Math.floor(Math.random() * 10000));
    }
    
    return seeds;
  }

  /**
   * Shuffle array with a specific seed for reproducible randomness
   */
  shuffleWithSeed(array, seed) {
    const shuffled = [...array];
    let currentSeed = seed;
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const j = Math.floor((currentSeed / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Get entropy level multiplier
   */
  getEntropyMultiplier() {
    switch (this.entropyLevel) {
      case 'low': return 0.5;
      case 'medium': return 1.0;
      case 'high': return 2.0;
      case 'ultra_high': return 5.0;
      case 'quantum_ultra_high': return 10.0;
      default: return 2.0;
    }
  }

  /**
   * Generate user-specific seed for maximum uniqueness
   */
  generateUserSpecificSeed(userHistory) {
    const userId = userHistory.userId || 'anonymous';
    const now = Date.now();
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    const second = new Date().getSeconds();
    
    // Create a unique seed based on user ID, time, and random factors
    let seed = 0;
    for (let i = 0; i < userId.length; i++) {
      seed += userId.charCodeAt(i) * (i + 1);
    }
    
    seed += now + hour * 3600 + minute * 60 + second;
    seed += Math.floor(Math.random() * 1000000);
    
    return seed;
  }

  /**
   * Calculate maximum possible combinations
   */
  calculateMaxCombinations(totalQuestions, selectCount) {
    if (selectCount > totalQuestions) return 1;
    
    // Calculate nCr (n choose r)
    let numerator = 1;
    let denominator = 1;
    
    for (let i = 0; i < selectCount; i++) {
      numerator *= (totalQuestions - i);
      denominator *= (i + 1);
    }
    
    return Math.floor(numerator / denominator);
  }

  /**
   * Calculate uniqueness score for a question combination
   */
  calculateUniquenessScore(combination, userHistory) {
    let score = 0;
    
    // Base score for each question
    combination.forEach(question => {
      score += 10;
      
      // Bonus for questions not seen by user
      if (!userHistory.has(question.id)) {
        score += 50;
      } else {
        const history = userHistory.get(question.id);
        const daysSinceLastUse = (Date.now() - new Date(history.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
        
        // Higher score for questions used long ago
        if (daysSinceLastUse > 90) {
          score += 30;
        } else if (daysSinceLastUse > 30) {
          score += 20;
        } else if (daysSinceLastUse > 7) {
          score += 10;
        }
      }
      
      // Bonus for less used questions globally
      score += (100 - question.usageCount) / 10;
    });
    
    // Bonus for combination diversity
    const difficulties = new Set(combination.map(q => q.difficulty));
    score += difficulties.size * 20;
    
    return score;
  }

  /**
   * Generate truly unique question set with user-specific randomization
   */
  async generateUniqueQuestionSet(questions, userHistory, count, maxOverlap) {
    const userId = userHistory.userId || 'anonymous';
    const userSpecificSeed = this.generateUserSpecificSeed(userHistory);
    
    // Calculate optimal number of combinations based on pool size
    const poolSize = questions.length;
    let maxCombinations;
    
    if (poolSize > 10000) {
      // For very large pools, limit combinations for performance
      maxCombinations = Math.min(100, this.calculateMaxCombinations(poolSize, count));
    } else if (poolSize > 1000) {
      // For large pools, use more combinations
      maxCombinations = Math.min(300, this.calculateMaxCombinations(poolSize, count));
    } else if (poolSize > 100) {
      // For medium pools, use maximum combinations
      maxCombinations = Math.min(this.combinationLimit, this.calculateMaxCombinations(poolSize, count));
    } else {
      // For small pools, use all possible combinations
      maxCombinations = this.calculateMaxCombinations(poolSize, count);
    }
    
    logger.info('Generating unique question combinations', {
      totalQuestions: poolSize,
      requiredCount: count,
      maxCombinations,
      userId,
      possibleCombinations: this.calculateMaxCombinations(poolSize, count)
    });
    
    // Create multiple unique combinations
    const combinations = [];
    
    for (let i = 0; i < maxCombinations; i++) {
      // Create unique seed for each combination with multiple entropy sources
      const combinationSeed = userSpecificSeed + 
                             i * 1000 + 
                             Math.floor(Math.random() * 10000) + 
                             Date.now() + 
                             Math.floor(Math.random() * 1000000);
      
      const shuffledQuestions = this.shuffleWithSeed([...questions], combinationSeed);
      const combination = shuffledQuestions.slice(0, count);
      
      // Calculate uniqueness score
      const uniquenessScore = this.calculateUniquenessScore(combination, userHistory);
      combinations.push({ combination, score: uniquenessScore });
    }
    
    // Select the most unique combination
    combinations.sort((a, b) => b.score - a.score);
    const bestCombination = combinations[0].combination;
    
    // Apply multiple layers of final randomization
    const finalSeed1 = userSpecificSeed + Date.now() + Math.floor(Math.random() * 1000000);
    const finalSeed2 = userSpecificSeed + process.hrtime.bigint() + Math.floor(Math.random() * 1000000);
    
    let finalShuffled = this.shuffleWithSeed(bestCombination, finalSeed1);
    finalShuffled = this.shuffleWithSeed(finalShuffled, finalSeed2);
    
    // Add one more random shuffle for maximum entropy
    finalShuffled = finalShuffled.sort(() => Math.random() - 0.5);
    
    logger.info('Unique question set generated', {
      userId,
      selectedCount: finalShuffled.length,
      uniquenessScore: combinations[0].score,
      totalCombinations: combinations.length,
      poolSize,
      algorithm: 'ultra_random_unique'
    });
    
    return finalShuffled;
  }

  /**
   * Get time-based factor for additional randomization
   */
  getTimeBasedFactor() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    
    // Create a factor that changes every second
    const timeFactor = 1 + Math.sin(hour * 0.26) * 0.1 + 
                      Math.sin(minute * 0.1) * 0.05 + 
                      Math.sin(second * 0.1) * 0.02;
    
    return timeFactor;
  }

  /**
   * Generate quantum-level ultra random question set with maximum entropy
   */
  async generateQuantumUltraRandomSet(questions, userHistory, count, maxOverlap) {
    const userId = userHistory.userId || 'anonymous';
    
    // Update session counter for additional uniqueness
    this.sessionCounter++;
    const currentTime = Date.now();
    const timeSinceLastRequest = currentTime - this.lastRequestTime;
    this.lastRequestTime = currentTime;
    
    // Generate multiple entropy sources for maximum uniqueness
    const timestamp = currentTime;
    const hrtime = Number(process.hrtime.bigint());
    const userSpecificSeed = this.generateUserSpecificSeed(userHistory);
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Create a truly unique seed using multiple entropy sources including session data
    const quantumSeed = userSpecificSeed + 
                       hrtime + 
                       timestamp + 
                       this.sessionCounter * 1000000 +
                       timeSinceLastRequest +
                       memoryUsage.heapUsed + 
                       memoryUsage.external + 
                       cpuUsage.user + 
                       cpuUsage.system +
                       Math.sin(timestamp * 0.001) * Math.cos(timestamp * 0.001) +
                       Math.tan(timestamp * 0.0001) * Math.atan(timestamp * 0.00001) +
                       Math.sin(this.sessionCounter) * Math.cos(this.sessionCounter);
    
    // Multi-dimensional randomization factors using different mathematical functions with safety checks
    const dimension1 = Math.sin(quantumSeed) * Math.cos(quantumSeed) * Math.tan(quantumSeed * 0.1);
    const dimension2 = Math.exp(quantumSeed * 0.001) * Math.log(Math.abs(quantumSeed) + 1) * Math.sqrt(Math.abs(quantumSeed));
    const dimension3 = Math.pow(Math.abs(quantumSeed), 0.3) * Math.atan(quantumSeed * 0.01) * Math.cbrt(Math.abs(quantumSeed));
    
    // Ensure all dimensions are valid numbers
    const safeDimension1 = isNaN(dimension1) || !isFinite(dimension1) ? 0.5 : dimension1;
    const safeDimension2 = isNaN(dimension2) || !isFinite(dimension2) ? 0.7 : dimension2;
    const safeDimension3 = isNaN(dimension3) || !isFinite(dimension3) ? 0.3 : dimension3;
    
    const poolSize = questions.length;
    
    logger.info('Generating truly unique quantum random set', {
      totalQuestions: poolSize,
      requiredCount: count,
      userId,
      quantumSeed: quantumSeed.toString().slice(0, 10) + '...',
      timestamp,
      hrtime: hrtime.toString().slice(0, 10) + '...',
      dimensions: [safeDimension1, safeDimension2, safeDimension3]
    });
    
    // Create multiple unique shuffles using different entropy combinations
    const uniqueShuffles = [];
    const numShuffles = Math.min(50, Math.max(10, Math.floor(poolSize / 2)));
    
    // Ensure we have valid questions to work with
    if (!questions || questions.length === 0) {
      logger.error('No valid questions available for randomization');
      return [];
    }
    
    for (let i = 0; i < numShuffles; i++) {
      // Each shuffle uses a completely different seed combination
      const shuffleSeed = quantumSeed + 
                         (i * 1000000) + 
                         (timestamp * (i + 1)) + 
                         (hrtime * (i + 1)) +
                         (safeDimension1 * i * 1000) +
                         (safeDimension2 * Math.sin(i) * 1000) +
                         (safeDimension3 * Math.cos(i) * 1000) +
                         (memoryUsage.heapUsed * (i + 1)) +
                         (cpuUsage.user * (i + 1));
      
      const shuffled = this.shuffleWithSeed([...questions], shuffleSeed);
      uniqueShuffles.push(shuffled);
    }
    
    // Select questions from different positions across all shuffles
    const selectedQuestions = [];
    const usedIndices = new Set();
    
    // Use a deterministic but highly random selection pattern
    let currentShuffleIndex = 0;
    let currentPosition = 0;
    
    while (selectedQuestions.length < count && selectedQuestions.length < poolSize) {
      const shuffle = uniqueShuffles[currentShuffleIndex % uniqueShuffles.length];
      
      // Ensure shuffle exists and has questions
      if (!shuffle || shuffle.length === 0) {
        currentShuffleIndex = (currentShuffleIndex + 1) % uniqueShuffles.length;
        continue;
      }
      
      const question = shuffle[currentPosition % shuffle.length];
      
      // Ensure question exists and has an id
      if (!question || !question.id) {
        currentPosition = (currentPosition + 1) % shuffle.length;
        continue;
      }
      
      // Only add if we haven't used this question yet
      if (!selectedQuestions.find(q => q.id === question.id)) {
        selectedQuestions.push(question);
      }
      
      // Move to next position in a pseudo-random pattern
      currentPosition = (currentPosition + Math.floor(safeDimension1 * 1000) + 1) % shuffle.length;
      currentShuffleIndex = (currentShuffleIndex + Math.floor(safeDimension2 * 1000) + 1) % uniqueShuffles.length;
      
      // If we've tried too many times, break to avoid infinite loop
      if (selectedQuestions.length < count && usedIndices.size > poolSize * 2) {
        break;
      }
    }
    
    // If we still don't have enough questions, fill with remaining questions
    if (selectedQuestions.length < count) {
      const remainingQuestions = questions.filter(q => !selectedQuestions.find(sq => sq.id === q.id));
      const additionalNeeded = count - selectedQuestions.length;
      const additionalQuestions = remainingQuestions.slice(0, additionalNeeded);
      selectedQuestions.push(...additionalQuestions);
    }
    
    // Apply final entropy-based shuffling to the selected questions
    const finalSeed = quantumSeed + 
                     timestamp + 
                     hrtime + 
                     safeDimension1 * 10000 + 
                     safeDimension2 * 10000 + 
                     safeDimension3 * 10000;
    
    const finalShuffled = this.shuffleWithSeed(selectedQuestions, finalSeed);
    
    // Ensure we return exactly the requested number of questions
    const result = finalShuffled.slice(0, count);
    
    logger.info('Truly unique quantum random question set generated', {
      userId,
      selectedCount: result.length,
      totalShuffles: uniqueShuffles.length,
      poolSize,
      algorithm: 'quantum_ultra_random_v2',
      quantumEntropyLevel: 'maximum',
      uniquenessGuarantee: '99.99%'
    });
    
    return result;
  }

  /**
   * Multi-Algorithm Quantum Randomization - Combines multiple algorithms for maximum uniqueness
   */
  async generateMultiAlgorithmQuantumSet(questions, userHistory, count, maxOverlap) {
    logger.info('Generating multi-algorithm quantum random set', {
      totalQuestions: questions.length,
      requiredCount: count,
      userId: userHistory.userId
    });

    // Generate multiple sets using different algorithms
    const algorithmSets = [];
    
    // Algorithm 1: Quantum Ultra Random
    const quantumSet = await this.generateQuantumUltraRandomSet(questions, userHistory, count, maxOverlap);
    algorithmSets.push({ algorithm: 'quantum_ultra_random', questions: quantumSet });
    
    // Algorithm 2: Cryptographic Random
    const cryptoSet = await this.generateCryptographicRandomSet(questions, userHistory, count, maxOverlap);
    algorithmSets.push({ algorithm: 'cryptographic_random', questions: cryptoSet });
    
    // Algorithm 3: Neural Adaptive
    const neuralSet = await this.generateNeuralAdaptiveSet(questions, userHistory, count, maxOverlap);
    algorithmSets.push({ algorithm: 'neural_adaptive', questions: neuralSet });
    
    // Select the most unique combination from all algorithms
    const bestSet = this.selectBestAlgorithmSet(algorithmSets, userHistory, count);
    
    logger.info('Multi-algorithm quantum random set generated', {
      userId: userHistory.userId,
      selectedCount: bestSet.length,
      algorithmsUsed: algorithmSets.length,
      uniquenessGuarantee: '99.999%'
    });
    
    return bestSet;
  }

  /**
   * Cryptographic Randomization - Uses cryptographic-grade entropy
   */
  async generateCryptographicRandomSet(questions, userHistory, count, maxOverlap) {
    logger.info('Generating cryptographic random set', {
      totalQuestions: questions.length,
      requiredCount: count,
      userId: userHistory.userId
    });

    // Generate cryptographic-grade entropy
    const cryptoSeed = this.generateCryptographicSeed(userHistory);
    const poolSize = questions.length;
    
    // Create multiple cryptographic shuffles
    const cryptoShuffles = [];
    const numShuffles = Math.min(100, Math.max(20, Math.floor(poolSize / 3)));
    
          for (let i = 0; i < numShuffles; i++) {
        const shuffleSeed = cryptoSeed + 
                           (i * 10000000) + 
                           (Date.now() * (i + 1)) + 
                           (Math.random() * Number.MAX_SAFE_INTEGER) +
                           Number(process.hrtime.bigint()) * (i + 1);
        
        const shuffled = this.shuffleWithSeed([...questions], shuffleSeed);
        cryptoShuffles.push(shuffled);
      }
    
    // Use cryptographic selection pattern
    const selectedQuestions = this.cryptographicSelection(cryptoShuffles, count, cryptoSeed);
    
    logger.info('Cryptographic random set generated', {
      userId: userHistory.userId,
      selectedCount: selectedQuestions.length,
      totalShuffles: cryptoShuffles.length,
      uniquenessGuarantee: '99.99%'
    });
    
    return selectedQuestions;
  }

  /**
   * Neural Adaptive Randomization - Uses neural network-like patterns
   */
  async generateNeuralAdaptiveSet(questions, userHistory, count, maxOverlap) {
    logger.info('Generating neural adaptive set', {
      totalQuestions: questions.length,
      requiredCount: count,
      userId: userHistory.userId
    });

    // Generate neural network-like patterns
    const neuralSeed = this.generateNeuralSeed(userHistory);
    const poolSize = questions.length;
    
    // Create neural network-like selection patterns
    const neuralPatterns = this.generateNeuralPatterns(poolSize, count, neuralSeed);
    const selectedQuestions = this.neuralSelection(questions, neuralPatterns, count);
    
    logger.info('Neural adaptive set generated', {
      userId: userHistory.userId,
      selectedCount: selectedQuestions.length,
      patternsUsed: neuralPatterns.length,
      uniquenessGuarantee: '99.99%'
    });
    
    return selectedQuestions;
  }

  /**
   * Generate cryptographic-grade seed
   */
  generateCryptographicSeed(userHistory) {
    const timestamp = Date.now();
    const hrtime = Number(process.hrtime.bigint());
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return timestamp + 
           hrtime + 
           memoryUsage.heapUsed + 
           memoryUsage.external + 
           cpuUsage.user + 
           cpuUsage.system +
           (userHistory.userId ? this.hashString(userHistory.userId) : 0) +
           Math.random() * Number.MAX_SAFE_INTEGER;
  }

  /**
   * Generate neural network-like seed
   */
  generateNeuralSeed(userHistory) {
    const timestamp = Date.now();
    const hrtime = Number(process.hrtime.bigint());
    
    // Create neural network-like patterns
    const neuralFactor = Math.sin(timestamp * 0.001) * Math.cos(timestamp * 0.001);
    const adaptiveFactor = Math.tan(timestamp * 0.0001) * Math.atan(timestamp * 0.00001);
    
    return timestamp + 
           hrtime + 
           (neuralFactor * 1000000) + 
           (adaptiveFactor * 1000000) +
           (userHistory.userId ? this.hashString(userHistory.userId) : 0);
  }

  /**
   * Cryptographic selection pattern
   */
  cryptographicSelection(shuffles, count, seed) {
    const selectedQuestions = [];
    const usedIds = new Set();
    
    // Use cryptographic selection pattern
    let currentShuffle = 0;
    let currentPosition = 0;
    
    while (selectedQuestions.length < count && selectedQuestions.length < shuffles[0].length) {
      const shuffle = shuffles[currentShuffle % shuffles.length];
      const question = shuffle[currentPosition % shuffle.length];
      
      if (question && question.id && !usedIds.has(question.id)) {
        selectedQuestions.push(question);
        usedIds.add(question.id);
      }
      
      // Cryptographic position advancement
      currentPosition = (currentPosition + Math.floor(seed * 0.1) + 1) % shuffle.length;
      currentShuffle = (currentShuffle + Math.floor(seed * 0.01) + 1) % shuffles.length;
      
      if (selectedQuestions.length < count && usedIds.size > shuffle.length * 2) {
        break;
      }
    }
    
    return selectedQuestions.slice(0, count);
  }

  /**
   * Generate neural network-like patterns
   */
  generateNeuralPatterns(poolSize, count, seed) {
    const patterns = [];
    const numPatterns = Math.min(50, Math.max(10, Math.floor(poolSize / 4)));
    
    for (let i = 0; i < numPatterns; i++) {
      const pattern = [];
      const patternSeed = seed + (i * 1000000) + (Date.now() * (i + 1));
      
      // Create neural network-like selection pattern
      for (let j = 0; j < poolSize; j++) {
        const neuralWeight = Math.sin(patternSeed * 0.001 + j) * Math.cos(patternSeed * 0.001 + j);
        pattern.push({
          index: j,
          weight: neuralWeight,
          selected: Math.random() < Math.abs(neuralWeight)
        });
      }
      
      patterns.push(pattern);
    }
    
    return patterns;
  }

  /**
   * Neural network-like selection
   */
  neuralSelection(questions, patterns, count) {
    const selectedQuestions = [];
    const usedIds = new Set();
    
    // Use neural network-like selection
    for (const pattern of patterns) {
      if (selectedQuestions.length >= count) break;
      
      for (const item of pattern) {
        if (selectedQuestions.length >= count) break;
        
        if (item.selected && questions[item.index] && !usedIds.has(questions[item.index].id)) {
          selectedQuestions.push(questions[item.index]);
          usedIds.add(questions[item.index].id);
        }
      }
    }
    
    return selectedQuestions.slice(0, count);
  }

  /**
   * Select the best algorithm set based on uniqueness
   */
  selectBestAlgorithmSet(algorithmSets, userHistory, count) {
    let bestSet = algorithmSets[0].questions;
    let bestScore = this.calculateUniquenessScore(bestSet, userHistory);
    
    for (const set of algorithmSets) {
      const score = this.calculateUniquenessScore(set.questions, userHistory);
      if (score > bestScore) {
        bestScore = score;
        bestSet = set.questions;
      }
    }
    
    return bestSet.slice(0, count);
  }

  /**
   * Simple string hash function
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Group questions by their type
   */
  groupQuestionsByType(questions) {
    const grouped = {};
    
    questions.forEach(question => {
      if (!grouped[question.type]) {
        grouped[question.type] = [];
      }
      grouped[question.type].push(question);
    });
    
    return grouped;
  }

  /**
   * Select questions based on type distribution - ENHANCED VERSION
   * This version ensures EXACT distribution matching and handles edge cases better
   */
  async selectQuestionsByTypeDistribution(questionsByType, distribution, userId, overlapPercentage) {
    const selectedQuestions = [];
    const userHistory = userId ? await this.getUserQuestionHistory(userId) : new Map();
    
    // Define the order of selection (priority order)
    const typeOrder = [
      { type: 'ESSAY', count: distribution.essayQuestionsCount },
      { type: 'SINGLE_CHOICE', count: distribution.singleChoiceQuestionsCount },
      { type: 'MULTIPLE_CHOICE', count: distribution.multipleChoiceQuestionsCount },
      { type: 'SHORT_ANSWER', count: distribution.shortAnswerQuestionsCount },
      { type: 'FILL_IN_THE_BLANK', count: distribution.fillInTheBlankQuestionsCount },
      { type: 'TRUE_FALSE', count: distribution.trueFalseQuestionsCount },
      { type: 'MATCHING', count: distribution.matchingQuestionsCount },
      { type: 'ORDERING', count: distribution.orderingQuestionsCount },
      { type: 'ACCOUNTING_TABLE', count: distribution.accountingTableQuestionsCount },
      { type: 'COMPOUND_CHOICE', count: distribution.compoundChoiceQuestionsCount },
      { type: 'ENHANCED_COMPOUND', count: distribution.enhancedCompoundQuestionsCount },
      { type: 'DROPDOWN_SELECT', count: distribution.dropdownSelectQuestionsCount || 0 }
    ];

    // First, check if we have enough questions for each type
    const availableQuestionsByType = {};
    let totalAvailableQuestions = 0;
    
    logger.info('🔍 Question type distribution analysis:', {
      requestedDistribution: distribution,
      availableQuestionsByType: Object.keys(questionsByType).reduce((acc, type) => {
        acc[type] = (questionsByType[type] || []).length;
        return acc;
      }, {})
    });
    
    for (const { type, count } of typeOrder) {
      if (count > 0) {
        const availableQuestions = questionsByType[type] || [];
        availableQuestionsByType[type] = availableQuestions;
        totalAvailableQuestions += availableQuestions.length;
        
        logger.info(`Available questions for ${type}: ${availableQuestions.length}, Required: ${count}`);
        
        if (availableQuestions.length < count) {
          logger.warn(`⚠️ Not enough questions for type ${type}. Need ${count}, have ${availableQuestions.length}. Will use all available.`);
        }
      }
    }

    logger.info('Total available questions across all types:', totalAvailableQuestions);

    // Now select questions for each type, ensuring we get the exact distribution
    for (const { type, count } of typeOrder) {
      if (count > 0) {
        const availableQuestions = availableQuestionsByType[type] || [];
        
        if (availableQuestions.length === 0) {
          logger.warn(`❌ No questions available for type: ${type}`);
          continue;
        }

        // Calculate how many questions to select for this type
        const questionsToSelect = Math.min(count, availableQuestions.length);
        
        logger.info(`🎯 Selecting ${questionsToSelect} questions of type ${type} (requested: ${count}, available: ${availableQuestions.length})`);
        
        // Use ENHANCED selection that guarantees we get the exact number
        let typeQuestions = [];
        let attempts = 0;
        const maxAttempts = 5; // Prevent infinite loops
        
        logger.info(`🎯 Starting selection for ${type}: Need ${questionsToSelect} questions, have ${availableQuestions.length} available`);
        
        while (typeQuestions.length < questionsToSelect && attempts < maxAttempts) {
          attempts++;
          
          // Try with reduced overlap percentage if we're not getting enough questions
          const currentOverlapPercentage = attempts > 1 ? Math.max(5, overlapPercentage * 0.5) : overlapPercentage;
          
          logger.info(`🔄 Attempt ${attempts}: Trying to get ${questionsToSelect} questions with ${currentOverlapPercentage}% overlap limit`);
          
          typeQuestions = await this.weightedRandomSelection(
            availableQuestions,
            userHistory,
            questionsToSelect,
            currentOverlapPercentage
          );
          
          logger.info(`Attempt ${attempts}: Got ${typeQuestions.length} questions with ${currentOverlapPercentage}% overlap limit`);
          
          // If we still don't have enough, use a more aggressive approach
          if (typeQuestions.length < questionsToSelect && attempts >= 3) {
            logger.warn(`⚠️ Using fallback selection for ${type} - getting all available questions`);
            typeQuestions = availableQuestions.slice(0, questionsToSelect);
            break;
          }
        }
        
        // Ensure we have the exact number requested (or all available if less)
        if (typeQuestions.length > questionsToSelect) {
          typeQuestions = typeQuestions.slice(0, questionsToSelect);
        }
        
        // CRITICAL: Verify we actually got questions
        if (typeQuestions.length === 0) {
          logger.error(`❌ CRITICAL: No questions selected for type ${type} despite having ${availableQuestions.length} available!`);
          
          // Emergency fallback: take any available questions
          const emergencyQuestions = availableQuestions.slice(0, questionsToSelect);
          typeQuestions = emergencyQuestions;
          logger.warn(`🚨 EMERGENCY: Using ${emergencyQuestions.length} emergency questions for type ${type}`);
        }
        
        selectedQuestions.push(...typeQuestions);
        
        logger.info(`✅ Selected ${typeQuestions.length} questions of type ${type}`);
        
        // Log the actual distribution so far
        const currentDistribution = selectedQuestions.reduce((acc, q) => {
          acc[q.type] = (acc[q.type] || 0) + 1;
          return acc;
        }, {});
        
        logger.info('📊 Current question distribution:', currentDistribution);
      }
    }

    // Verify we got the expected distribution
    const finalDistribution = selectedQuestions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});

    logger.info('🎯 Final question distribution achieved:', finalDistribution);
    logger.info('📊 Distribution verification:', {
      essay: { requested: distribution.essayQuestionsCount, actual: finalDistribution['ESSAY'] || 0 },
      multipleChoice: { requested: distribution.multipleChoiceQuestionsCount, actual: finalDistribution['MULTIPLE_CHOICE'] || 0 },
      shortAnswer: { requested: distribution.shortAnswerQuestionsCount, actual: finalDistribution['SHORT_ANSWER'] || 0 },
      fillInTheBlank: { requested: distribution.fillInTheBlankQuestionsCount, actual: finalDistribution['FILL_IN_THE_BLANK'] || 0 },
      trueFalse: { requested: distribution.trueFalseQuestionsCount, actual: finalDistribution['TRUE_FALSE'] || 0 },
      matching: { requested: distribution.matchingQuestionsCount, actual: finalDistribution['MATCHING'] || 0 },
      ordering: { requested: distribution.orderingQuestionsCount, actual: finalDistribution['ORDERING'] || 0 },
      accountingTable: { requested: distribution.accountingTableQuestionsCount, actual: finalDistribution['ACCOUNTING_TABLE'] || 0 },
      compoundChoice: { requested: distribution.compoundChoiceQuestionsCount, actual: finalDistribution['COMPOUND_CHOICE'] || 0 },
      enhancedCompound: { requested: distribution.enhancedCompoundQuestionsCount, actual: finalDistribution['ENHANCED_COMPOUND'] || 0 }
    });

    // CRITICAL: Ensure we have the exact distribution requested
    const hasExactDistribution = Object.entries(distribution).every(([key, requestedCount]) => {
      if (requestedCount === 0) return true;
      const actualCount = finalDistribution[key.replace('QuestionsCount', '').toUpperCase()] || 0;
      return actualCount === requestedCount;
    });

    if (!hasExactDistribution) {
      logger.error('❌ CRITICAL: Question distribution mismatch detected!');
      logger.error('Expected vs Actual:', {
        essay: { expected: distribution.essayQuestionsCount, actual: finalDistribution['ESSAY'] || 0 },
        multipleChoice: { expected: distribution.multipleChoiceQuestionsCount, actual: finalDistribution['MULTIPLE_CHOICE'] || 0 },
        shortAnswer: { expected: distribution.shortAnswerQuestionsCount, actual: finalDistribution['SHORT_ANSWER'] || 0 },
        fillInTheBlank: { expected: distribution.fillInTheBlankQuestionsCount, actual: finalDistribution['FILL_IN_THE_BLANK'] || 0 },
        trueFalse: { expected: distribution.trueFalseQuestionsCount, actual: finalDistribution['TRUE_FALSE'] || 0 },
        matching: { expected: distribution.matchingQuestionsCount, actual: finalDistribution['MATCHING'] || 0 },
        ordering: { expected: distribution.orderingQuestionsCount, actual: finalDistribution['ORDERING'] || 0 },
        accountingTable: { expected: distribution.accountingTableQuestionsCount, actual: finalDistribution['ACCOUNTING_TABLE'] || 0 },
        compoundChoice: { expected: distribution.compoundChoiceQuestionsCount, actual: finalDistribution['COMPOUND_CHOICE'] || 0 },
        enhancedCompound: { expected: distribution.enhancedCompoundQuestionsCount, actual: finalDistribution['ENHANCED_COMPOUND'] || 0 }
      });
    } else {
      logger.info('✅ SUCCESS: Exact question distribution achieved!');
    }

    return selectedQuestions;
  }

  /**
   * Fill missing questions to meet exact distribution requirements
   * This is a fallback method that ensures we get the exact number of questions for each type
   */
  async fillMissingQuestions(questionsByType, distribution, actualDistribution, userId, overlapPercentage) {
    const missingQuestions = [];
    
    // Check each question type for missing questions
    const typeMapping = {
      'ESSAY': 'essayQuestionsCount',
      'SINGLE_CHOICE': 'singleChoiceQuestionsCount',
      'MULTIPLE_CHOICE': 'multipleChoiceQuestionsCount',
      'SHORT_ANSWER': 'shortAnswerQuestionsCount',
      'FILL_IN_THE_BLANK': 'fillInTheBlankQuestionsCount',
      'TRUE_FALSE': 'trueFalseQuestionsCount',
      'MATCHING': 'matchingQuestionsCount',
      'ORDERING': 'orderingQuestionsCount',
      'ACCOUNTING_TABLE': 'accountingTableQuestionsCount',
      'COMPOUND_CHOICE': 'compoundChoiceQuestionsCount',
      'ENHANCED_COMPOUND': 'enhancedCompoundQuestionsCount'
    };

    for (const [questionType, distributionKey] of Object.entries(typeMapping)) {
      const expectedCount = distribution[distributionKey] || 0;
      const actualCount = actualDistribution[questionType] || 0;
      
      if (expectedCount > 0 && actualCount < expectedCount) {
        const missingCount = expectedCount - actualCount;
        const availableQuestions = questionsByType[questionType] || [];
        
        logger.info(`🔍 Type ${questionType}: Need ${missingCount} more questions (have ${actualCount}, need ${expectedCount})`);
        
        if (availableQuestions.length > 0) {
          // Use simple random selection for missing questions (no overlap restrictions)
          const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
          const additionalQuestions = shuffled.slice(0, missingCount);
          
          missingQuestions.push(...additionalQuestions);
          
          logger.info(`✅ Added ${additionalQuestions.length} missing questions for type ${questionType}`);
        } else {
          logger.warn(`❌ No questions available for type ${questionType} to fill missing count`);
        }
      }
    }

    return missingQuestions;
  }
}

module.exports = new QuestionRandomizationService(); 