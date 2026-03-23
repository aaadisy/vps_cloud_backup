const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Device = require('../models/Device');
const BackupJob = require('../models/BackupJob');

router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});

router.get('/devices', protect, async (req, res) => {
  const devices = await Device.findAll({ where: { user_id: req.user.id } });
  res.json(devices);
});

router.get('/backups', protect, async (req, res) => {
  const backups = await BackupJob.findAll({ where: { user_id: req.user.id }, order: [['started_at', 'DESC']] });
  res.json(backups);
});

module.exports = router;
