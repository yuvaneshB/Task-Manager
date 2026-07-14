const express = require('express');
const router = express.Router();
const { getWeeklyReportsData } = require('../controllers/report.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/weekly', protect, authorize('Admin', 'Manager'), getWeeklyReportsData);

module.exports = router;
