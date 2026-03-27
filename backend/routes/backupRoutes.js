const express = require('express');
const router = express.Router();
const { startBackup, saveFileMetadata, completeBackup, getBackupHistory } = require('../controllers/backupController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/upload');

router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({
    message: 'File successfully stored on VPS',
    path: req.file.path,
    size: req.file.size
  });
});

router.get('/download/:file_id', protect, async (req, res) => {
  try {
     const BackupFile = require('../models/BackupFile');
     const file = await BackupFile.findByPk(req.params.file_id);
     if(!file) return res.status(404).json({ message: 'File record not found' });
     res.download(file.file_path); // file_path should be absolute on VPS
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.post('/start', protect, startBackup);
router.post('/file-metadata', protect, saveFileMetadata);
router.post('/complete', protect, completeBackup);
router.put('/progress/:job_id', protect, async (req, res) => {
  const { progress_percent, total_size, files_processed } = req.body;
  try {
     const job = await require('../models/BackupJob').findByPk(req.params.job_id);
     if(!job) return res.status(404).json({ message: 'Job not found' });
     job.progress_percent = progress_percent;
     job.total_size = total_size;
     job.total_files = files_processed;
     await job.save();
     res.json({ message: 'Progress updated' });
  } catch(e) { res.status(500).json({ message: e.message }); }
});
router.get('/history', protect, getBackupHistory);

module.exports = router;
