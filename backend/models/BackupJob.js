const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Device = require('./Device');

const BackupJob = sequelize.define('BackupJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  device_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Device,
      key: 'id'
    }
  },
  backup_type: {
    type: DataTypes.ENUM('manual', 'scheduled', 'real-time'),
    defaultValue: 'real-time'
  },
  status: {
    type: DataTypes.ENUM('running', 'completed', 'failed'),
    defaultValue: 'running'
  },
  started_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completed_at: {
    type: DataTypes.DATE
  }
}, {
  timestamps: false
});

BackupJob.belongsTo(User, { foreignKey: 'user_id' });
BackupJob.belongsTo(Device, { foreignKey: 'device_id' });

module.exports = BackupJob;
