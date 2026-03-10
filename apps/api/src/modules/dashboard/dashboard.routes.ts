import type { AutomationRule, ServerProfile } from '@saifcontrol/shared';
import { AlertsSchema, BansSchema, ProfilesSchema, STORAGE_FILES, WebhookConfigSchema } from '@saifcontrol/shared';
import { randomUUID } from 'crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { readAuditLog, writeAudit } from '../../lib/audit.js';
import { getStore } from '../../lib/store.js';
import * as authService from '../auth/auth.service.js';
import { getAutomationEngine } from '../automation/automation.engine.js';
import { createBackup, deleteBackup, listBackups, restoreBackup } from '../backup/backup.service.js';
import { collectMetrics } from '../metrics/metrics.service.js';
import { scanResources } from '../resource/resource.service.js';
import { getServerManager } from '../server/server.manager.js';

type AuthPayload = { sub: string; role: string; username: string };

/**
 * Auth hooks & helpers.
 */
function getAuthUser(request: FastifyRequest): AuthPayload {
    return (request as any).user as AuthPayload;
}

function requireRole(...roles: string[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = getAuthUser(request);
        if (!roles.includes(user.role)) {
            reply.code(403).send({ success: false, error: 'صلاحيات غير كافية' });
        }
    };
}

async function getActiveProfile(): Promise<ServerProfile | null> {
    const store = getStore();
    const data = await store.read(STORAGE_FILES.PROFILES, ProfilesSchema);
    if (!data || !data.activeProfileId) return null;
    return data.profiles.find((p) => p.id === data.activeProfileId) || null;
}

/**
 * Register authenticated dashboard API routes.
 */
