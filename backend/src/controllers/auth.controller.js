const User = require('../models/User.model');
const OTP = require('../models/OTP.model');
const AuditLog = require('../models/AuditLog.model');
const crypto = require('crypto');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');
const { 
  sendOTPEmail, 
  sendWelcomeEmail, 
  sendPasswordResetSuccessEmail 
} = require('../services/mail.service');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

// Helper to log user audit actions
const logAudit = async (userId, action, details, ip) => {
  try {
    await AuditLog.create({ user: userId, action, details, ipAddress: ip || '' });
  } catch (err) {
    logger.error('Failed to log audit activity: %o', err);
  }
};

// Generate a secure random 6 digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const isFirstUser = (await User.countDocuments({})) === 0;
    const finalRole = isFirstUser ? 'Admin' : (role || 'Employee');

    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      department: department || 'General'
    });

    await logAudit(user._id, 'REGISTER', 'User registered successfully', req.ip);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send Welcome Email (Non-blocking)
    sendWelcomeEmail(user.email, user.name).catch(err => {
      logger.error('Failed to send welcome email in register controller: %o', err);
    });

    res.status(201).json({
      success: true,
      accessToken,
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

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    await logAudit(user._id, 'LOGIN', 'User logged in with credentials', req.ip);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      accessToken,
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

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
        await logAudit(decoded.id, 'LOGOUT', 'User logged out', req.ip);
      } catch (err) {
        // Token was invalid or expired, ignore
      }
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token not found' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }

    const newAccessToken = generateAccessToken(user);
    res.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    logger.error('Refresh token error: %o', error);
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user registered with this email' });
    }

    // Delete existing OTP for this email
    await OTP.deleteOne({ email });

    const otp = generateOTP();
    // Save to DB (hashed is preferred, but simple is ok too; let's store it hashed for high security)
    const salt = await require('bcryptjs').genSalt(10);
    const hashedOTP = await require('bcryptjs').hash(otp, salt);

    await OTP.create({ email, otp: hashedOTP });

    // Send email
    await sendOTPEmail(email, otp);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email });
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP expired or not requested' });
    }

    const isMatch = await require('bcryptjs').compare(otp, record.otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    const record = await OTP.findOne({ email });
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP expired or not requested' });
    }

    const isMatch = await require('bcryptjs').compare(otp, record.otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = password;
    await user.save();

    // Clean up OTP record
    await OTP.deleteOne({ email });

    await logAudit(user._id, 'RESET_PASSWORD', 'Password reset successfully using OTP', req.ip);

    // Send password reset success email (Non-blocking)
    sendPasswordResetSuccessEmail(user.email, user.name, new Date()).catch(err => {
      logger.error('Failed to send password reset success email: %o', err);
    });

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getMe
};
