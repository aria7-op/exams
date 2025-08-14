const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

const prisma = new PrismaClient();

class UserService {
  /**
   * Create new user
   */
  async createUser(userData, createdBy) {
    try {
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
        isPhoneVerified = false,
        isActive = true,
        isEmailVerified
      } = userData;

      // Normalize email and add debug logging
      const normalizedEmail = email.toLowerCase().trim();
      logger.info('Creating user with email:', { 
        originalEmail: email, 
        normalizedEmail, 
        createdBy,
        timestamp: new Date().toISOString()
      });

      // Check if user already exists with better error handling
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingUser) {
        logger.warn('User creation failed - email already exists:', { 
          email: normalizedEmail, 
          existingUserId: existingUser.id,
          existingUserCreatedAt: existingUser.createdAt
        });
        return { success: false, message: 'User with this email already exists' };
      }

      // Additional check: search for any email that might be similar (case-insensitive)
      const similarEmails = await prisma.user.findMany({
        where: {
          OR: [
            { email: { equals: normalizedEmail, mode: 'insensitive' } },
            { email: { contains: normalizedEmail, mode: 'insensitive' } }
          ]
        },
        select: { id: true, email: true }
      });

      logger.info('Similar emails found:', similarEmails);

      // Filter out exact matches (should be empty after first check)
      const exactMatches = similarEmails.filter(u => u.email.toLowerCase() === normalizedEmail);
      if (exactMatches.length > 0) {
        logger.warn('User creation failed - exact email match found after initial check:', { 
          email: normalizedEmail, 
          matches: exactMatches 
        });
        return { success: false, message: 'User with this email already exists' };
      }

      // Check for very similar emails that might cause confusion
      const verySimilarEmails = similarEmails.filter(u => {
        const emailLower = u.email.toLowerCase();
        return emailLower !== normalizedEmail && 
               (emailLower.includes(normalizedEmail) || normalizedEmail.includes(emailLower));
      });

      if (verySimilarEmails.length > 0) {
        logger.warn('User creation failed - very similar email exists:', { 
          requestedEmail: normalizedEmail, 
          similarEmails: verySimilarEmails 
        });
        return { success: false, message: 'User with a very similar email already exists' };
      }

      logger.info('No existing user found, proceeding with creation');

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
            isActive,
            emailVerificationToken: null, // No email verification needed
            isEmailVerified: role === 'STUDENT' ? true : true // Auto-verify all users since no email verification
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
      logger.info('User created successfully - email verification disabled', { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });

      // Create audit log
      try {
        await prisma.auditLog.create({
          data: {
            userId: createdBy,
            action: 'USER_CREATED',
            resource: 'USER',
            resourceId: user.id,
            details: {
              createdUser: user.email,
              role: user.role,
              emailSent: false // Email verification is disabled
            },
            ipAddress: 'system',
            userAgent: 'user-service'
          }
        });
      } catch (auditError) {
        logger.error('Failed to create audit log:', auditError);
        // Don't fail the user creation if audit log fails
      }

