const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const EmailService = require('./emailService');

const prisma = new PrismaClient();
const emailService = new EmailService();

class AuthService {
  /**
   * Generate access token
   */
  generateAccessToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
  }

  /**
   * Create user session
   */
  async createUserSession(userId, refreshToken, rememberMe, ipAddress, userAgent) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7)); // 30 days or 7 days

    return await prisma.userSession.create({
      data: {
        userId,
        sessionToken: refreshToken,
        expiresAt,
        ipAddress,
        userAgent,
        isActive: true
      }
    });
  }

  /**
   * Handle failed login attempts
   */
  async handleFailedLogin(userId, currentAttempts) {
    const newAttempts = currentAttempts + 1;
    let lockedUntil = null;

    // Lock account after 5 failed attempts
    if (newAttempts >= 5) {
      lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + 30); // Lock for 30 minutes
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: newAttempts,
        lockedUntil
      }
    });

    // Log security event
    logger.logSecurity('FAILED_LOGIN_ATTEMPT', {
      userId,
      attemptCount: newAttempts,
      lockedUntil,
      ipAddress: 'system'
    });

    // Send security alert email if account is locked
    if (lockedUntil) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true }
      });

      if (user) {
        await emailService.sendSecurityAlert(user.email, {
          type: 'ACCOUNT_LOCKED',
          reason: 'Multiple failed login attempts',
          lockedUntil,
          firstName: user.firstName
        });
      }
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      if (decoded.type !== 'refresh') {
        return { success: false, message: 'Invalid token type' };
      }

      // Check if session exists and is valid
      const session = await prisma.userSession.findFirst({
        where: {
          sessionToken: refreshToken,
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      });

      if (!session) {
        return { success: false, message: 'Session expired or invalid' };
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(decoded.userId);

      return {
        success: true,
        accessToken,
        userId: decoded.userId
      };
    } catch (error) {
      logger.error('Token refresh failed', error);
      return { success: false, message: 'Invalid refresh token' };
    }
  }

  /**
   * Invalidate session
   */
  async invalidateSession(token) {
    try {
      await prisma.userSession.updateMany({
        where: { sessionToken: token },
        data: { isActive: false }
      });
    } catch (error) {
      logger.error('Session invalidation failed', error);
    }
  }

  /**
   * Invalidate all user sessions
   */
  async invalidateAllUserSessions(userId) {
    try {
      await prisma.userSession.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false }
      });
    } catch (error) {
      logger.error('User sessions invalidation failed', error);
    }
  }

  /**
   * Verify email token
   */
  async verifyEmailToken(token) {
    try {
      const user = await prisma.user.findFirst({
        where: { emailVerificationToken: token }
      });

      if (!user) {
        return { success: false, message: 'Invalid verification token' };
      }

      if (user.isEmailVerified) {
        return { success: false, message: 'Email already verified' };
      }

      // Verify email
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'EMAIL_VERIFIED',
          resource: 'USER',
          resourceId: user.id,
          details: { verifiedAt: new Date().toISOString() },
          ipAddress: 'system',
          userAgent: 'email-verification'
        }
      });

      // Send email verification notification
      if (global.notificationService) {
        try {
          await global.notificationService.notifyEmailVerified(user);
          logger.info('Email verification notification sent', { userId: user.id });
        } catch (notificationError) {
          logger.error('Failed to send email verification notification', {
            userId: user.id,
            error: notificationError.message
          });
        }
      }

      logger.info('Email verified successfully', { userId: user.id });

      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      logger.error('Email verification failed', error);
      return { success: false, message: 'Email verification failed' };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Return success to prevent email enumeration
        return { success: true };
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour

      // Update user with reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires
        }
      });

      // Send reset email
      await emailService.sendPasswordResetEmail(user.email, resetToken, {
        firstName: user.firstName,
        lastName: user.lastName
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          resource: 'USER',
          resourceId: user.id,
          details: { requestedAt: new Date().toISOString() },
          ipAddress: 'system',
          userAgent: 'password-reset-request'
        }
      });

      logger.info('Password reset requested', { userId: user.id });

      return { success: true };
    } catch (error) {
      logger.error('Password reset request failed', error);
      return { success: false, message: 'Password reset request failed' };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: { gt: new Date() }
        }
      });

      if (!user) {
        return { success: false, message: 'Invalid or expired reset token' };
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          loginAttempts: 0,
          lockedUntil: null
        }
      });

      // Invalidate all sessions
      await this.invalidateAllUserSessions(user.id);

      // Send confirmation email
      await emailService.sendPasswordChangedEmail(user.email, {
        firstName: user.firstName,
        lastName: user.lastName
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_COMPLETED',
          resource: 'USER',
          resourceId: user.id,
          details: { resetAt: new Date().toISOString() },
          ipAddress: 'system',
          userAgent: 'password-reset-completion'
        }
      });

      logger.info('Password reset completed', { userId: user.id });

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      logger.error('Password reset failed', error);
      return { success: false, message: 'Password reset failed' };
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      const result = await prisma.userSession.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          isActive: true
        },
        data: { isActive: false }
      });

      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} expired sessions`);
      }
    } catch (error) {
      logger.error('Session cleanup failed', error);
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId) {
    return await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Revoke specific session
   */
  async revokeSession(userId, sessionId) {
    try {
      const session = await prisma.userSession.findFirst({
        where: {
          id: sessionId,
          userId,
          isActive: true
        }
      });

      if (!session) {
        return { success: false, message: 'Session not found' };
      }

      await prisma.userSession.update({
        where: { id: sessionId },
        data: { isActive: false }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'SESSION_REVOKED',
          resource: 'USER_SESSION',
          resourceId: sessionId,
          details: { revokedAt: new Date().toISOString() },
          ipAddress: 'system',
          userAgent: 'session-revocation'
        }
      });

      return { success: true, message: 'Session revoked successfully' };
    } catch (error) {
      logger.error('Session revocation failed', error);
      return { success: false, message: 'Session revocation failed' };
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar)
    };
  }

  /**
   * Calculate password strength
   */
  calculatePasswordStrength(password, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar) {
    let score = 0;
    
    // Length contribution
    score += Math.min(password.length * 4, 20);
    
    // Character variety contribution
    if (hasUpperCase) score += 10;
    if (hasLowerCase) score += 10;
    if (hasNumbers) score += 10;
    if (hasSpecialChar) score += 10;

    // Determine strength level
    if (score >= 80) return 'very_strong';
    if (score >= 60) return 'strong';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'weak';
    return 'very_weak';
  }

  /**
   * Check if user has permission
   */
  async checkPermission(userId, resource, action) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return false;
      }

      // Super admin has all permissions
      if (user.role === 'SUPER_ADMIN') {
        return true;
      }

      // Admin permissions
      if (user.role === 'ADMIN') {
        const adminPermissions = [
          'user:read', 'user:create', 'user:update',
          'exam:read', 'exam:create', 'exam:update', 'exam:delete',
          'question:read', 'question:create', 'question:update', 'question:delete',
          'category:read', 'category:create', 'category:update', 'category:delete',
          'booking:read', 'booking:update', 'booking:create', 'booking:delete',
          'calendar:read', 'calendar:update', 'calendar:reschedule',
          'analytics:read'
        ];

        return adminPermissions.includes(`${resource}:${action}`);
      }

      // Moderator permissions
      if (user.role === 'MODERATOR') {
        const moderatorPermissions = [
          'user:read',
          'exam:read', 'exam:update',
          'question:read', 'question:create', 'question:update',
          'category:read',
          'booking:read', 'booking:update',
          'calendar:read', 'calendar:update',
          'analytics:read'
        ];

        return moderatorPermissions.includes(`${resource}:${action}`);
      }

      // Student permissions
      if (user.role === 'STUDENT') {
        const studentPermissions = [
          'profile:read', 'profile:update',
          'exam:read',
          'booking:read', 'booking:create',
          'attempt:read', 'attempt:create', 'attempt:update'
        ];

        return studentPermissions.includes(`${resource}:${action}`);
      }

      return false;
    } catch (error) {
      logger.error('Permission check failed', error);
      return false;
    }
  }
}

module.exports = AuthService; 