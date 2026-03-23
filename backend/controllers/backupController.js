const BackupJob = require('../models/BackupJob');
const BackupFile = require('../models/BackupFile');
const Device = require('../models/Device');
const ActivityLog = require('../models/Log');

const startBackup = async (req, res) => {
  const { device_id, backup_type } = req.body;

  try {
    const job = await BackupJob.create({
      user_id: req.user.id,
      device_id,
      backup_type,
      status: 'running'
    });

    await ActivityLog.create({
      user_id: req.user.id,
      action: 'BACKUP_STARTED',
      description: `Backup started for device ${device_id}`
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveFileMetadata = async (req, res) => {
  const { device_id, file_path, original_path, file_size, checksum } = req.body;

  try {
    const backupFile = await BackupFile.create({
      user_id: req.user.id,
      device_id,
      file_path,
      original_path,
      file_size,
      checksum
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

module.exports = { startBackup, saveFileMetadata, completeBackup, getBackupHistory };
