require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { dataStore } = require('./services/dataStore');

// Initialize app
const app = express();

// Middlewares
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check & Diagnostics
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'CivicLens Municipal Complaint Portal',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dataStore.isMongoActive() ? 'MongoDB Connected' : 'In-Memory Resilient Store'
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Centralized Error Handling
app.use((err, req, res, next) => {
  console.error('[CivicLens Server Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 Route handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await dataStore.initDefaults();

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`[CivicLens Backend] Server running on port ${PORT}`);
      console.log(`[CivicLens Backend] Health check: http://localhost:${PORT}/api/health`);
    });
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
