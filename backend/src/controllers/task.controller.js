const Task = require('../models/Task.model');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const AuditLog = require('../models/AuditLog.model');
const { 
  sendTaskAssignedEmail, 
  sendTaskStatusUpdateEmail, 
  sendTaskDetailsUpdatedEmail, 
  sendTaskCompletionEmail 
} = require('../services/mail.service');
const { uploadToCloudinary } = require('../services/cloudinary.service');
const logger = require('../utils/logger');

// Helper to push updates to Socket.io and DB Notifications
const sendNotification = async (req, recipientId, type, title, message, taskId) => {
  try {
    const notif = await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type,
      title,
      message,
      relatedTask: taskId
    });

    const io = req.app.get('io');
    if (io) {
      // Emit to user's private socket room
      io.to(recipientId.toString()).emit('new-notification', {
        id: notif._id,
        type,
        title,
        message,
        isRead: false,
        relatedTask: taskId,
        createdAt: notif.createdAt
      });
      // Broadcast general status change
      io.emit('task-updated', { taskId });
    }
  } catch (error) {
    logger.error('Failed to create/send notification: %o', error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, assignedTo } = req.body;

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      history: [{ action: 'Task Created', performedBy: req.user._id }]
    });

    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE_TASK',
      details: `Created task "${title}"`,
      ipAddress: req.ip
    });

    // Notify assigned employee
    if (assignedTo) {
      const employee = await User.findById(assignedTo);
      if (employee) {
        await sendNotification(
          req,
          assignedTo,
          'TaskAssigned',
          'New Task Assigned',
          `You have been assigned the task: "${title}" by ${req.user.name}`,
          task._id
        );
        // Send email
        await sendTaskAssignedEmail(employee.email, employee.name, title, description, priority, req.user.name, dueDate);
      }
    }

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const { 
      status, 
      priority, 
      assignedTo, 
      search, 
      sortBy = 'createdAt', 
      order = 'desc', 
      page = 1, 
      limit = 10 
    } = req.query;

    const query = {};

    // Manager / Employee Restrictions
    if (req.user.role === 'Employee') {
      query.assignedTo = req.user._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOption = {};
    sortOption[sortBy] = order === 'desc' ? -1 : 1;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email role avatar department')
      .populate('createdBy', 'name email role avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(parsedLimit);

    res.json({
      success: true,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
      tasks
    });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email role avatar department')
      .populate('createdBy', 'name email role avatar')
      .populate('comments.user', 'name email avatar role');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Role verification
    if (req.user.role === 'Employee' && task.assignedTo && task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this task' });
    }

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { title, description, priority, status, dueDate, assignedTo } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Auth validation: employees can only update task STATUS, admins cannot create or assign tasks
    if (req.user.role === 'Employee') {
      if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      
      const allowedKeys = ['status'];
      const incomingKeys = Object.keys(req.body);
      const isStatusOnly = incomingKeys.every(key => allowedKeys.includes(key));
      if (!isStatusOnly) {
        return res.status(403).json({ success: false, message: 'Employees can only update task status' });
      }
    } else if (req.user.role === 'Admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admins cannot create or assign tasks' });
    }

    const oldStatus = task.status;
    const oldAssignee = task.assignedTo;
    const oldDueDate = task.dueDate;

    // Track Changes
    const historyEntries = [];
    if (title && title !== task.title) {
      task.title = title;
      historyEntries.push({ action: `Updated title to "${title}"`, performedBy: req.user._id });
    }
    if (description && description !== task.description) {
      task.description = description;
      historyEntries.push({ action: 'Updated description', performedBy: req.user._id });
    }
    if (priority && priority !== task.priority) {
      task.priority = priority;
      historyEntries.push({ action: `Updated priority to "${priority}"`, performedBy: req.user._id });
    }
    if (dueDate && new Date(dueDate).getTime() !== new Date(task.dueDate).getTime()) {
      task.dueDate = dueDate;
      historyEntries.push({ action: `Updated due date to ${new Date(dueDate).toLocaleDateString()}`, performedBy: req.user._id });
    }

    if (assignedTo !== undefined) {
      const originalAssigneeStr = oldAssignee ? oldAssignee.toString() : '';
      const newAssigneeStr = assignedTo ? assignedTo.toString() : '';
      if (originalAssigneeStr !== newAssigneeStr) {
        task.assignedTo = assignedTo || null;
        const newAssigneeName = assignedTo ? (await User.findById(assignedTo))?.name || 'User' : 'None';
        historyEntries.push({ action: `Reassigned task to: ${newAssigneeName}`, performedBy: req.user._id });
      }
    }

    if (status && status !== task.status) {
      task.status = status;
      if (status === 'Completed') {
        task.completedAt = new Date();
      } else {
        task.completedAt = null;
      }
      historyEntries.push({ action: `Updated status to "${status}"`, performedBy: req.user._id });
    }

    if (historyEntries.length > 0) {
      task.history.push(...historyEntries);
      await task.save();
    }

    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE_TASK',
      details: `Updated task "${task.title}"`,
      ipAddress: req.ip
    });

    // Notify assignee of status/info change
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await sendNotification(
        req,
        task.assignedTo,
        'TaskUpdated',
        'Task Updated',
        `Task "${task.title}" has been updated by ${req.user.name}`,
        task._id
      );
    }

    // If status is completed, notify task creator
    if (status === 'Completed' && task.createdBy.toString() !== req.user._id.toString()) {
      await sendNotification(
        req,
        task.createdBy,
        'TaskCompleted',
        'Task Completed',
        `Task "${task.title}" has been completed by ${req.user.name}`,
        task._id
      );
    }

    // Trigger emails for modifications (Non-blocking)
    const handleEmailNotifications = async () => {
      try {
        const creator = await User.findById(task.createdBy);
        const assignee = task.assignedTo ? await User.findById(task.assignedTo) : null;
        
        const oldAssigneeIdStr = oldAssignee ? oldAssignee.toString() : '';
        const newAssigneeIdStr = task.assignedTo ? task.assignedTo.toString() : '';
        
        const isStatusChanged = oldStatus !== task.status;
        const isReassigned = oldAssigneeIdStr !== newAssigneeIdStr;
        const isDueDateModified = oldDueDate && task.dueDate && new Date(oldDueDate).getTime() !== new Date(task.dueDate).getTime();
        
        // 1. Status Change Notifications
        if (isStatusChanged) {
          if (assignee) {
            await sendTaskStatusUpdateEmail(
              assignee.email,
              assignee.name,
              task.title,
              oldStatus,
              task.status,
              req.user.name
            );
          }
          if (creator) {
            await sendTaskStatusUpdateEmail(
              creator.email,
              creator.name,
              task.title,
              oldStatus,
              task.status,
              req.user.name
            );
          }
          
          // Requirement 7: Manager/Admin Notification when employee completes a task
          if (task.status === 'Completed') {
            if (creator) {
              const employeeName = assignee ? assignee.name : 'Unassigned Employee';
              await sendTaskCompletionEmail(
                creator.email,
                creator.name,
                employeeName,
                task.title,
                task.completedAt || new Date(),
                task.description
              );
            }
          }
        }
        
        // 2. Reassignment Notifications
        if (isReassigned) {
          if (assignee) {
            // Requirement 2: Send Task Assignment email to the newly assigned employee
            await sendTaskAssignedEmail(
              assignee.email,
              assignee.name,
              task.title,
              task.description,
              task.priority,
              creator ? creator.name : req.user.name,
              task.dueDate
            );
          }
          
          // Notify creator of reassignment
          if (creator) {
            const oldAssigneeName = oldAssignee ? (await User.findById(oldAssignee))?.name || 'User' : 'None';
            const newAssigneeName = assignee ? assignee.name : 'Unassigned';
            await sendTaskDetailsUpdatedEmail(
              creator.email,
              creator.name,
              task.title,
              `Task was reassigned from ${oldAssigneeName} to ${newAssigneeName}.`,
              req.user.name
            );
          }
          
          // Notify old assignee that they've been unassigned
          if (oldAssigneeIdStr) {
            const oldAssigneeUser = await User.findById(oldAssigneeIdStr);
            if (oldAssigneeUser) {
              await sendTaskDetailsUpdatedEmail(
                oldAssigneeUser.email,
                oldAssigneeUser.name,
                task.title,
                `You have been unassigned from this task.`,
                req.user.name
              );
            }
          }
        }
        
        // 3. Due Date Modified Notifications
        if (isDueDateModified && !isReassigned) {
          const formattedOldDate = new Date(oldDueDate).toLocaleDateString();
          const formattedNewDate = new Date(task.dueDate).toLocaleDateString();
          const desc = `Task due date was changed from ${formattedOldDate} to ${formattedNewDate}.`;
          
          if (assignee) {
            await sendTaskDetailsUpdatedEmail(
              assignee.email,
              assignee.name,
              task.title,
              desc,
              req.user.name
            );
          }
          if (creator) {
            await sendTaskDetailsUpdatedEmail(
              creator.email,
              creator.name,
              task.title,
              desc,
              req.user.name
            );
          }
        }
      } catch (err) {
        logger.error('Failed to handle email notifications in updateTask: %o', err);
      }
    };
    
    handleEmailNotifications();

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Role restriction: Only Admins or Managers can delete tasks
    if (req.user.role === 'Employee') {
      return res.status(403).json({ success: false, message: 'Only Admins or Managers can delete tasks' });
    }

    const title = task.title;
    const oldAssignee = task.assignedTo;

    await task.deleteOne();

    await AuditLog.create({
      user: req.user._id,
      action: 'DELETE_TASK',
      details: `Deleted task "${title}"`,
      ipAddress: req.ip
    });

    if (oldAssignee) {
      await sendNotification(
        req,
        oldAssignee,
        'System',
        'Task Deleted',
        `Task "${title}" which was assigned to you, has been deleted by ${req.user.name}`,
        null
      );
    }

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role === 'Employee' && task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const newComment = {
      user: req.user._id,
      text: text.trim()
    };

    task.comments.push(newComment);
    task.history.push({
      action: `Added comment: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
      performedBy: req.user._id
    });

    await task.save();

    const fullTask = await Task.findById(task._id).populate('comments.user', 'name email avatar role');
    const addedComment = fullTask.comments[fullTask.comments.length - 1];

    // Sockets update
    const io = req.app.get('io');
    if (io) {
      io.to(task._id.toString()).emit('new-comment', { taskId: task._id, comment: addedComment });
    }

    // Send notifications to other actors
    const notifyTarget = req.user._id.toString() === task.createdBy.toString() 
      ? task.assignedTo 
      : task.createdBy;

    if (notifyTarget && notifyTarget.toString() !== req.user._id.toString()) {
      await sendNotification(
        req,
        notifyTarget,
        'NewComment',
        'New Task Comment',
        `New comment added on "${task.title}" by ${req.user.name}`,
        task._id
      );
    }

    res.status(201).json({ success: true, comment: addedComment });
  } catch (error) {
    next(error);
  }
};

const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const secureUrl = await uploadToCloudinary(req.file.path, 'attachments');

    const attachment = {
      name: req.file.originalname,
      url: secureUrl
    };

    task.attachments.push(attachment);
    task.history.push({
      action: `Uploaded attachment: "${req.file.originalname}"`,
      performedBy: req.user._id
    });

    await task.save();

    res.status(201).json({ success: true, attachments: task.attachments });
  } catch (error) {
    next(error);
  }
};

// Bulk Actions
const bulkStatusUpdate = async (req, res, next) => {
  try {
    const { taskIds, status } = req.body;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ success: false, message: 'taskIds list is required' });
    }

    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updateQuery = { status };
    if (status === 'Completed') {
      updateQuery.completedAt = new Date();
    } else {
      updateQuery.completedAt = null;
    }

    // Employees cannot bulk update unless they are the assignees of all target tasks. Admins cannot create or assign tasks.
    if (req.user.role === 'Employee') {
      const matchCount = await Task.countDocuments({ _id: { $in: taskIds }, assignedTo: req.user._id });
      if (matchCount !== taskIds.length) {
        return res.status(403).json({ success: false, message: 'Employees can only bulk update tasks assigned to them' });
      }
    } else if (req.user.role === 'Admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admins cannot create or assign tasks' });
    }

    // Perform bulk status update
    await Task.updateMany(
      { _id: { $in: taskIds } },
      { 
        $set: updateQuery,
        $push: { history: { action: `Bulk updated status to "${status}"`, performedBy: req.user._id } }
      }
    );

    // Fetch and send emails (Non-blocking)
    const handleBulkEmails = async () => {
      try {
        const tasks = await Task.find({ _id: { $in: taskIds } });
        for (const t of tasks) {
          const creator = await User.findById(t.createdBy);
          const assignee = t.assignedTo ? await User.findById(t.assignedTo) : null;

          if (assignee) {
            await sendTaskStatusUpdateEmail(
              assignee.email,
              assignee.name,
              t.title,
              'Previous',
              status,
              req.user.name
            );
          }
          if (creator) {
            await sendTaskStatusUpdateEmail(
              creator.email,
              creator.name,
              t.title,
              'Previous',
              status,
              req.user.name
            );
          }

          if (status === 'Completed' && creator) {
            const employeeName = assignee ? assignee.name : 'Unassigned Employee';
            await sendTaskCompletionEmail(
              creator.email,
              creator.name,
              employeeName,
              t.title,
              t.completedAt || new Date(),
              t.description
            );
          }
        }
      } catch (err) {
        logger.error('Failed to send bulk status update emails: %o', err);
      }
    };
    handleBulkEmails();

    await AuditLog.create({
      user: req.user._id,
      action: 'BULK_UPDATE_STATUS',
      details: `Bulk updated status to "${status}" for ${taskIds.length} tasks`,
      ipAddress: req.ip
    });

    // Sockets sync
    const io = req.app.get('io');
    if (io) {
      io.emit('task-updated', { bulk: true });
    }

    res.json({ success: true, message: `Successfully updated ${taskIds.length} tasks` });
  } catch (error) {
    next(error);
  }
};

const bulkDelete = async (req, res, next) => {
  try {
    const { taskIds } = req.body;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ success: false, message: 'taskIds list is required' });
    }

    if (req.user.role === 'Employee') {
      return res.status(403).json({ success: false, message: 'Employees cannot delete tasks' });
    }

    await Task.deleteMany({ _id: { $in: taskIds } });

    await AuditLog.create({
      user: req.user._id,
      action: 'BULK_DELETE',
      details: `Bulk deleted ${taskIds.length} tasks`,
      ipAddress: req.ip
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('task-updated', { bulk: true });
    }

    res.json({ success: true, message: `Successfully deleted ${taskIds.length} tasks` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addComment,
  uploadAttachment,
  bulkStatusUpdate,
  bulkDelete
};
