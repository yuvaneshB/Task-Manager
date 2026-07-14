const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getTeamMembers, 
  updateUserProfile, 
  updateAvatar, 
  changePassword,
  updateUserRole,
  toggleUserActiveStatus
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect);

router.put('/profile', updateUserProfile);
router.put('/avatar', upload.single('avatar'), updateAvatar);
router.put('/change-password', changePassword);
router.get('/team', getTeamMembers);

// Admin-only endpoints
router.get('/', authorize('Admin'), getUsers);
router.put('/:id/role', authorize('Admin'), updateUserRole);
router.put('/:id/status', authorize('Admin'), toggleUserActiveStatus);

module.exports = router;
