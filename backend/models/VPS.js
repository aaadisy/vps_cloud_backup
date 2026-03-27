const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StorageVPS = sequelize.define('StorageVPS', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  vps_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'root'
  },
  password: {
    type: DataTypes.STRING, // Should be encrypted in a real system
    allowNull: false
  },
  ssh_port: {
    type: DataTypes.INTEGER,
    defaultValue: 22
  },
  total_storage: {
    type: DataTypes.BIGINT, // Bytes
    allowNull: false,
    defaultValue: 0
  },
  used_storage: {
    type: DataTypes.BIGINT, // Bytes
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'maintenance'),
    defaultValue: 'online'
  },
  last_health_check: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = StorageVPS;
