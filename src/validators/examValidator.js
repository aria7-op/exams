const Joi = require('joi');

// Exam creation validation
const validateExamCreation = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(200).required().messages({
      'string.min': 'Exam title must be at least 3 characters long',
      'string.max': 'Exam title cannot exceed 200 characters',
      'any.required': 'Exam title is required'
    }),
    description: Joi.string().max(1000).optional().messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
    examCategoryId: Joi.string().optional().messages({
      'string.base': 'Exam category ID must be a string'
    }),
    categoryId: Joi.string().optional().messages({
      'string.base': 'Category ID must be a string'
    }),
    duration: Joi.number().integer().min(1).max(480).required().messages({
      'number.base': 'Duration must be a number',
      'number.integer': 'Duration must be a whole number',
      'number.min': 'Duration must be at least 1 minute',
      'number.max': 'Duration cannot exceed 480 minutes (8 hours)',
      'any.required': 'Duration is required'
    }),
    totalMarks: Joi.number().integer().min(1).max(1000).optional().messages({
      'number.base': 'Total marks must be a number',
      'number.integer': 'Total marks must be a whole number',
      'number.min': 'Total marks must be at least 1',
      'number.max': 'Total marks cannot exceed 1000'
    }),
    totalQuestions: Joi.number().integer().min(1).max(1000).optional().messages({
      'number.base': 'Total questions must be a number',
      'number.integer': 'Total questions must be a whole number',
      'number.min': 'Total questions must be at least 1',
      'number.max': 'Total questions cannot exceed 1000'
    }),
    passingMarks: Joi.number().integer().min(1).max(Joi.ref('totalMarks')).optional().messages({
      'number.base': 'Passing marks must be a number',
      'number.integer': 'Passing marks must be a whole number',
      'number.min': 'Passing marks must be at least 1',
      'number.max': 'Passing marks cannot exceed total marks'
    }),
    passingScore: Joi.number().integer().min(1).max(100).optional().messages({
      'number.base': 'Passing score must be a number',
      'number.integer': 'Passing score must be a whole number',
      'number.min': 'Passing score must be at least 1',
      'number.max': 'Passing score cannot exceed 100'
    }),
    price: Joi.number().precision(2).min(0).max(10000).required().messages({
      'number.base': 'Price must be a number',
      'number.precision': 'Price can have maximum 2 decimal places',
      'number.min': 'Price cannot be negative',
      'number.max': 'Price cannot exceed 10000',
      'any.required': 'Price is required'
    }),
    currency: Joi.string().length(3).default('USD').messages({
      'string.length': 'Currency must be 3 characters (e.g., USD, EUR)'
    }),
    isActive: Joi.boolean().default(true),
    isPublic: Joi.boolean().default(false),
    allowRetakes: Joi.boolean().default(false),
    maxRetakes: Joi.when('allowRetakes', {
      is: true,
      then: Joi.number().integer().min(1).max(10).required(),
      otherwise: Joi.number().integer().min(0).max(0).default(0)
    }).messages({
      'number.base': 'Max retakes must be a number',
      'number.integer': 'Max retakes must be a whole number',
      'number.min': 'Max retakes must be at least 1 when retakes are allowed',
      'number.max': 'Max retakes cannot exceed 10',
      'any.required': 'Max retakes is required when retakes are allowed'
    }),
    showResults: Joi.boolean().default(true),
    showAnswers: Joi.boolean().default(false),
    randomizeQuestions: Joi.boolean().default(true),
    randomizeOptions: Joi.boolean().default(true),
    questionOverlapPercentage: Joi.number().precision(1).min(0).max(100).default(10.0).messages({
      'number.base': 'Question overlap percentage must be a number',
      'number.precision': 'Question overlap percentage can have maximum 1 decimal place',
      'number.min': 'Question overlap percentage cannot be negative',
      'number.max': 'Question overlap percentage cannot exceed 100'
    }),
    instructions: Joi.string().max(2000).optional(),
    rules: Joi.string().max(2000).optional(),
    // Accept both frontend format (startDate/endDate) and backend format (scheduledStart/scheduledEnd)
    startDate: Joi.date().min('now').optional().messages({
      'date.min': 'Start date cannot be in the past'
    }),
    endDate: Joi.date().min(Joi.ref('startDate')).optional().messages({
      'date.min': 'End date must be after start date'
    }),
    scheduledStart: Joi.date().min('now').optional().messages({
      'date.min': 'Scheduled start date cannot be in the past'
    }),
    scheduledEnd: Joi.date().min(Joi.ref('scheduledStart')).optional().messages({
      'date.min': 'Scheduled end date must be after start date'
    }),
    // Question type distribution
    essayQuestionsCount: Joi.number().integer().min(0).default(0),
    multipleChoiceQuestionsCount: Joi.number().integer().min(0).default(0),
    shortAnswerQuestionsCount: Joi.number().integer().min(0).default(0),
    fillInTheBlankQuestionsCount: Joi.number().integer().min(0).default(0),
    trueFalseQuestionsCount: Joi.number().integer().min(0).default(0),
    matchingQuestionsCount: Joi.number().integer().min(0).default(0),
    orderingQuestionsCount: Joi.number().integer().min(0).default(0)
  }).custom((value, helpers) => {
    // Ensure at least one of examCategoryId or categoryId is provided
    if (!value.examCategoryId && !value.categoryId) {
      return helpers.error('any.required', { message: 'Either examCategoryId or categoryId is required' });
    }
    
    // Ensure at least one of totalMarks or totalQuestions is provided
    if (!value.totalMarks && !value.totalQuestions) {
      return helpers.error('any.required', { message: 'Either totalMarks or totalQuestions is required' });
    }
    
    // Ensure at least one of passingMarks or passingScore is provided
    if (!value.passingMarks && !value.passingScore) {
      return helpers.error('any.required', { message: 'Either passingMarks or passingScore is required' });
    }
    
    return value;
  });

  return schema.unknown().validate(data);
};

