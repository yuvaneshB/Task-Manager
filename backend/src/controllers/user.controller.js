const User = require('../models/User.model');
const Task = require('../models/Task.model');
const AuditLog = require('../models/AuditLog.model');
const { uploadToCloudinary } = require('../services/cloudinary.service');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res, next) => {
  try {
    // Return all users (exclude password)
    const users = await User.find({}).select('-password');
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

const getTeamMembers = async (req, res, next) => {
  try {
    // Returns active employees and managers for drop-downs
    const members = await User.find({ isActive: true }).select('name email role avatar department');
    res.json({ success: true, members });
  } catch (error) {
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const { name, department } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (department) user.department = department;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        department: user.department
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload' });
    }

    const secureUrl = await uploadToCloudinary(req.file.path, 'avatars');

    const user = await User.findById(req.user._id);
    user.avatar = secureUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      avatar: secureUrl
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Google-only users might not have a password
    if (user.password) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
    }

    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      user: user._id,
      action: 'CHANGE_PASSWORD',
      details: 'User updated login password',
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Admin Commands
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['Admin', 'Manager', 'Employee'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE_ROLE',
      details: `Updated role of user "${user.email}" from "${oldRole}" to "${role}"`,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'User role updated successfully', user });
  } catch (error) {
    next(error);
  }
};

const toggleUserActiveStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Admins cannot deactivate themselves
    if (user._id.toString() === req.user._id.toString() && !isActive) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account' });
    }

    user.isActive = isActive;
    await user.save();

    await AuditLog.create({
      user: req.user._id,
      action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      details: `${isActive ? 'Activated' : 'Deactivated'} user account "${user.email}"`,
      ipAddress: req.ip
    });

    res.json({ success: true, message: `User status set to ${isActive ? 'active' : 'inactive'}`, user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getTeamMembers,
  updateUserProfile,
  updateAvatar,
  changePassword,
  updateUserRole,
  toggleUserActiveStatus
};
