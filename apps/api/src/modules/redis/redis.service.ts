import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);
  private readonly inMemoryStore = new Map<string, { value: string; expiresAt: number | null }>();

  constructor(config: ConfigService) {
    const redisUrl = config.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
        });

        this.client.on('error', (err) => {
          this.logger.warn(`Redis connection error, falling back to in-memory: ${err.message}`);
          if (this.client) {
            try { this.client.disconnect(); } catch (e) {}
            this.client = null;
          }
        });

        this.client.connect().catch((err) => {
          this.logger.warn(`Redis connection failed: ${err.message}. Using in-memory fallback.`);
          if (this.client) {
            try { this.client.disconnect(); } catch (e) {}
            this.client = null;
          }
        });
      } catch (err: any) {
        this.logger.warn(`Could not construct Redis client: ${err.message}. Using in-memory fallback.`);
        this.client = null;
      }
    } else {
      this.logger.log('No REDIS_URL provided. Using in-memory store.');
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err: any) {
        this.logger.warn(`Redis set failed, using in-memory: ${err.message}`);
      }
    }
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.inMemoryStore.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch (err: any) {
        this.logger.warn(`Redis get failed, using in-memory: ${err.message}`);
      }
    }
    const item = this.inMemoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.inMemoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err: any) {
        this.logger.warn(`Redis del failed, using in-memory: ${err.message}`);
      }
    }
    this.inMemoryStore.delete(key);
  }

  async incr(key: string): Promise<number> {
    if (this.client) {
      try {
        return await this.client.incr(key);
      } catch (err: any) {
        this.logger.warn(`Redis incr failed, using in-memory: ${err.message}`);
      }
    }
    const currentVal = await this.get(key);
    const newVal = (currentVal ? parseInt(currentVal, 10) : 0) + 1;
    const expiresAt = this.inMemoryStore.get(key)?.expiresAt || null;
    this.inMemoryStore.set(key, { value: newVal.toString(), expiresAt });
    return newVal;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (this.client) {
      try {
        await this.client.expire(key, ttlSeconds);
        return;
      } catch (err: any) {
        this.logger.warn(`Redis expire failed, using in-memory: ${err.message}`);
      }
    }
    const item = this.inMemoryStore.get(key);
    if (item) {
      item.expiresAt = Date.now() + ttlSeconds * 1000;
      this.inMemoryStore.set(key, item);
    }
  }

  async ttl(key: string): Promise<number> {
    if (this.client) {
      try {
        return await this.client.ttl(key);
      } catch (err: any) {
        this.logger.warn(`Redis ttl failed, using in-memory: ${err.message}`);
      }
    }
    const item = this.inMemoryStore.get(key);
    if (!item) return -2;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.inMemoryStore.delete(key);
      return -2;
    }
    if (!item.expiresAt) return -1;
    return Math.round((item.expiresAt - Date.now()) / 1000);
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.client) {
      try {
        return await this.client.keys(pattern);
      } catch (err: any) {
        this.logger.warn(`Redis keys failed, using in-memory: ${err.message}`);
      }
    }
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matched: string[] = [];
    const now = Date.now();
    for (const [key, item] of this.inMemoryStore.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.inMemoryStore.delete(key);
        continue;
      }
      if (regex.test(key)) {
        matched.push(key);
      }
    }
    return matched;
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