// Exam update validation
const validateExamUpdate = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(200).optional().messages({
      'string.min': 'Exam title must be at least 3 characters long',
      'string.max': 'Exam title cannot exceed 200 characters'
    }),
    description: Joi.string().max(1000).optional().messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
    examCategoryId: Joi.string().optional(),
    duration: Joi.number().integer().min(1).max(480).optional().messages({
      'number.base': 'Duration must be a number',
      'number.integer': 'Duration must be a whole number',
      'number.min': 'Duration must be at least 1 minute',
      'number.max': 'Duration cannot exceed 480 minutes (8 hours)'
    }),
    totalMarks: Joi.number().integer().min(1).max(1000).optional().messages({
      'number.base': 'Total marks must be a number',
      'number.integer': 'Total marks must be a whole number',
      'number.min': 'Total marks must be at least 1',
      'number.max': 'Total marks cannot exceed 1000'
    }),
    passingMarks: Joi.number().integer().min(1).optional().messages({
      'number.base': 'Passing marks must be a number',
      'number.integer': 'Passing marks must be a whole number',
      'number.min': 'Passing marks must be at least 1'
    }),
    price: Joi.number().precision(2).min(0).max(10000).optional().messages({
      'number.base': 'Price must be a number',
      'number.precision': 'Price can have maximum 2 decimal places',
      'number.min': 'Price cannot be negative',
      'number.max': 'Price cannot exceed 10000'
    }),
    currency: Joi.string().length(3).optional().messages({
      'string.length': 'Currency must be 3 characters (e.g., USD, EUR)'
    }),
    isActive: Joi.boolean().optional(),
    isPublic: Joi.boolean().optional(),
    allowRetakes: Joi.boolean().optional(),
    maxRetakes: Joi.number().integer().min(0).max(10).optional().messages({
      'number.base': 'Max retakes must be a number',
      'number.integer': 'Max retakes must be a whole number',
      'number.min': 'Max retakes cannot be negative',
      'number.max': 'Max retakes cannot exceed 10'
    }),
    showResults: Joi.boolean().optional(),
    showAnswers: Joi.boolean().optional(),
    randomizeQuestions: Joi.boolean().optional(),
    randomizeOptions: Joi.boolean().optional(),
    questionOverlapPercentage: Joi.number().precision(1).min(0).max(100).optional().messages({
      'number.base': 'Question overlap percentage must be a number',
      'number.precision': 'Question overlap percentage can have maximum 1 decimal place',
      'number.min': 'Question overlap percentage cannot be negative',
      'number.max': 'Question overlap percentage cannot exceed 100'
    }),
    instructions: Joi.string().max(2000).optional(),
    rules: Joi.string().max(2000).optional(),
    // Accept both frontend format (startDate/endDate) and backend format (scheduledStart/scheduledEnd)
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    scheduledStart: Joi.date().optional(),
    scheduledEnd: Joi.date().optional(),
    // Question type distribution
    essayQuestionsCount: Joi.number().integer().min(0).optional(),
    multipleChoiceQuestionsCount: Joi.number().integer().min(0).optional(),
    shortAnswerQuestionsCount: Joi.number().integer().min(0).optional(),
    fillInTheBlankQuestionsCount: Joi.number().integer().min(0).optional(),
    trueFalseQuestionsCount: Joi.number().integer().min(0).optional(),
    matchingQuestionsCount: Joi.number().integer().min(0).optional(),
    orderingQuestionsCount: Joi.number().integer().min(0).optional()
  });

  return schema.unknown().validate(data);
};

