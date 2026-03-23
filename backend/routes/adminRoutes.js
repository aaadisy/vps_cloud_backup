const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Device = require('../models/Device');
const BackupJob = require('../models/BackupJob');
const ActivityLog = require('../models/Log');
const BackupFile = require('../models/BackupFile');
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

router.post('/trigger-restore/:id', async (req, res) => {
  try {
    const job = await BackupJob.findByPk(req.params.id, { include: [Device] });
    if (!job) return res.status(404).json({ message: 'Backup job not found' });
    
    // Log the restore event
    await ActivityLog.create({
      user_id: req.user.id,
      action: 'MANUAL_RESTORE_TRIGGER',
      description: `Manual restore triggered for job ${job.id} on device: ${job.Device?.device_name}`
    });

    res.json({ message: `Restore process initiated for job ${job.id}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/trigger-backup/:id', async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    
    // Log the manual trigger event
    await ActivityLog.create({
      user_id: req.user.id,
      action: 'MANUAL_BACKUP_TRIGGER',
      description: `Manual backup triggered for device: ${device.device_name}`
    });

    // In a real system, you'd send a message (e.g., via WebSocket or MQTT) to the agent here.
    res.json({ message: `Backup instruction queued for ${device.device_name}` });
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
    const totalSize = await BackupFile.sum('file_size');
    res.json({ total_bytes: totalSize || 0 });
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

router.get('/activity-logs', async (req, res) => {
  const logs = await ActivityLog.findAll({ include: [User], order: [['timestamp', 'DESC']] });
  res.json(logs);
});

module.exports = router;
