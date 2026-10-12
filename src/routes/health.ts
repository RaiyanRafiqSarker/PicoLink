import { Router, Request, Response } from 'express';
import { checkDbHealth } from '../db/pool.js';
import { checkRedisHealth } from '../db/redis.js';

const router = Router();

router.get('/healthz', async (req: Request, res: Response) => {
  const [dbOk, redisOk] = await Promise.all([checkDbHealth(), checkRedisHealth()]);

  const healthy = dbOk && redisOk;
  const status = healthy ? 200 : 503;

  res.status(status).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      postgres: dbOk ? 'healthy' : 'unhealthy',
      redis: redisOk ? 'healthy' : 'unhealthy',
    },
  });
});

export default router;