export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
    // All routes require JWT auth
    app.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch {
            reply.code(401).send({ success: false, error: 'غير مصرح' });
        }
    });

    // ═══ Auth ═══

    app.get('/api/auth/me', async (request) => {
        const user = getAuthUser(request);
        return { success: true, data: user };
    });

    app.post('/api/auth/refresh', async (request) => {
        const { refreshToken } = request.body as { refreshToken: string };
        const result = await authService.refreshAccessToken(
            refreshToken,
            (payload, opts) => app.jwt.sign(payload, opts),
        );
        if (!result) return { success: false, error: 'رمز التحديث غير صالح' };
        return { success: true, data: result };
    });

    app.post('/api/auth/logout', async (request) => {
        const user = getAuthUser(request);
        const { refreshToken } = request.body as { refreshToken: string };
        await authService.logout(user.sub, refreshToken);
        return { success: true };
    });

    // ═══ Users (owner/admin only) ═══

    app.get('/api/users', { preHandler: requireRole('owner', 'admin') }, async () => {
        const users = await authService.getUsers();
        return { success: true, data: users };
    });

    // ═══ Server Control ═══

    app.get('/api/server/status', async () => {
        const profile = await getActiveProfile();
        if (!profile) return { success: false, error: 'لا يوجد بروفايل نشط' };

        const manager = getServerManager(profile);
        const info = await manager.getServerInfo();
        return { success: true, data: { status: manager.status, info } };
    });

    app.post('/api/server/start', { preHandler: requireRole('owner', 'admin') }, async (request) => {
        const profile = await getActiveProfile();
        if (!profile) return { success: false, error: 'لا يوجد بروفايل نشط' };

        const manager = getServerManager(profile);
        await manager.start();
        writeAudit({ userId: getAuthUser(request).sub, action: 'server.start' });
        return { success: true, data: { status: manager.status } };
    });

    app.post('/api/server/stop', { preHandler: requireRole('owner', 'admin') }, async (request) => {
        const profile = await getActiveProfile();
        if (!profile) return { success: false, error: 'لا يوجد بروفايل نشط' };

        const manager = getServerManager(profile);
        await manager.stop();
        writeAudit({ userId: getAuthUser(request).sub, action: 'server.stop' });
        return { success: true, data: { status: manager.status } };
    });

    app.post('/api/server/restart', { preHandler: requireRole('owner', 'admin') }, async (request) => {
        const profile = await getActiveProfile();
        if (!profile) return { success: false, error: 'لا يوجد بروفايل نشط' };

        const manager = getServerManager(profile);
        await manager.restart();
        writeAudit({ userId: getAuthUser(request).sub, action: 'server.restart' });
        return { success: true, data: { status: manager.status } };
    });

    app.post<{ Body: { command: string } }>(
        '/api/server/command',
        { preHandler: requireRole('owner', 'admin') },
        async (request) => {
            const profile = await getActiveProfile();
            if (!profile) return { success: false, error: 'لا يوجد بروفايل نشط' };

            const { command } = request.body;

            // Validate command against allowlist
            const allowedPrefixes = ['start', 'stop', 'ensure', 'restart', 'refresh', 'status', 'clientkick', 'say', 'exec', 'quit'];
            const cmdBase = command.split(' ')[0].toLowerCase();
            if (!allowedPrefixes.includes(cmdBase)) {
                return { success: false, error: `الأمر غير مسموح: ${cmdBase}` };
            }

            const manager = getServerManager(profile);

            // Prefer panel_bridge if installed
            if (profile.panelBridgeInstalled) {
                const result = await manager.executeViaBridge(command);
                writeAudit({ userId: getAuthUser(request).sub, action: 'server.command', details: { command, via: 'bridge' } });
                return { success: result.success, data: result };
            }

            // Fallback: direct stdin (process mode only)
            const sent = manager.sendCommand(command);
            writeAudit({ userId: getAuthUser(request).sub, action: 'server.command', details: { command, via: 'stdin' } });
            return { success: sent };
        },
    );

    app.get('/api/server/console', async () => {
        const profile = await getActiveProfile();
        if (!profile) return { success: false, error: 'لا يوجد بروفايل نشط' };

        const manager = getServerManager(profile);
        return { success: true, data: { lines: manager.getLogBuffer() } };
    });

    // ═══ Metrics ═══

    app.get('/api/metrics', async () => {
        const metrics = await collectMetrics();
        return { success: true, data: metrics };
    });

    // ═══ Players ═══

    app.get('/api/players', async () => {
        const profile = await getActiveProfile();
        if (!profile) return { success: true, data: [] };

        const manager = getServerManager(profile);
        const players = await manager.getPlayersViaBridge();
        return { success: true, data: players || [] };
    });

    app.post<{ Body: { playerId: number; reason?: string } }>(
        '/api/players/kick',
        { preHandler: requireRole('owner', 'admin') },
        async (request) => {
            const profile = await getActiveProfile();
            if (!profile) return { success: false, error: 'لا يوجد بروفايل نشط' };

            const { playerId, reason } = request.body;
            const manager = getServerManager(profile);

            if (profile.panelBridgeInstalled) {
                const result = await manager.executeViaBridge(`clientkick ${playerId} "${reason || 'Kicked by admin'}"`);
                writeAudit({ userId: getAuthUser(request).sub, action: 'player.kick', details: { playerId, reason } });
                return { success: result.success };
            }

            const sent = manager.sendCommand(`clientkick ${playerId} "${reason || 'Kicked by admin'}"`);
            writeAudit({ userId: getAuthUser(request).sub, action: 'player.kick', details: { playerId, reason } });
            return { success: sent };
        },
    );

    // ═══ Resources ═══

    app.get('/api/resources', async () => {
        const profile = await getActiveProfile();
        if (!profile) return { success: true, data: [] };

        const resources = await scanResources(profile.serverDataPath);

        // Try to get live resource states from panel_bridge
        const manager = getServerManager(profile);
        const liveResources = await manager.getResourcesViaBridge();

        if (liveResources) {
            const stateMap = new Map(liveResources.map(r => [r.name, r.state]));
            for (const res of resources) {
                // Resource names in bridge don't have the [category]/ prefix
                const baseName = res.name.includes('/') ? res.name.split('/').pop()! : res.name;
                const state = stateMap.get(baseName) || stateMap.get(res.name);
                if (state) {
                    res.status = state === 'started' ? 'started' : state === 'stopped' ? 'stopped' : 'unknown';
                }
            }
        } else {
            // Fallback: check server.cfg for ensure/start lines
            try {
                const cfgPath = join(profile.serverDataPath, 'server.cfg');
                if (existsSync(cfgPath)) {
                    const cfg = await readFile(cfgPath, 'utf-8');
                    const ensured = new Set<string>();
                    for (const line of cfg.split('\n')) {
                        const match = line.trim().match(/^(?:ensure|start)\s+(\S+)/);
                        if (match) ensured.add(match[1]);
                    }
                    for (const res of resources) {
                        const baseName = res.name.includes('/') ? res.name.split('/').pop()! : res.name;
                        if (ensured.has(baseName) || ensured.has(res.name)) {
                            res.status = 'started';
                        } else {
                            res.status = 'stopped';
                        }
                    }
                }
            } catch { /* ignore cfg read errors */ }
        }

        return { success: true, data: resources };
    });

    app.post<{ Body: { name: string; action: 'start' | 'stop' | 'ensure' | 'restart' } }>(
        '/api/resources/action',
        { preHandler: requireRole('owner', 'admin') },
        async (request) => {
            const profile = await getActiveProfile();
            if (!profile) return { success: false, error: 'لا يوجد بروفايل نشط' };

            const { name, action } = request.body;
            const command = `${action} ${name}`;
            const manager = getServerManager(profile);

            if (profile.panelBridgeInstalled) {
                const result = await manager.executeViaBridge(command);
                writeAudit({ userId: getAuthUser(request).sub, action: 'resource.action', details: { name, action: action } });
                return { success: result.success };
            }

            const sent = manager.sendCommand(command);
            writeAudit({ userId: getAuthUser(request).sub, action: 'resource.action', details: { name, action: action } });
            return { success: sent };
        },
    );

    // ═══ Backups ═══

    app.get('/api/backups', async () => {
        const backups = await listBackups();
        return { success: true, data: backups };
    });

    app.post('/api/backups/create', { preHandler: requireRole('owner', 'admin') }, async (request) => {
        const profile = await getActiveProfile();
        if (!profile) return { success: false, error: 'لا يوجد بروفايل نشط' };

        const backup = await createBackup(profile.id, profile.serverDataPath, 'manual', getAuthUser(request).sub);
        return { success: true, data: backup };
    });

    app.post<{ Body: { backupId: string } }>(
        '/api/backups/restore',
        { preHandler: requireRole('owner') },
        async (request) => {
            const profile = await getActiveProfile();
            if (!profile) return { success: false, error: 'لا يوجد بروفايل نشط' };

            const { backupId } = request.body;
            await restoreBackup(backupId, profile.serverDataPath, getAuthUser(request).sub);
            return { success: true };
        },
    );

    app.delete<{ Params: { id: string } }>(
        '/api/backups/:id',
        { preHandler: requireRole('owner', 'admin') },
        async (request) => {
            await deleteBackup(request.params.id, getAuthUser(request).sub);
            return { success: true };
        },
    );

    // ═══ Automation ═══

    app.get('/api/automation/rules', async () => {
        const engine = getAutomationEngine();
        const rules = await engine.getRules();
        return { success: true, data: rules };
    });

    app.post<{ Body: AutomationRule }>(
        '/api/automation/rules',
        { preHandler: requireRole('owner', 'admin') },
        async (request) => {
            const engine = getAutomationEngine();
            const rule = await engine.upsertRule(request.body);
            return { success: true, data: rule };
        },
    );

    app.delete<{ Params: { id: string } }>(
        '/api/automation/rules/:id',
        { preHandler: requireRole('owner', 'admin') },
        async (request) => {
            const engine = getAutomationEngine();
            await engine.deleteRule(request.params.id);
            return { success: true };
        },
    );

    // ═══ Audit Log ═══

    app.get('/api/audit', { preHandler: requireRole('owner') }, async (request) => {
        const query = request.query as { limit?: string };
        const limit = parseInt(query.limit || '200', 10);
        const entries = await readAuditLog(limit);
        return { success: true, data: entries };
    });

    // ═══ Profiles ═══

    app.get('/api/profiles', async () => {
        const store = getStore();
        const data = await store.read(STORAGE_FILES.PROFILES, ProfilesSchema);
        return { success: true, data };
    });

    app.post<{ Body: { profileId: string } }>(
        '/api/profiles/switch',
        { preHandler: requireRole('owner', 'admin') },
        async (request) => {
            const { profileId } = request.body;
            const store = getStore();
            await store.update(STORAGE_FILES.PROFILES, ProfilesSchema, (data) => {
                const exists = data.profiles.find(p => p.id === profileId);
                if (!exists) throw new Error('Profile not found');
                data.activeProfileId = profileId;
                data.updatedAt = new Date().toISOString();
                return data;
            });
            writeAudit({ userId: getAuthUser(request).sub, action: 'profile.switch', details: { profileId } });
            return { success: true };
        },
    );

    // ═══ Ban System ═══

    app.get('/api/bans', async () => {
        const store = getStore();
        try {
            const data = await store.read(STORAGE_FILES.BANS, BansSchema);
            return { success: true, data: data?.bans || [] };
        } catch {
            return { success: true, data: [] };
        }
    });

    app.post<{ Body: { playerName: string; identifiers: string[]; reason: string; duration?: number } }>(
        '/api/bans',
        { preHandler: requireRole('owner', 'admin') },
        async (request) => {
            const { playerName, identifiers, reason, duration } = request.body;
            const user = getAuthUser(request);
            const now = new Date().toISOString();
            const expiresAt = duration ? new Date(Date.now() + duration * 60000).toISOString() : null;

            const ban = { id: randomUUID(), playerName, identifiers, reason, bannedBy: user.username, expiresAt, createdAt: now };

            const store = getStore();
            try {
                await store.update(STORAGE_FILES.BANS, BansSchema, (data) => {
                    data.bans.push(ban);
                    data.updatedAt = now;
                    return data;
                });
            } catch {
                // File doesn't exist yet, create it
                await store.writeAtomic(STORAGE_FILES.BANS, {
                    schemaVersion: 1, bans: [ban], updatedAt: now,
                });
            }

            // Also kick the player if online
            const profile = await getActiveProfile();
            if (profile) {
                const manager = getServerManager(profile);
                manager.sendCommand(`clientkick ${playerName} "${reason}"`);
            }

            writeAudit({ userId: user.sub, action: 'player.ban', details: { playerName, reason, duration } });
            return { success: true, data: ban };
        },
    );

    app.delete<{ Params: { id: string } }>(
        '/api/bans/:id',
        { preHandler: requireRole('owner', 'admin') },
        async (request) => {
            const store = getStore();
            await store.update(STORAGE_FILES.BANS, BansSchema, (data) => {
                data.bans = data.bans.filter(b => b.id !== request.params.id);
                data.updatedAt = new Date().toISOString();
                return data;
            });
            writeAudit({ userId: getAuthUser(request).sub, action: 'player.unban', details: { banId: request.params.id } });
            return { success: true };
        },
    );

    // ═══ Server Config Editor ═══

    app.get('/api/server/config', async () => {
        const profile = await getActiveProfile();
        if (!profile) return { success: false, error: 'No active profile' };

        const cfgPath = join(profile.serverDataPath, 'server.cfg');
        if (!existsSync(cfgPath)) return { success: false, error: 'server.cfg not found' };

        const content = await readFile(cfgPath, 'utf-8');
        return { success: true, data: { content } };
    });

    app.post<{ Body: { content: string } }>(
        '/api/server/config',
        { preHandler: requireRole('owner') },
        async (request) => {
            const profile = await getActiveProfile();
            if (!profile) return { success: false, error: 'No active profile' };

            const cfgPath = join(profile.serverDataPath, 'server.cfg');

            // Create backup before editing
            const backupPath = cfgPath + '.bak.' + Date.now();
            if (existsSync(cfgPath)) {
                const old = await readFile(cfgPath, 'utf-8');
                await writeFile(backupPath, old, 'utf-8');
            }

            await writeFile(cfgPath, request.body.content, 'utf-8');
            writeAudit({ userId: getAuthUser(request).sub, action: 'config.edit' });
            return { success: true };
        },
    );

    // ═══ Discord Webhooks ═══

    app.get('/api/webhooks', { preHandler: requireRole('owner') }, async () => {
        const store = getStore();
        try {
            const data = await store.read(STORAGE_FILES.WEBHOOKS, WebhookConfigSchema);
            return { success: true, data };
        } catch {
            return { success: true, data: { discord: { enabled: false, url: '', events: [] } } };
        }
    });

    app.post<{ Body: { discord: { enabled: boolean; url: string; events: string[] } } }>(
        '/api/webhooks',
        { preHandler: requireRole('owner') },
        async (request) => {
            const now = new Date().toISOString();
            const store = getStore();
            const config = { schemaVersion: 1, discord: request.body.discord, updatedAt: now };
            await store.writeAtomic(STORAGE_FILES.WEBHOOKS, config);
            writeAudit({ userId: getAuthUser(request).sub, action: 'webhooks.update' });
            return { success: true };
        },
    );

    app.post('/api/webhooks/test', { preHandler: requireRole('owner') }, async () => {
        const store = getStore();
        try {
            const data = await store.read(STORAGE_FILES.WEBHOOKS, WebhookConfigSchema);
            if (!data?.discord?.enabled || !data.discord.url) {
                return { success: false, error: 'Discord webhook not configured' };
            }
            await fetch(data.discord.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [{
                        title: '✅ SaifControl Test',
                        description: 'Webhook is working!',
                        color: 0x6366F1,
                        timestamp: new Date().toISOString(),
                    }],
                }),
            });
            return { success: true };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    });

    // ═══ Alerts (Persistent) ═══

    app.get('/api/alerts', async () => {
        const store = getStore();
        try {
            const data = await store.read(STORAGE_FILES.ALERTS, AlertsSchema);
            return { success: true, data: data?.alerts || [] };
        } catch {
            return { success: true, data: [] };
        }
    });

    app.post<{ Body: { id: string } }>(
        '/api/alerts/acknowledge',
        { preHandler: requireRole('owner', 'admin') },
        async (request) => {
            const store = getStore();
            await store.update(STORAGE_FILES.ALERTS, AlertsSchema, (data) => {
                const alert = data.alerts.find(a => a.id === request.body.id);
                if (alert) alert.acknowledged = true;
                data.updatedAt = new Date().toISOString();
                return data;
            });
            return { success: true };
        },
    );

    app.post('/api/alerts/acknowledge-all', { preHandler: requireRole('owner', 'admin') }, async () => {
        const store = getStore();
        try {
            await store.update(STORAGE_FILES.ALERTS, AlertsSchema, (data) => {
                data.alerts.forEach(a => { a.acknowledged = true; });
                data.updatedAt = new Date().toISOString();
                return data;
            });
        } catch { /* no alerts yet */ }
        return { success: true };
    });

    app.delete('/api/alerts/clear', { preHandler: requireRole('owner') }, async () => {
        const store = getStore();
        const now = new Date().toISOString();
        await store.writeAtomic(STORAGE_FILES.ALERTS, { schemaVersion: 1, alerts: [], updatedAt: now });
        return { success: true };
    });

    // ═══ User Management ═══

    app.post<{ Body: { username: string; password: string; role: string } }>(
        '/api/users',
        { preHandler: requireRole('owner') },
        async (request) => {
            const { username, password, role } = request.body;
            if (!['admin', 'viewer'].includes(role)) return { success: false, error: 'Invalid role' };
            const user = await authService.createUser(username, password, role as 'admin' | 'viewer');
            writeAudit({ userId: getAuthUser(request).sub, action: 'user.create', details: { username, role } });
            return { success: true, data: { id: user.id, username: user.username, role: user.role } };
        },
    );

    app.delete<{ Params: { id: string } }>(
        '/api/users/:id',
        { preHandler: requireRole('owner') },
        async (request) => {
            await authService.deleteUser(request.params.id);
            writeAudit({ userId: getAuthUser(request).sub, action: 'user.delete', details: { userId: request.params.id } });
            return { success: true };
        },
    );

    // ═══ 2FA Setup ═══

    app.post('/api/auth/2fa/setup', async (request) => {
        const user = getAuthUser(request);
        const result = await authService.setup2FA(user.sub);
        return { success: true, data: result };
    });

    app.post<{ Body: { secret: string; code: string } }>('/api/auth/2fa/confirm', async (request) => {
        const user = getAuthUser(request);
        const valid = await authService.confirm2FA(user.sub, request.body.secret, request.body.code);
        if (!valid) return { success: false, error: 'Invalid verification code' };
        return { success: true };
    });
}
