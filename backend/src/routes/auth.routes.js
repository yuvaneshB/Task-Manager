const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout, 
  refresh, 
  forgotPassword, 
  verifyOTP, 
  resetPassword,
  getMe
} = require('../controllers/auth.controller');
const { 
  registerValidator, 
  loginValidator, 
  forgotPasswordValidator, 
  verifyOTPValidator, 
  resetPasswordValidator 
} = require('../validators/auth.validator');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter.middleware');

router.post('/register', registerValidator, register);
router.post('/login', authLimiter, loginValidator, login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidator, forgotPassword);
router.post('/verify-otp', verifyOTPValidator, verifyOTP);
router.post('/reset-password', resetPasswordValidator, resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
