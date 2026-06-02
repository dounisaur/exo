import { writeFileSync } from 'fs';
const log = (m) => {
  writeFileSync('/tmp/import-test.log', `${m}\n`, { flag: 'a' });
  console.log(m);
};

log('[IMPORT TEST] Starting');

log('[IMPORT TEST] Importing fs');
import { appendFileSync } from 'fs';
log('[IMPORT TEST] fs OK');

log('[IMPORT TEST] Importing express');
import express from 'express';
log('[IMPORT TEST] express OK');

log('[IMPORT TEST] Importing cors');
import cors from 'cors';
log('[IMPORT TEST] cors OK');

log('[IMPORT TEST] Importing dotenv');
import dotenv from 'dotenv';
log('[IMPORT TEST] dotenv OK');

log('[IMPORT TEST] Importing bodyParser');
import bodyParser from 'body-parser';
log('[IMPORT TEST] bodyParser OK');

log('[IMPORT TEST] Importing path');
import path from 'path';
log('[IMPORT TEST] path OK');

log('[IMPORT TEST] Importing fileURLToPath');
import { fileURLToPath } from 'url';
log('[IMPORT TEST] fileURLToPath OK');

log('[IMPORT TEST] Importing auth.js');
import { JWT_SECRET } from './auth.js';
log('[IMPORT TEST] auth.js OK');

log('[IMPORT TEST] Importing db.js');
import { initDb } from './db.js';
log('[IMPORT TEST] db.js OK');

log('[IMPORT TEST] Importing routes.js');
import { setupRoutes } from './routes.js';
log('[IMPORT TEST] routes.js OK');

log('[IMPORT TEST] All imports done!');
process.exit(0);
