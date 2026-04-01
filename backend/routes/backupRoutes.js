const express = require('express');
const router = express.Router();

const { 
  startBackup, 
  saveFileMetadata, 
  completeBackup, 
  getBackupHistory, 
  downloadFile 
} = require('../controllers/backupController');

const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/upload');

// Diagnostic route
router.get('/ping', (req, res) => res.json({ message: 'Backup API Reachable' }));

router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({
    message: 'File successfully stored on VPS',
    path: req.file.path,
    size: req.file.size
  });
});

router.get('/download/:file_id', protect, downloadFile);

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
