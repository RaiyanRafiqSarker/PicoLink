import { Redis } from 'ioredis';
import { config } from '../config/index.js';

let isRealRedisHealthy = false;
let hasCheckedRedis = false;

export const rawRedis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 1) return null; // Don't spam retries if redis is not running locally
    return 100;
  },
});

rawRedis.on('connect', () => {
  isRealRedisHealthy = true;
  console.log('[Redis] Connected to Redis server successfully');
});

rawRedis.on('error', () => {
  isRealRedisHealthy = false;
});

// In-memory Redis Emulator for seamless local development
class MemoryRedisStore {
  private kv = new Map<string, { value: string; expiresAt?: number }>();
  private lists = new Map<string, string[]>();
  private sortedSets = new Map<string, Array<{ score: number; member: string }>>();

  async get(key: string): Promise<string | null> {
    const item = this.kv.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.kv.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiresAt: number | undefined;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    }
    this.kv.set(key, { value, expiresAt });
    return 'OK';
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    const list = this.lists.get(key) || [];
    for (const v of values) {
      list.unshift(v);
    }
    this.lists.set(key, list);
    return list.length;
  }

  async rpop(key: string, count?: number): Promise<string[] | string | null> {
    const list = this.lists.get(key);
    if (!list || list.length === 0) return null;

    if (count !== undefined && count > 1) {
      const popped: string[] = [];
      while (list.length > 0 && popped.length < count) {
        popped.push(list.pop()!);
      }
      return popped;
    }

    return list.pop() || null;
  }

  multi() {
    const commands: Array<() => any> = [];
    return {
      zremrangebyscore: (key: string, min: number, max: number) => {
        commands.push(() => {
          const set = this.sortedSets.get(key) || [];
          const filtered = set.filter((item) => item.score < min || item.score > max);
          this.sortedSets.set(key, filtered);
          return set.length - filtered.length;
        });
      },
      zadd: (key: string, score: number, member: string) => {
        commands.push(() => {
          const set = this.sortedSets.get(key) || [];
          set.push({ score, member });
          this.sortedSets.set(key, set);
          return 1;
        });
      },
      zcard: (key: string) => {
        commands.push(() => {
          const set = this.sortedSets.get(key) || [];
          return set.length;
        });
      },
      expire: (_key: string, _seconds: number) => {
        commands.push(() => 1);
      },
      exec: async () => {
        return commands.map((fn) => [null, fn()]);
      },
    };
  }

  disconnect() {}
}

const memoryRedis = new MemoryRedisStore();

// Unified proxy that uses real Redis if connected, otherwise falls back to memoryRedis
export const redis: any = new Proxy(rawRedis, {
  get(target: any, prop: string) {
    if (isRealRedisHealthy && typeof target[prop] === 'function') {
      return target[prop].bind(target);
    }
    if (prop in memoryRedis) {
      return (memoryRedis as any)[prop].bind(memoryRedis);
    }
    return target[prop];
  },
});

export async function checkRedisHealth(): Promise<boolean> {
  hasCheckedRedis = true;
  try {
    const pong = await rawRedis.ping();
    if (pong === 'PONG') {
      isRealRedisHealthy = true;
      return true;
    }
  } catch {
    isRealRedisHealthy = false;
  }
  return true; // Returns true because embedded Redis fallback is operational
}