// Question creation validation
const validateQuestionCreation = (data) => {
  const schema = Joi.object({
    text: Joi.string().min(10).max(2000).required().messages({
      'string.min': 'Question text must be at least 10 characters long',
      'string.max': 'Question text cannot exceed 2000 characters',
      'any.required': 'Question text is required'
    }),
    type: Joi.string().valid('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'SHORT_ANSWER', 'ESSAY', 'MATCHING', 'ORDERING').required().messages({
      'any.only': 'Invalid question type',
      'any.required': 'Question type is required'
    }),
    difficulty: Joi.string().valid('EASY', 'MEDIUM', 'HARD', 'EXPERT').required().messages({
      'any.only': 'Invalid difficulty level',
      'any.required': 'Difficulty level is required'
    }),
    examCategoryId: Joi.string().required().messages({
      'any.required': 'Exam category is required'
    }),
    marks: Joi.number().integer().min(1).max(100).default(1).messages({
      'number.base': 'Marks must be a number',
      'number.integer': 'Marks must be a whole number',
      'number.min': 'Marks must be at least 1',
      'number.max': 'Marks cannot exceed 100'
    }),
    timeLimit: Joi.number().integer().min(10).max(3600).optional().messages({
      'number.base': 'Time limit must be a number',
      'number.integer': 'Time limit must be a whole number',
      'number.min': 'Time limit must be at least 10 seconds',
      'number.max': 'Time limit cannot exceed 3600 seconds (1 hour)'
    }),
    isActive: Joi.boolean().default(true),
    isPublic: Joi.boolean().default(false),
    options: Joi.when('type', {
      is: Joi.string().valid('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE'),
      then: Joi.array().items(
        Joi.object({
          text: Joi.string().min(1).max(500).required(),
          isCorrect: Joi.boolean().required(),
          explanation: Joi.string().max(1000).optional()
        })
      ).min(2).max(10).required().messages({
        'array.min': 'At least 2 options are required',
        'array.max': 'Maximum 10 options allowed',
        'any.required': 'Options are required for this question type'
      }),
      otherwise: Joi.forbidden()
    }),
    explanation: Joi.string().max(2000).optional().messages({
      'string.max': 'Explanation cannot exceed 2000 characters'
    }),
    tags: Joi.array().items(Joi.string().min(1).max(50)).max(20).optional().messages({
      'array.max': 'Maximum 20 tags allowed'
    }),
    images: Joi.array().items(
      Joi.object({
        imageUrl: Joi.string().uri().required(),
        altText: Joi.string().max(200).optional()
      })
    ).max(10).optional().messages({
      'array.max': 'Maximum 10 images allowed'
    })
  });

  return schema.validate(data);
};

// Question update validation
const validateQuestionUpdate = (data) => {
  const schema = Joi.object({
    text: Joi.string().min(10).max(2000).optional().messages({
      'string.min': 'Question text must be at least 10 characters long',
      'string.max': 'Question text cannot exceed 2000 characters'
    }),
    type: Joi.string().valid('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'SHORT_ANSWER', 'ESSAY', 'MATCHING', 'ORDERING').optional().messages({
      'any.only': 'Invalid question type'
    }),
    difficulty: Joi.string().valid('EASY', 'MEDIUM', 'HARD', 'EXPERT').optional().messages({
      'any.only': 'Invalid difficulty level'
    }),
    examCategoryId: Joi.string().optional(),
    marks: Joi.number().integer().min(1).max(100).optional().messages({
      'number.base': 'Marks must be a number',
      'number.integer': 'Marks must be a whole number',
      'number.min': 'Marks must be at least 1',
      'number.max': 'Marks cannot exceed 100'
    }),
    timeLimit: Joi.number().integer().min(10).max(3600).optional().messages({
      'number.base': 'Time limit must be a number',
      'number.integer': 'Time limit must be a whole number',
      'number.min': 'Time limit must be at least 10 seconds',
      'number.max': 'Time limit cannot exceed 3600 seconds (1 hour)'
    }),
    isActive: Joi.boolean().optional(),
    isPublic: Joi.boolean().optional(),
    options: Joi.array().items(
      Joi.object({
        text: Joi.string().min(1).max(500).required(),
        isCorrect: Joi.boolean().required(),
        explanation: Joi.string().max(1000).optional()
      })
    ).min(2).max(10).optional().messages({
      'array.min': 'At least 2 options are required',
      'array.max': 'Maximum 10 options allowed'
    }),
    explanation: Joi.string().max(2000).optional().messages({
      'string.max': 'Explanation cannot exceed 2000 characters'
    }),
    tags: Joi.array().items(Joi.string().min(1).max(50)).max(20).optional().messages({
      'array.max': 'Maximum 20 tags allowed'
    }),
    images: Joi.array().items(
      Joi.object({
        imageUrl: Joi.string().uri().required(),
        altText: Joi.string().max(200).optional()
      })
    ).max(10).optional().messages({
      'array.max': 'Maximum 10 images allowed'
    })
  });

  return schema.validate(data);
};

