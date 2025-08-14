const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');

class FileUploadService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads');
    this.ensureUploadDirectory();
  }

  ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    
    // Create subdirectories
    const subdirs = ['questions', 'profiles', 'temp'];
    subdirs.forEach(subdir => {
      const subdirPath = path.join(this.uploadDir, subdir);
      if (!fs.existsSync(subdirPath)) {
        fs.mkdirSync(subdirPath, { recursive: true });
      }
    });
  }

  /**
   * Configure multer for image uploads
   */
  getImageUploadMiddleware() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(this.uploadDir, 'questions'));
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `question-${uniqueSuffix}${ext}`);
      }
    });

    const fileFilter = (req, file, cb) => {
      // Accept only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    };

    return multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Maximum 5 files per request
      }
    });
  }

  /**
   * Upload question images
   */
  async uploadQuestionImages(files, questionId) {
    try {
      const uploadedImages = [];
      
      if (!files || files.length === 0) {
        return uploadedImages;
      }

      for (const file of files) {
        const imageData = {
          questionId,
          imageUrl: `/uploads/questions/${file.filename}`,
          altText: file.originalname,
          sortOrder: uploadedImages.length
        };

        uploadedImages.push(imageData);
      }

      return uploadedImages;
    } catch (error) {
      logger.error('Upload question images failed', error);
      throw error;
    }
  }

  /**
   * Delete image file
   */
  async deleteImageFile(imageUrl) {
    try {
      if (imageUrl && imageUrl.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('Delete image file failed', error);
      return false;
    }
  }

  /**
   * Get image URL for serving static files
   */
  getImageUrl(filename) {
    return `/uploads/questions/${filename}`;
  }

  /**
   * Validate image file
   */
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size too large. Maximum size is 5MB.' };
    }

    return { valid: true };
  }
}

module.exports = FileUploadService; 