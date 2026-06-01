import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly ttlSeconds: number;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('REDIS_HOST') ?? 'localhost';
    const port = Number(this.config.get<string>('REDIS_PORT') ?? '6379');
    const password = this.config.get<string>('REDIS_PASSWORD') ?? undefined;

    this.ttlSeconds = 0;

    this.client = new Redis({
      host,
      port,
      password,
    });

    this.client.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('Redis connection error:', err);
    });
  }

  getDefaultTtlSeconds(): number {
    return this.ttlSeconds;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.ttlSeconds;
    if (Number.isFinite(ttl) && ttl > 0) {
      await this.client.set(key, value, 'EX', ttl);
      return;
    }

    await this.client.set(key, value);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds?: number,
  ): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
