const Task = require('../models/Task.model');
const User = require('../models/User.model');

const getWeeklyReportsData = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).select('name email avatar department role');
    const reports = [];

    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday
    startOfWeek.setHours(0,0,0,0);

    for (const u of users) {
      const assignedCount = await Task.countDocuments({ assignedTo: u._id });
      const completedCount = await Task.countDocuments({ assignedTo: u._id, status: 'Completed' });
      const pendingCount = await Task.countDocuments({ assignedTo: u._id, status: { $ne: 'Completed' } });
      const overdueCount = await Task.countDocuments({
        assignedTo: u._id,
        status: { $ne: 'Completed' },
        dueDate: { $lt: new Date() }
      });

      // Calculate Average Completion Time (in hours)
      const completedTasks = await Task.find({ assignedTo: u._id, status: 'Completed' });
      let totalCompletionTimeMs = 0;
      let countWithTimes = 0;

      completedTasks.forEach(task => {
        if (task.completedAt) {
          totalCompletionTimeMs += (task.completedAt.getTime() - task.createdAt.getTime());
          countWithTimes++;
        }
      });

      const averageCompletionTimeHours = countWithTimes > 0 
        ? Math.round((totalCompletionTimeMs / (1000 * 60 * 60 * countWithTimes)) * 10) / 10 
        : 0;

      // Completion percentage
      const completionPercentage = assignedCount > 0 
        ? Math.round((completedCount / assignedCount) * 100) 
        : 0;

      // Productivity score: completion percentage minus a penalty for overdue tasks (e.g. 5 points per overdue task, min 0)
      const productivityScore = Math.max(0, completionPercentage - (overdueCount * 5));

      reports.push({
        user: {
          id: u._id,
          name: u.name,
          email: u.email,
          department: u.department,
          avatar: u.avatar
        },
        metrics: {
          assigned: assignedCount,
          completed: completedCount,
          pending: pendingCount,
          overdue: overdueCount,
          averageCompletionTimeHours,
          completionPercentage,
          productivityScore
        }
      });
    }

    // Sort leaderboard rankings
    const leaderboard = [...reports].sort((a, b) => b.metrics.productivityScore - a.metrics.productivityScore);

    // Get weekly task lists for excel table dump
    const weeklyTasks = await Task.find({
      $or: [
        { createdAt: { $gte: startOfWeek } },
        { completedAt: { $gte: startOfWeek } }
      ]
    })
    .populate('assignedTo', 'name email department')
    .sort({ dueDate: 1 });

    res.json({
      success: true,
      reports,
      leaderboard,
      weeklyTasks
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWeeklyReportsData
};
