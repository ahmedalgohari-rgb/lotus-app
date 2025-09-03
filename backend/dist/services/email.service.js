"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailVerificationService = exports.EmailTemplates = void 0;
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
class MockEmailService {
    async sendEmail(to, subject, content) {
        logger_1.logger.info({
            message: 'Mock email sent',
            to,
            subject,
            content: content.text
        });
        return true;
    }
}
class EmailTemplates {
    static emailVerification(verificationToken, userFirstName) {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify-email?token=${verificationToken}`;
        return {
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #2D5F3F; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #F7F3E9; }
            .button { display: inline-block; padding: 12px 24px; background: #4A90A4; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌿 Welcome to Lotus Plant Care</h1>
            </div>
            <div class="content">
              <h2>Hello ${userFirstName}!</h2>
              <p>Thank you for joining Lotus Plant Care! To get started, please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify My Email</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
              <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
              <p>If you didn't create an account with us, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2024 Lotus Plant Care. This is a system email.</p>
              <p>Need help? Contact us at support@lotus-plant-care.app</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
Welcome to Lotus Plant Care!

Hello ${userFirstName},

Thank you for joining Lotus Plant Care! To get started, please verify your email address by visiting this link:

${verificationUrl}

This verification link will expire in 24 hours for security reasons.

If you didn't create an account with us, please ignore this email.

Need help? Contact us at support@lotus-plant-care.app

© 2024 Lotus Plant Care
      `
        };
    }
    static passwordReset(resetToken, userFirstName) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
        return {
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #2D5F3F; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #F7F3E9; }
            .button { display: inline-block; padding: 12px 24px; background: #4A90A4; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${userFirstName},</h2>
              <p>We received a request to reset your password for your Lotus Plant Care account.</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This reset link will expire in 1 hour</li>
                  <li>You can only use this link once</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your current password remains unchanged until you complete the reset</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>© 2024 Lotus Plant Care. This email was sent to verify your identity.</p>
              <p>If you have concerns, contact us at security@lotus-plant-care.app</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
Password Reset Request - Lotus Plant Care

Hello ${userFirstName},

We received a request to reset your password for your Lotus Plant Care account.

Reset your password by visiting this link:
${resetUrl}

SECURITY NOTICE:
- This reset link will expire in 1 hour
- You can only use this link once  
- If you didn't request this reset, please ignore this email
- Your current password remains unchanged until you complete the reset

© 2024 Lotus Plant Care
If you have concerns, contact us at security@lotus-plant-care.app
      `
        };
    }
    static securityAlert(alertType, userFirstName, details) {
        return {
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #F7F3E9; }
            .alert { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; color: #721c24; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Security Alert</h1>
            </div>
            <div class="content">
              <h2>Hello ${userFirstName},</h2>
              <div class="alert">
                <strong>Alert Type:</strong> ${alertType}<br>
                <strong>Details:</strong> ${details}<br>
                <strong>Time:</strong> ${new Date().toISOString()}
              </div>
              <p>If this was you, no further action is needed. If you don't recognize this activity, please:</p>
              <ul>
                <li>Change your password immediately</li>
                <li>Review your account settings</li>
                <li>Contact our security team</li>
              </ul>
            </div>
            <div class="footer">
              <p>© 2024 Lotus Plant Care Security Team</p>
              <p>Report security concerns: security@lotus-plant-care.app</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
Security Alert - Lotus Plant Care

Hello ${userFirstName},

SECURITY ALERT:
Alert Type: ${alertType}
Details: ${details}
Time: ${new Date().toISOString()}

If this was you, no further action is needed. If you don't recognize this activity, please:
- Change your password immediately
- Review your account settings  
- Contact our security team

© 2024 Lotus Plant Care Security Team
Report security concerns: security@lotus-plant-care.app
      `
        };
    }
}
exports.EmailTemplates = EmailTemplates;
class EmailVerificationService {
    emailProvider;
    constructor(emailProvider) {
        this.emailProvider = emailProvider || new MockEmailService();
    }
    generateVerificationToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    async sendVerificationEmail(email, firstName, verificationToken) {
        try {
            const template = EmailTemplates.emailVerification(verificationToken, firstName);
            const success = await this.emailProvider.sendEmail(email, 'Verify your Lotus Plant Care account', template);
            logger_1.logger.info({
                message: 'Verification email sent',
                email,
                success,
                timestamp: new Date().toISOString()
            });
            return success;
        }
        catch (error) {
            logger_1.logger.error({
                message: 'Failed to send verification email',
                email,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async sendPasswordResetEmail(email, firstName, resetToken) {
        try {
            const template = EmailTemplates.passwordReset(resetToken, firstName);
            const success = await this.emailProvider.sendEmail(email, 'Reset your Lotus Plant Care password', template);
            logger_1.logger.info({
                message: 'Password reset email sent',
                email,
                success,
                timestamp: new Date().toISOString()
            });
            return success;
        }
        catch (error) {
            logger_1.logger.error({
                message: 'Failed to send password reset email',
                email,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async sendSecurityAlert(email, firstName, alertType, details) {
        try {
            const template = EmailTemplates.securityAlert(alertType, firstName, details);
            const success = await this.emailProvider.sendEmail(email, `Security Alert: ${alertType}`, template);
            logger_1.logger.warn({
                message: 'Security alert email sent',
                email,
                alertType,
                details,
                success,
                timestamp: new Date().toISOString()
            });
            return success;
        }
        catch (error) {
            logger_1.logger.error({
                message: 'Failed to send security alert email',
                email,
                alertType,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
}
exports.EmailVerificationService = EmailVerificationService;
exports.emailService = new EmailVerificationService();
//# sourceMappingURL=email.service.js.map