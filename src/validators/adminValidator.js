const Joi = require('joi');

// Admin user creation validation (extends auth validator)
const validateUserCreation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
    role: Joi.string().valid('STUDENT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN').default('STUDENT').messages({
      'any.only': 'Invalid role specified'
    }),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
    dateOfBirth: Joi.date().max('now').optional().messages({
      'date.max': 'Date of birth cannot be in the future'
    }),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY').optional().messages({
      'any.only': 'Invalid gender specified'
    }),
    address: Joi.string().max(500).optional().messages({
      'string.max': 'Address cannot exceed 500 characters'
    }),
    departmentId: Joi.string().optional().messages({
      'string.base': 'Department ID must be a valid string'
    }),
    profilePicture: Joi.string().uri().optional().messages({
      'string.uri': 'Profile picture must be a valid URL'
    }),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').optional().default('active').messages({
      'any.only': 'Invalid status specified'
    }),
    isPhoneVerified: Joi.boolean().optional().default(false).messages({
      'boolean.base': 'Phone verification status must be true or false'
    }),
    isActive: Joi.boolean().default(true),
    isEmailVerified: Joi.boolean().default(false)
  });

  return schema.validate(data);
};

// Admin user update validation
const validateUserUpdate = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().optional().messages({
      'string.email': 'Please provide a valid email address'
    }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .optional()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),
    firstName: Joi.string().min(2).max(50).optional().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters'
    }),
    lastName: Joi.string().min(2).max(50).optional().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
    role: Joi.string().valid('STUDENT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN').optional().messages({
      'any.only': 'Invalid role specified'
    }),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
    dateOfBirth: Joi.date().max('now').optional().messages({
      'date.max': 'Date of birth cannot be in the future'
    }),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY').optional().messages({
      'any.only': 'Invalid gender specified'
    }),
    address: Joi.string().max(500).optional().messages({
      'string.max': 'Address cannot exceed 500 characters'
    }),
    departmentId: Joi.string().optional().messages({
      'string.base': 'Department ID must be a valid string'
    }),
    profilePicture: Joi.string().uri().optional().messages({
      'string.uri': 'Profile picture must be a valid URL'
    }),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').optional().messages({
      'any.only': 'Invalid status specified'
    }),
    isPhoneVerified: Joi.boolean().optional().messages({
      'boolean.base': 'Phone verification status must be true or false'
    }),
    isActive: Joi.boolean().optional(),
    isEmailVerified: Joi.boolean().optional()
  });

  return schema.validate(data);
};

// Bulk user import validation
const validateBulkUserImport = (data) => {
  const userSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('STUDENT', 'MODERATOR', 'ADMIN').default('STUDENT'),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY').optional(),
    isActive: Joi.boolean().default(true),
    isEmailVerified: Joi.boolean().default(false)
  });

  const schema = Joi.object({
    users: Joi.array().items(userSchema).min(1).max(100).required().messages({
      'array.min': 'At least one user must be provided',
      'array.max': 'Maximum 100 users can be imported at once',
      'any.required': 'Users array is required'
    }),
    sendWelcomeEmail: Joi.boolean().default(true),
    requireEmailVerification: Joi.boolean().default(true)
  });

  return schema.validate(data);
};

// User status toggle validation
const validateUserStatusToggle = (data) => {
  const schema = Joi.object({
    isActive: Joi.boolean().required().messages({
      'any.required': 'Status is required'
    }),
    reason: Joi.string().max(500).optional().messages({
      'string.max': 'Reason cannot exceed 500 characters'
    }),
    notifyUser: Joi.boolean().default(true)
  });

  return schema.validate(data);
};

// User analytics filter validation
const validateUserAnalyticsFilter = (data) => {
  const schema = Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional().messages({
      'date.min': 'End date must be after start date'
    }),
    role: Joi.string().valid('STUDENT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN').optional(),
    isActive: Joi.boolean().optional(),
    examCategoryId: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100).messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be a whole number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 1000'
    }),
    offset: Joi.number().integer().min(0).default(0).messages({
      'number.base': 'Offset must be a number',
      'number.integer': 'Offset must be a whole number',
      'number.min': 'Offset cannot be negative'
    })
  });

  return schema.validate(data);
};

