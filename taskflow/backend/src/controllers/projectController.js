const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Project, User, Task, ProjectMember } = require('../models');

const getProjects = async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.findAll({
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar'] },
          { model: User, as: 'members', attributes: ['id', 'name', 'email', 'avatar'], through: { attributes: ['role'] } }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else {
      const memberProjects = await ProjectMember.findAll({ where: { userId: req.user.id } });
      const projectIds = memberProjects.map(mp => mp.projectId);
      const ownedIds = (await Project.findAll({ where: { ownerId: req.user.id }, attributes: ['id'] })).map(p => p.id);
      const allIds = [...new Set([...projectIds, ...ownedIds])];

      projects = await Project.findAll({
        where: { id: { [Op.in]: allIds } },
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar'] },
          { model: User, as: 'members', attributes: ['id', 'name', 'email', 'avatar'], through: { attributes: ['role'] } }
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    const projectsWithStats = await Promise.all(projects.map(async (p) => {
      const tasks = await Task.findAll({ where: { projectId: p.id } });
      const done = tasks.filter(t => t.status === 'done').length;
      return {
        ...p.toJSON(),
        taskCount: tasks.length,
        completedTasks: done,
        progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0
      };
    }));

    res.json({ projects: projectsWithStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description, color, dueDate } = req.body;

    const project = await Project.create({
      name, description, color, dueDate,
      ownerId: req.user.id
    });

    await ProjectMember.create({ projectId: project.id, userId: req.user.id, role: 'admin' });

    const full = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email', 'avatar'], through: { attributes: ['role'] } }
      ]
    });

    res.status(201).json({ project: { ...full.toJSON(), taskCount: 0, completedTasks: 0, progress: 0 } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email', 'avatar'], through: { attributes: ['role'] } },
        {
          model: Task, as: 'tasks',
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] },
            { model: User, as: 'createdBy', attributes: ['id', 'name', 'avatar'] }
          ]
        }
      ]
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isMember = project.members.some(m => m.id === req.user.id) || req.user.role === 'admin';
    if (!isMember) return res.status(403).json({ error: 'Access denied' });

    const tasks = project.tasks || [];
    const done = tasks.filter(t => t.status === 'done').length;

    res.json({
      project: {
        ...project.toJSON(),
        taskCount: tasks.length,
        completedTasks: done,
        progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const member = await ProjectMember.findOne({ where: { projectId: project.id, userId: req.user.id } });
    const canEdit = req.user.role === 'admin' || project.ownerId === req.user.id || (member && member.role === 'admin');
    if (!canEdit) return res.status(403).json({ error: 'Access denied' });

    await project.update(req.body);
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const canDelete = req.user.role === 'admin' || project.ownerId === req.user.id;
    if (!canDelete) return res.status(403).json({ error: 'Access denied' });

    await Task.destroy({ where: { projectId: project.id } });
    await ProjectMember.destroy({ where: { projectId: project.id } });
    await project.destroy();

    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await ProjectMember.findOne({ where: { projectId: project.id, userId } });
    if (existing) return res.status(409).json({ error: 'Already a member' });

    const user = await User.findByPk(userId, { attributes: ['id', 'name', 'email', 'avatar'] });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await ProjectMember.create({ projectId: project.id, userId, role: role || 'member' });
    res.status(201).json({ message: 'Member added', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const member = await ProjectMember.findOne({ where: { projectId: req.params.id, userId: memberId } });
    if (!member) return res.status(404).json({ error: 'Member not found' });

    await member.destroy();
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember };
