const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getStats, getAllUsers, getAdminStats, updateUserRole, deleteUser, getCalendarTasks, getMemberTasks } = require('../controllers/dashboardController');

const router = Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/calendar', getCalendarTasks);

router.get('/admin/stats', authorize('admin'), getAdminStats);
router.get('/admin/member-tasks', authorize('admin'), getMemberTasks);
router.put('/admin/users/:id/role', authorize('admin'), updateUserRole);
router.delete('/admin/users/:id', authorize('admin'), deleteUser);

module.exports = router;
