const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { create, getAll, getOne, update, remove } = require('../controllers/projectController');
const { addMember, getMembers, removeMember } = require('../controllers/memberController');

const router = Router();

router.use(authenticate);

router.post('/', [body('name').trim().notEmpty()], create);
router.get('/', getAll);
router.get('/:id', getOne);
router.put('/:id', update);
router.delete('/:id', remove);

router.get('/:projectId/members', getMembers);
router.post('/:projectId/members', [body('userId').isInt()], addMember);
router.delete('/:projectId/members/:memberId', removeMember);

module.exports = router;
