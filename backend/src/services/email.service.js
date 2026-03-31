import logger from '../utils/logger.js';

// Stubbed email service for Phase 1
// Will be implemented with nodemailer or a transactional email provider in Phase 2

class EmailService {
  async sendPasswordResetEmail(email, resetToken) {
    logger.info(`[EMAIL STUB] Password reset email would be sent to ${email}`);
    logger.info(`[EMAIL STUB] Reset link: ${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`);
  }
}

const emailService = new EmailService();
export default emailService;
