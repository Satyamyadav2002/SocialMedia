import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import businessRoutes from './src/routes/businessRoutes.js';
import socialAccountRoutes from './src/routes/socialAccountRoutes.js';
import interactionRoutes from './src/routes/interactionRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';
import contentRoutes from './src/routes/contentRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import opsRoutes from './src/routes/opsRoutes.js';
import { authMiddleware } from './src/middleware/auth.js';
import { startPublishingWorker } from './src/workers/publishingWorker.js';
import { startSyncWorker } from './src/workers/syncWorker.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Public health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'AI Social Media Management Platform API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Auth Routes (login, switch demo)
app.use('/api/auth', authRoutes);

// Protected application routes
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api', authMiddleware, businessRoutes);
app.use('/api/social-accounts', authMiddleware, socialAccountRoutes);
app.use('/api/interactions', authMiddleware, interactionRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/content', authMiddleware, contentRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/ops', authMiddleware, opsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server and Workers
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Social Media Platform Backend running on port ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);

  // Start background processes
  startPublishingWorker(15000); // Check scheduled posts every 15s
  startSyncWorker(60000);       // Background reconciliation every 60s
});
