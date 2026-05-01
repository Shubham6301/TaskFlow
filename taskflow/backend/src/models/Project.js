const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [2, 200] }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'on_hold', 'completed', 'archived'),
    defaultValue: 'active'
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#6366f1'
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Project;
