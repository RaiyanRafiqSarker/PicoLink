import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  
  postgres: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'urlshortener',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || '5000', 10),
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    urlCacheTtlSeconds: parseInt(process.env.URL_CACHE_TTL || '86400', 10), // 24 hours
    clickEventsQueueKey: 'click_events',
    rateLimitPrefix: 'ratelimit:',
  },

  rateLimit: {
    shortenPerMinute: parseInt(process.env.RATE_LIMIT_SHORTEN || '30', 10),
  },

  worker: {
    batchSize: parseInt(process.env.WORKER_BATCH_SIZE || '50', 10),
    maxBatchSize: parseInt(process.env.WORKER_MAX_BATCH_SIZE || '100', 10),
    flushIntervalMs: parseInt(process.env.WORKER_FLUSH_INTERVAL_MS || '2000', 10),
  },
};
