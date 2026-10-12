import { Router, Request, Response, NextFunction } from 'express';
import { urlService } from '../services/urlService.js';
import { redis } from '../db/redis.js';
import { config } from '../config/index.js';
import { isReservedSlug } from '../utils/blacklist.js';

const router = Router();

function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.socket.remoteAddress || req.ip || '127.0.0.1';
}

router.get('/:code', async (req: Request, res: Response, next: NextFunction) => {
  const rawCode = req.params.code;
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;

  if (!code) {
    return next();
  }

  // If this matches reserved system routes or frontend assets, skip redirection handler
  if (isReservedSlug(code) || code.includes('.')) {
    return next();
  }

  try {
    const result = await urlService.resolveUrl(code);

    if (!result.found) {
      res.status(404).json({
        error: 'Not Found',
        message: `Short URL code "${code}" does not exist or has been disabled.`,
      });
      return;
    }

    if (result.expired) {
      res.status(410).json({
        error: 'Gone',
        message: `The short link "${code}" has expired.`,
      });
      return;
    }

    const destinationUrl = result.original_url!;

    // Asynchronously push click event to Redis list without blocking the HTTP redirect
    const clientIp = extractClientIp(req);
    const countryHeader = req.headers['cf-ipcountry'] || req.headers['x-country-code'];
    const clickPayload = {
      short_code: code,
      clicked_at: new Date().toISOString(),
      referrer: (req.get('referer') || req.get('referrer') || null) as string | null,
      user_agent: (req.get('user-agent') || null) as string | null,
      ip: clientIp,
      country_code: typeof countryHeader === 'string' ? countryHeader.substring(0, 2).toUpperCase() : null,
    };

    redis.lpush(config.redis.clickEventsQueueKey, JSON.stringify(clickPayload)).catch((err: any) => {
      console.warn('[Redis Click Event Push Failed]', err.message);
    });

    // Immediate HTTP 302 redirect
    res.redirect(302, destinationUrl);
  } catch (err) {
    next(err);
  }
});

export default router;
