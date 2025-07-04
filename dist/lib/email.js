"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.sendAdminNotificationEmail = sendAdminNotificationEmail;
exports.sendPlaceClaimStatusEmail = sendPlaceClaimStatusEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Create a nodemailer transporter
const createTransporter = () => {
    // For production, use environment variables for these values
    return nodemailer_1.default.createTransport({
        host: process.env.EMAIL_SERVER_HOST || 'smtp.example.com',
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        secure: process.env.EMAIL_SERVER_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_SERVER_USER || 'user@example.com',
            pass: process.env.EMAIL_SERVER_PASSWORD || 'password',
        },
    });
};
/**
 * Sends an email using the provided template
 */
async function sendEmail({ to, subject, message, }) {
    try {
        const transporter = createTransporter();
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const fromEmail = process.env.FROM_EMAIL || 'noreply@example.com';
        const mailOptions = {
            from: `"WNS Admin" <${fromEmail}>`,
            to,
            subject,
            html: message,
        };
        const result = await transporter.sendMail(mailOptions);
        return result;
    }
    catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}
/**
 * Sends a notification email to administrators
 */
async function sendAdminNotificationEmail({ subject, message, }) {
    var _a;
    const adminEmails = ((_a = process.env.ADMIN_EMAILS) === null || _a === void 0 ? void 0 : _a.split(',')) || ['admin@example.com'];
    try {
        // Send to all admin emails
        const results = await Promise.all(adminEmails.map(email => sendEmail({
            to: email.trim(),
            subject,
            message: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${subject}</h2>
              <div style="border-left: 4px solid #0070f3; padding-left: 15px; margin: 20px 0;">
                ${message}
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is an automatic notification from the WNS Platform.
              </p>
            </div>
          `
        })));
        return results;
    }
    catch (error) {
        console.error('Failed to send admin notification email:', error);
        throw error;
    }
}
/**
 * Sends a place claim notification to the user
 */
async function sendPlaceClaimStatusEmail({ to, placeName, status, message, }) {
    const subject = status === 'approved'
        ? `Your claim for "${placeName}" has been approved`
        : `Update on your claim for "${placeName}"`;
    const statusMessage = status === 'approved'
        ? `<p style="color: #10b981; font-weight: bold;">Your claim has been approved!</p>
       <p>You now have management access to "${placeName}" and can start managing it right away.</p>`
        : `<p style="color: #ef4444; font-weight: bold;">Your claim was not approved at this time.</p>
       <p>Unfortunately, we could not verify your relationship with "${placeName}".</p>`;
    try {
        return await sendEmail({
            to,
            subject,
            message: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Place Claim Update</h2>
          ${statusMessage}
          ${message ? `<p style="border-left: 4px solid #999; padding-left: 15px; margin: 20px 0;">${message}</p>` : ''}
          <p>
            <a href="${process.env.NEXTAUTH_URL}/locations" style="background-color: #0070f3; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px;">
              Go to Places
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automatic email from the WNS Platform.
          </p>
        </div>
      `
        });
    }
    catch (error) {
        console.error('Failed to send place claim status email:', error);
        throw error;
    }
}
