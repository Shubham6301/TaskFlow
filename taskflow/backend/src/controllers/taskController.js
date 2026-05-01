const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Task, User, Project, ProjectMember } = require('../models');

const getTasks = async (req, res) => {
  try {
    const { projectId, status, priority, assigneeId } = req.query;
    const where = {};

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    // Non-admins only see tasks in their projects
    if (req.user.role !== 'admin') {
      const memberProjects = await ProjectMember.findAll({ where: { userId: req.user.id } });
      const projectIds = memberProjects.map(mp => mp.projectId);
      where.projectId = { [Op.in]: projectIds };
    }

    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'avatar'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, status, priority, dueDate, projectId, assigneeId } = req.body;

    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const member = await ProjectMember.findOne({ where: { projectId, userId: req.user.id } });
    if (!member && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

    const task = await Task.create({
      title, description, status, priority, dueDate, projectId, assigneeId,
      createdById: req.user.id
    });

    const full = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'avatar'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] }
      ]
    });

    res.status(201).json({ task: full });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = await ProjectMember.findOne({ where: { projectId: task.projectId, userId: req.user.id } });
    if (!member && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

    // Members can only update status of tasks assigned to them, admins can update anything
    if (req.user.role === 'member' && member.role === 'member') {
      const allowedFields = ['status'];
      if (task.assigneeId !== req.user.id) {
        return res.status(403).json({ error: 'You can only update your own tasks' });
      }
      const update = {};
      allowedFields.forEach(f => { if (req.body[f]) update[f] = req.body[f]; });
      await task.update(update);
    } else {
      await task.update(req.body);
    }

    const full = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'avatar'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] }
      ]
    });

    res.json({ task: full });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = await ProjectMember.findOne({ where: { projectId: task.projectId, userId: req.user.id } });
    const canDelete = req.user.role === 'admin' || (member && member.role === 'admin') || task.createdById === req.user.id;
    if (!canDelete) return res.status(403).json({ error: 'Access denied' });

    await task.destroy();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let taskWhere = {};

    if (req.user.role !== 'admin') {
      const memberProjects = await ProjectMember.findAll({ where: { userId: req.user.id } });
      const projectIds = memberProjects.map(mp => mp.projectId);
      taskWhere.projectId = { [Op.in]: projectIds };
    }

    const allTasks = await Task.findAll({
      where: taskWhere,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] }
      ]
    });

    const myTasks = allTasks.filter(t => t.assigneeId === req.user.id);
    const overdue = allTasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'done');
    const dueToday = allTasks.filter(t => t.dueDate === today && t.status !== 'done');

    const statusBreakdown = {
      todo: allTasks.filter(t => t.status === 'todo').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      in_review: allTasks.filter(t => t.status === 'in_review').length,
      done: allTasks.filter(t => t.status === 'done').length
    };

    res.json({
      stats: {
        total: allTasks.length,
        myTasks: myTasks.length,
        overdue: overdue.length,
        dueToday: dueToday.length,
        statusBreakdown
      },
      recentTasks: allTasks.slice(0, 10),
      overdueTasks: overdue.slice(0, 5),
      myTasks: myTasks.slice(0, 10)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getDashboard };
