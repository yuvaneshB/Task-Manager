const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const templates = require('./emailTemplates');

const isMailConfigured = 
  process.env.EMAIL_USER && 
  process.env.EMAIL_PASS;

let transporter;

if (isMailConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: parseInt(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  logger.info('Nodemailer SMTP transporter initialized.');
} else {
  logger.warn('Nodemailer credentials not provided. Emails will be logged to console.');
}

const sendMail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Task Manager" <noreply@example.com>',
      to,
      subject,
      html,
      text
    };

    if (isMailConfigured) {
      const info = await transporter.sendMail(mailOptions);
      logger.info('Email sent: %s', info.messageId);
      return info;
    } else {
      logger.info('----- MOCK EMAIL SENT -----');
      logger.info('To: %s', to);
      logger.info('Subject: %s', subject);
      logger.info('Body (HTML):\n%s', html);
      logger.info('---------------------------');
      return { mock: true, messageId: 'mock-id-' + Date.now() };
    }
  } catch (error) {
    logger.error('Nodemailer send error: %o', error);
    // Silent catch - email failures should not break the core app flow
    return { error: true, message: error.message };
  }
};

// 1. User Registration Email
const sendWelcomeEmail = async (email, name) => {
  const companyName = process.env.COMPANY_NAME || 'Enterprise Task Management System';
  const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
  const html = templates.welcomeTemplate(name, companyName, loginUrl);
  
  return sendMail({
    to: email,
    subject: `Welcome to ${companyName}!`,
    html
  });
};

// 2. Task Assignment Email
const sendTaskAssignedEmail = async (email, employeeName, taskTitle, taskDescription, priority, creatorName, dueDate) => {
  const dashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`;
  const html = templates.taskAssignmentTemplate(
    employeeName,
    taskTitle,
    taskDescription,
    priority,
    dueDate,
    creatorName,
    dashboardUrl
  );

  return sendMail({
    to: email,
    subject: `New Task Assigned: ${taskTitle}`,
    html
  });
};

// 3. Task Status Update Email
const sendTaskStatusUpdateEmail = async (email, userName, taskTitle, oldStatus, newStatus, updatedByName) => {
  const dashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`;
  const html = templates.taskStatusUpdateTemplate(
    userName,
    taskTitle,
    oldStatus,
    newStatus,
    updatedByName,
    dashboardUrl
  );

  return sendMail({
    to: email,
    subject: `Task Status Updated: ${taskTitle} [${newStatus}]`,
    html
  });
};

// 3b. Task Details Updated Email (For Reassignments & Due Date Modifications)
const sendTaskDetailsUpdatedEmail = async (email, userName, taskTitle, changeDescription, updatedByName) => {
  const dashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`;
  const html = templates.taskDetailsUpdatedTemplate(
    userName,
    taskTitle,
    changeDescription,
    updatedByName,
    dashboardUrl
  );

  return sendMail({
    to: email,
    subject: `Task Details Modified: ${taskTitle}`,
    html
  });
};

// 4. Forgot Password OTP Email
const sendOTPEmail = async (email, otp) => {
  const html = templates.otpVerificationTemplate(otp);
  return sendMail({
    to: email,
    subject: 'Your Password Reset OTP Code',
    html
  });
};

// 5. Password Reset Success Email
const sendPasswordResetSuccessEmail = async (email, name, changeTime = new Date()) => {
  const html = templates.passwordResetSuccessTemplate(name, changeTime);
  return sendMail({
    to: email,
    subject: 'Password Reset Successful',
    html
  });
};

// 6. Task Reminder Email
const sendTaskReminderEmail = async (email, employeeName, taskTitle, taskDescription, priority, dueDate, reminderType) => {
  const dashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`;
  const html = templates.taskReminderTemplate(
    employeeName,
    taskTitle,
    taskDescription,
    priority,
    dueDate,
    reminderType,
    dashboardUrl
  );

  const subjects = {
    '24h': `Reminder: Task "${taskTitle}" is due tomorrow`,
    'today': `ALERT: Task "${taskTitle}" is due TODAY`,
    'overdue': `OVERDUE ALERT: Task "${taskTitle}" is overdue`
  };

  return sendMail({
    to: email,
    subject: subjects[reminderType] || `Reminder: Task "${taskTitle}"`,
    html
  });
};

// 7. Manager/Admin Notification Email (Task Completion)
const sendTaskCompletionEmail = async (email, creatorName, employeeName, taskTitle, completionTime, taskDescription) => {
  const html = templates.taskCompletionTemplate(
    creatorName,
    employeeName,
    taskTitle,
    completionTime,
    taskDescription
  );

  return sendMail({
    to: email,
    subject: `Task Completed: ${taskTitle} by ${employeeName}`,
    html
  });
};

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendTaskAssignedEmail,
  sendTaskStatusUpdateEmail,
  sendTaskDetailsUpdatedEmail,
  sendOTPEmail,
  sendPasswordResetSuccessEmail,
  sendTaskReminderEmail,
  sendTaskCompletionEmail
};
