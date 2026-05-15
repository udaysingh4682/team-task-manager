const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { create, getByProject, update, remove } = require('../controllers/taskController');

const router = Router();

router.use(authenticate);

router.post('/project/:projectId', [body('title').trim().notEmpty()], create);
router.get('/project/:projectId', getByProject);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
