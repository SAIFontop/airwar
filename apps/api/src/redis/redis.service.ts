import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private client: Redis;
    private subscriber: Redis;

    constructor(private configService: ConfigService) {
        const url = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
        this.client = new Redis(url);
        this.subscriber = new Redis(url);
    }

    getClient(): Redis {
        return this.client;
    }

    getSubscriber(): Redis {
        return this.subscriber;
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await this.client.setex(key, ttl, value);
        } else {
            await this.client.set(key, value);
        }
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async publish(channel: string, message: string): Promise<void> {
        await this.client.publish(channel, message);
    }

    async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
        await this.subscriber.subscribe(channel);
        this.subscriber.on('message', (ch, msg) => {
            if (ch === channel) callback(msg);
        });
    }

    async hset(key: string, field: string, value: string): Promise<void> {
        await this.client.hset(key, field, value);
    }

    async hget(key: string, field: string): Promise<string | null> {
        return this.client.hget(key, field);
    }

    async hgetall(key: string): Promise<Record<string, string>> {
        return this.client.hgetall(key);
    }

    async onModuleDestroy() {
        await this.client.quit();
        await this.subscriber.quit();
    }
}
