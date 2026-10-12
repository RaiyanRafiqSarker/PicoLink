import { pool } from '../db/pool.js';
import { redis } from '../db/redis.js';
import { config } from '../config/index.js';
import { encodeBase62 } from '../utils/base62.js';
import { validateUrlSafety } from '../utils/ssrf.js';
import { isReservedSlug, isValidSlugFormat } from '../utils/blacklist.js';

export interface ShortenResult {
  short_code: string;
  short_url: string;
  original_url: string;
  created_at: string;
  expires_at: string | null;
}

export interface RedirectLookupResult {
  found: boolean;
  expired: boolean;
  original_url?: string;
}

export class UrlService {
  /**
   * Shortens a target URL, optionally with a custom vanity slug and expiration period.
   */
  async createShortUrl(
    originalUrl: string,
    customSlug?: string,
    expiresInDays?: number
  ): Promise<ShortenResult> {
    // 1. Validate URL and SSRF safety
    if (!originalUrl || typeof originalUrl !== 'string') {
      const err: any = new Error('Field "original_url" is required and must be a valid URL string');
      err.status = 400;
      throw err;
    }

    const safety = await validateUrlSafety(originalUrl.trim());
    if (!safety.safe) {
      const err: any = new Error(safety.error || 'Invalid or prohibited destination URL');
      err.status = 400;
      throw err;
    }

    // 2. Calculate expiration timestamp
    let expiresAt: Date | null = null;
    if (expiresInDays !== undefined && expiresInDays !== null) {
      const days = Number(expiresInDays);
      if (isNaN(days) || days <= 0 || days > 3650) {
        const err: any = new Error('Expiration days must be a positive number up to 3650 days');
        err.status = 400;
        throw err;
      }
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    const cleanOriginalUrl = originalUrl.trim();

    // 3. Handle custom vanity slug
    if (customSlug && customSlug.trim().length > 0) {
      const slug = customSlug.trim();

      if (!isValidSlugFormat(slug)) {
        const err: any = new Error(
          'Custom slug must be between 3 and 64 characters and contain only letters, numbers, underscores, or hyphens.'
        );
        err.status = 400;
        throw err;
      }

      if (isReservedSlug(slug)) {
        const err: any = new Error(`The custom slug "${slug}" is reserved for system routes.`);
        err.status = 400;
        throw err;
      }

      try {
        const insertRes = await pool.query(
          `INSERT INTO urls (short_code, original_url, expires_at)
           VALUES ($1, $2, $3)
           RETURNING short_code, original_url, created_at, expires_at;`,
          [slug, cleanOriginalUrl, expiresAt]
        );

        const row = insertRes.rows[0];

        // Cache-aside warm up
        await this.cacheUrl(row.short_code, {
          original_url: row.original_url,
          expires_at: row.expires_at,
          is_active: true,
        });

        return {
          short_code: row.short_code,
          short_url: `${config.baseUrl}/${row.short_code}`,
          original_url: row.original_url,
          created_at: row.created_at.toISOString(),
          expires_at: row.expires_at ? row.expires_at.toISOString() : null,
        };
      } catch (dbErr: any) {
        if (dbErr.code === '23505') {
          // Unique constraint violation in PostgreSQL
          const err: any = new Error(`Custom slug "${slug}" is already taken. Please choose another.`);
          err.status = 409;
          throw err;
        }
        throw dbErr;
      }
    }

    // 4. Handle auto-generated Base62 code using PostgreSQL sequence
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const seqRes = await client.query("SELECT nextval('urls_id_seq') AS id");
      const nextId = BigInt(seqRes.rows[0].id);
      const generatedCode = encodeBase62(nextId);

      const insertRes = await client.query(
        `INSERT INTO urls (id, short_code, original_url, expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING short_code, original_url, created_at, expires_at;`,
        [nextId.toString(), generatedCode, cleanOriginalUrl, expiresAt]
      );

      await client.query('COMMIT');

      const row = insertRes.rows[0];

      // Cache-aside warm up
      await this.cacheUrl(row.short_code, {
        original_url: row.original_url,
        expires_at: row.expires_at,
        is_active: true,
      });

      return {
        short_code: row.short_code,
        short_url: `${config.baseUrl}/${row.short_code}`,
        original_url: row.original_url,
        created_at: row.created_at.toISOString(),
        expires_at: row.expires_at ? row.expires_at.toISOString() : null,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Resolves a short code using Cache-Aside pattern (Redis -> PostgreSQL fallback).
   */
  async resolveUrl(code: string): Promise<RedirectLookupResult> {
    const cacheKey = `url:${code}`;

    // 1. Check Redis Cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (!data.is_active) {
          return { found: false, expired: false };
        }
        if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
          return { found: true, expired: true };
        }
        return { found: true, expired: false, original_url: data.original_url };
      }
    } catch (err) {
      console.warn('[Redis Cache Lookup Warning]', err);
    }

    // 2. Cache Miss: Query PostgreSQL
    const res = await pool.query(
      `SELECT original_url, expires_at, is_active FROM urls WHERE short_code = $1 LIMIT 1`,
      [code]
    );

    if (res.rows.length === 0) {
      return { found: false, expired: false };
    }

    const record = res.rows[0];

    if (!record.is_active) {
      return { found: false, expired: false };
    }

    if (record.expires_at && new Date(record.expires_at).getTime() < Date.now()) {
      return { found: true, expired: true };
    }

    // 3. Cache valid record in Redis (24-hour TTL)
    await this.cacheUrl(code, {
      original_url: record.original_url,
      expires_at: record.expires_at,
      is_active: record.is_active,
    });

    return { found: true, expired: false, original_url: record.original_url };
  }

  private async cacheUrl(
    code: string,
    data: { original_url: string; expires_at: Date | string | null; is_active: boolean }
  ): Promise<void> {
    try {
      const cacheKey = `url:${code}`;
      await redis.set(cacheKey, JSON.stringify(data), 'EX', config.redis.urlCacheTtlSeconds);
    } catch (err) {
      console.warn('[Redis Cache Set Warning]', err);
    }
  }
}

export const urlService = new UrlService();
