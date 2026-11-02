import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { config, serverRoot } from './config/env.js';
import { initializeDatabase } from './database/initialize.js';
import { closeDb } from './database/connection.js';
import apiRoutes from './routes/index.js';
import { settingsController } from './controllers/settingsController.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.set('etag', false);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: false,
      crossOriginOpenerPolicy: false,
    })
  );

  // Allow embedding inside AI Studio preview iframe
  app.use((_req, res, next) => {
    res.removeHeader('X-Frame-Options');
    next();
  });

  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  );

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: false, limit: '20mb' }));
  app.use(cookieParser());

  // Catalogue and dashboard data must always reflect the live SQLite state.
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.use('/api', apiLimiter, apiRoutes);

  // Google AdSense verification /ads.txt route
  app.get('/ads.txt', (req, res) => settingsController.serveAdsTxt(req, res));

  // Serve static assets and the built SPA
  const clientUploads = path.resolve(serverRoot, '../client/public/uploads');
  if (!fs.existsSync(clientUploads)) {
    fs.mkdirSync(clientUploads, { recursive: true });
  }
  app.use('/uploads', express.static(clientUploads, { index: false, maxAge: '30d' }));

  const clientPublic = path.resolve(serverRoot, '../client/public');
  if (fs.existsSync(clientPublic)) {
    app.use(express.static(clientPublic, { index: false }));
  }

  const clientDist = path.resolve(serverRoot, '../client/dist');
  const indexPath = path.join(clientDist, 'index.html');
  if (!fs.existsSync(indexPath)) {
    try {
      console.log('[server] Building client dist for preview...');
      execSync('npm --prefix ../client run build', { cwd: serverRoot, stdio: 'inherit' });
    } catch (e) {
      console.error('[server] Error building client:', e);
    }
  }

  app.use(express.static(clientDist, { index: false, maxAge: '1h' }));

  app.get(/^\/(?!api).*/, (_req, res, next) => {
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const isDirectRun =
  process.argv[1] &&
  (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) ||
    path.resolve(process.argv[1]) === path.resolve(serverRoot, '../server.js'));

if (isDirectRun) {
  initializeDatabase();
  const app = createApp();

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`\n  FREE2WATCH API ready on http://0.0.0.0:${config.port}`);
    console.log(`  Environment: ${config.nodeEnv}`);
    console.log(`  Database:    ${config.databasePath}`);
    console.log(`  Client:      ${config.clientUrl}\n`);
  });

  const shutdown = (signal) => {
    console.log(`\n[server] ${signal} received, shutting down`);
    server.close(() => {
      closeDb();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
