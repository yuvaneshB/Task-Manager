const assert = require('assert');
const app = require('./src/app');
const User = require('./src/models/User.model');
const Task = require('./src/models/Task.model');
const Notification = require('./src/models/Notification.model');
const OTP = require('./src/models/OTP.model');
const AuditLog = require('./src/models/AuditLog.model');
const tokenUtils = require('./src/utils/tokenUtils');

console.log('--- STARTING BACKEND SMOKE TESTS ---');

try {
  // 1. Assert Express app loads correctly
  assert.ok(app, 'Express app should be defined');
  console.log('✅ Express App loading verified.');

  // 2. Assert Models compile successfully
  assert.ok(User, 'User model should load');
  assert.ok(Task, 'Task model should load');
  assert.ok(Notification, 'Notification model should load');
  assert.ok(OTP, 'OTP model should load');
  assert.ok(AuditLog, 'AuditLog model should load');
  console.log('✅ Mongoose Database models verified.');

  // 3. Verify JWT Utils
  const dummyUser = { _id: '507f1f77bcf86cd799439011', email: 'test@example.com', role: 'Employee' };
  const accessToken = tokenUtils.generateAccessToken(dummyUser);
  const refreshToken = tokenUtils.generateRefreshToken(dummyUser);
  assert.ok(accessToken, 'Access token generation should succeed');
  assert.ok(refreshToken, 'Refresh token generation should succeed');
  console.log('✅ JWT Utility Token engines verified.');

  console.log('--- ALL SMOKE TESTS COMPLETED SUCCESSFULLY ---');
  process.exit(0);
} catch (error) {
  console.error('❌ Smoke test failed:', error.message);
  process.exit(1);
}
