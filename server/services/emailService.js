const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter;

const initMailer = () => {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    transporter.verify((err, success) => {
      if (err) {
        logger.error('Mail service unavailable', err, { service: 'nodemailer' });
      } else if (success) {
        logger.info('Mail service connected', { service: 'nodemailer' });
      }
    });
  } catch (err) {
    logger.error('Failed to initialize mail service', err);
  }
};

const sendEmail = async (options) => {
  try {
    if (!transporter) initMailer();

    const mailOptions = {
      from: process.env.MAIL_FROM || 'noreply@lms.com',
      to: options.to,
      subject: options.subject,
      html: options.html || options.text,
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info('Email sent', { to: options.to, subject: options.subject, messageId: result.messageId });
    return result;
  } catch (err) {
    logger.error('Failed to send email', err, { to: options.to, subject: options.subject });
    throw err;
  }
};

const sendVerificationEmail = async (user, verificationLink) => {
  const html = `
    <h2>Welcome to LMS!</h2>
    <p>Hi ${user.name},</p>
    <p>Please verify your email to activate your account:</p>
    <a href="${verificationLink}" style="display:inline-block;background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
      Verify Email
    </a>
    <p>This link expires in 24 hours.</p>
    <p>If you didn't create this account, ignore this email.</p>
  `;
  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email - LMS',
    html,
  });
};

const sendPasswordResetEmail = async (user, resetLink) => {
  const html = `
    <h2>Password Reset Request</h2>
    <p>Hi ${user.name},</p>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}" style="display:inline-block;background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
      Reset Password
    </a>
    <p>This link expires in 30 minutes.</p>
    <p>If you didn't request this, ignore this email.</p>
  `;
  return sendEmail({
    to: user.email,
    subject: 'Reset Your Password - LMS',
    html,
  });
};

const sendWelcomeEmail = async (user) => {
  const html = `
    <h2>Welcome to LMS!</h2>
    <p>Hi ${user.name},</p>
    <p>Your account has been activated. You can now access all courses.</p>
    <p>Happy learning!</p>
  `;
  return sendEmail({
    to: user.email,
    subject: 'Account Activated - LMS',
    html,
  });
};

const sendEnrollmentConfirmation = async (user, courseName) => {
  const html = `
    <h2>Enrollment Confirmed</h2>
    <p>Hi ${user.name},</p>
    <p>You have successfully enrolled in <strong>${courseName}</strong>.</p>
    <p>Start learning now!</p>
  `;
  return sendEmail({
    to: user.email,
    subject: `Enrolled in ${courseName} - LMS`,
    html,
  });
};

module.exports = {
  initMailer,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendEnrollmentConfirmation,
};
