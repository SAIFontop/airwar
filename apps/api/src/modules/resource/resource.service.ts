import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '../../redis/redis.service';

export interface ResourceData {
    name: string;
    state: string;
    version?: string;
    author?: string;
    description?: string;
    path: string;
    dependencies: string[];
    dependents: string[];
    cpuUsage: number;
    memoryUsage: number;
    tickTime: number;
    errorCount: number;
    lastError?: string;
}

@Injectable()
export class ResourceService {
    private readonly logger = new Logger(ResourceService.name);

    constructor(
        private redis: RedisService,
        private events: EventEmitter2,
    ) { }

    async getResources(serverId: string): Promise<ResourceData[]> {
        const cached = await this.redis.get(`server:${serverId}:resources`);
        if (cached) return JSON.parse(cached);
        return [];
    }

    async getResource(serverId: string, name: string): Promise<ResourceData | null> {
        const resources = await this.getResources(serverId);
        return resources.find((r) => r.name === name) || null;
    }

    async updateResources(serverId: string, resources: ResourceData[]) {
        await this.redis.set(`server:${serverId}:resources`, JSON.stringify(resources), 30);
        this.events.emit('resource.updated', { serverId, resources });
    }

    async getDependencyGraph(serverId: string) {
        const resources = await this.getResources(serverId);
        const nodes = resources.map((r) => ({ id: r.name, state: r.state, cpu: r.cpuUsage, memory: r.memoryUsage }));
        const edges = resources.flatMap((r) =>
            r.dependencies.map((dep) => ({ from: dep, to: r.name })),
        );
        return { nodes, edges };
    }

    async getResourceProfile(serverId: string, resourceName: string) {
        const historyKey = `server:${serverId}:resource:${resourceName}:history`;
        const history = await this.redis.get(historyKey);
        return history ? JSON.parse(history) : { cpu: [], memory: [], tickTime: [], errors: [] };
    }

    async recordResourceMetrics(
        serverId: string,
        resourceName: string,
        metrics: { cpu: number; memory: number; tickTime: number; errors: number },
    ) {
        const historyKey = `server:${serverId}:resource:${resourceName}:history`;
        const existing = await this.redis.get(historyKey);
        const history = existing ? JSON.parse(existing) : { cpu: [], memory: [], tickTime: [], errors: [] };

        const timestamp = Date.now();
        history.cpu.push({ timestamp, value: metrics.cpu });
        history.memory.push({ timestamp, value: metrics.memory });
        history.tickTime.push({ timestamp, value: metrics.tickTime });
        history.errors.push({ timestamp, value: metrics.errors });

        // Keep last 1000 data points
        const maxPoints = 1000;
        for (const key of ['cpu', 'memory', 'tickTime', 'errors'] as const) {
            if (history[key].length > maxPoints) {
                history[key] = history[key].slice(-maxPoints);
            }
        }

        await this.redis.set(historyKey, JSON.stringify(history), 3600);
    }
}
