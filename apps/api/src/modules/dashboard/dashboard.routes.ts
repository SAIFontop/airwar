import type { AutomationRule, ServerProfile } from '@saifcontrol/shared';
import { AlertsSchema, BansSchema, ProfilesSchema, STORAGE_FILES, WebhookConfigSchema } from '@saifcontrol/shared';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { existsSync } from 'fs';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'fs/promises';
import { basename, join, relative, resolve } from 'path';
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

    // ═══ Web Terminal ═══

    const terminalSessions = new Map<string, import('child_process').ChildProcess>();

    app.post('/api/terminal/create', { preHandler: requireRole('owner') }, async () => {
        const id = randomUUID();
        const shell = spawn('/bin/bash', ['-i'], {
            cwd: process.env.HOME || '/root',
            env: { ...process.env, TERM: 'xterm-256color' },
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        terminalSessions.set(id, shell);
        shell.on('exit', () => terminalSessions.delete(id));
        return { success: true, data: { sessionId: id } };
    });

    app.post<{ Body: { sessionId: string; command: string } }>(
        '/api/terminal/exec',
        { preHandler: requireRole('owner') },
        async (request) => {
            const { sessionId, command } = request.body;
            const shell = terminalSessions.get(sessionId);
            if (!shell?.stdin) return { success: false, error: 'Session not found' };

            return new Promise((res) => {
                let output = '';
                const timeout = setTimeout(() => {
                    res({ success: true, data: { output: output || '(no output)' } });
                }, 8000);

                const onData = (chunk: Buffer) => { output += chunk.toString(); };
                shell.stdout?.on('data', onData);
                shell.stderr?.on('data', onData);

                shell.stdin?.write(command + '\n');

                setTimeout(() => {
                    shell.stdout?.removeListener('data', onData);
                    shell.stderr?.removeListener('data', onData);
                    clearTimeout(timeout);
                    res({ success: true, data: { output } });
                }, 1500);
            });
        },
    );

    app.post<{ Body: { sessionId: string } }>(
        '/api/terminal/kill',
        { preHandler: requireRole('owner') },
        async (request) => {
            const shell = terminalSessions.get(request.body.sessionId);
            if (shell) { shell.kill(); terminalSessions.delete(request.body.sessionId); }
            return { success: true };
        },
    );

    // ═══ File Manager ═══

    function safePath(base: string, requested: string): string | null {
        const full = resolve(base, requested);
        const rel = relative(base, full);
        if (rel.startsWith('..') || resolve(full) !== full) return null;
        return full;
    }

    app.post<{ Body: { path: string } }>(
        '/api/files/list',
        { preHandler: requireRole('owner') },
        async (request) => {
            const profile = await getActiveProfile();
            const basePath = profile?.serverDataPath || (process.env.HOME || '/root');
            const targetPath = request.body.path === '/' ? basePath : safePath(basePath, request.body.path);
            if (!targetPath) return { success: false, error: 'Invalid path' };

            if (!existsSync(targetPath)) return { success: false, error: 'Path not found' };

            const stats = await stat(targetPath);
            if (!stats.isDirectory()) return { success: false, error: 'Not a directory' };

            const entries = await readdir(targetPath, { withFileTypes: true });
            const items = await Promise.all(entries.map(async (e) => {
                const fullPath = join(targetPath, e.name);
                try {
                    const s = await stat(fullPath);
                    return {
                        name: e.name,
                        type: e.isDirectory() ? 'directory' as const : 'file' as const,
                        size: s.size,
                        modified: s.mtime.toISOString(),
                    };
                } catch {
                    return { name: e.name, type: e.isDirectory() ? 'directory' as const : 'file' as const, size: 0, modified: '' };
                }
            }));

            items.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });

            return { success: true, data: { path: request.body.path, basePath, items } };
        },
    );

    app.post<{ Body: { path: string } }>(
        '/api/files/read',
        { preHandler: requireRole('owner') },
        async (request) => {
            const profile = await getActiveProfile();
            const basePath = profile?.serverDataPath || (process.env.HOME || '/root');
            const targetPath = safePath(basePath, request.body.path);
            if (!targetPath) return { success: false, error: 'Invalid path' };
            if (!existsSync(targetPath)) return { success: false, error: 'File not found' };

            const s = await stat(targetPath);
            if (s.size > 2 * 1024 * 1024) return { success: false, error: 'File too large (max 2MB)' };

            const content = await readFile(targetPath, 'utf-8');
            return { success: true, data: { content, size: s.size } };
        },
    );

    app.post<{ Body: { path: string; content: string } }>(
        '/api/files/write',
        { preHandler: requireRole('owner') },
        async (request) => {
            const profile = await getActiveProfile();
            const basePath = profile?.serverDataPath || (process.env.HOME || '/root');
            const targetPath = safePath(basePath, request.body.path);
            if (!targetPath) return { success: false, error: 'Invalid path' };

            const dir = join(targetPath, '..');
            if (!existsSync(dir)) await mkdir(dir, { recursive: true });

            await writeFile(targetPath, request.body.content, 'utf-8');
            writeAudit({ userId: getAuthUser(request).sub, action: 'file.write', details: { path: request.body.path } });
            return { success: true };
        },
    );

    app.post<{ Body: { path: string } }>(
        '/api/files/mkdir',
        { preHandler: requireRole('owner') },
        async (request) => {
            const profile = await getActiveProfile();
            const basePath = profile?.serverDataPath || (process.env.HOME || '/root');
            const targetPath = safePath(basePath, request.body.path);
            if (!targetPath) return { success: false, error: 'Invalid path' };
            await mkdir(targetPath, { recursive: true });
            return { success: true };
        },
    );

    app.post<{ Body: { path: string } }>(
        '/api/files/delete',
        { preHandler: requireRole('owner') },
        async (request) => {
            const profile = await getActiveProfile();
            const basePath = profile?.serverDataPath || (process.env.HOME || '/root');
            const targetPath = safePath(basePath, request.body.path);
            if (!targetPath) return { success: false, error: 'Invalid path' };
            if (!existsSync(targetPath)) return { success: false, error: 'Not found' };

            await rm(targetPath, { recursive: true });
            writeAudit({ userId: getAuthUser(request).sub, action: 'file.delete', details: { path: request.body.path } });
            return { success: true };
        },
    );

    // ═══ Scheduled Tasks ═══

    const scheduledJobs = new Map<string, NodeJS.Timeout>();

    app.get('/api/scheduler/tasks', async () => {
        const store = getStore();
        try {
            const raw = await readFile(store.getFilePath('scheduler.json'), 'utf-8');
            return { success: true, data: JSON.parse(raw).tasks || [] };
        } catch {
            return { success: true, data: [] };
        }
    });

    app.post<{ Body: { name: string; type: 'restart' | 'backup' | 'command' | 'message'; schedule: string; command?: string; enabled: boolean } }>(
        '/api/scheduler/tasks',
        { preHandler: requireRole('owner') },
        async (request) => {
            const { name, type, schedule, command, enabled } = request.body;
            const task = { id: randomUUID(), name, type, schedule, command: command || '', enabled, createdAt: new Date().toISOString() };

            const store = getStore();
            const filePath = store.getFilePath('scheduler.json');
            let tasks: any[] = [];
            try { tasks = JSON.parse(await readFile(filePath, 'utf-8')).tasks || []; } catch { /* empty */ }
            tasks.push(task);
            await store.writeAtomic('scheduler.json', { tasks });

            writeAudit({ userId: getAuthUser(request).sub, action: 'scheduler.create', details: { name, type } });
            return { success: true, data: task };
        },
    );

    app.delete<{ Params: { id: string } }>(
        '/api/scheduler/tasks/:id',
        { preHandler: requireRole('owner') },
        async (request) => {
            const store = getStore();
            const filePath = store.getFilePath('scheduler.json');
            let tasks: any[] = [];
            try { tasks = JSON.parse(await readFile(filePath, 'utf-8')).tasks || []; } catch { /* empty */ }
            tasks = tasks.filter(t => t.id !== request.params.id);
            await store.writeAtomic('scheduler.json', { tasks });

            // Clear interval if running
            const interval = scheduledJobs.get(request.params.id);
            if (interval) { clearInterval(interval); scheduledJobs.delete(request.params.id); }

            writeAudit({ userId: getAuthUser(request).sub, action: 'scheduler.delete', details: { taskId: request.params.id } });
            return { success: true };
        },
    );

    app.post<{ Body: { id: string; enabled: boolean } }>(
        '/api/scheduler/tasks/toggle',
        { preHandler: requireRole('owner') },
        async (request) => {
            const store = getStore();
            const filePath = store.getFilePath('scheduler.json');
            let tasks: any[] = [];
            try { tasks = JSON.parse(await readFile(filePath, 'utf-8')).tasks || []; } catch { /* empty */ }
            const task = tasks.find(t => t.id === request.body.id);
            if (!task) return { success: false, error: 'Task not found' };
            task.enabled = request.body.enabled;
            await store.writeAtomic('scheduler.json', { tasks });
            return { success: true };
        },
    );

    // ═══ Quick Resource Installer ═══

    app.post<{ Body: { repoUrl: string; resourceName?: string } }>(
        '/api/resources/install',
        { preHandler: requireRole('owner') },
        async (request) => {
            const profile = await getActiveProfile();
            if (!profile) return { success: false, error: 'No active profile' };

            const { repoUrl, resourceName } = request.body;
            // Validate URL format
            if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+/.test(repoUrl)) {
                return { success: false, error: 'Invalid GitHub URL' };
            }

            const name = resourceName || basename(repoUrl.replace(/\.git$/, ''));
            const targetDir = join(profile.serverDataPath, 'resources', name);

            if (existsSync(targetDir)) {
                return { success: false, error: `Resource "${name}" already exists` };
            }

            return new Promise((res) => {
                const git = spawn('git', ['clone', '--depth', '1', repoUrl, targetDir]);
                let output = '';
                git.stdout?.on('data', (d: Buffer) => { output += d.toString(); });
                git.stderr?.on('data', (d: Buffer) => { output += d.toString(); });
                git.on('close', (code) => {
                    if (code === 0) {
                        writeAudit({ userId: getAuthUser(request).sub, action: 'resource.install', details: { repoUrl, name } });
                        res({ success: true, data: { name, path: targetDir, output } });
                    } else {
                        res({ success: false, error: `Git clone failed: ${output}` });
                    }
                });
            });
        },
    );

    // ═══ Crash Detection & Health ═══

    app.get('/api/server/health', async () => {
        const profile = await getActiveProfile();
        if (!profile) return { success: true, data: { healthy: false, reason: 'No active profile' } };

        const manager = getServerManager(profile);
        const info = await manager.getServerInfo();
        const isResponding = info !== null;

        return {
            success: true,
            data: {
                healthy: manager.status === 'running' && isResponding,
                status: manager.status,
                responding: isResponding,
                serverInfo: info,
            },
        };
    });

    app.post('/api/server/auto-restart/toggle', { preHandler: requireRole('owner') }, async (request) => {
        const { enabled } = request.body as { enabled: boolean };
        const store = getStore();
        await store.writeAtomic('auto-restart.json', { enabled, updatedAt: new Date().toISOString() });
        writeAudit({ userId: getAuthUser(request).sub, action: 'auto-restart.toggle', details: { enabled } });
        return { success: true };
    });

    app.get('/api/server/auto-restart', async () => {
        const store = getStore();
        try {
            const raw = await readFile(store.getFilePath('auto-restart.json'), 'utf-8');
            return { success: true, data: JSON.parse(raw) };
        } catch {
            return { success: true, data: { enabled: false } };
        }
    });

    // ═══ Pinggy Tunnel (TCP for FiveM) ═══

    let pinggyProcess: import('child_process').ChildProcess | null = null;
    let pinggyUrl = '';

    app.post<{ Body: { port?: number; token?: string } }>(
        '/api/tunnel/start',
        { preHandler: requireRole('owner') },
        async (request) => {
            if (pinggyProcess) return { success: false, error: 'Tunnel already running' };

            const port = request.body.port || 30120;
            const token = request.body.token || '';

            return new Promise((res) => {
                const host = token ? 'pro.pinggy.io' : 'a.pinggy.io';
                const user = token ? `${token}+tcp` : 'tcp';
                const args = [
                    '-p', '443',
                    `-R0:127.0.0.1:${port}`,
                    '-o', 'StrictHostKeyChecking=no',
                    '-o', 'ServerAliveInterval=30',
                    `${user}@${host}`,
                ];

                try {
                    pinggyProcess = spawn('ssh', args, {
                        stdio: ['pipe', 'pipe', 'pipe'],
                        env: { ...process.env },
                    });
                } catch (e: any) {
                    res({ success: false, error: `Failed to spawn ssh: ${e.message}` });
                    return;
                }

                let output = '';
                let resolved = false;

                pinggyProcess.on('error', (err) => {
                    pinggyProcess = null;
                    pinggyUrl = '';
                    if (!resolved) {
                        resolved = true;
                        res({ success: false, error: `SSH error: ${err.message}` });
                    }
                });

                const onData = (data: Buffer) => {
                    output += data.toString();
                    const urlMatch = output.match(/((?:tcp|https?):\/\/[^\s]+)/);
                    if (urlMatch && !resolved) {
                        resolved = true;
                        pinggyUrl = urlMatch[1];
                        res({ success: true, data: { url: pinggyUrl, port } });
                    }
                };

                pinggyProcess.stdout?.on('data', onData);
                pinggyProcess.stderr?.on('data', onData);

                pinggyProcess.on('exit', () => {
                    pinggyProcess = null;
                    pinggyUrl = '';
                    if (!resolved) {
                        resolved = true;
                        res({ success: false, error: `Tunnel exited: ${output.slice(-500)}` });
                    }
                });

                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        if (output.includes('://')) {
                            const m = output.match(/((?:tcp|https?):\/\/[^\s]+)/);
                            if (m) pinggyUrl = m[1];
                        }
                        res({ success: true, data: { url: pinggyUrl || 'connecting...', port, output: output.slice(-500) } });
                    }
                }, 20000);
            });
        },
    );

    app.post('/api/tunnel/stop', { preHandler: requireRole('owner') }, async () => {
        if (pinggyProcess) {
            pinggyProcess.kill();
            pinggyProcess = null;
            pinggyUrl = '';
        }
        return { success: true };
    });

    app.get('/api/tunnel/status', async () => {
        return {
            success: true,
            data: {
                active: pinggyProcess !== null,
                url: pinggyUrl,
            },
        };
    });

    // ═══ Panel Tunnel (HTTPS for web panel access) ═══

    let panelTunnelProcess: import('child_process').ChildProcess | null = null;
    let panelTunnelUrl = '';

    app.post<{ Body: { token?: string } }>(
        '/api/tunnel/panel/start',
        { preHandler: requireRole('owner') },
        async (request) => {
            if (panelTunnelProcess) return { success: false, error: 'Panel tunnel already running' };

            const token = request.body.token || '';
            const port = 3000; // Next.js web panel port

            return new Promise((res) => {
                const host = token ? 'pro.pinggy.io' : 'a.pinggy.io';
                // No protocol suffix = HTTPS tunnel
                const user = token || '';
                const args = [
                    '-p', '443',
                    `-R0:localhost:${port}`,
                    '-o', 'StrictHostKeyChecking=no',
                    '-o', 'ServerAliveInterval=30',
                    ...(user ? [`${user}@${host}`] : [host]),
                ];

                try {
                    panelTunnelProcess = spawn('ssh', args, {
                        stdio: ['pipe', 'pipe', 'pipe'],
                        env: { ...process.env },
                    });
                } catch (e: any) {
                    res({ success: false, error: `Failed to spawn ssh: ${e.message}` });
                    return;
                }

                let output = '';
                let resolved = false;

                panelTunnelProcess.on('error', (err) => {
                    panelTunnelProcess = null;
                    panelTunnelUrl = '';
                    if (!resolved) {
                        resolved = true;
                        res({ success: false, error: `SSH error: ${err.message}` });
                    }
                });

                const onData = (data: Buffer) => {
                    output += data.toString();
                    const urlMatch = output.match(/(https?:\/\/[^\s]+)/);
                    if (urlMatch && !resolved) {
                        resolved = true;
                        panelTunnelUrl = urlMatch[1];
                        res({ success: true, data: { url: panelTunnelUrl } });
                    }
                };

                panelTunnelProcess.stdout?.on('data', onData);
                panelTunnelProcess.stderr?.on('data', onData);

                panelTunnelProcess.on('exit', () => {
                    panelTunnelProcess = null;
                    panelTunnelUrl = '';
                    if (!resolved) {
                        resolved = true;
                        res({ success: false, error: `Panel tunnel exited: ${output.slice(-500)}` });
                    }
                });

                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        const m = output.match(/(https?:\/\/[^\s]+)/);
                        if (m) panelTunnelUrl = m[1];
                        res({ success: true, data: { url: panelTunnelUrl || 'connecting...', output: output.slice(-500) } });
                    }
                }, 20000);
            });
        },
    );

    app.post('/api/tunnel/panel/stop', { preHandler: requireRole('owner') }, async () => {
        if (panelTunnelProcess) {
            panelTunnelProcess.kill();
            panelTunnelProcess = null;
            panelTunnelUrl = '';
        }
        return { success: true };
    });

    app.get('/api/tunnel/panel/status', async () => {
        return {
            success: true,
            data: {
                active: panelTunnelProcess !== null,
                url: panelTunnelUrl,
            },
        };
    });

    // ═══ Server Logs (History) ═══

    app.get('/api/server/logs', async () => {
        const profile = await getActiveProfile();
        if (!profile) return { success: true, data: { lines: [] } };

        const manager = getServerManager(profile);
        return { success: true, data: { lines: manager.getLogBuffer() } };
    });
}
