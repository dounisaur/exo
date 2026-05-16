import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import jwt from 'jsonwebtoken';
import { initDb } from './db.js';
import { setupRoutes } from './routes.js';

console.log('[SERVER] Starting...');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// __dirname setup for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// JWT Authentication middleware
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

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
