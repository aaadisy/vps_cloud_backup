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
     const fs = require('fs');
     const file = await BackupFile.findByPk(req.params.file_id);
     
     if(!file) {
       console.error(`Download Failed: File record ${req.params.file_id} not found in DB`);
       return res.status(404).json({ message: 'File record not found' });
     }
     
     if (!fs.existsSync(file.file_path)) {
       console.error(`Download Failed: File not found on VPS disk: ${file.file_path}`);
       return res.status(404).json({ message: 'Physical file missing from storage' });
     }

     console.log(`Serving download: ${file.file_name} from ${file.file_path}`);
     res.download(file.file_path);
  } catch(e) { 
    console.error(`Download Error: ${e.message}`);
    res.status(500).json({ message: e.message }); 
  }
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
