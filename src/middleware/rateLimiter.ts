import { Request, Response, NextFunction } from 'express';
import { redis } from '../db/redis.js';
import { config } from '../config/index.js';

// In-memory fallback if Redis is unreachable
const memoryFallback = new Map<string, number[]>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.socket.remoteAddress || req.ip || '127.0.0.1';
}

export function createIpRateLimiter(limit: number = config.rateLimit.shortenPerMinute, windowSeconds: number = 60) {
  const windowMs = windowSeconds * 1000;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = getClientIp(req);
    const key = `${config.redis.rateLimitPrefix}shorten:${ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Redis sliding window counter using sorted set
      const multi = redis.multi();
      multi.zremrangebyscore(key, 0, windowStart);
      multi.zadd(key, now, `${now}-${Math.random()}`);
      multi.zcard(key);
      multi.expire(key, windowSeconds);

      const results = await multi.exec();
      if (!results || !results[2] || results[2][0]) {
        throw new Error('Redis multi execution failed');
      }

      const requestCount = results[2][1] as number;
      const remaining = Math.max(0, limit - requestCount);

      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000).toString());

      if (requestCount > limit) {
        res.setHeader('Retry-After', windowSeconds.toString());
        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Maximum ${limit} link creations per minute allowed.`,
          retryAfterSeconds: windowSeconds,
        });
        return;
      }

      next();
    } catch {
      // Fallback to in-memory sliding window
      const timestamps = memoryFallback.get(ip) || [];
      const validTimestamps = timestamps.filter(t => t > windowStart);
      validTimestamps.push(now);
      memoryFallback.set(ip, validTimestamps);

      // Periodically clean up memory map
      if (memoryFallback.size > 10000) {
        for (const [k, v] of memoryFallback.entries()) {
          if (v.every(t => t <= windowStart)) {
            memoryFallback.delete(k);
          }
        }
      }

      const count = validTimestamps.length;
      const remaining = Math.max(0, limit - count);

      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());

      if (count > limit) {
        res.setHeader('Retry-After', windowSeconds.toString());
        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Maximum ${limit} link creations per minute allowed.`,
          retryAfterSeconds: windowSeconds,
        });
        return;
      }

      next();
    }
  };
}
