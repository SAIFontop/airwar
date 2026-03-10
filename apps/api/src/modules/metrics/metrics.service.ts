import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '../../redis/redis.service';

export interface MetricSnapshot {
    serverId: string;
    timestamp: number;
    cpu: number;
    memory: number;
    memoryTotal: number;
    networkIn: number;
    networkOut: number;
    diskRead: number;
    diskWrite: number;
    tickRate: number;
    playerCount: number;
    resourceCount: number;
    scriptExecutionTime: number;
    threadCount: number;
}

@Injectable()
export class MetricsService {
    private readonly logger = new Logger(MetricsService.name);
    private metricsHistory = new Map<string, MetricSnapshot[]>();

    constructor(
        private redis: RedisService,
        private events: EventEmitter2,
    ) { }

    async ingestMetrics(metrics: MetricSnapshot) {
        // Store in Redis for real-time access
        const key = `server:${metrics.serverId}:metrics`;
        await this.redis.hset(key, 'cpu', String(metrics.cpu));
        await this.redis.hset(key, 'memory', String(metrics.memory));
        await this.redis.hset(key, 'memoryTotal', String(metrics.memoryTotal));
        await this.redis.hset(key, 'networkIn', String(metrics.networkIn));
        await this.redis.hset(key, 'networkOut', String(metrics.networkOut));
        await this.redis.hset(key, 'tickRate', String(metrics.tickRate));
        await this.redis.hset(key, 'playerCount', String(metrics.playerCount));
        await this.redis.hset(key, 'resourceCount', String(metrics.resourceCount));
        await this.redis.hset(key, 'scriptExecutionTime', String(metrics.scriptExecutionTime));
        await this.redis.hset(key, 'timestamp', String(metrics.timestamp));

        // Store in history
        const history = this.metricsHistory.get(metrics.serverId) || [];
        history.push(metrics);
        if (history.length > 10000) history.shift();
        this.metricsHistory.set(metrics.serverId, history);

        // Emit real-time event
        this.events.emit('metrics.updated', metrics);
        await this.redis.publish(`metrics:${metrics.serverId}`, JSON.stringify(metrics));

        // Check thresholds
        this.checkThresholds(metrics);
    }

    async getCurrentMetrics(serverId: string): Promise<Record<string, string>> {
        return this.redis.hgetall(`server:${serverId}:metrics`);
    }

    async getMetricsHistory(
        serverId: string,
        from: number,
        to: number,
        resolution?: number,
    ): Promise<MetricSnapshot[]> {
        const history = this.metricsHistory.get(serverId) || [];
        let filtered = history.filter((m) => m.timestamp >= from && m.timestamp <= to);

        if (resolution && filtered.length > resolution) {
            const step = Math.ceil(filtered.length / resolution);
            filtered = filtered.filter((_, i) => i % step === 0);
        }

        return filtered;
    }

    async getServerSummary(serverId: string) {
        const metrics = await this.getCurrentMetrics(serverId);
        const history = this.metricsHistory.get(serverId) || [];
        const last60 = history.filter((m) => m.timestamp > Date.now() - 3600000);

        return {
            current: metrics,
            avgCpu: last60.length ? last60.reduce((s, m) => s + m.cpu, 0) / last60.length : 0,
            avgMemory: last60.length ? last60.reduce((s, m) => s + m.memory, 0) / last60.length : 0,
            avgTickRate: last60.length ? last60.reduce((s, m) => s + m.tickRate, 0) / last60.length : 0,
            peakPlayers: last60.length ? Math.max(...last60.map((m) => m.playerCount)) : 0,
            dataPoints: last60.length,
        };
    }

    private checkThresholds(metrics: MetricSnapshot) {
        if (metrics.cpu > 90) {
            this.events.emit('alert.threshold', {
                serverId: metrics.serverId,
                metric: 'cpu',
                value: metrics.cpu,
                threshold: 90,
                severity: 'critical',
            });
        }

        if (metrics.memory > 85) {
            this.events.emit('alert.threshold', {
                serverId: metrics.serverId,
                metric: 'memory',
                value: metrics.memory,
                threshold: 85,
                severity: 'warning',
            });
        }

        if (metrics.tickRate < 20) {
            this.events.emit('alert.threshold', {
                serverId: metrics.serverId,
                metric: 'tickRate',
                value: metrics.tickRate,
                threshold: 20,
                severity: 'critical',
            });
        }
    }
}