      return { 
        success: true, 
        user,
        warnings: [] // No warnings for email verification
      };
    } catch (error) {
      logger.error('Create user failed:', { 
        error: error.message, 
        stack: error.stack,
        email: userData.email,
        createdBy 
      });
      
      if (error.message.includes('already exists')) {
        return { success: false, message: error.message };
      }
      
      return { success: false, message: 'Failed to create user' };
    }
  }

  /**
   * Get all users with pagination and filters
   */
  async getAllUsers(options = {}) {
    const { page = 1, limit = 20, role, isActive, search, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    try {
      const where = {};

      if (role) {
        where.role = role;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } }
        ];
      }

      const orderBy = {};
      if (sortBy && sortOrder) {
        orderBy[sortBy] = sortOrder;
      } else {
        orderBy.createdAt = 'desc';
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
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
            updatedAt: true,
            _count: {
              select: {
                examAttempts: true,
                examBookings: true
              }
            }
          },
          orderBy,
          skip,
          take: limit
        }),
        prisma.user.count({ where })
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Get all users failed', error);
      throw error;
    }
  }

  /**
   * Get user details
   */
  async getUserDetails(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              examAttempts: true,
              examBookings: true,
              certificates: true
            }
          },
          examAttempts: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              exam: {
                select: {
                  title: true,
                  examCategory: {
                    select: { name: true }
                  }
                }
              }
            }
          },
          examBookings: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              exam: {
                select: {
                  title: true,
                  examCategory: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        }
      });

      return user;
    } catch (error) {
      logger.error('Get user details failed', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, updateData, updatedBy) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Hash password if provided
      if (updateData.password) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        updateData.password = await bcrypt.hash(updateData.password, saltRounds);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
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

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: updatedBy,
          action: 'USER_UPDATED',
          resource: 'USER',
          resourceId: userId,
          details: {
            updatedFields: Object.keys(updateData)
          },
          ipAddress: 'system',
          userAgent: 'user-service'
        }
      });

      return { success: true, user: updatedUser };
    } catch (error) {
      logger.error('Update user failed', error);
      return { success: false, message: 'Failed to update user' };
    }
  }

  /**
   * Toggle user status
   */
  async toggleUserStatus(userId, isActive, reason, updatedBy) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          updatedAt: true
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: updatedBy,
          action: 'USER_STATUS_TOGGLED',
          resource: 'USER',
          resourceId: userId,
          details: {
            newStatus: isActive,
            reason,
            previousStatus: user.isActive
          },
          ipAddress: 'system',
          userAgent: 'user-service'
        }
      });

      // Send status change notification
      if (global.notificationService) {
        await global.notificationService.notifyAccountStatusChanged(user.id, {
          firstName: user.firstName,
          isActive,
          reason
        });
      }

      return { success: true, user: updatedUser };
    } catch (error) {
      logger.error('Toggle user status failed', error);
      return { success: false, message: 'Failed to update user status' };
    }
  }

  /**
   * Bulk import users
   */
  async bulkImportUsers(users, importedBy) {
    try {
      const results = {
        successful: [],
        failed: [],
        total: users.length
      };

      for (const userData of users) {
        try {
          const result = await this.createUser(userData, importedBy);
          if (result.success) {
            results.successful.push(result.user);
          } else {
            results.failed.push({
              email: userData.email,
              error: result.message
            });
          }
        } catch (error) {
          results.failed.push({
            email: userData.email,
            error: error.message
          });
        }
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: importedBy,
          action: 'BULK_USER_IMPORT',
          resource: 'USER',
          resourceId: null,
          details: {
            totalUsers: results.total,
            successful: results.successful.length,
            failed: results.failed.length
          },
          ipAddress: 'system',
          userAgent: 'user-service'
        }
      });

      return results;
    } catch (error) {
      logger.error('Bulk import users failed', error);
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(options = {}) {
    const { startDate, endDate, role } = options;

    try {
      const where = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      if (role) {
        where.role = role;
      }

      const [
        totalUsers,
        activeUsers,
        verifiedUsers,
        usersByRole,
        usersByMonth,
        loginStats
      ] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.count({ where: { ...where, isActive: true } }),
        prisma.user.count({ where: { ...where, isEmailVerified: true } }),
        prisma.user.groupBy({
          by: ['role'],
          where,
          _count: { id: true }
        }),
        prisma.user.groupBy({
          by: ['createdAt'],
          where,
          _count: { id: true }
        }),
        prisma.user.aggregate({
          where: { ...where, lastLoginAt: { not: null } },
          _avg: { loginAttempts: true }
        })
      ]);

      return {
        totalUsers,
        activeUsers,
        verifiedUsers,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count.id;
          return acc;
        }, {}),
        usersByMonth: usersByMonth.map(item => ({
          month: item.createdAt,
          count: item._count.id
        })),
        averageLoginAttempts: loginStats._avg.loginAttempts || 0,
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
        activationRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
      };
    } catch (error) {
      logger.error('Get user analytics failed', error);
      throw error;
    }
  }
}

module.exports = UserService; 