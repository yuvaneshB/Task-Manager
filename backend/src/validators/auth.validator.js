const { body, validationResult } = require('express-validator');

const validateRules = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Enter a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['Admin', 'Manager', 'Employee'])
    .withMessage('Invalid role, must be Admin, Manager, or Employee'),
  body('department')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department cannot be empty if provided'),
  validateRules
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRules
];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Enter a valid email address'),
  validateRules
];

const verifyOTPValidator = [
  body('email').trim().isEmail().withMessage('Enter a valid email address'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits'),
  validateRules
];

const resetPasswordValidator = [
  body('email').trim().isEmail().withMessage('Enter a valid email address'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  validateRules
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyOTPValidator,
  resetPasswordValidator
};
