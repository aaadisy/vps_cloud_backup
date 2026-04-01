const BackupJob = require('../models/BackupJob');
const BackupFile = require('../models/BackupFile');
const Device = require('../models/Device');
const ActivityLog = require('../models/Log');

const startBackup = async (req, res) => {
  const { device_uuid, backup_type } = req.body;

  try {
    const device = await Device.findOne({ where: { device_uuid } });
    if (!device) return res.status(404).json({ message: 'Device not found' });

    const job = await BackupJob.create({
      user_id: device.user_id,
      device_id: device.id,
      backup_type: backup_type || 'manual',
      status: 'running'
    });

    await ActivityLog.create({
      user_id: device.user_id,
      action: 'BACKUP_STARTED',
      description: `Backup started for device ${device.device_name}`
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('CRITICAL: startBackup failed', { error: error.message, body: req.body });
    res.status(500).json({ message: error.message });
  }
};

const saveFileMetadata = async (req, res) => {
  const { device_uuid, backup_job_id, file_name, original_path, vps_path, file_size } = req.body;

  try {
    const device = await Device.findOne({ where: { device_uuid } });
    if (!device) return res.status(404).json({ message: 'Device not found' });

    const backupFile = await BackupFile.create({
      user_id: device.user_id,
      device_id: device.id,
      backup_job_id,
      file_name,
      file_path: vps_path,
      original_path,
      file_size
    });

    res.status(201).json(backupFile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeBackup = async (req, res) => {
  const { job_id, status } = req.body;

  try {
    const job = await BackupJob.findByPk(job_id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    job.status = status || 'completed';
    job.completed_at = new Date();
    await job.save();

    await ActivityLog.create({
      user_id: req.user.id,
      action: 'BACKUP_COMPLETED',
      description: `Backup job ${job_id} ${job.status}`
    });

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBackupHistory = async (req, res) => {
  try {
    const backups = await BackupJob.findAll({
      where: { user_id: req.user.id },
      include: [Device],
      order: [['started_at', 'DESC']]
    });
    res.json(backups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDeviceFiles = async (req, res) => {
  try {
    const { device_id } = req.params;
    let targetId = device_id;
    
    // Check if it's a UUID
    if (device_id.length > 10) {
      const device = await Device.findOne({ where: { device_uuid: device_id } });
      if (device) targetId = device.id;
    }

    const files = await BackupFile.findAll({
      where: { device_id: targetId },
      order: [['created_at', 'DESC']]
    });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { startBackup, saveFileMetadata, completeBackup, getBackupHistory, getDeviceFiles };
