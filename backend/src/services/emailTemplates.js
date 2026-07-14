/**
 * Enterprise Email Notification Templates
 * Beautiful, responsive, and modern HTML layouts using a slate/indigo/emerald system.
 */

// Helper to wrap the body in a standard professional layout
const wrapLayout = (title, contentHTML) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          color: #334155;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
          padding: 32px 24px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.025em;
        }
        .content {
          padding: 32px 24px;
          line-height: 1.6;
        }
        .footer {
          background-color: #f1f5f9;
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #4f46e5;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          margin: 20px 0;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
        }
        .button:hover {
          background-color: #4338ca;
        }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 9999px;
          text-transform: uppercase;
        }
        .badge-critical { background-color: #fee2e2; color: #991b1b; }
        .badge-high { background-color: #ffedd5; color: #9a3412; }
        .badge-medium { background-color: #e0e7ff; color: #3730a3; }
        .badge-low { background-color: #f1f5f9; color: #475569; }
        
        .badge-pending { background-color: #fef3c7; color: #92400e; }
        .badge-progress { background-color: #e0f2fe; color: #075985; }
        .badge-completed { background-color: #d1fae5; color: #065f46; }

        .card {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        .card-title {
          font-weight: 700;
          color: #1e293b;
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 16px;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        .meta-table td {
          padding: 8px 0;
          font-size: 14px;
        }
        .meta-label {
          color: #64748b;
          font-weight: 500;
          width: 35%;
        }
        .meta-value {
          color: #1e293b;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${contentHTML}
        </div>
        <div class="footer">
          <p>This is an automated security or notification update from your task dashboard.</p>
          <p>&copy; ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Enterprise Task Management System'}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// 1. Welcome Email
const welcomeTemplate = (name, companyName, loginUrl) => {
  const content = `
    <p>Hi <strong>${name}</strong>,</p>
    <p>Welcome to <strong>${companyName}</strong>! We are thrilled to have you join our enterprise team task manager workspace.</p>
    <p>Your account has been successfully created and configured. You can now log in, collaborate on tasks, check status tracking, and view real-time updates.</p>
    
    <div style="text-align: center;">
      <a href="${loginUrl}" class="button" target="_blank">Access Your Dashboard</a>
    </div>

    <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
      If the button above does not work, copy and paste the following link into your web browser:<br>
      <a href="${loginUrl}" style="color: #4f46e5; word-break: break-all;">${loginUrl}</a>
    </p>
    <p>Best regards,<br>The ${companyName} Admin Team</p>
  `;
  return wrapLayout('Account Created Successfully', content);
};

// 2. Task Assignment Email
const taskAssignmentTemplate = (employeeName, taskTitle, taskDescription, priority, dueDate, creatorName, dashboardUrl) => {
  const priorityLower = (priority || 'medium').toLowerCase();
  const badgeClass = `badge badge-${priorityLower}`;
  const formattedDueDate = new Date(dueDate).toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const content = `
    <p>Hi <strong>${employeeName}</strong>,</p>
    <p>You have been assigned a new task on the platform by <strong>${creatorName}</strong>. Please review the details below:</p>
    
    <div class="card">
      <h3 class="card-title">${taskTitle}</h3>
      <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px;">${taskDescription || 'No description provided.'}</p>
      
      <table class="meta-table">
        <tr>
          <td class="meta-label">Priority:</td>
          <td class="meta-value"><span class="${badgeClass}">${priority}</span></td>
        </tr>
        <tr>
          <td class="meta-label">Due Date:</td>
          <td class="meta-value" style="color: #b91c1c;">${formattedDueDate}</td>
        </tr>
        <tr>
          <td class="meta-label">Assigned By:</td>
          <td class="meta-value">${creatorName}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="button" target="_blank">View Task Details</a>
    </div>
    
    <p>Good luck with the assignment! Let your manager know if you have any questions.</p>
  `;
  return wrapLayout('New Task Assigned', content);
};

// 3. Task Status Update Notification
const taskStatusUpdateTemplate = (userName, taskTitle, oldStatus, newStatus, updatedByName, dashboardUrl) => {
  const getBadgeClass = (status) => {
    if (status === 'Pending') return 'badge badge-pending';
    if (status === 'In Progress') return 'badge badge-progress';
    if (status === 'Completed') return 'badge badge-completed';
    return 'badge';
  };

  const content = `
    <p>Hello <strong>${userName}</strong>,</p>
    <p>The status of the following task has been updated by <strong>${updatedByName}</strong>:</p>
    
    <div class="card">
      <h3 class="card-title">${taskTitle}</h3>
      
      <table class="meta-table">
        <tr>
          <td class="meta-label">Previous Status:</td>
          <td class="meta-value"><span class="${getBadgeClass(oldStatus)}">${oldStatus}</span></td>
        </tr>
        <tr>
          <td class="meta-label">Current Status:</td>
          <td class="meta-value"><span class="${getBadgeClass(newStatus)}">${newStatus}</span></td>
        </tr>
        <tr>
          <td class="meta-label">Updated By:</td>
          <td class="meta-value">${updatedByName}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="button" target="_blank">Open Task Dashboard</a>
    </div>
  `;
  return wrapLayout('Task Status Updated', content);
};

// 3b. Task Details Updated Template (For Reassignment & Due Date Modifications)
const taskDetailsUpdatedTemplate = (userName, taskTitle, changeDescription, updatedByName, dashboardUrl) => {
  const content = `
    <p>Hello <strong>${userName}</strong>,</p>
    <p>A modification has been made to the task: <strong>${taskTitle}</strong> by <strong>${updatedByName}</strong>.</p>
    
    <div class="card">
      <h3 class="card-title">Modification Log</h3>
      <p style="margin: 0; padding: 8px 12px; background-color: #f1f5f9; border-left: 4px solid #4f46e5; border-radius: 4px; font-size: 14px; font-style: italic; color: #334155;">
        ${changeDescription}
      </p>
    </div>

    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="button" target="_blank">Review Changes</a>
    </div>
  `;
  return wrapLayout('Task Specifications Modified', content);
};

// 4. OTP Verification
const otpVerificationTemplate = (otp) => {
  const content = `
    <p>Hello,</p>
    <p>We received a request to reset the password for your account. Please use the verification OTP code below to proceed.</p>
    
    <div style="text-align: center; margin: 36px 0;">
      <div style="display: inline-block; font-size: 36px; font-weight: 800; letter-spacing: 6px; padding: 12px 32px; background-color: #f8fafc; border: 2px dashed #4f46e5; color: #1e1b4b; border-radius: 12px;">
        ${otp}
      </div>
      <p style="font-size: 12px; color: #b91c1c; margin-top: 12px; font-weight: 600;">
        ⚠️ For security reasons, this code will expire in 5 minutes.
      </p>
    </div>

    <p style="font-size: 13px; color: #64748b;">
      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
  `;
  return wrapLayout('Verify Your Password Reset Request', content);
};

// 5. Password Reset Success
const passwordResetSuccessTemplate = (name, changeTime) => {
  const formattedTime = new Date(changeTime).toLocaleString(undefined, { 
    dateStyle: 'full', 
    timeStyle: 'long' 
  });
  
  const content = `
    <p>Hi <strong>${name}</strong>,</p>
    <p>This is to confirm that the password for your account has been successfully reset.</p>
    
    <div class="card" style="border-left: 4px solid #10b981; background-color: #f0fdf4;">
      <h4 style="margin: 0 0 8px 0; color: #065f46; font-size: 15px; font-weight: 700;">Security Notice</h4>
      <p style="margin: 0; font-size: 13px; color: #15803d;">
        Password Changed on: <strong>${formattedTime}</strong>
      </p>
    </div>

    <p>If you did initiate this password change, no further action is required.</p>
    <p style="font-weight: 600; color: #b91c1c; margin-top: 16px;">
      If you did NOT change your password, please contact your workspace administrator immediately to secure your account.
    </p>
  `;
  return wrapLayout('Your Password Was Changed Successfully', content);
};

// 6. Task Reminder Template
const taskReminderTemplate = (employeeName, taskTitle, taskDescription, priority, dueDate, reminderType, dashboardUrl) => {
  const priorityLower = (priority || 'medium').toLowerCase();
  const badgeClass = `badge badge-${priorityLower}`;
  const formattedDueDate = new Date(dueDate).toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let urgencyHeader = 'Task Deadline Reminder';
  let urgencyText = 'This is a gentle reminder that the deadline for this task is approaching.';
  let cardBorderColor = '#e2e8f0';
  let cardBg = '#f8fafc';

  if (reminderType === '24h') {
    urgencyHeader = 'Task Due Tomorrow';
    urgencyText = 'This is a reminder that the task below is scheduled to be completed within the next 24 hours.';
    cardBorderColor = '#f59e0b';
    cardBg = '#fffbeb';
  } else if (reminderType === 'today') {
    urgencyHeader = 'Task Due TODAY';
    urgencyText = 'Urgent reminder: This task is scheduled for completion by the end of today.';
    cardBorderColor = '#ea580c';
    cardBg = '#fff7ed';
  } else if (reminderType === 'overdue') {
    urgencyHeader = 'Task is OVERDUE';
    urgencyText = 'Warning: The deadline for this task has passed. Please complete the assignment as soon as possible.';
    cardBorderColor = '#dc2626';
    cardBg = '#fef2f2';
  }

  const content = `
    <p>Hi <strong>${employeeName}</strong>,</p>
    <p>${urgencyText}</p>
    
    <div class="card" style="border: 1px solid ${cardBorderColor}; background-color: ${cardBg};">
      <h3 class="card-title">${taskTitle}</h3>
      <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px;">${taskDescription || 'No description provided.'}</p>
      
      <table class="meta-table">
        <tr>
          <td class="meta-label">Priority:</td>
          <td class="meta-value"><span class="${badgeClass}">${priority}</span></td>
        </tr>
        <tr>
          <td class="meta-label">Due Date:</td>
          <td class="meta-value" style="color: #b91c1c; font-weight: 700;">${formattedDueDate}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="button" target="_blank" style="background-color: ${reminderType === 'overdue' ? '#dc2626' : '#4f46e5'};">Go to Dashboard</a>
    </div>
  `;
  return wrapLayout(urgencyHeader, content);
};

// 7. Task Completion Email
const taskCompletionTemplate = (creatorName, employeeName, taskTitle, completionTime, taskDescription) => {
  const formattedTime = new Date(completionTime).toLocaleString(undefined, { 
    dateStyle: 'long', 
    timeStyle: 'short' 
  });

  const content = `
    <p>Hi <strong>${creatorName}</strong>,</p>
    <p>Great news! An employee has completed a task you created. Here are the completion details:</p>
    
    <div class="card" style="border-left: 4px solid #10b981; background-color: #f0fdf4;">
      <h3 class="card-title" style="color: #065f46;">✔ ${taskTitle}</h3>
      <p style="margin: 0 0 16px 0; color: #1e3a2f; font-size: 14px;">${taskDescription || 'No description provided.'}</p>
      
      <table class="meta-table">
        <tr>
          <td class="meta-label">Completed By:</td>
          <td class="meta-value">${employeeName}</td>
        </tr>
        <tr>
          <td class="meta-label">Completion Time:</td>
          <td class="meta-value">${formattedTime}</td>
        </tr>
      </table>
    </div>
    
    <p>You can review this task and any associated attachments/comments on the portal dashboard.</p>
  `;
  return wrapLayout('Task Completed Notification', content);
};

module.exports = {
  welcomeTemplate,
  taskAssignmentTemplate,
  taskStatusUpdateTemplate,
  taskDetailsUpdatedTemplate,
  otpVerificationTemplate,
  passwordResetSuccessTemplate,
  taskReminderTemplate,
  taskCompletionTemplate
};
