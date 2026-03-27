const disk = require('diskusage');
const os = require('os');
const path = require('path');

const getDiskStats = async (dirPath = null) => {
  try {
    const root = dirPath || (os.platform() === 'win32' ? 'C:' : '/');
    const info = await disk.check(root);
    return {
      total: info.total,
      free: info.free,
      used: info.total - info.free,
      available: info.available,
      percentUsed: ((info.total - info.free) / info.total * 100).toFixed(2)
    };
  } catch (err) {
    console.error('Disk usage check failed:', err);
    return null;
  }
};

module.exports = { getDiskStats };
