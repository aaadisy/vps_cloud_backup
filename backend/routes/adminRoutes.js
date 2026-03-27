const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Device = require('../models/Device');
const BackupJob = require('../models/BackupJob');
const ActivityLog = require('../models/Log');
const BackupFile = require('../models/BackupFile');
const StorageVPS = require('../models/VPS');
const { getDiskStats } = require('../utils/storageUtils');
const { sequelize } = require('../config/database');

// Admin only routes
router.use(protect);
router.use(admin);

router.get('/users', async (req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['password_hash'] } });
  res.json(users);
});

router.post('/create-user', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password_hash: password, role });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/disable-user', async (req, res) => {
  try {
    const { user_id, status } = req.body;
    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = status || 'disabled';
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/devices', async (req, res) => {
  const devices = await Device.findAll({ include: [User] });
  res.json(devices);
});

router.get('/backups', async (req, res) => {
  const backups = await BackupJob.findAll({ include: [User, Device], order: [['started_at', 'DESC']] });
  res.json(backups);
});


router.put('/device/:id', async (req, res) => {
  try {
    const { device_name, backup_paths, cron_schedule } = req.body;
    const device = await Device.findByPk(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    
    device.device_name = device_name || device.device_name;
    device.backup_paths = backup_paths || device.backup_paths;
    device.cron_schedule = cron_schedule || device.cron_schedule;
    
    await device.save();
    
    // Log the change
    await ActivityLog.create({
      user_id: req.user.id,
      action: 'DEVICE_CONFIG_UPDATE',
      description: `Updated configuration for device: ${device.device_name}`
    });

    res.json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/device/:id/restore', async (req, res) => {
  try {
    const { file_id, target_dir } = req.body;
    const device = await Device.findByPk(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    
    // Set restore configuration
    device.remote_command = 'RESTORE';
    device.restore_config = {
      file_id,
      target_dir: target_dir || 'C:\\Restored_Files',
      status: 'pending'
    };
    
    await device.save();
    
    await ActivityLog.create({
      user_id: req.user.id,
      device_id: device.id,
      action: 'RESTORE_QUEUED',
      description: `Restore queued for file ${file_id} to ${target_dir || 'default directory'}`
    });

    res.json({ message: 'Restore command queued successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/device/:id/command', async (req, res) => {
  try {
    const { command } = req.body;
    const device = await Device.findByPk(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    
    device.remote_command = command;
    await device.save();
    
    await ActivityLog.create({
      user_id: req.user.id,
      action: `REMOTE_COMMAND_${command}`,
      description: `Sent ${command} command to device: ${device.device_name}`
    });

    res.json({ message: `Command ${command} delivered to device mailbox` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// VPS Management
router.get('/vps', async (req, res) => {
  const vpsList = await StorageVPS.findAll();
  res.json(vpsList);
});

router.post('/vps', async (req, res) => {
  try {
    const vps = await StorageVPS.create(req.body);
    res.status(201).json(vps);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/vps/:id', async (req, res) => {
  try {
    const vps = await StorageVPS.findByPk(req.params.id);
    if (!vps) return res.status(404).json({ message: 'VPS not found' });
    await vps.update(req.body);
    res.json(vps);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/vps/:id', async (req, res) => {
  try {
    const vps = await StorageVPS.findByPk(req.params.id);
    if (!vps) return res.status(404).json({ message: 'VPS not found' });
    await vps.destroy();
    res.json({ message: 'VPS removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/reports/usage', async (req, res) => {
  try {
    const stats = await User.findAll({
      attributes: ['name', 'email', 'role'],
      include: [{ model: Device, attributes: ['device_name', 'last_seen'] }]
    });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/storage-usage', async (req, res) => {
  try {
    const stats = await getDiskStats();
    const backupSize = await BackupFile.sum('file_size'); // From database
    
    // Merge OS stats with database stats
    res.json({ 
       total_bytes: stats?.total || 0,
       free_bytes: stats?.free || 0,
       used_bytes: stats?.used || 0,
       backup_metadata_size: backupSize || 0,
       percent_used: stats?.percentUsed || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.delete('/user/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/device/:id', async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    await device.destroy();
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats/storage-by-user', async (req, res) => {
  try {
    const stats = await User.findAll({
      attributes: ['name'],
      include: [{
        model: Device,
        attributes: [],
        include: [{
          model: BackupJob,
          attributes: [],
          include: [{
            model: BackupFile,
            attributes: []
          }]
        }]
      }],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(bf.file_size), 0)
              FROM BackupFiles AS bf
              JOIN BackupJobs AS bj ON bf.backup_job_id = bj.id
              JOIN Devices AS d ON bj.device_id = d.id
              WHERE d.user_id = User.id
            )`),
            'total_storage_bytes'
          ]
        ]
      },
      group: ['User.id']
    });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/device/:device_id/files', async (req, res) => {
  const { getDeviceFiles } = require('../controllers/backupController');
  return getDeviceFiles(req, res);
});

router.get('/activity-logs', async (req, res) => {
  const logs = await ActivityLog.findAll({ include: [User], order: [['timestamp', 'DESC']] });
  res.json(logs);
});

module.exports = router;
