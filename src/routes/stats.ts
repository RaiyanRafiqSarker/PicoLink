import { Router, Request, Response, NextFunction } from 'express';
import { statsService } from '../services/statsService.js';

const router = Router();

router.get('/api/v1/stats/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawCode = req.params.code;
    const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;
    if (!code) {
      res.status(400).json({ error: 'Bad Request', message: 'Short code is required' });
      return;
    }

    const stats = await statsService.getStatsForCode(code);
    if (!stats) {
      res.status(404).json({
        error: 'Not Found',
        message: `No shortened URL found matching code "${code}"`,
      });
      return;
    }

    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
