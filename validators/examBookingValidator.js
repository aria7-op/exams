const Joi = require('joi');
const logger = require('../config/logger');

/**
 * Validate exam booking creation
 */
const validateExamBooking = (data) => {
  try {
    const schema = Joi.object({
      examId: Joi.string().required().messages({
        'string.empty': 'Exam ID is required',
        'any.required': 'Exam ID is required'
      }),
      userId: Joi.string().optional().messages({
        'string.empty': 'User ID cannot be empty'
      }),
      scheduledAt: Joi.date().min('now').required().messages({
        'date.base': 'Scheduled date must be a valid date',
        'date.min': 'Scheduled date must be in the future',
        'any.required': 'Scheduled date is required'
      }),
      attemptsAllowed: Joi.number().integer().min(1).max(10).default(1).messages({
        'number.base': 'Attempts allowed must be a number',
        'number.integer': 'Attempts allowed must be a whole number',
        'number.min': 'Attempts allowed must be at least 1',
        'number.max': 'Attempts allowed cannot exceed 10'
      }),
      notes: Joi.string().max(1000).allow('').optional().messages({
        'string.max': 'Notes must not exceed 1000 characters'
      })
    });

    return schema.validate(data);
  } catch (error) {
    logger.error('Exam booking validation error', error);
    return { error: { details: [{ message: 'Validation error occurred' }] } };
  }
};

/**
 * Validate admin exam booking creation
 */
const validateAdminExamBooking = (data) => {
  try {
    const schema = Joi.object({
      examId: Joi.string().required().messages({
        'string.empty': 'Exam ID is required',
        'any.required': 'Exam ID is required'
      }),
      userId: Joi.string().required().messages({
        'string.empty': 'User ID is required',
        'any.required': 'User ID is required'
      }),
      scheduledAt: Joi.alternatives().try(
        Joi.date(),
        Joi.string().isoDate(),
        Joi.string().pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      ).optional().messages({
        'alternatives.match': 'Scheduled date must be a valid date or ISO string'
      }),
      attemptsAllowed: Joi.number().integer().min(1).max(10).default(1).messages({
        'number.base': 'Attempts allowed must be a number',
        'number.integer': 'Attempts allowed must be a whole number',
        'number.min': 'Attempts allowed must be at least 1',
        'number.max': 'Attempts allowed cannot exceed 10'
      }),
      notes: Joi.string().max(1000).allow('').optional().messages({
        'string.max': 'Notes must not exceed 1000 characters'
      })
    });

    return schema.validate(data);
  } catch (error) {
    logger.error('Admin exam booking validation error', error);
    return { error: { details: [{ message: 'Validation error occurred' }] } };
  }
};

/**
 * Validate exam booking update
 */
const validateBookingUpdate = (req, res, next) => {
  try {
    const schema = Joi.object({
      scheduledDate: Joi.date().min('now').optional().messages({
        'date.base': 'Scheduled date must be a valid date',
        'date.min': 'Scheduled date must be in the future'
      }),
      status: Joi.string().valid('CONFIRMED', 'CANCELLED', 'RESCHEDULED').optional().messages({
        'string.empty': 'Status cannot be empty',
        'any.only': 'Status must be one of: CONFIRMED, CANCELLED, RESCHEDULED'
      }),
      specialRequirements: Joi.string().max(500).optional().messages({
        'string.max': 'Special requirements must not exceed 500 characters'
      }),
      notes: Joi.string().max(1000).allow('').optional().messages({
        'string.max': 'Notes must not exceed 1000 characters'
      })
    });

    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.validatedData = value;
    next();
  } catch (error) {
    logger.error('Exam booking update validation error', error);
    res.status(500).json({
      success: false,
      message: 'Validation error occurred'
    });
  }
};

/**
 * Validate booking ID parameter
 */
const validateBookingId = (req, res, next) => {
  try {
    const schema = Joi.object({
      bookingId: Joi.string().required().messages({
        'string.empty': 'Booking ID is required',
        'any.required': 'Booking ID is required'
      })
    });

    const { error } = schema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    next();
  } catch (error) {
    logger.error('Booking ID validation error', error);
    res.status(500).json({
      success: false,
      message: 'Validation error occurred'
    });
  }
};

/**
 * Validate booking query parameters
 */
const validateBookingQuery = (req, res, next) => {
  try {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
      limit: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
      status: Joi.string().valid('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'RESCHEDULED').optional().messages({
        'string.empty': 'Status cannot be empty',
        'any.only': 'Status must be one of: PENDING, CONFIRMED, CANCELLED, COMPLETED, RESCHEDULED'
      }),
      examId: Joi.string().optional().messages({
        'string.empty': 'Exam ID cannot be empty'
      }),
      startDate: Joi.date().optional().messages({
        'date.base': 'Start date must be a valid date'
      }),
      endDate: Joi.date().min(Joi.ref('startDate')).optional().messages({
        'date.base': 'End date must be a valid date',
        'date.min': 'End date must be after start date'
      })
    });

    const { error, value } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.validatedQuery = value;
    next();
  } catch (error) {
    logger.error('Booking query validation error', error);
    res.status(500).json({
      success: false,
      message: 'Validation error occurred'
    });
  }
};

module.exports = {
  validateExamBooking,
  validateAdminExamBooking,
  validateBookingUpdate,
  validateBookingId,
  validateBookingQuery
}; 