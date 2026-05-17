console.log('[SERVER] Importing modules...');

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';

console.log('[SERVER] Importing auth...');
import { JWT_SECRET } from './auth.js';
console.log('[SERVER] Importing db...');
import { initDb } from './db.js';
console.log('[SERVER] Importing routes...');
import { setupRoutes } from './routes.js';

console.log('[SERVER] Starting...');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// __dirname setup for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(bodyParser.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

export { JWT_SECRET };

// Health check (before db init)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize database and start server
console.log('[SERVER] Initializing database...');
initDb()
  .then(() => {
    console.log('[SERVER] Database initialized');
    setupRoutes(app);

    const server = app.listen(PORT, () => {
      console.log(`[SERVER] Running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[SERVER] SIGTERM received, shutting down...');
      server.close();
    });
  })
  .catch((err) => {
    console.error('[SERVER] Failed to initialize:', err);
    process.exit(1);
  });
