const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Device = sequelize.define('Device', {
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
  device_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  device_uuid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  os_type: {
    type: DataTypes.STRING
  },
  last_seen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  backup_paths: {
    type: DataTypes.TEXT, // Stringified JSON or comma-separated
    allowNull: true,
    defaultValue: 'C:\\Users\\'
  },
  cron_schedule: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '0 0 * * *' // Default daily at midnight
  },
  remote_command: {
    type: DataTypes.ENUM('NONE', 'START', 'PAUSE', 'RESUME', 'CANCEL', 'RESTORE'),
    defaultValue: 'NONE'
  },
  last_backup_status: {
    type: DataTypes.STRING,
    defaultValue: 'IDLE'
  },
  reported_drives: {
    type: DataTypes.TEXT, // Comma-separated or JSON list of C:\, D:\, etc.
    allowNull: true
  },
  restore_config: {
    type: DataTypes.JSON, // { file_id, target_dir, status }
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Device.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Device, { foreignKey: 'user_id' });

module.exports = Device;
