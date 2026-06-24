import dotenv from 'dotenv';
dotenv.config(); // MUST be first — before any module that reads process.env

import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/error.js';

// Route Imports
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import communicationRoutes from './routes/communication.js';
import renewalRoutes from './routes/renewals.js';
import analyticsRoutes from './routes/analytics.js';
import logRoutes from './routes/logs.js';
import { statusSyncMiddleware } from './middleware/statusSync.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins in local dev
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logging and JSON Parsing Middleware
app.use(morgan('dev'));
app.use(express.json());

// Apply client status synchronization middleware
app.use('/api', statusSyncMiddleware);

// API Route Registration
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/renewals', renewalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/logs', logRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from frontend
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Catch-all route to serve the React app's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Error handling middleware (must be registered last)
app.use(errorHandler);

// Start Server locally if not running on Vercel
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(` SD DIGITALS CRM SERVER STARTED SUCCESSFULLY      `);
    console.log(` Port: http://localhost:${PORT}                    `);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'}    `);
    console.log(`===================================================`);
  });
}

// Export app for serverless environment
export default app;
