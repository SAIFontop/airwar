import type { AutomationRule, ServerProfile } from '@saifcontrol/shared';
import { ProfilesSchema, STORAGE_FILES } from '@saifcontrol/shared';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
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
}
