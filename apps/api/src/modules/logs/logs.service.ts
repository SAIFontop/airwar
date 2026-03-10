import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '../../redis/redis.service';

export interface LogEntry {
    id: string;
    serverId: string;
    timestamp: number;
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    source: string;
    message: string;
    resource?: string;
    stackTrace?: string;
    metadata?: Record<string, unknown>;
}

export interface LogFilter {
    serverId?: string;
    level?: string[];
    source?: string;
    resource?: string;
    search?: string;
    from?: number;
    to?: number;
    limit?: number;
    offset?: number;
}

@Injectable()
export class LogsService {
    private readonly logger = new Logger(LogsService.name);
    private logs = new Map<string, LogEntry[]>();

    constructor(
        private redis: RedisService,
        private events: EventEmitter2,
    ) { }

    async ingestLog(entry: LogEntry) {
        const logs = this.logs.get(entry.serverId) || [];
        logs.push(entry);
        if (logs.length > 50000) logs.shift();
        this.logs.set(entry.serverId, logs);

        // Publish real-time
        this.events.emit('log.new', entry);
        await this.redis.publish(`logs:${entry.serverId}`, JSON.stringify(entry));

        // Error clustering
        if (entry.level === 'error' || entry.level === 'fatal') {
            this.events.emit('log.error', entry);
        }
    }

    async queryLogs(filter: LogFilter): Promise<{ items: LogEntry[]; total: number }> {
        const serverId = filter.serverId;
        if (!serverId) return { items: [], total: 0 };

        let logs = this.logs.get(serverId) || [];

        if (filter.level?.length) {
            logs = logs.filter((l) => filter.level!.includes(l.level));
        }
        if (filter.source) {
            logs = logs.filter((l) => l.source.includes(filter.source!));
        }
        if (filter.resource) {
            logs = logs.filter((l) => l.resource === filter.resource);
        }
        if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            logs = logs.filter((l) => l.message.toLowerCase().includes(searchLower));
        }
        if (filter.from) {
            logs = logs.filter((l) => l.timestamp >= filter.from!);
        }
        if (filter.to) {
            logs = logs.filter((l) => l.timestamp <= filter.to!);
        }

        const total = logs.length;
        const offset = filter.offset || 0;
        const limit = filter.limit || 100;
        const items = logs.slice(offset, offset + limit).reverse();

        return { items, total };
    }

    async getErrorClusters(serverId: string) {
        const logs = this.logs.get(serverId) || [];
        const errors = logs.filter((l) => l.level === 'error' || l.level === 'fatal');

        const clusters = new Map<string, { count: number; sample: LogEntry; firstSeen: number; lastSeen: number }>();

        for (const error of errors) {
            // Simple clustering by first line of message
            const key = error.message.split('\n')[0].substring(0, 100);
            const existing = clusters.get(key);
            if (existing) {
                existing.count++;
                existing.lastSeen = Math.max(existing.lastSeen, error.timestamp);
            } else {
                clusters.set(key, {
                    count: 1,
                    sample: error,
                    firstSeen: error.timestamp,
                    lastSeen: error.timestamp,
                });
            }
        }

        return Array.from(clusters.values()).sort((a, b) => b.count - a.count);
    }
}
