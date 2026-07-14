const cron = require('node-cron');
const Task = require('../models/Task.model');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const { sendMail, sendTaskReminderEmail } = require('../services/mail.service');
const logger = require('../utils/logger');

// Setup cron schedulers
const initCronJobs = () => {
  // 1. 24 Hours Before Due Date Reminder (Every day at 7:00 AM)
  cron.schedule('0 7 * * *', async () => {
    logger.info('Running 24-Hour Task Reminders cron job...');
    try {
      const tomorrowStart = new Date();
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0,0,0,0);
      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setHours(23,59,59,999);

      // Find tasks due tomorrow
      const tasksDueTomorrow = await Task.find({
        status: { $ne: 'Completed' },
        dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd }
      }).populate('assignedTo', 'name email');

      logger.info('Found %d tasks due tomorrow.', tasksDueTomorrow.length);

      for (const task of tasksDueTomorrow) {
        if (task.assignedTo) {
          // Send notification and email
          await Notification.create({
            recipient: task.assignedTo._id,
            type: 'TaskUpdated',
            title: 'Task Due Tomorrow',
            message: `Reminder: Your task "${task.title}" is due tomorrow!`,
            relatedTask: task._id
          });

          await sendTaskReminderEmail(
            task.assignedTo.email,
            task.assignedTo.name,
            task.title,
            task.description,
            task.priority,
            task.dueDate,
            '24h'
          );
        }
      }
    } catch (error) {
      logger.error('Error running 24-hour task reminders: %o', error);
    }
  });

  // 2. Daily task reminders (Every day at 8:00 AM)
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running Daily Task Reminders (Due Today) cron job...');
    try {
      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);
      const todayEnd = new Date();
      todayEnd.setHours(23,59,59,999);

      // Find tasks due today
      const tasksDueToday = await Task.find({
        status: { $ne: 'Completed' },
        dueDate: { $gte: todayStart, $lte: todayEnd }
      }).populate('assignedTo', 'name email');

      logger.info('Found %d tasks due today.', tasksDueToday.length);

      for (const task of tasksDueToday) {
        if (task.assignedTo) {
          // Send notification and email
          await Notification.create({
            recipient: task.assignedTo._id,
            type: 'TaskUpdated',
            title: 'Task Due Today',
            message: `Reminder: Your task "${task.title}" is due today!`,
            relatedTask: task._id
          });

          await sendTaskReminderEmail(
            task.assignedTo.email,
            task.assignedTo.name,
            task.title,
            task.description,
            task.priority,
            task.dueDate,
            'today'
          );
        }
      }
    } catch (error) {
      logger.error('Error running daily task reminders: %o', error);
    }
  });

  // 3. Overdue task alerts (Every day at 9:00 AM)
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running Overdue Task Alerts cron job...');
    try {
      const now = new Date();

      // Find tasks that are overdue
      const overdueTasks = await Task.find({
        status: { $ne: 'Completed' },
        dueDate: { $lt: now }
      }).populate('assignedTo', 'name email');

      logger.info('Found %d overdue tasks.', overdueTasks.length);

      for (const task of overdueTasks) {
        if (task.assignedTo) {
          // Send notification and email
          await Notification.create({
            recipient: task.assignedTo._id,
            type: 'TaskOverdue',
            title: 'Task Overdue Alert',
            message: `Warning: Your task "${task.title}" is overdue!`,
            relatedTask: task._id
          });

          await sendTaskReminderEmail(
            task.assignedTo.email,
            task.assignedTo.name,
            task.title,
            task.description,
            task.priority,
            task.dueDate,
            'overdue'
          );
        }
      }
    } catch (error) {
      logger.error('Error running overdue alerts: %o', error);
    }
  });

  // 3. Weekly Report Digest (Every Friday at 5:00 PM)
  cron.schedule('0 17 * * 5', async () => {
    logger.info('Running Weekly Report Digest cron job...');
    try {
      const managersAndAdmins = await User.find({ role: { $in: ['Admin', 'Manager'] } });
      const employees = await User.find({ isActive: true });
      
      const totalTasks = await Task.countDocuments({});
      const completedTasks = await Task.countDocuments({ status: 'Completed' });
      const pendingTasks = await Task.countDocuments({ status: { $ne: 'Completed' } });

      const htmlReport = `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">Weekly Task Performance Digest</h2>
          <p>Hi team,</p>
          <p>Here is the quick snapshot of the task metrics for this week:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Metric</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Count</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">Total Active Tasks</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${totalTasks}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; color: #16a34a; font-weight: bold;">Completed Tasks</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; color: #16a34a; font-weight: bold;">${completedTasks}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; color: #ea580c;">Pending Tasks</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; color: #ea580c;">${pendingTasks}</td>
              </tr>
            </tbody>
          </table>
          
          <p>Check the admin dashboard for detailed team leaderboard metrics and exportable reports.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">Enterprise Task Management System</p>
        </div>
      `;

      for (const manager of managersAndAdmins) {
        await sendMail({
          to: manager.email,
          subject: 'Weekly Team Performance Digest',
          html: htmlReport
        });
      }
    } catch (error) {
      logger.error('Error running weekly digest: %o', error);
    }
  });

  logger.info('Cron job schedules registered.');
};

module.exports = initCronJobs;
