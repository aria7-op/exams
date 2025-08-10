const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get('/', auth, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};

    // Add search filter
    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Add role filter
    if (role) {
      where.role = role;
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          departmentId: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          profilePicture: true,
          phone: true,
          address: true,
          dateOfBirth: true,
          gender: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          _count: {
            select: {
              examAttempts: true,
              examBookings: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        profilePicture: true,
        phone: true,
        address: true,
        dateOfBirth: true,
        gender: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        examAttempts: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        examBookings: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
});

// Update user
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove sensitive fields from update data
    delete updateData.password;
    delete updateData.emailVerificationToken;
    delete updateData.passwordResetToken;
    delete updateData.passwordResetExpires;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        profilePicture: true,
        phone: true,
        address: true,
        dateOfBirth: true,
        gender: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
});

// Delete user
router.delete('/:id', auth, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
});

// Get user profile
router.get('/profile/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        profilePicture: true,
        phone: true,
        address: true,
        dateOfBirth: true,
        gender: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        examAttempts: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        examBookings: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    res.json({
      success: true,
      data: user,
      message: 'Profile retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
});

// Update user profile
router.put('/profile/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Remove sensitive fields from update data
    delete updateData.password;
    delete updateData.emailVerificationToken;
    delete updateData.passwordResetToken;
    delete updateData.passwordResetExpires;
    delete updateData.role;
    delete updateData.isEmailVerified;
    delete updateData.isPhoneVerified;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        profilePicture: true,
        phone: true,
        address: true,
        dateOfBirth: true,
        gender: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
});

module.exports = router; 