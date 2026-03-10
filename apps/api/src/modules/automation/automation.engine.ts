import type { AutomationAction, AutomationRule, ServerProfile } from '@saifcontrol/shared';
import { AutomationRulesSchema, STORAGE_FILES, now } from '@saifcontrol/shared';
import { Cron } from 'croner';
import { EventEmitter } from 'events';
import { writeAudit } from '../../lib/audit.js';
import { getStore } from '../../lib/store.js';
import { createBackup } from '../backup/backup.service.js';
import { getServerManager } from '../server/server.manager.js';

/**
 * Automation Engine
 * Manages rules with cron/event triggers and sequential action execution.
 */
export class AutomationEngine extends EventEmitter {
    private cronJobs = new Map<string, Cron>();
    private activeProfile: ServerProfile | null = null;
    private running = false;

    /**
     * Load and activate all enabled rules for a profile.
     */
    async start(profile: ServerProfile): Promise<void> {
        this.activeProfile = profile;
        this.running = true;

        const store = getStore();
        const data = await store.read(STORAGE_FILES.AUTOMATION, AutomationRulesSchema);
        if (!data) return;

        for (const rule of data.rules) {
            if (rule.enabled) {
                this.activateRule(rule);
            }
        }
    }

    /**
     * Stop all active rules.
     */
    stop(): void {
        this.running = false;
        for (const [id, job] of this.cronJobs) {
            job.stop();
        }
        this.cronJobs.clear();
    }

    /**
     * Add or update a rule.
     */
    async upsertRule(rule: AutomationRule): Promise<AutomationRule> {
        const store = getStore();
        await store.update(STORAGE_FILES.AUTOMATION, AutomationRulesSchema, (data) => {
            const idx = data.rules.findIndex((r) => r.id === rule.id);
            if (idx >= 0) {
                data.rules[idx] = rule;
            } else {
                data.rules.push(rule);
            }
            data.updatedAt = now();
            return data;
        });

        // Re-activate if running
        this.deactivateRule(rule.id);
        if (this.running && rule.enabled) {
            this.activateRule(rule);
        }

        writeAudit({ userId: null, action: 'automation.rule_upsert', details: { ruleId: rule.id, name: rule.name } });
        return rule;
    }

    /**
     * Delete a rule.
     */
    async deleteRule(ruleId: string): Promise<void> {
        this.deactivateRule(ruleId);

        const store = getStore();
        await store.update(STORAGE_FILES.AUTOMATION, AutomationRulesSchema, (data) => {
            data.rules = data.rules.filter((r) => r.id !== ruleId);
            data.updatedAt = now();
            return data;
        });

        writeAudit({ userId: null, action: 'automation.rule_delete', details: { ruleId } });
    }

    /**
     * Get all rules.
     */
    async getRules(): Promise<AutomationRule[]> {
        const store = getStore();
        const data = await store.read(STORAGE_FILES.AUTOMATION, AutomationRulesSchema);
        return data?.rules || [];
    }

    /**
     * Handle event-based triggers (called by server manager events).
     */
    async handleEvent(eventType: string, eventData?: Record<string, unknown>): Promise<void> {
        if (!this.running) return;

        const store = getStore();
        const data = await store.read(STORAGE_FILES.AUTOMATION, AutomationRulesSchema);
        if (!data) return;

        for (const rule of data.rules) {
            if (!rule.enabled) continue;
            if (rule.trigger.type !== eventType) continue;

            // Check conditions
            const conditionsMet = this.evaluateConditions(rule, eventData);
            if (conditionsMet) {
                this.executeActions(rule).catch((err) => {
                    this.emit('error', { ruleId: rule.id, error: err });
                });
            }
        }
    }

    // ─── Private ───

    private activateRule(rule: AutomationRule): void {
        if (rule.trigger.type === 'cron') {
            const cronJob = new Cron(rule.trigger.cron, () => {
                this.executeActions(rule).catch((err) => {
                    this.emit('error', { ruleId: rule.id, error: err });
                });
            });
            this.cronJobs.set(rule.id, cronJob);
        }
        // Event-based triggers are handled via handleEvent()
    }

    private deactivateRule(ruleId: string): void {
        const job = this.cronJobs.get(ruleId);
        if (job) {
            job.stop();
            this.cronJobs.delete(ruleId);
        }
    }

    private evaluateConditions(rule: AutomationRule, eventData?: Record<string, unknown>): boolean {
        if (!rule.conditions || rule.conditions.length === 0) return true;

        for (const condition of rule.conditions) {
            if (condition.type === 'server.running') {
                const manager = this.activeProfile ? getServerManager(this.activeProfile) : null;
                if (!manager) return false;
                const isRunning = manager.status === 'running';
                if (condition.equals !== undefined && condition.equals !== isRunning) return false;
            }
            // Add more condition types as needed
        }

        return true;
    }

    private async executeActions(rule: AutomationRule): Promise<void> {
        this.emit('ruleTriggered', { ruleId: rule.id, name: rule.name });
        writeAudit({ userId: null, action: 'automation.triggered', details: { ruleId: rule.id, name: rule.name } });

        for (const action of rule.actions) {
            await this.executeAction(action);
        }
    }

    private async executeAction(action: AutomationAction): Promise<void> {
        if (!this.activeProfile) return;

        const manager = getServerManager(this.activeProfile);

        switch (action.type) {
            case 'server.start':
                await manager.start();
                break;

            case 'server.stop':
                await manager.stop();
                break;

            case 'server.restart':
                await manager.restart();
                break;

            case 'command.exec':
                manager.sendCommand(action.command);
                break;

            case 'backup.create':
                await createBackup(this.activeProfile.id, this.activeProfile.serverDataPath, 'scheduled');
                break;

            case 'announce':
                manager.sendCommand(`say ${action.message}`);
                break;

            case 'delay':
                await new Promise((r) => setTimeout(r, action.ms));
                break;

            case 'notify.local':
                this.emit('notification', { message: action.message });
                break;
        }
    }
}

/** Singleton engine */
let engineInstance: AutomationEngine | null = null;

export function getAutomationEngine(): AutomationEngine {
    if (!engineInstance) {
        engineInstance = new AutomationEngine();
    }
    return engineInstance;
}
