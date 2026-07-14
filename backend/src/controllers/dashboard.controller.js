const Task = require('../models/Task.model');
const User = require('../models/User.model');

const getDashboardStats = async (req, res, next) => {
  try {
    const isEmployee = req.user.role === 'Employee';
    const filter = {};
    if (isEmployee) {
      filter.assignedTo = req.user._id;
    }

    const now = new Date();

    // 1. Overview cards
    const totalTasks = await Task.countDocuments(filter);
    const completedTasks = await Task.countDocuments({ ...filter, status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ ...filter, status: { $ne: 'Completed' } });
    const overdueTasks = await Task.countDocuments({ 
      ...filter, 
      status: { $ne: 'Completed' }, 
      dueDate: { $lt: now } 
    });

    const teamMembersCount = await User.countDocuments({ isActive: true });

    // Weekly Productivity score (Task completed in last 7 days vs previous 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const completedThisWeek = await Task.countDocuments({
      ...filter,
      status: 'Completed',
      completedAt: { $gte: sevenDaysAgo }
    });

    const weeklyProductivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const monthlyProductivity = totalTasks > 0 ? Math.round((completedThisWeek / (totalTasks || 1)) * 100) : 0; // Relative metrics

    // 2. Charts Data
    // Status distribution (Pie Chart)
    const pendingCount = await Task.countDocuments({ ...filter, status: 'Pending' });
    const inProgressCount = await Task.countDocuments({ ...filter, status: 'In Progress' });
    const completedCount = completedTasks;

    const statusChart = [
      { name: 'Pending', value: pendingCount },
      { name: 'In Progress', value: inProgressCount },
      { name: 'Completed', value: completedCount }
    ];

    // Weekly Performance (Bar Chart) - Completed tasks in last 7 days group by day
    const weeklyPerformance = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const count = await Task.countDocuments({
        ...filter,
        status: 'Completed',
        completedAt: { $gte: d, $lt: nextD }
      });

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      weeklyPerformance.push({ day: dayName, tasks: count });
    }

    // Monthly Progress (Area Chart) - Last 6 months
    const monthlyProgress = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date();
      m.setMonth(now.getMonth() - i);
      const startOfMonth = new Date(m.getFullYear(), m.getMonth(), 1);
      const endOfMonth = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59);

      const created = await Task.countDocuments({
        ...filter,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const completed = await Task.countDocuments({
        ...filter,
        status: 'Completed',
        completedAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const monthName = startOfMonth.toLocaleDateString('en-US', { month: 'short' });
      monthlyProgress.push({ month: monthName, created, completed });
    }

    // Team Productivity Chart (Only relevant for Admin/Manager)
    let teamProductivity = [];
    if (!isEmployee) {
      // Find top 5 users based on completed tasks
      const users = await User.find({ isActive: true }).limit(10);
      for (const u of users) {
        const assigned = await Task.countDocuments({ assignedTo: u._id });
        const done = await Task.countDocuments({ assignedTo: u._id, status: 'Completed' });
        const pct = assigned > 0 ? Math.round((done / assigned) * 100) : 0;
        teamProductivity.push({ name: u.name, completed: done, efficiency: pct });
      }
      teamProductivity.sort((a, b) => b.completed - a.completed);
      teamProductivity = teamProductivity.slice(0, 5);
    }

    // Department Performance Chart (Group tasks completed by assignee department)
    const departmentPerformance = [];
    const depts = ['Engineering', 'Marketing', 'Sales', 'Design', 'General'];
    for (const d of depts) {
      const usersInDept = await User.find({ department: d }).select('_id');
      const userIds = usersInDept.map(u => u._id);
      
      const done = await Task.countDocuments({
        status: 'Completed',
        assignedTo: { $in: userIds }
      });
      const pending = await Task.countDocuments({
        status: { $ne: 'Completed' },
        assignedTo: { $in: userIds }
      });

      departmentPerformance.push({ department: d, completed: done, pending });
    }

    // Task Completion Trend (Line Chart) - Completed vs Overdue trend over last 30 days
    const completionTrend = [];
    for (let i = 9; i >= 0; i--) {
      const dateVal = new Date();
      dateVal.setDate(now.getDate() - i * 3); // 3 day intervals
      dateVal.setHours(0,0,0,0);
      
      const done = await Task.countDocuments({
        ...filter,
        status: 'Completed',
        completedAt: { $lte: dateVal }
      });
      
      completionTrend.push({
        date: dateVal.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        completed: done
      });
    }

    res.json({
      success: true,
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        teamMembers: teamMembersCount,
        weeklyProductivity,
        monthlyProductivity
      },
      charts: {
        statusChart,
        weeklyPerformance,
        monthlyProgress,
        teamProductivity,
        departmentPerformance,
        completionTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
