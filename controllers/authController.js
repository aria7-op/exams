const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const AuthService = require('../services/authService');
const { validateUserCreation, validateLogin, validatePasswordReset } = require('../validators/authValidator');

const prisma = new PrismaClient();
const authService = new AuthService();
// const emailService = new EmailService(); // Email service disabled

class AuthController {
  /**
   * Register a new user (admin only)
   */
  async register(req, res) {
    try {
      // Validate request
      const { error, value } = validateUserCreation(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.details
          }
        });
      }

      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        role = 'STUDENT', 
        phone, 
        dateOfBirth, 
        gender,
        address,
        departmentId,
        profilePicture,
        status = 'active',
        isPhoneVerified = false
      } = value;

      // Check if user already exists
      const normalizedEmail = email.toLowerCase().trim();
      logger.info('User registration attempt:', { 
        originalEmail: email, 
        normalizedEmail, 
        timestamp: new Date().toISOString()
      });

      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingUser) {
        logger.warn('Registration failed - email already exists:', { 
          email: normalizedEmail, 
          existingUserId: existingUser.id,
          existingUserCreatedAt: existingUser.createdAt
        });
        return res.status(409).json({
          success: false,
          error: {
            message: 'User with this email already exists'
          }
        });
      }

      // Double-check with case-insensitive search
      const caseInsensitiveCheck = await prisma.user.findFirst({
        where: {
          email: {
            contains: normalizedEmail,
            mode: 'insensitive'
          }
        }
      });

      if (caseInsensitiveCheck && caseInsensitiveCheck.email.toLowerCase() !== normalizedEmail) {
        logger.warn('Registration failed - similar email exists:', { 
          requestedEmail: normalizedEmail, 
          existingEmail: caseInsensitiveCheck.email,
          existingUserId: caseInsensitiveCheck.id
        });
        return res.status(409).json({
          success: false,
          error: {
            message: 'User with a similar email already exists'
          }
        });
      }

      logger.info('No existing user found, proceeding with registration');

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user with transaction to ensure atomicity
      const user = await prisma.$transaction(async (tx) => {
        // Final check inside transaction to prevent race conditions
        const finalCheck = await tx.user.findUnique({
          where: { email: normalizedEmail }
        });

        if (finalCheck) {
          throw new Error('User with this email already exists (race condition detected)');
        }

        // Create user
        return await tx.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            firstName,
            lastName,
            role,
            phone,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            gender,
            address,
            departmentId,
            profilePicture,
            status,
            isPhoneVerified,
            emailVerificationToken: null, // No email verification needed
            isEmailVerified: true // Auto-verify all users since no email verification
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            address: true,
            departmentId: true,
            profilePicture: true,
            status: true,
            isPhoneVerified: true,
            isEmailVerified: true,
            isActive: true,
            createdAt: true
          }
        });
      });

      // Email verification is disabled - all users are auto-verified
      logger.info('User registered successfully - email verification disabled', { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });

      // Create audit log
      try {
        await prisma.auditLog.create({
          data: {
            userId: req.user?.id || null,
            action: 'USER_REGISTERED',
            resource: 'USER',
            resourceId: user.id,
            details: {
              registeredUser: user.email,
              role: user.role,
              emailVerificationDisabled: true
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        });
      } catch (auditError) {
        logger.error('Failed to create audit log:', auditError);
        // Don't fail the user creation if audit log fails
      }

      // Send welcome notification
      if (global.notificationService) {
        await global.notificationService.notifyUserRegistered(user);
        await global.notificationService.notifyAdminsNewUser(user);
      }

      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        registeredBy: req.user?.id || 'system'
      });

      // Return success response
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Registration failed', error);
      
      // Check if this is a duplicate email error from transaction
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: {
            message: error.message
          }
        });
      }
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to register user'
        }
      });
    }
  }

  /**
   * Login user
   */
  async login(req, res) {
    try {
      console.log('🔐 Login attempt - Body:', req.body);
      console.log('🔐 Login attempt - Headers:', req.headers);
      
      // Validate request
      const { error, value } = validateLogin(req.body);
      if (error) {
        console.log('❌ Login validation failed:', error);
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.details
          }
        });
      }

      const { email, password, rememberMe = false } = value;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          loginAttempts: true,
          lockedUntil: true,
          lastLoginAt: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid credentials'
          }
        });
      }

      // Check if account is locked
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        return res.status(423).json({
          success: false,
          error: {
            message: 'Account is temporarily locked due to multiple failed login attempts',
            lockedUntil: user.lockedUntil
          }
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Account is deactivated'
          }
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // Increment login attempts
        await authService.handleFailedLogin(user.id, user.loginAttempts);
        
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid credentials'
          }
        });
      }

      // Reset login attempts on successful login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date()
        }
      });

      // Generate tokens
      const accessToken = authService.generateAccessToken(user.id);
      const refreshToken = authService.generateRefreshToken(user.id);

      // Create session
      const session = await authService.createUserSession(user.id, refreshToken, rememberMe, req.ip, req.get('User-Agent'));

      // Prepare user data
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      };

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          resource: 'USER',
          resourceId: user.id,
          details: {
            loginMethod: 'email',
            rememberMe,
            sessionId: session.id
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: req.ip
      });

      // Emit WebSocket event for user login
      if (global.io) {
        global.io.to('admin-room').emit('user-login', {
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userRole: user.role,
          timestamp: new Date().toISOString()
        });
      }

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000 // 30 days or 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          accessToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      });
    } catch (error) {
      console.log('💥 Login error occurred:', error);
      console.log('💥 Login error stack:', error.stack);
      logger.error('Login failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Login failed',
          details: error.message
        }
      });
    }
  }

  /**
   * Logout user
   */
  async logout(req, res) {
    try {
      const { token } = req;

      if (token) {
        // Invalidate session
        await authService.invalidateSession(token);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'USER_LOGOUT',
          resource: 'USER',
          resourceId: req.user?.id,
          details: {
            logoutMethod: 'manual'
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      logger.info('User logged out', {
        userId: req.user?.id,
        email: req.user?.email
      });

      // Emit WebSocket event for user logout
      if (global.io && req.user) {
        global.io.to('admin-room').emit('user-logout', {
          userId: req.user.id,
          userName: `${req.user.firstName} ${req.user.lastName}`,
          userRole: req.user.role,
          timestamp: new Date().toISOString()
        });
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Logout failed'
        }
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Refresh token not provided'
          }
        });
      }

      const result = await authService.refreshAccessToken(refreshToken);
      
      if (!result.success) {
        return res.status(401).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      });
    } catch (error) {
      logger.error('Token refresh failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Token refresh failed'
        }
      });
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      const result = await authService.verifyEmailToken(token);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      logger.error('Email verification failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Email verification failed'
        }
      });
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Email is required'
          }
        });
      }

      const result = await authService.requestPasswordReset(email);
      
      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (error) {
      logger.error('Password reset request failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Password reset request failed'
        }
      });
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req, res) {
    try {
      const { error, value } = validatePasswordReset(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.details
          }
        });
      }

      const { token, password } = value;

      const result = await authService.resetPassword(token, password);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Password reset failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Password reset failed'
        }
      });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          profileImage: true,
          profilePicture: true,
          address: true,
          departmentId: true,
          role: true,
          status: true,
          isActive: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          lastLoginAt: true,
          loginAttempts: true,
          lockedUntil: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Get profile failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get profile'
        }
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const { 
        firstName, 
        lastName, 
        phone, 
        dateOfBirth, 
        gender, 
        address, 
        profilePicture 
      } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          firstName,
          lastName,
          phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender,
          address,
          profilePicture
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          profileImage: true,
          profilePicture: true,
          address: true,
          departmentId: true,
          role: true,
          status: true,
          isActive: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'PROFILE_UPDATED',
          resource: 'USER',
          resourceId: req.user.id,
          details: {
            updatedFields: Object.keys(req.body)
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Profile update failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Profile update failed'
        }
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get current user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { password: true }
      });

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Current password is incorrect'
          }
        });
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedNewPassword }
      });

      // Invalidate all sessions
      await authService.invalidateAllUserSessions(req.user.id);

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'PASSWORD_CHANGED',
          resource: 'USER',
          resourceId: req.user.id,
          details: {
            changedBy: 'user'
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. Please login again.'
      });
    } catch (error) {
      logger.error('Password change failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Password change failed'
        }
      });
    }
  }
}

module.exports = new AuthController(); 