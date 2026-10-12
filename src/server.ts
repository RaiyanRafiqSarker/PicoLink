import http from 'http';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { runMigrations } from './db/migrate.js';
import { pool } from './db/pool.js';
import { redis } from './db/redis.js';
import { ClickConsumerWorker } from './worker/clickConsumer.js';

async function bootstrap() {
  console.log(`[Server] Initializing URL Shortener Service in ${config.nodeEnv} mode...`);

  // 1. Run database migrations and sequence initialization
  try {
    await runMigrations();
  } catch (err) {
    console.error('[Server] Database migration error:', err);
  }

  // 2. Start Express app
  const app = createApp();
  const server = http.createServer(app);

  let currentPort = config.port;

  const startListening = (port: number) => {
    server.listen(port, () => {
      config.port = port;
      config.baseUrl = `http://localhost:${port}`;
      console.log(`[Server] 🚀 Server running at ${config.baseUrl}`);
      console.log(`[Server] Health check available at ${config.baseUrl}/healthz`);
      console.log(`[Server] Interactive UI dashboard ready at ${config.baseUrl}/`);
    });
  };

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${currentPort} is currently occupied. Retrying on port ${currentPort + 1}...`);
      currentPort += 1;
      startListening(currentPort);
    } else {
      console.error('[Server Server Error]', err);
    }
  });

  startListening(currentPort);

  // 3. Embedded Click Consumer Worker (can be controlled via RUN_WORKER_IN_APP env var)
  let embeddedWorker: ClickConsumerWorker | null = null;
  const runEmbeddedWorker = process.env.RUN_WORKER_IN_APP !== 'false';

  if (runEmbeddedWorker) {
    console.log('[Server] Starting embedded click consumer worker...');
    embeddedWorker = new ClickConsumerWorker();
    embeddedWorker.start().catch((err) => {
      console.error('[Server] Embedded click worker failed:', err);
    });
  }

  // 4. Graceful Shutdown Handlers
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Commencing graceful shutdown...`);

    server.close(async () => {
      console.log('[Server] HTTP server closed.');

      if (embeddedWorker) {
        await embeddedWorker.stop();
      }

      try {
        await pool.end();
        console.log('[PostgreSQL] Pool drained.');
      } catch (err) {
        console.error('[PostgreSQL Drain Error]', err);
      }

      try {
        redis.disconnect();
        console.log('[Redis] Connection closed.');
      } catch (err) {
        console.error('[Redis Close Error]', err);
      }

      console.log('[Server] Graceful shutdown complete. Exiting.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[Server] Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[Fatal Bootstrap Error]', err);
  process.exit(1);
});
