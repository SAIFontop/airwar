import { expandHome } from '@saifcontrol/shared';
import { ChildProcess, fork } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

// ─── Plugin manifest schema ───

export interface PluginManifest {
    name: string;
    version: string;
    description?: string;
    author?: string;
    main: string;
    trusted?: boolean;
    permissions?: string[];
    hooks?: string[];
}

export interface PluginInfo {
    id: string;
    manifest: PluginManifest;
    status: 'loaded' | 'running' | 'stopped' | 'error';
    error?: string;
    loadedAt?: string;
}

// ─── Plugin Manager ───

const PLUGINS_DIR = path.join(expandHome('~/.saifcontrol'), 'plugins');

export class PluginManager extends EventEmitter {
    private plugins = new Map<string, PluginInfo>();
    private processes = new Map<string, ChildProcess>();

    async init(): Promise<void> {
        await fs.mkdir(PLUGINS_DIR, { recursive: true });
    }

    async discoverPlugins(): Promise<PluginInfo[]> {
        await this.init();
        const entries = await fs.readdir(PLUGINS_DIR, { withFileTypes: true });
        const results: PluginInfo[] = [];

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const pluginDir = path.join(PLUGINS_DIR, entry.name);
            const manifestPath = path.join(pluginDir, 'manifest.json');

            try {
                const raw = await fs.readFile(manifestPath, 'utf-8');
                const manifest = JSON.parse(raw) as PluginManifest;

                if (!manifest.name || !manifest.version || !manifest.main) {
                    continue;
                }

                // Security: main file must be inside plugin directory
                const mainPath = path.resolve(pluginDir, manifest.main);
                if (!mainPath.startsWith(pluginDir)) {
                    continue; // path traversal attempt
                }

                const info: PluginInfo = {
                    id: entry.name,
                    manifest,
                    status: 'loaded',
                    loadedAt: new Date().toISOString(),
                };

                this.plugins.set(entry.name, info);
                results.push(info);
            } catch {
                // skip invalid plugins
            }
        }

        return results;
    }

    async startPlugin(id: string): Promise<void> {
        const info = this.plugins.get(id);
        if (!info) throw new Error(`Plugin ${id} not found`);

        const pluginDir = path.join(PLUGINS_DIR, id);
        const mainPath = path.resolve(pluginDir, info.manifest.main);

        // Verify the main file is within the plugin directory
        if (!mainPath.startsWith(pluginDir)) {
            throw new Error('Invalid plugin main path');
        }

        try {
            await fs.access(mainPath);
        } catch {
            throw new Error(`Plugin entry point not found: ${info.manifest.main}`);
        }

        // Untrusted plugins run in sandboxed child process
        if (!info.manifest.trusted) {
            const child = fork(mainPath, [], {
                cwd: pluginDir,
                stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                env: {
                    PLUGIN_ID: id,
                    PLUGIN_NAME: info.manifest.name,
                    NODE_ENV: 'production',
                },
            });

            child.on('message', (msg: unknown) => {
                this.emit('plugin:message', { pluginId: id, message: msg });
            });

            child.on('exit', (code) => {
                this.processes.delete(id);
                info.status = code === 0 ? 'stopped' : 'error';
                if (code !== 0) info.error = `Exited with code ${code}`;
                this.emit('plugin:exit', { pluginId: id, code });
            });

            child.on('error', (err) => {
                info.status = 'error';
                info.error = err.message;
                this.emit('plugin:error', { pluginId: id, error: err.message });
            });

            this.processes.set(id, child);
            info.status = 'running';
        } else {
            // Trusted plugins: direct require (same process)
            try {
                require(mainPath);
                info.status = 'running';
            } catch (e: unknown) {
                info.status = 'error';
                info.error = e instanceof Error ? e.message : 'Unknown error';
                throw e;
            }
        }

        this.emit('plugin:started', { pluginId: id });
    }

    async stopPlugin(id: string): Promise<void> {
        const info = this.plugins.get(id);
        if (!info) return;

        const child = this.processes.get(id);
        if (child) {
            child.kill('SIGTERM');
            // Grace period then force kill
            setTimeout(() => {
                if (!child.killed) child.kill('SIGKILL');
            }, 5000);
            this.processes.delete(id);
        }

        info.status = 'stopped';
        this.emit('plugin:stopped', { pluginId: id });
    }

    sendMessage(pluginId: string, message: unknown): void {
        const child = this.processes.get(pluginId);
        if (child && child.connected) {
            child.send(message as never);
        }
    }

    listPlugins(): PluginInfo[] {
        return Array.from(this.plugins.values());
    }

    getPlugin(id: string): PluginInfo | undefined {
        return this.plugins.get(id);
    }

    async shutdown(): Promise<void> {
        for (const id of this.processes.keys()) {
            await this.stopPlugin(id);
        }
    }
}

// Singleton
let pluginManager: PluginManager | null = null;

export function getPluginManager(): PluginManager {
    if (!pluginManager) {
        pluginManager = new PluginManager();
    }
    return pluginManager;
}
