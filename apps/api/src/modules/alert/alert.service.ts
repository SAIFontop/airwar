import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AlertService {
    private readonly logger = new Logger(AlertService.name);

    constructor(
        private prisma: PrismaService,
        private events: EventEmitter2,
    ) { }

    async getAlerts(serverId?: string, acknowledged?: boolean) {
        return this.prisma.alert.findMany({
            where: {
                ...(serverId ? { serverId } : {}),
                ...(acknowledged !== undefined ? { acknowledged } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    async createAlert(data: {
        serverId: string;
        severity: 'INFO' | 'WARNING' | 'CRITICAL';
        title: string;
        message: string;
        metadata?: Record<string, unknown>;
    }) {
        const alert = await this.prisma.alert.create({
            data: {
                ...data,
                metadata: data.metadata as any ?? undefined,
            },
        });
        this.events.emit('alert.created', alert);
        return alert;
    }

    async acknowledgeAlert(id: string, userId: string) {
        return this.prisma.alert.update({
            where: { id },
            data: { acknowledged: true, acknowledgedBy: userId },
        });
    }

    async resolveAlert(id: string) {
        return this.prisma.alert.update({
            where: { id },
            data: { resolvedAt: new Date() },
        });
    }

    @OnEvent('alert.threshold')
    async handleThreshold(payload: {
        serverId: string;
        metric: string;
        value: number;
        threshold: number;
        severity: string;
    }) {
        await this.createAlert({
            serverId: payload.serverId,
            severity: payload.severity === 'critical' ? 'CRITICAL' : 'WARNING',
            title: `${payload.metric} threshold exceeded`,
            message: `${payload.metric} is at ${payload.value.toFixed(1)}% (threshold: ${payload.threshold}%)`,
            metadata: payload as unknown as Record<string, unknown>,
        });
    }
}
