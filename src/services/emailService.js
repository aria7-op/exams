const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email, token) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Verify Your Email Address',
        html: this.getVerificationEmailTemplate(verificationUrl)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Verification email sent', { email });
    } catch (error) {
      logger.error('Send verification email failed', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, token) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Reset Your Password',
        html: this.getPasswordResetEmailTemplate(resetUrl)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Password reset email sent', { email });
    } catch (error) {
      logger.error('Send password reset email failed', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, userData) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Welcome to Our Mock Test Platform',
        html: this.getWelcomeEmailTemplate(userData)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Welcome email sent', { email });
    } catch (error) {
      logger.error('Send welcome email failed', error);
      throw error;
    }
  }

  /**
   * Send exam booking confirmation
   */
  async sendExamBookingConfirmation(email, bookingData) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Exam Booking Confirmation',
        html: this.getExamBookingEmailTemplate(bookingData)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Exam booking confirmation email sent', { email });
    } catch (error) {
      logger.error('Send exam booking confirmation failed', error);
      throw error;
    }
  }

  /**
   * Send exam results email
   */
  async sendExamResultsEmail(email, resultsData) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Your Exam Results',
        html: this.getExamResultsEmailTemplate(resultsData)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Exam results email sent', { email });
    } catch (error) {
      logger.error('Send exam results email failed', error);
      throw error;
    }
  }

  /**
   * Send certificate email
   */
  async sendCertificateEmail(email, certificateData) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Your Certificate is Ready',
        html: this.getCertificateEmailTemplate(certificateData)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Certificate email sent', { email });
    } catch (error) {
      logger.error('Send certificate email failed', error);
      throw error;
    }
  }

  /**
   * Send account status email
   */
  async sendAccountStatusEmail(email, statusData) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: `Account ${statusData.isActive ? 'Activated' : 'Deactivated'}`,
        html: this.getAccountStatusEmailTemplate(statusData)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Account status email sent', { email });
    } catch (error) {
      logger.error('Send account status email failed', error);
      throw error;
    }
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(email, notificationData) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: notificationData.subject,
        html: this.getNotificationEmailTemplate(notificationData)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Notification email sent', { email });
    } catch (error) {
      logger.error('Send notification email failed', error);
      throw error;
    }
  }

  // Email templates

  /**
   * Get verification email template
   */
  getVerificationEmailTemplate(verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email Address</h1>
          </div>
          <div class="content">
            <p>Thank you for registering with our Mock Test Platform!</p>
            <p>Please click the button below to verify your email address:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get password reset email template
   */
  getPasswordResetEmailTemplate(resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>You requested to reset your password.</p>
            <p>Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>For security reasons, this link will expire soon.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get welcome email template
   */
  getWelcomeEmailTemplate(userData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Our Platform</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Mock Test Platform!</h1>
          </div>
          <div class="content">
            <p>Hello ${userData.firstName},</p>
            <p>Welcome to our professional mock test platform! We're excited to have you on board.</p>
            <p>Here's what you can do:</p>
            <ul>
              <li>Browse available exams</li>
              <li>Book and take mock tests</li>
              <li>View your results and certificates</li>
              <li>Track your progress</li>
            </ul>
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Get Started</a>
            </p>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing our platform!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get exam booking email template
   */
  getExamBookingEmailTemplate(bookingData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Exam Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #17a2b8; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Exam Booking Confirmation</h1>
          </div>
          <div class="content">
            <p>Hello ${bookingData.userName},</p>
            <p>Your exam booking has been confirmed!</p>
            <div class="details">
              <h3>Exam Details:</h3>
              <p><strong>Exam:</strong> ${bookingData.examTitle}</p>
              <p><strong>Category:</strong> ${bookingData.categoryName}</p>
              <p><strong>Date:</strong> ${bookingData.scheduledDate}</p>
              <p><strong>Duration:</strong> ${bookingData.duration} minutes</p>
              <p><strong>Price:</strong> $${bookingData.price}</p>
            </div>
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/exams/${bookingData.examId}" class="button">View Exam Details</a>
            </p>
            <p>Good luck with your exam!</p>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get exam results email template
   */
  getExamResultsEmailTemplate(resultsData) {
    const isPassed = resultsData.isPassed;
    const headerColor = isPassed ? '#28a745' : '#dc3545';
    const headerText = isPassed ? 'Congratulations!' : 'Exam Results';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Exam Results</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${headerColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .results { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; text-align: center; }
          .score { font-size: 48px; font-weight: bold; color: ${headerColor}; }
          .button { display: inline-block; padding: 12px 24px; background: ${headerColor}; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${headerText}</h1>
          </div>
          <div class="content">
            <p>Hello ${resultsData.userName},</p>
            <p>Your exam results are ready!</p>
            <div class="results">
              <div class="score">${resultsData.percentage}%</div>
              <p><strong>Status:</strong> ${resultsData.status}</p>
              <p><strong>Total Marks:</strong> ${resultsData.totalMarks}/${resultsData.maxMarks}</p>
              <p><strong>Time Taken:</strong> ${resultsData.timeSpent} minutes</p>
            </div>
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/results/${resultsData.attemptId}" class="button">View Detailed Results</a>
            </p>
            ${isPassed ? '<p>Congratulations on passing the exam!</p>' : '<p>Don\'t worry, you can retake the exam to improve your score.</p>'}
          </div>
          <div class="footer">
            <p>Keep practicing to improve your skills!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get certificate email template
   */
  getCertificateEmailTemplate(certificateData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Certificate is Ready</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #ffc107; color: #333; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Your Certificate is Ready!</h1>
          </div>
          <div class="content">
            <p>Hello ${certificateData.userName},</p>
            <p>Congratulations! Your certificate for the exam is now ready for download.</p>
            <div class="details">
              <h3>Certificate Details:</h3>
              <p><strong>Certificate Number:</strong> ${certificateData.certificateNumber}</p>
              <p><strong>Exam:</strong> ${certificateData.examTitle}</p>
              <p><strong>Score:</strong> ${certificateData.score}%</p>
              <p><strong>Issued Date:</strong> ${certificateData.issuedDate}</p>
              <p><strong>Valid Until:</strong> ${certificateData.validUntil}</p>
            </div>
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/certificates/${certificateData.certificateId}/download" class="button">Download Certificate</a>
            </p>
            <p>You can also view and manage all your certificates from your dashboard.</p>
          </div>
          <div class="footer">
            <p>Keep up the great work!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get account status email template
   */
  getAccountStatusEmailTemplate(statusData) {
    const isActive = statusData.isActive;
    const headerColor = isActive ? '#28a745' : '#dc3545';
    const headerText = isActive ? 'Account Activated' : 'Account Deactivated';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${headerText}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${headerColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: ${headerColor}; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${headerText}</h1>
          </div>
          <div class="content">
            <p>Hello ${statusData.firstName},</p>
            ${isActive 
              ? '<p>Your account has been activated successfully. You can now access all features of our platform.</p>'
              : '<p>Your account has been deactivated. You will no longer be able to access the platform.</p>'
            }
            ${statusData.reason ? `<p><strong>Reason:</strong> ${statusData.reason}</p>` : ''}
            ${isActive 
              ? `<p style="text-align: center;">
                  <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Your Account</a>
                </p>`
              : '<p>If you believe this was done in error, please contact our support team.</p>'
            }
          </div>
          <div class="footer">
            <p>Thank you for using our platform.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get notification email template
   */
  getNotificationEmailTemplate(notificationData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${notificationData.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6c757d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${notificationData.subject}</h1>
          </div>
          <div class="content">
            <p>Hello ${notificationData.userName},</p>
            <p>${notificationData.message}</p>
            ${notificationData.actionUrl ? `
              <p style="text-align: center;">
                <a href="${notificationData.actionUrl}" class="button">${notificationData.actionText || 'Take Action'}</a>
              </p>
            ` : ''}
          </div>
          <div class="footer">
            <p>Thank you for using our platform.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = EmailService; 