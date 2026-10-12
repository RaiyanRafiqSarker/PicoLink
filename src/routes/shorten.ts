import { Router, Request, Response, NextFunction } from 'express';
import { urlService } from '../services/urlService.js';
import { createIpRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const shortenRateLimiter = createIpRateLimiter();

router.post('/api/v1/shorten', shortenRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { original_url, custom_slug, expires_in_days } = req.body || {};

    if (!original_url) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Field "original_url" is required in request body.',
      });
      return;
    }

    const result = await urlService.createShortUrl(original_url, custom_slug, expires_in_days);

    res.status(201).json(result);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({
        error: err.status === 409 ? 'Conflict' : 'Bad Request',
        message: err.message,
      });
      return;
    }
    next(err);
  }
});

export default router;
