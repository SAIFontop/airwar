import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AutomationService {
    private readonly logger = new Logger(AutomationService.name);

    constructor(
        private prisma: PrismaService,
        private events: EventEmitter2,
    ) { }

    async getRules(serverId?: string) {
        return this.prisma.automationRule.findMany({
            where: serverId ? { serverId } : {},
            orderBy: { createdAt: 'desc' },
        });
    }

    async getRule(id: string) {
        return this.prisma.automationRule.findUnique({ where: { id } });
    }

    async createRule(data: {
        name: string;
        description?: string;
        serverId?: string;
        triggerType: string;
        conditions: Record<string, unknown>;
        cooldown?: number;
        actions: Array<{ type: string; params: Record<string, unknown>; order: number }>;
    }) {
        return this.prisma.automationRule.create({
            data: {
                name: data.name,
                description: data.description || '',
                serverId: data.serverId,
                triggerType: data.triggerType,
                conditions: data.conditions as any,
                cooldown: data.cooldown || 60,
                actions: data.actions as any,
            },
        });
    }

    async updateRule(id: string, data: Partial<{
        name: string;
        description: string;
        enabled: boolean;
        triggerType: string;
        conditions: Record<string, unknown>;
        cooldown: number;
        actions: Array<{ type: string; params: Record<string, unknown>; order: number }>;
    }>) {
        const updateData: Record<string, unknown> = { ...data };
        if (data.conditions) updateData.conditions = data.conditions;
        if (data.actions) updateData.actions = data.actions;
        return this.prisma.automationRule.update({
            where: { id },
            data: updateData as any,
        });
    }

    async deleteRule(id: string) {
        await this.prisma.automationRule.delete({ where: { id } });
        return true;
    }

    @OnEvent('alert.threshold')
    async handleThresholdAlert(payload: {
        serverId: string;
        metric: string;
        value: number;
        threshold: number;
        severity: string;
    }) {
        const rules = await this.prisma.automationRule.findMany({
            where: {
                enabled: true,
                OR: [{ serverId: payload.serverId }, { serverId: null }],
            },
        });

        for (const rule of rules) {
            if (this.shouldTrigger(rule, payload)) {
                await this.executeRule(rule, payload);
            }
        }
    }

    @OnEvent('server.crashed')
    async handleServerCrash(payload: { serverId: string; code: number }) {
        const rules = await this.prisma.automationRule.findMany({
            where: {
                enabled: true,
                triggerType: 'server_crash',
                OR: [{ serverId: payload.serverId }, { serverId: null }],
            },
        });

        for (const rule of rules) {
            await this.executeRule(rule, payload);
        }
    }

    private shouldTrigger(rule: { triggerType: string; conditions: unknown; lastTriggered: Date | null; cooldown: number }, payload: { metric?: string }) {
        const conditions = rule.conditions as Record<string, unknown>;

        // Check cooldown
        if (rule.lastTriggered) {
            const elapsed = Date.now() - rule.lastTriggered.getTime();
            if (elapsed < rule.cooldown * 1000) return false;
        }

        // Match trigger type to metric
        const triggerMap: Record<string, string> = {
            cpu_spike: 'cpu',
            memory_leak: 'memory',
            tickrate_drop: 'tickRate',
        };

        const expectedMetric = triggerMap[rule.triggerType];
        if (expectedMetric && payload.metric !== expectedMetric) return false;

        return true;
    }

    private async executeRule(
        rule: { id: string; name: string; actions: unknown },
        payload: Record<string, unknown>,
    ) {
        this.logger.log(`Executing automation rule: ${rule.name}`);

        const actions = rule.actions as Array<{ type: string; params: Record<string, unknown> }>;

        for (const action of actions) {
            this.events.emit(`automation.execute.${action.type}`, {
                ruleId: rule.id,
                action,
                triggerPayload: payload,
            });
        }

        await this.prisma.automationRule.update({
            where: { id: rule.id },
            data: {
                lastTriggered: new Date(),
                triggerCount: { increment: 1 },
            },
        });
    }
}
