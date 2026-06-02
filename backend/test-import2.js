import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { JWT_SECRET } from './auth.js';
import { initDb } from './db.js';
import { setupRoutes } from './routes.js';

console.log('[TEST] All imports successful!');
process.exit(0);
