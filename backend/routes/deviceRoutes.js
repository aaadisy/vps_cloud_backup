const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Device = require('../models/Device');
const ActivityLog = require('../models/Log');

router.post('/register', protect, async (req, res) => {
  const { device_name, device_uuid, os_type } = req.body;
  try {
    let device = await Device.findOne({ where: { device_uuid } });
    if (device) {
      device.last_seen = new Date();
      await device.save();
    } else {
      device = await Device.create({
        user_id: req.user.id,
        device_name,
        device_uuid,
        os_type
      });
      await ActivityLog.create({
        user_id: req.user.id,
        action: 'DEVICE_REGISTERED',
        description: `New device registered: ${device_name} (${os_type})`
      });
    }
    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/heartbeat', protect, async (req, res) => {
  const { device_uuid, current_status } = req.body;
  try {
    const device = await Device.findOne({ where: { device_uuid } });
    if (!device) return res.status(404).json({ message: 'Device not found' });
    
    device.last_seen = new Date();
    if (current_status) {
      device.last_backup_status = current_status;
    }
    await device.save();

    // Fetch command and config
    const command = device.remote_command;
    const config = {
      backup_paths: device.backup_paths ? JSON.parse(device.backup_paths) : [],
      cron_schedule: device.cron_schedule,
      restore_config: device.restore_config
    };

    // If command was START/PAUSE etc, we might want to clear it after sending
    // but for now let's keep it until the agent reports status change
    
    res.json({ 
      message: 'Heartbeat received',
      command: command,
      config: config
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/list', protect, async (req, res) => {
  try {
    const devices = await Device.findAll({ where: { user_id: req.user.id } });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
