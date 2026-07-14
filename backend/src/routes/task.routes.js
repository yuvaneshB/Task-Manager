const express = require('express');
const router = express.Router();
const { 
  createTask, 
  getTasks, 
  getTaskById, 
  updateTask, 
  deleteTask, 
  addComment, 
  uploadAttachment,
  bulkStatusUpdate,
  bulkDelete
} = require('../controllers/task.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { taskCreateValidator, taskUpdateValidator } = require('../validators/task.validator');
const upload = require('../middleware/upload.middleware');

router.use(protect); // All routes below are authenticated

router.route('/')
  .post(authorize('Manager'), taskCreateValidator, createTask)
  .get(getTasks);

router.post('/bulk-status', bulkStatusUpdate);
router.post('/bulk-delete', authorize('Manager'), bulkDelete);

router.route('/:id')
  .get(getTaskById)
  .put(taskUpdateValidator, updateTask)
  .delete(authorize('Manager'), deleteTask);

router.post('/:id/comments', addComment);
router.post('/:id/attachments', upload.single('file'), uploadAttachment);

module.exports = router;
