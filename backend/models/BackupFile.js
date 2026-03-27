const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Device = require('./Device');

const BackupFile = sequelize.define('BackupFile', {
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
  file_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  file_path: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  original_path: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  checksum: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

BackupFile.belongsTo(User, { foreignKey: 'user_id' });
BackupFile.belongsTo(Device, { foreignKey: 'device_id' });

module.exports = BackupFile;
