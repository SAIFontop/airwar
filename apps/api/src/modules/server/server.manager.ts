import type { FxServerInfo, ServerProfile, ServerStatus } from '@saifcontrol/shared';
import { ChildProcess, exec, spawn } from 'child_process';
import { EventEmitter } from 'events';
import { existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Manages a single FXServer instance.
 * Supports two modes:
 *   - 'process': spawn child process directly
 *   - 'systemd': control via systemctl
 */
export class ServerManager extends EventEmitter {
    private process: ChildProcess | null = null;
    private _status: ServerStatus = 'unknown';
    private logBuffer: string[] = [];
    private maxLogLines = 5000;
    private profile: ServerProfile;

    constructor(profile: ServerProfile) {
        super();
        this.profile = profile;
    }

    get status(): ServerStatus {
        return this._status;
    }

    private setStatus(status: ServerStatus) {
        this._status = status;
        this.emit('status', status);
    }

    /** Start server based on management mode */
    async start(): Promise<void> {
        if (this._status === 'running' || this._status === 'starting') {
            throw new Error('السيرفر يعمل بالفعل أو في طور التشغيل');
        }

        if (this.profile.managementMode === 'systemd') {
            await this.startSystemd();
        } else {
            await this.startProcess();
        }
    }

    /** Stop server */
    async stop(): Promise<void> {
        if (this._status === 'stopped' || this._status === 'stopping') {
            throw new Error('السيرفر متوقف بالفعل');
        }

        if (this.profile.managementMode === 'systemd') {
            await this.stopSystemd();
        } else {
            await this.stopProcess();
        }
    }

    /** Restart server */
    async restart(): Promise<void> {
        if (this.profile.managementMode === 'systemd') {
            await this.restartSystemd();
        } else {
            await this.stop();
            // Wait a bit for clean shutdown
            await new Promise((r) => setTimeout(r, 2000));
            await this.start();
        }
    }

    /** Send command to server console (process mode) */
    sendCommand(command: string): boolean {
        if (this.profile.managementMode !== 'process' || !this.process?.stdin) {
            return false;
        }
        this.process.stdin.write(command + '\n');
        this.emit('command', command);
        return true;
    }

    /** Get recent log lines */
    getLogBuffer(): string[] {
        return [...this.logBuffer];
    }

    /** Get server info via documented /info.json endpoint */
    async getServerInfo(): Promise<FxServerInfo | null> {
        const port = this.profile.port || 30120;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(`http://127.0.0.1:${port}/info.json`, {
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!res.ok) {
                // sv_requestParanoia may return "Nope." 
                if (res.status === 403) {
                    this.emit('log', '[Panel] info.json blocked — sv_requestParanoia may be active');
                    return null;
                }
                return null;
            }

            const data = await res.json() as FxServerInfo;
            return data;
        } catch {
            return null;
        }
    }

    /** Get players via panel_bridge (if installed) */
    async getPlayersViaBridge(): Promise<unknown[] | null> {
        if (!this.profile.panelBridgeInstalled || !this.profile.panelBridgeToken) {
            return null;
        }

        const port = this.profile.port || 30120;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(`http://127.0.0.1:${port}/panel_bridge/players`, {
                headers: { Authorization: `Bearer ${this.profile.panelBridgeToken}` },
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!res.ok) return null;
            return await res.json() as unknown[];
        } catch {
            return null;
        }
    }

    /** Execute server command via panel_bridge */
    async executeViaBridge(command: string): Promise<{ success: boolean; output?: string }> {
        if (!this.profile.panelBridgeInstalled || !this.profile.panelBridgeToken) {
            return { success: false, output: 'panel_bridge not installed' };
        }

        const port = this.profile.port || 30120;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            const res = await fetch(`http://127.0.0.1:${port}/panel_bridge/command`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.profile.panelBridgeToken}`,
                },
                body: JSON.stringify({ command }),
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!res.ok) return { success: false, output: `HTTP ${res.status}` };
            const data = await res.json() as { success: boolean; output?: string };
            return data;
        } catch (err) {
            return { success: false, output: String(err) };
        }
    }

    // ─── Process Mode ───

    private findRunSh(): string {
        // Check configured binaries path first
        if (this.profile.fxServerBinariesPath) {
            const direct = join(this.profile.fxServerBinariesPath, 'run.sh');
            if (existsSync(direct)) return direct;
        }

        // Search upward from serverDataPath for run.sh
        let dir = this.profile.serverDataPath;
        for (let i = 0; i < 5; i++) {
            const candidate = join(dir, 'run.sh');
            if (existsSync(candidate)) return candidate;
            const parent = join(dir, '..');
            if (parent === dir) break;
            dir = parent;
        }

        throw new Error(
            `run.sh not found. Checked: ${this.profile.fxServerBinariesPath}/run.sh and parent directories of ${this.profile.serverDataPath}`,
        );
    }

    private async startProcess(): Promise<void> {
        const runShPath = this.findRunSh();

        this.setStatus('starting');

        this.process = spawn('bash', [runShPath, '+exec', 'server.cfg'], {
            cwd: this.profile.serverDataPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env },
        });

        this.process.stdout?.on('data', (data: Buffer) => {
            const lines = data.toString().split('\n').filter(Boolean);
            for (const line of lines) {
                this.addLogLine(line);
            }
        });

        this.process.stderr?.on('data', (data: Buffer) => {
            const lines = data.toString().split('\n').filter(Boolean);
            for (const line of lines) {
                this.addLogLine(`[stderr] ${line}`);
            }
        });

        this.process.on('close', (code) => {
            this.process = null;
            if (code === 0 || this._status === 'stopping') {
                this.setStatus('stopped');
            } else {
                this.setStatus('crashed');
                this.emit('crash', code);
            }
        });

        this.process.on('error', (err) => {
            this.addLogLine(`[error] ${err.message}`);
            this.setStatus('crashed');
        });

        // Wait a bit, then check if still running
        await new Promise((r) => setTimeout(r, 3000));
        if (this.process && !this.process.killed) {
            this.setStatus('running');
        }
    }

    private async stopProcess(): Promise<void> {
        if (!this.process) {
            this.setStatus('stopped');
            return;
        }

        this.setStatus('stopping');

        // Try graceful quit command first
        this.sendCommand('quit');

        // Wait for graceful shutdown
        const gracefulTimeout = new Promise<boolean>((resolve) => {
            const checkInterval = setInterval(() => {
                if (!this.process || this.process.killed) {
                    clearInterval(checkInterval);
                    resolve(true);
                }
            }, 500);

            setTimeout(() => {
                clearInterval(checkInterval);
                resolve(false);
            }, 10000);
        });

        const graceful = await gracefulTimeout;

        if (!graceful && this.process) {
            // Send SIGTERM
            this.process.kill('SIGTERM');

            await new Promise((r) => setTimeout(r, 5000));

            if (this.process && !this.process.killed) {
                // Force kill
                this.process.kill('SIGKILL');
            }
        }

        this.process = null;
        this.setStatus('stopped');
    }

    // ─── Systemd Mode ───

    private async startSystemd(): Promise<void> {
        const unit = this.profile.systemdUnit;
        if (!unit) throw new Error('Systemd unit not configured');

        this.setStatus('starting');
        try {
            await execAsync(`systemctl start ${unit}`);
            await new Promise((r) => setTimeout(r, 3000));
            const running = await this.checkSystemdStatus();
            this.setStatus(running ? 'running' : 'crashed');
        } catch (err) {
            this.setStatus('crashed');
            throw err;
        }
    }

    private async stopSystemd(): Promise<void> {
        const unit = this.profile.systemdUnit;
        if (!unit) throw new Error('Systemd unit not configured');

        this.setStatus('stopping');
        try {
            await execAsync(`systemctl stop ${unit}`);
            this.setStatus('stopped');
        } catch (err) {
            throw err;
        }
    }

    private async restartSystemd(): Promise<void> {
        const unit = this.profile.systemdUnit;
        if (!unit) throw new Error('Systemd unit not configured');

        this.setStatus('stopping');
        try {
            await execAsync(`systemctl restart ${unit}`);
            await new Promise((r) => setTimeout(r, 3000));
            const running = await this.checkSystemdStatus();
            this.setStatus(running ? 'running' : 'crashed');
        } catch (err) {
            this.setStatus('crashed');
            throw err;
        }
    }

    private async checkSystemdStatus(): Promise<boolean> {
        const unit = this.profile.systemdUnit;
        if (!unit) return false;

        try {
            const { stdout } = await execAsync(`systemctl is-active ${unit} 2>/dev/null`);
            return stdout.trim() === 'active';
        } catch {
            return false;
        }
    }

    /** Read systemd journal logs */
    async getSystemdLogs(lines = 200): Promise<string[]> {
        const unit = this.profile.systemdUnit;
        if (!unit) return [];

        try {
            const { stdout } = await execAsync(`journalctl -u ${unit} -n ${lines} --no-pager 2>/dev/null`);
            return stdout.split('\n').filter(Boolean);
        } catch {
            return [];
        }
    }

    private addLogLine(line: string) {
        this.logBuffer.push(line);
        if (this.logBuffer.length > this.maxLogLines) {
            this.logBuffer.shift();
        }
        this.emit('log', line);
    }

    /** Cleanup */
    destroy(): void {
        if (this.process && !this.process.killed) {
            this.process.kill('SIGTERM');
        }
        this.removeAllListeners();
    }
}

/** Map of active server managers keyed by profile ID */
const managers = new Map<string, ServerManager>();

export function getServerManager(profile: ServerProfile): ServerManager {
    let manager = managers.get(profile.id);
    if (!manager) {
        manager = new ServerManager(profile);
        managers.set(profile.id, manager);
    }
    return manager;
}

export function removeServerManager(profileId: string): void {
    const manager = managers.get(profileId);
    if (manager) {
        manager.destroy();
        managers.delete(profileId);
    }
}
