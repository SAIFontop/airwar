import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { ProfilesSchema, SecretsSchema, STORAGE_FILES } from '@saifcontrol/shared';
import Fastify from 'fastify';
import { generateToken } from './lib/crypto.js';
import { getState, initializeStorage } from './lib/data.js';
import { initStore } from './lib/store.js';
import { getAutomationEngine } from './modules/automation/automation.engine.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { getPluginManager } from './modules/plugins/plugin.manager.js';
import { pluginRoutes } from './modules/plugins/plugin.routes.js';
import { setupWizardRoutes } from './modules/setup/setup.routes.js';
import { setupServerEventBroadcasting, websocketRoutes } from './modules/websocket/ws.handler.js';

const API_PORT = parseInt(process.env.SAIFCONTROL_API_PORT || '4800', 10);
const API_HOST = process.env.SAIFCONTROL_API_HOST || '0.0.0.0';

async function main() {
    // Initialize storage
    const store = initStore(process.env.SAIFCONTROL_DATA_DIR);
    await initializeStorage();

    // Get or create JWT secret
    let jwtSecret: string;
    const secrets = await store.read(STORAGE_FILES.SECRETS, SecretsSchema);
    if (secrets?.jwtSecret) {
        jwtSecret = secrets.jwtSecret;
    } else {
        jwtSecret = generateToken(64);
        await store.writeAtomic(STORAGE_FILES.SECRETS, {
            schemaVersion: 1,
            jwtSecret,
            masterKeySalt: '',
            panelBridgeTokens: {},
            updatedAt: new Date().toISOString(),
        });
    }

    // Create Fastify instance
    const app = Fastify({
        logger: {
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV !== 'production'
                ? { target: 'pino-pretty', options: { colorize: true } }
                : undefined,
        },
    });

    // ─── Plugins ───
    await app.register(helmet, {
        contentSecurityPolicy: false, // Handled by frontend
    });

    await app.register(cors, {
        origin: process.env.SAIFCONTROL_CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    });

    await app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
    });

    await app.register(jwt, {
        secret: jwtSecret,
    });

    await app.register(websocket);

    // ─── Login route (before auth middleware) ───
    app.post('/api/auth/login', async (request, reply) => {
        const body = request.body as { username: string; password: string; totpCode?: string };
        const { login } = await import('./modules/auth/auth.service.js');

        try {
            const result = await login(
                body,
                request.ip,
                request.headers['user-agent'] || '',
                (payload, opts) => app.jwt.sign(payload as any, opts),
            );
            return { success: true, data: result };
        } catch (err) {
            reply.code(401);
            return { success: false, error: err instanceof Error ? err.message : 'Authentication failed' };
        }
    });

    // ─── Health endpoints ───
    app.get('/healthz', async () => ({ status: 'ok' }));
    app.get('/readyz', async () => {
        const state = await getState();
        return { status: 'ok', setupCompleted: state.setupCompleted };
    });

    // ─── Prometheus-style metrics ───
    app.get('/metrics', async (request, reply) => {
        const { collectMetrics } = await import('./modules/metrics/metrics.service.js');
        const m = await collectMetrics();
        const lines = [
            `# HELP saifcontrol_cpu_percent CPU usage percentage`,
            `# TYPE saifcontrol_cpu_percent gauge`,
            `saifcontrol_cpu_percent ${m.cpuPercent}`,
            `# HELP saifcontrol_memory_used_mb Memory used in MB`,
            `# TYPE saifcontrol_memory_used_mb gauge`,
            `saifcontrol_memory_used_mb ${m.memoryUsedMb}`,
            `# HELP saifcontrol_memory_total_mb Total memory in MB`,
            `# TYPE saifcontrol_memory_total_mb gauge`,
            `saifcontrol_memory_total_mb ${m.memoryTotalMb}`,
            `# HELP saifcontrol_disk_used_gb Disk used in GB`,
            `# TYPE saifcontrol_disk_used_gb gauge`,
            `saifcontrol_disk_used_gb ${m.diskUsedGb}`,
            `# HELP saifcontrol_uptime_seconds System uptime`,
            `# TYPE saifcontrol_uptime_seconds gauge`,
            `saifcontrol_uptime_seconds ${m.uptime}`,
        ];
        reply.type('text/plain').send(lines.join('\n') + '\n');
    });

    // ─── Register route groups ───
    await setupWizardRoutes(app);

    // Dashboard routes (authenticated)
    await app.register(async (dashApp) => {
        await dashboardRoutes(dashApp);
    });

    // WebSocket
    await websocketRoutes(app);

    // Plugin system
    await app.register(async (pluginApp) => {
        await pluginRoutes(pluginApp);
    });
    const pm = getPluginManager();
    await pm.discoverPlugins();

    // ─── Auto-start server manager if setup complete ───
    const state = await getState();
    if (state.setupCompleted) {
        const profiles = await store.read(STORAGE_FILES.PROFILES, ProfilesSchema);
        if (profiles?.activeProfileId) {
            const profile = profiles.profiles.find((p: any) => p.id === profiles.activeProfileId);
            if (profile) {
                setupServerEventBroadcasting(profile);
                const engine = getAutomationEngine();
                await engine.start(profile);
                app.log.info(`Active profile loaded: ${profile.name}`);
            }
        }
    }

    // ─── Start server ───
    try {
        await app.listen({ port: API_PORT, host: API_HOST });
        app.log.info(`🚀 SaifControl API running on http://${API_HOST}:${API_PORT}`);
        app.log.info(`Setup completed: ${state.setupCompleted}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

main().catch(console.error);
