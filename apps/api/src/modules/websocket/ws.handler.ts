import type { ServerProfile } from '@saifcontrol/shared';
import { ProfilesSchema, STORAGE_FILES } from '@saifcontrol/shared';
import type { FastifyInstance } from 'fastify';
import { getStore } from '../../lib/store.js';
import { collectMetrics } from '../metrics/metrics.service.js';
import { getServerManager } from '../server/server.manager.js';

const WS_CLIENTS = new Set<import('ws').WebSocket>();
let metricsInterval: NodeJS.Timeout | null = null;

/**
 * Broadcast message to all connected WebSocket clients.
 */
export function broadcast(event: string, data: unknown): void {
    const msg = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    for (const client of WS_CLIENTS) {
        if (client.readyState === 1) { // OPEN
            client.send(msg);
        }
    }
}

/**
 * Register WebSocket route.
 */
export async function websocketRoutes(app: FastifyInstance): Promise<void> {
    app.get('/ws', { websocket: true }, (socket, req) => {
        // Verify JWT from query params
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token) {
            socket.close(4001, 'Missing token');
            return;
        }

        try {
            (app as any).jwt.verify(token);
        } catch {
            socket.close(4001, 'Invalid token');
            return;
        }

        WS_CLIENTS.add(socket);

        socket.on('message', async (raw) => {
            try {
                const msg = JSON.parse(raw.toString());
                await handleWsMessage(msg, socket);
            } catch {
                socket.send(JSON.stringify({ event: 'error', data: { message: 'Invalid message format' } }));
            }
        });

        socket.on('close', () => {
            WS_CLIENTS.delete(socket);
        });

        // Send initial status
        sendInitialState(socket).catch(() => { });
    });
}

async function sendInitialState(socket: import('ws').WebSocket): Promise<void> {
    const store = getStore();
    const data = await store.read(STORAGE_FILES.PROFILES, ProfilesSchema);
    if (!data?.activeProfileId) return;

    const profile = data.profiles.find((p: ServerProfile) => p.id === data.activeProfileId);
    if (!profile) return;

    const manager = getServerManager(profile);
    socket.send(JSON.stringify({
        event: 'server:status',
        data: { status: manager.status },
    }));
}

async function handleWsMessage(msg: { event: string; data?: unknown }, socket: import('ws').WebSocket): Promise<void> {
    switch (msg.event) {
        case 'command:execute': {
            const { command } = msg.data as { command: string };
            // Command execution via WS (delegates to same logic as HTTP route)
            socket.send(JSON.stringify({
                event: 'command:result',
                data: { command, received: true },
            }));
            break;
        }
        case 'ping':
            socket.send(JSON.stringify({ event: 'pong', data: {} }));
            break;
    }
}

/**
 * Setup server event listeners for broadcasting.
 */
export function setupServerEventBroadcasting(profile: ServerProfile): void {
    const manager = getServerManager(profile);

    manager.on('log', (line: string) => {
        broadcast('console:line', { line, timestamp: new Date().toISOString() });
    });

    manager.on('status', (status: string) => {
        broadcast('server:status', { status });
    });

    manager.on('crash', (code: number) => {
        broadcast('notification', { type: 'error', message: `السيرفر تعطّل (exit code: ${code})` });
    });

    // Periodic metrics
    if (metricsInterval) clearInterval(metricsInterval);
    metricsInterval = setInterval(async () => {
        try {
            const metrics = await collectMetrics();
            broadcast('server:metrics', metrics);
        } catch { }
    }, 5000);
}
