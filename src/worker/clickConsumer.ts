import geoip from 'geoip-lite';
import { redis } from '../db/redis.js';
import { pool } from '../db/pool.js';
import { config } from '../config/index.js';

export interface RawClickEvent {
  short_code: string;
  clicked_at: string;
  referrer: string | null;
  user_agent: string | null;
  ip: string | null;
  country_code?: string | null;
}

export interface ProcessedClickRecord {
  short_code: string;
  clicked_at: string;
  referrer: string | null;
  user_agent: string | null;
  country_code: string | null;
}

export class ClickConsumerWorker {
  private isRunning: boolean = false;
  private pendingBatch: ProcessedClickRecord[] = [];
  private lastFlushTime: number = Date.now();
  private flushTimer: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    this.isRunning = true;
    console.log('[Click Worker] Worker started. Consuming click events from Redis...');

    // Regular interval to flush partial batches
    this.flushTimer = setInterval(() => {
      this.checkTimeBasedFlush();
    }, 1000);

    while (this.isRunning) {
      try {
        await this.pollAndProcess();
      } catch (err) {
        console.error('[Click Worker Error in Poll Loop]', err);
        // Exponential/gentle backoff on failure
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async pollAndProcess(): Promise<void> {
    const queueKey = config.redis.clickEventsQueueKey;

    // Pop up to 50 items using Redis RPOP with count (supported in Redis 6.2+)
    let rawItems: string[] | string | null = null;
    try {
      rawItems = (await redis.rpop(queueKey, 50)) as any;
    } catch {
      // Fallback if RPOP count is not supported on older Redis
      const single = await redis.rpop(queueKey);
      rawItems = single ? [single] : null;
    }

    if (!rawItems || (Array.isArray(rawItems) && rawItems.length === 0)) {
      // Queue is empty, pause slightly to prevent high CPU spinning
      await new Promise((resolve) => setTimeout(resolve, 200));
      return;
    }

    const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];

    for (const raw of itemsArray) {
      try {
        const parsed: RawClickEvent = JSON.parse(raw);
        if (!parsed.short_code) continue;

        // Resolve Country Code using GeoIP from client IP
        let country = parsed.country_code || null;
        if (!country && parsed.ip) {
          const geo = geoip.lookup(parsed.ip);
          if (geo && geo.country) {
            country = geo.country.substring(0, 2).toUpperCase();
          }
        }

        // Sanitize and trim strings
        const referrer = parsed.referrer ? parsed.referrer.substring(0, 512) : null;
        const userAgent = parsed.user_agent ? parsed.user_agent.substring(0, 1024) : null;
        const clickedAt = parsed.clicked_at || new Date().toISOString();

        this.pendingBatch.push({
          short_code: parsed.short_code,
          clicked_at: clickedAt,
          referrer,
          user_agent: userAgent,
          country_code: country,
        });
      } catch (err) {
        console.warn('[Click Worker] Error parsing click event payload:', err);
      }
    }

    // Flush if batch size threshold is reached (50-100)
    if (this.pendingBatch.length >= config.worker.batchSize) {
      await this.flushBatch();
    }
  }

  private async checkTimeBasedFlush(): Promise<void> {
    const elapsed = Date.now() - this.lastFlushTime;
    if (this.pendingBatch.length > 0 && elapsed >= config.worker.flushIntervalMs) {
      await this.flushBatch();
    }
  }

  public async flushBatch(): Promise<void> {
    if (this.pendingBatch.length === 0) return;

    // Drain the current batch
    const recordsToInsert = [...this.pendingBatch];
    this.pendingBatch = [];
    this.lastFlushTime = Date.now();

    try {
      const values: any[] = [];
      const rowPlaceholders: string[] = [];

      let paramIdx = 1;
      for (const rec of recordsToInsert) {
        rowPlaceholders.push(
          `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`
        );
        values.push(rec.short_code, rec.clicked_at, rec.referrer, rec.user_agent, rec.country_code);
      }

      const sql = `
        INSERT INTO link_clicks (short_code, clicked_at, referrer, user_agent, country_code)
        VALUES ${rowPlaceholders.join(', ')};
      `;

      await pool.query(sql, values);
      console.log(`[Click Worker] Successfully bulk inserted ${recordsToInsert.length} click events.`);
    } catch (err) {
      console.error('[Click Worker] Bulk insert failed, restoring records to retry:', err);
      // Put back records on failure to prevent data loss
      this.pendingBatch.unshift(...recordsToInsert);
    }
  }

  async stop(): Promise<void> {
    console.log('[Click Worker] Stopping worker and flushing remaining events...');
    this.isRunning = false;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flushBatch();
    console.log('[Click Worker] Flushed and worker stopped.');
  }
}

// When run directly as standalone script
const isMain = process.argv[1]?.endsWith('clickConsumer.ts') || process.argv[1]?.endsWith('clickConsumer.js');
if (isMain) {
  const worker = new ClickConsumerWorker();

  const shutdown = async () => {
    await worker.stop();
    await pool.end();
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  worker.start().catch((err) => {
    console.error('[Fatal Click Worker Crash]', err);
    process.exit(1);
  });
}
