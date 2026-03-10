import { FastifyInstance } from 'fastify';
import { getPluginManager } from './plugin.manager.js';

export async function pluginRoutes(app: FastifyInstance): Promise<void> {
    const pm = getPluginManager();

    // List all discovered plugins
    app.get('/plugins', async () => {
        return { ok: true, data: pm.listPlugins() };
    });

    // Discover / refresh plugins from disk
    app.post('/plugins/discover', async () => {
        const plugins = await pm.discoverPlugins();
        return { ok: true, data: plugins };
    });

    // Get single plugin info
    app.get<{ Params: { id: string } }>('/plugins/:id', async (req, reply) => {
        const info = pm.getPlugin(req.params.id);
        if (!info) return reply.code(404).send({ ok: false, error: 'Plugin not found' });
        return { ok: true, data: info };
    });

    // Start a plugin
    app.post<{ Params: { id: string } }>('/plugins/:id/start', async (req, reply) => {
        try {
            await pm.startPlugin(req.params.id);
            return { ok: true };
        } catch (e: unknown) {
            return reply.code(400).send({ ok: false, error: e instanceof Error ? e.message : 'Failed' });
        }
    });

    // Stop a plugin
    app.post<{ Params: { id: string } }>('/plugins/:id/stop', async (req, reply) => {
        try {
            await pm.stopPlugin(req.params.id);
            return { ok: true };
        } catch (e: unknown) {
            return reply.code(400).send({ ok: false, error: e instanceof Error ? e.message : 'Failed' });
        }
    });

    // Send IPC message to a running (sandboxed) plugin
    app.post<{ Params: { id: string }; Body: { message: unknown } }>(
        '/plugins/:id/message',
        async (req, reply) => {
            const info = pm.getPlugin(req.params.id);
            if (!info) return reply.code(404).send({ ok: false, error: 'Plugin not found' });
            if (info.status !== 'running') return reply.code(400).send({ ok: false, error: 'Plugin not running' });
            pm.sendMessage(req.params.id, req.body.message);
            return { ok: true };
        }
    );
}
