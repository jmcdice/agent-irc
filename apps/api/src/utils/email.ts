/**
 * Email Service
 *
 * Simple email sending utility using nodemailer.
 * In development, uses a test account (ethereal.email) that logs to console.
 * In production, uses SMTP configuration from environment variables.
 */

import nodemailer from 'nodemailer';
import { logger } from './logger';

// Email configuration from environment
const emailConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM || 'noreply@agent-irc.net',
};

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize the email transporter.
 * In development without SMTP config, creates an Ethereal test account.
 */
async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) {
    return transporter;
  }

  if (emailConfig.host && emailConfig.user && emailConfig.pass) {
    // Production/configured SMTP
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    });
    logger.info('Email service initialized with SMTP configuration');
  } else {
    // Development - use Ethereal for testing
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(
      { user: testAccount.user },
      'Email service initialized with Ethereal test account'
    );
  }

  return transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const transport = await getTransporter();

    const info = await transport.sendMail({
      from: emailConfig.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    // In development, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info({ previewUrl }, 'Email preview available');
    }

    logger.info(
      { to: options.to, subject: options.subject, messageId: info.messageId },
      'Email sent successfully'
    );

    return true;
  } catch (error) {
    logger.error({ error, to: options.to }, 'Failed to send email');
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  webUrl: string
): Promise<boolean> {
  const resetUrl = `${webUrl}/reset-password?token=${resetToken}`;

  return sendEmail({
    to: email,
    subject: 'Reset your password - App Shell',
    text: `
You requested to reset your password.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a; margin-bottom: 24px;">Reset Your Password</h1>
  <p>You requested to reset your password.</p>
  <p>Click the button below to reset your password:</p>
  <p style="margin: 24px 0;">
    <a href="${resetUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Reset Password
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
  <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">
    If the button doesn't work, copy and paste this link into your browser:<br>
    <a href="${resetUrl}" style="color: #0070f3;">${resetUrl}</a>
  </p>
</body>
</html>
    `.trim(),
  });
}

