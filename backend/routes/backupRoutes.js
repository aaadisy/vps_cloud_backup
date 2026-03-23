const express = require('express');
const router = express.Router();
const { startBackup, saveFileMetadata, completeBackup, getBackupHistory } = require('../controllers/backupController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start', protect, startBackup);
router.post('/file-metadata', protect, saveFileMetadata);
router.post('/complete', protect, completeBackup);
router.get('/history', protect, getBackupHistory);

module.exports = router;
