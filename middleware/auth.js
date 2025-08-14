const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const prisma = new PrismaClient();

const auth = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access denied. No token provided.',
        },
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid token. User not found.',
          },
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Account is deactivated. Please contact support.',
          },
        });
      }

      // For JWT access tokens, we don't need to check the session table
      // The JWT token itself contains the user information and expiration
      // Sessions are only used for refresh tokens

      // Add user to request
      req.user = user;
      req.token = token;

      // Log successful authentication
      logger.debug('User authenticated', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      next();
    } catch (jwtError) {
      logger.warn('JWT verification failed', {
        error: jwtError.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token.',
        },
      });
    }
  } catch (error) {
    logger.error('Authentication error', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed.',
      },
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('No user found in request', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required.',
        },
      });
    }

    logger.debug('Authorization check', {
      userId: req.user.id,
      userRole: req.user.role,
      requiredRoles: roles,
      path: req.path,
      method: req.method,
    });

    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Insufficient permissions.',
        },
      });
    }

    logger.debug('Authorization successful', {
      userId: req.user.id,
      userRole: req.user.role,
      path: req.path,
    });

    next();
  };
};

// Admin only middleware
const adminOnly = authorize('ADMIN', 'SUPER_ADMIN');

// Super admin only middleware
const superAdminOnly = authorize('SUPER_ADMIN');

// Student only middleware
const studentOnly = authorize('STUDENT');

// Moderator only middleware
const moderatorOnly = authorize('MODERATOR');

// Admin or moderator middleware (for viewing everything)
const adminOrModerator = authorize('ADMIN', 'SUPER_ADMIN', 'MODERATOR');

// Admin or super admin only (no moderator)
const adminOrSuperAdmin = authorize('ADMIN', 'SUPER_ADMIN');

// Resource ownership middleware
const checkOwnership = (resourceModel, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdField];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Resource ID is required.',
          },
        });
      }

      // Get resource
      const resource = await prisma[resourceModel].findUnique({
        where: { id: resourceId },
        select: { id: true, userId: true },
      });

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Resource not found.',
          },
        });
      }

      // Allow if user is admin/super admin or owns the resource
      if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN' || resource.userId === req.user.id) {
        req.resource = resource;
        return next();
      }

      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You can only access your own resources.',
        },
      });
    } catch (error) {
      logger.error('Ownership check error', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to verify resource ownership.',
        },
      });
    }
  };
};

// Exam access middleware
const checkExamAccess = async (req, res, next) => {
  try {
    const examId = req.params.examId;
    
    if (!examId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Exam ID is required.',
        },
      });
    }

    // Get exam
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        isPublic: true,
        createdBy: true,
        examCategory: {
          select: {
            id: true,
            users: {
              where: { userId: req.user.id },
              select: { accessLevel: true },
            },
          },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Exam not found.',
        },
      });
    }

    // Allow if exam is public, user is admin, or user has access to exam category
    if (
      exam.isPublic ||
      req.user.role === 'ADMIN' ||
      req.user.role === 'SUPER_ADMIN' ||
      exam.createdBy === req.user.id ||
      exam.examCategory.users.length > 0
    ) {
      req.exam = exam;
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied. You do not have permission to access this exam.',
      },
    });
  } catch (error) {
    logger.error('Exam access check error', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to verify exam access.',
      },
    });
  }
};

module.exports = {
  auth,
  authorize,
  adminOnly,
  superAdminOnly,
  studentOnly,
  moderatorOnly,
  adminOrModerator,
  adminOrSuperAdmin,
  checkOwnership,
  checkExamAccess,
}; 