// Exam attempt validation
const validateExamAttempt = (data) => {
  const schema = Joi.object({
    timeSpent: Joi.number().integer().min(0).optional().messages({
      'number.base': 'Time spent must be a number',
      'number.integer': 'Time spent must be a whole number',
      'number.min': 'Time spent cannot be negative'
    }),
    responses: Joi.array().items(
      Joi.object({
        questionId: Joi.string().required(),
        selectedOptions: Joi.array().items(Joi.string()).optional(),
        timeSpent: Joi.number().integer().min(0).optional(),
        essayAnswer: Joi.string().max(10000).allow(null, '').optional()
      })
    ).optional()
  });

  return schema.validate(data);
};

// Question response validation
const validateQuestionResponse = (data) => {
  const schema = Joi.object({
    questionId: Joi.string().required().messages({
      'any.required': 'Question ID is required'
    }),
    selectedOptions: Joi.array().items(Joi.string()).optional().messages({
      'array.base': 'Selected options must be an array'
    }),
    timeSpent: Joi.number().integer().min(0).max(3600).optional().messages({
      'number.base': 'Time spent must be a number',
      'number.integer': 'Time spent must be a whole number',
      'number.min': 'Time spent cannot be negative',
      'number.max': 'Time spent cannot exceed 3600 seconds (1 hour)'
    }),
    essayAnswer: Joi.string().max(10000).allow(null, '').optional().messages({
      'string.max': 'Essay answer cannot exceed 10,000 characters'
    })
  }).or('selectedOptions', 'essayAnswer').messages({
    'object.missing': 'Either selectedOptions or essayAnswer must be provided'
  });

  return schema.validate(data);
};

// Exam booking validation
const validateExamBooking = (data) => {
  const schema = Joi.object({
    examId: Joi.string().required().messages({
      'any.required': 'Exam ID is required'
    }),
    scheduledAt: Joi.date().min('now').optional().messages({
      'date.min': 'Scheduled date cannot be in the past'
    }),
    notes: Joi.string().max(500).optional().messages({
      'string.max': 'Notes cannot exceed 500 characters'
    })
  });

  return schema.validate(data);
};

// Exam category validation
const validateExamCategory = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Category name must be at least 2 characters long',
      'string.max': 'Category name cannot exceed 100 characters',
      'any.required': 'Category name is required'
    }),
    description: Joi.string().max(500).optional().messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
    icon: Joi.string().max(50).optional().messages({
      'string.max': 'Icon name cannot exceed 50 characters'
    }),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional().messages({
      'string.pattern.base': 'Color must be a valid hex color (e.g., #FF0000)'
    }),
    isActive: Joi.boolean().default(true),
    sortOrder: Joi.number().integer().min(0).max(1000).default(0).messages({
      'number.base': 'Sort order must be a number',
      'number.integer': 'Sort order must be a whole number',
      'number.min': 'Sort order cannot be negative',
      'number.max': 'Sort order cannot exceed 1000'
    })
  });

  return schema.validate(data);
};

// Bulk question import validation
const validateBulkQuestionImport = (data) => {
  const questionSchema = Joi.object({
    text: Joi.string().min(10).max(2000).required(),
    type: Joi.string().valid('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'SHORT_ANSWER', 'ESSAY', 'MATCHING', 'ORDERING').required(),
    difficulty: Joi.string().valid('EASY', 'MEDIUM', 'HARD', 'EXPERT').required(),
    examCategoryId: Joi.string().required(),
    marks: Joi.number().integer().min(1).max(100).default(1),
    timeLimit: Joi.number().integer().min(10).max(3600).optional(),
    options: Joi.array().items(
      Joi.object({
        text: Joi.string().min(1).max(500).required(),
        isCorrect: Joi.boolean().required(),
        explanation: Joi.string().max(1000).optional()
      })
    ).min(2).max(10).optional(),
    explanation: Joi.string().max(2000).optional(),
    tags: Joi.array().items(Joi.string().min(1).max(50)).max(20).optional()
  });

  const schema = Joi.object({
    questions: Joi.array().items(questionSchema).min(1).max(1000).required().messages({
      'array.min': 'At least one question must be provided',
      'array.max': 'Maximum 1000 questions can be imported at once',
      'any.required': 'Questions array is required'
    })
  });

  return schema.validate(data);
};

module.exports = {
  validateExamCreation,
  validateExamUpdate,
  validateQuestionCreation,
  validateQuestionUpdate,
  validateExamAttempt,
  validateQuestionResponse,
  validateExamBooking,
  validateExamCategory,
  validateBulkQuestionImport
}; 