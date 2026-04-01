const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const { connectDB, sequelize } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const backupRoutes = require('./routes/backupRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load all models for sync
require('./models/User');
require('./models/Device');
require('./models/BackupJob');
require('./models/BackupFile');
require('./models/Log');
require('./models/VPS');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/admin', adminRoutes);

// Test Direct Route to bypass potential prefix issues
app.get('/api/raw-restore/:file_id', (req, res) => {
  const { downloadFile } = require('./controllers/backupController');
  return downloadFile(req, res);
});

// Root route
app.get('/', (req, res) => {
  res.send('Cloud Backup API is running...');
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Sync database: automatically updates tables with new columns
    await sequelize.sync({ alter: true }); 
    console.log('Database synced');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
