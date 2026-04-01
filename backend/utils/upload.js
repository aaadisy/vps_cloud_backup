const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Each device gets its own folder on the VPS
    const deviceUuid = req.body.device_uuid || 'unknown_device';
    const subPath = req.body.sub_path || ''; // e.g. "Documents/Projects"
    const uploadDir = path.join(__dirname, '../../backups', deviceUuid, subPath);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Maintain original name for exact cloud mirroring as requested
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 * 1024 } // 50GB max (adjust as needed)
});

module.exports = upload;
