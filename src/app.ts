import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import healthRouter from './routes/health.js';
import shortenRouter from './routes/shorten.js';
import statsRouter from './routes/stats.js';
import redirectRouter from './routes/redirect.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): express.Application {
  const app = express();

  // Trust proxy for reverse proxies / docker / kubernetes / cloudflare
  app.set('trust proxy', 1);

  // Security headers with permissive CSP for Tailwind CDN and Fonts
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.tailwindcss.com', 'https://cdnjs.cloudflare.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(cors());
  app.use(express.json({ limit: '16kb' }));
  app.use(express.urlencoded({ extended: true, limit: '16kb' }));

  // Serve static UI assets from /public
  const publicDir = path.resolve(__dirname, '../../public');
  // In development/runtime path resolution fallback
  const altPublicDir = path.resolve(process.cwd(), 'public');
  app.use(express.static(altPublicDir));

  // 1. Health check probe
  app.use(healthRouter);

  // 2. REST API Endpoints
  app.use(shortenRouter);
  app.use(statsRouter);

  // 3. Short code redirection route (matches /:code)
  app.use(redirectRouter);

  // 4. 404 & Global Error Handling
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
