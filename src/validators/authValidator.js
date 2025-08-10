const Joi = require('joi');

// User registration validation
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
    })
  });

  return schema.validate(data);
};

// User update validation
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
    isActive: Joi.boolean().optional(),
    isEmailVerified: Joi.boolean().optional(),
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
    })
  });

  return schema.validate(data);
};

// Login validation
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    }),
    rememberMe: Joi.boolean().default(false)
  });

  return schema.validate(data);
};

// Password reset request validation
const validatePasswordResetRequest = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
  });

  return schema.validate(data);
};

// Password reset validation
const validatePasswordReset = (data) => {
  const schema = Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required'
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
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
  });

  return schema.validate(data);
};

// Change password validation
const validateChangePassword = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
  });

  return schema.validate(data);
};

// Profile update validation
const validateProfileUpdate = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50).optional().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters'
    }),
    lastName: Joi.string().min(2).max(50).optional().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters'
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
    profileImage: Joi.string().uri().optional().messages({
      'string.uri': 'Please provide a valid image URL'
    })
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
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY').optional()
  });

  const schema = Joi.object({
    users: Joi.array().items(userSchema).min(1).max(100).required().messages({
      'array.min': 'At least one user must be provided',
      'array.max': 'Maximum 100 users can be imported at once',
      'any.required': 'Users array is required'
    })
  });

  return schema.validate(data);
};

// Refresh token validation
const validateRefreshToken = (data) => {
  const schema = Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required'
    })
  });

  return schema.validate(data);
};

// Email verification validation
const validateEmailVerification = (data) => {
  const schema = Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Verification token is required'
    })
  });

  return schema.validate(data);
};

module.exports = {
  validateUserCreation,
  validateUserUpdate,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateChangePassword,
  validateProfileUpdate,
  validateBulkUserImport,
  validateRefreshToken,
  validateEmailVerification
}; 