// System backup validation
const validateSystemBackup = (data) => {
  const schema = Joi.object({
    includeData: Joi.boolean().default(true),
    includeLogs: Joi.boolean().default(true),
    includeUploads: Joi.boolean().default(true),
    compression: Joi.boolean().default(true),
    encryption: Joi.boolean().default(false),
    encryptionPassword: Joi.when('encryption', {
      is: true,
      then: Joi.string().min(8).required(),
      otherwise: Joi.forbidden()
    }).messages({
      'any.required': 'Encryption password is required when encryption is enabled'
    }),
    backupType: Joi.string().valid('FULL', 'INCREMENTAL', 'DIFFERENTIAL').default('FULL').messages({
      'any.only': 'Invalid backup type'
    }),
    retentionDays: Joi.number().integer().min(1).max(365).default(30).messages({
      'number.base': 'Retention days must be a number',
      'number.integer': 'Retention days must be a whole number',
      'number.min': 'Retention days must be at least 1',
      'number.max': 'Retention days cannot exceed 365'
    })
  });

  return schema.validate(data);
};

// System export validation
const validateSystemExport = (data) => {
  const schema = Joi.object({
    dataType: Joi.string().valid('USERS', 'EXAMS', 'QUESTIONS', 'ATTEMPTS', 'PAYMENTS', 'ALL').required().messages({
      'any.only': 'Invalid data type',
      'any.required': 'Data type is required'
    }),
    format: Joi.string().valid('JSON', 'CSV', 'XLSX').default('JSON').messages({
      'any.only': 'Invalid export format'
    }),
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional().messages({
      'date.min': 'End date must be after start date'
    }),
    filters: Joi.object().optional(),
    includeSensitiveData: Joi.boolean().default(false),
    compression: Joi.boolean().default(true)
  });

  return schema.validate(data);
};

// Audit log filter validation
const validateAuditLogFilter = (data) => {
  const schema = Joi.object({
    userId: Joi.string().optional(),
    action: Joi.string().optional(),
    resource: Joi.string().optional(),
    resourceId: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional().messages({
      'date.min': 'End date must be after start date'
    }),
    ipAddress: Joi.string().ip().optional().messages({
      'string.ip': 'Invalid IP address format'
    }),
    limit: Joi.number().integer().min(1).max(1000).default(100).messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be a whole number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 1000'
    }),
    offset: Joi.number().integer().min(0).default(0).messages({
      'number.base': 'Offset must be a number',
      'number.integer': 'Offset must be a whole number',
      'number.min': 'Offset cannot be negative'
    })
  });

  return schema.validate(data);
};

// System health check validation
const validateSystemHealthCheck = (data) => {
  const schema = Joi.object({
    includeDetails: Joi.boolean().default(false),
    checkDatabase: Joi.boolean().default(true),
    checkRedis: Joi.boolean().default(true),
    checkStorage: Joi.boolean().default(true),
    checkExternalServices: Joi.boolean().default(false),
    timeout: Joi.number().integer().min(1000).max(30000).default(5000).messages({
      'number.base': 'Timeout must be a number',
      'number.integer': 'Timeout must be a whole number',
      'number.min': 'Timeout must be at least 1000ms',
      'number.max': 'Timeout cannot exceed 30000ms'
    })
  });

  return schema.validate(data);
};

// System configuration validation
const validateSystemConfiguration = (data) => {
  const schema = Joi.object({
    maintenanceMode: Joi.boolean().optional(),
    maintenanceMessage: Joi.string().max(500).optional().messages({
      'string.max': 'Maintenance message cannot exceed 500 characters'
    }),
    maxFileUploadSize: Joi.number().integer().min(1024).max(104857600).optional().messages({
      'number.base': 'Max file upload size must be a number',
      'number.integer': 'Max file upload size must be a whole number',
      'number.min': 'Max file upload size must be at least 1KB',
      'number.max': 'Max file upload size cannot exceed 100MB'
    }),
    allowedFileTypes: Joi.array().items(Joi.string().pattern(/^[a-zA-Z0-9\/\-\.]+$/)).optional().messages({
      'array.base': 'Allowed file types must be an array'
    }),
    sessionTimeout: Joi.number().integer().min(300).max(86400).optional().messages({
      'number.base': 'Session timeout must be a number',
      'number.integer': 'Session timeout must be a whole number',
      'number.min': 'Session timeout must be at least 5 minutes',
      'number.max': 'Session timeout cannot exceed 24 hours'
    }),
    maxLoginAttempts: Joi.number().integer().min(1).max(10).optional().messages({
      'number.base': 'Max login attempts must be a number',
      'number.integer': 'Max login attempts must be a whole number',
      'number.min': 'Max login attempts must be at least 1',
      'number.max': 'Max login attempts cannot exceed 10'
    }),
    accountLockoutDuration: Joi.number().integer().min(300).max(86400).optional().messages({
      'number.base': 'Account lockout duration must be a number',
      'number.integer': 'Account lockout duration must be a whole number',
      'number.min': 'Account lockout duration must be at least 5 minutes',
      'number.max': 'Account lockout duration cannot exceed 24 hours'
    }),
    emailVerificationRequired: Joi.boolean().optional(),
    passwordResetEnabled: Joi.boolean().optional(),
    twoFactorAuthEnabled: Joi.boolean().optional(),
    rateLimitingEnabled: Joi.boolean().optional(),
    rateLimitRequests: Joi.number().integer().min(1).max(1000).optional().messages({
      'number.base': 'Rate limit requests must be a number',
      'number.integer': 'Rate limit requests must be a whole number',
      'number.min': 'Rate limit requests must be at least 1',
      'number.max': 'Rate limit requests cannot exceed 1000'
    }),
    rateLimitWindow: Joi.number().integer().min(60).max(3600).optional().messages({
      'number.base': 'Rate limit window must be a number',
      'number.integer': 'Rate limit window must be a whole number',
      'number.min': 'Rate limit window must be at least 1 minute',
      'number.max': 'Rate limit window cannot exceed 1 hour'
    })
  });

  return schema.validate(data);
};

// Notification creation validation
const validateNotificationCreation = (data) => {
  const schema = Joi.object({
    userId: Joi.string().optional(), // If not provided, sends to all users
    type: Joi.string().valid('EXAM_BOOKING', 'EXAM_REMINDER', 'EXAM_RESULT', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'CERTIFICATE_ISSUED', 'SYSTEM_ANNOUNCEMENT', 'GENERAL').required().messages({
      'any.only': 'Invalid notification type',
      'any.required': 'Notification type is required'
    }),
    title: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Title must not be empty',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
    message: Joi.string().min(1).max(2000).required().messages({
      'string.min': 'Message must not be empty',
      'string.max': 'Message cannot exceed 2000 characters',
      'any.required': 'Message is required'
    }),
    metadata: Joi.object().optional(),
    scheduledAt: Joi.date().min('now').optional().messages({
      'date.min': 'Scheduled date cannot be in the past'
    }),
    sendEmail: Joi.boolean().default(true),
    sendPush: Joi.boolean().default(false)
  });

  return schema.validate(data);
};

// Bulk notification validation
const validateBulkNotification = (data) => {
  const schema = Joi.object({
    userIds: Joi.array().items(Joi.string()).min(1).max(1000).optional().messages({
      'array.min': 'At least one user ID must be provided',
      'array.max': 'Maximum 1000 users can be notified at once'
    }),
    userRoles: Joi.array().items(Joi.string().valid('STUDENT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN')).optional().messages({
      'array.base': 'User roles must be an array'
    }),
    type: Joi.string().valid('EXAM_BOOKING', 'EXAM_REMINDER', 'EXAM_RESULT', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'CERTIFICATE_ISSUED', 'SYSTEM_ANNOUNCEMENT', 'GENERAL').required().messages({
      'any.only': 'Invalid notification type',
      'any.required': 'Notification type is required'
    }),
    title: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Title must not be empty',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
    message: Joi.string().min(1).max(2000).required().messages({
      'string.min': 'Message must not be empty',
      'string.max': 'Message cannot exceed 2000 characters',
      'any.required': 'Message is required'
    }),
    metadata: Joi.object().optional(),
    scheduledAt: Joi.date().min('now').optional().messages({
      'date.min': 'Scheduled date cannot be in the past'
    }),
    sendEmail: Joi.boolean().default(true),
    sendPush: Joi.boolean().default(false)
  });

  return schema.validate(data);
};

module.exports = {
  validateUserCreation,
  validateUserUpdate,
  validateBulkUserImport,
  validateUserStatusToggle,
  validateUserAnalyticsFilter,
  validateSystemBackup,
  validateSystemExport,
  validateAuditLogFilter,
  validateSystemHealthCheck,
  validateSystemConfiguration,
  validateNotificationCreation,
  validateBulkNotification
}; 