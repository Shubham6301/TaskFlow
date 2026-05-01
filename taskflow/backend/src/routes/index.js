const express = require('express');
const { body } = require('express-validator');
const { signup, login, getMe } = require('../controllers/authController');
const { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember } = require('../controllers/projectController');
const { getTasks, createTask, updateTask, deleteTask, getDashboard } = require('../controllers/taskController');
const { getUsers, updateUser } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Auth
router.post('/auth/signup', [
  body('name').isLength({ min: 2 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['admin', 'member'])
], signup);

router.post('/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], login);

router.get('/auth/me', authenticate, getMe);

// Dashboard
router.get('/dashboard', authenticate, getDashboard);

// Projects
router.get('/projects', authenticate, getProjects);
router.post('/projects', authenticate, [
  body('name').isLength({ min: 2 }).trim(),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/)
], createProject);
router.get('/projects/:id', authenticate, getProject);
router.put('/projects/:id', authenticate, updateProject);
router.delete('/projects/:id', authenticate, deleteProject);
router.post('/projects/:id/members', authenticate, addMember);
router.delete('/projects/:id/members/:memberId', authenticate, removeMember);

// Tasks
router.get('/tasks', authenticate, getTasks);
router.post('/tasks', authenticate, [
  body('title').isLength({ min: 2 }).trim(),
  body('projectId').isUUID(),
  body('status').optional().isIn(['todo', 'in_progress', 'in_review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], createTask);
router.put('/tasks/:id', authenticate, updateTask);
router.delete('/tasks/:id', authenticate, deleteTask);

// Users
router.get('/users', authenticate, getUsers);
router.put('/users/:id', authenticate, updateUser);

module.exports = router;
