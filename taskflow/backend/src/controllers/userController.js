const { User } = require('../models');

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] }, order: [['name', 'ASC']] });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, role } = req.body;
    const update = {};
    if (name) update.name = name;
    if (role && req.user.role === 'admin') update.role = role;

    await user.update(update);
    const updated = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getUsers, updateUser };
