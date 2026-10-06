import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow same-origin / server-to-server requests (no Origin header) and configured clients.
        if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
        return cb(new AppError('Origin not allowed by CORS', 403, 'CORS'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());
  if (env.nodeEnv !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // Basic CSRF defence for cookie auth: state-changing requests must be JSON
  // (cross-site HTML forms cannot send application/json without a CORS preflight).
  app.use('/api', (req, _res, next) => {
    const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const hasBody = Number(req.get('content-length') || 0) > 0;
    if (mutating && hasBody && !req.is('application/json')) {
      return next(new AppError('Content-Type must be application/json', 415, 'UNSUPPORTED_MEDIA_TYPE'));
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      githubToken: Boolean(env.githubToken),
      time: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/analyses', analysisRoutes);
  app.use('/api', notFoundHandler);

  // In production, serve the built React app from the same origin.
  if (env.isProd && fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
