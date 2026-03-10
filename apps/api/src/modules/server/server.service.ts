import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChildProcess, spawn } from 'child_process';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

interface RunningServer {
    process: ChildProcess;
    startTime: number;
    consoleBuffer: string[];
}

@Injectable()
export class ServerService {
    private readonly logger = new Logger(ServerService.name);
    private runningServers = new Map<string, RunningServer>();

    constructor(
        private prisma: PrismaService,
        private redis: RedisService,
        private events: EventEmitter2,
    ) { }

    async getAllServers() {
        const servers = await this.prisma.server.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return Promise.all(
            servers.map(async (server: any) => {
                const metrics = await this.redis.hgetall(`server:${server.id}:metrics`);
                return {
                    ...server,
                    playersOnline: parseInt(metrics.playerCount || '0', 10),
                    cpu: parseFloat(metrics.cpu || '0'),
                    memory: parseFloat(metrics.memory || '0'),
                    tickRate: parseFloat(metrics.tickRate || '0'),
                    uptime: this.getUptime(server.id),
                };
            }),
        );
    }

    async getServer(id: string) {
        const server = await this.prisma.server.findUnique({ where: { id } });
        if (!server) throw new NotFoundException('Server not found');

        const metrics = await this.redis.hgetall(`server:${id}:metrics`);
        return {
            ...server,
            playersOnline: parseInt(metrics.playerCount || '0', 10),
            cpu: parseFloat(metrics.cpu || '0'),
            memory: parseFloat(metrics.memory || '0'),
            tickRate: parseFloat(metrics.tickRate || '0'),
            uptime: this.getUptime(id),
        };
    }

    async createServer(data: {
        name: string;
        hostname: string;
        port: number;
        maxPlayers: number;
        serverDataPath: string;
        cfgPath: string;
        tags?: string[];
    }) {
        const server = await this.prisma.server.create({ data });
        this.events.emit('server.created', server);
        return server;
    }

    async updateServer(id: string, data: Partial<{
        name: string;
        hostname: string;
        port: number;
        maxPlayers: number;
        serverDataPath: string;
        cfgPath: string;
        autoRestart: boolean;
        tags: string[];
        scheduledRestarts: string[];
    }>) {
        const server = await this.prisma.server.update({ where: { id }, data });
        this.events.emit('server.updated', server);
        return server;
    }

    async deleteServer(id: string) {
        await this.stopServer(id);
        await this.prisma.server.delete({ where: { id } });
        this.events.emit('server.deleted', { id });
        return true;
    }

    async startServer(id: string) {
        const server = await this.prisma.server.findUnique({ where: { id } });
        if (!server) throw new NotFoundException('Server not found');

        if (this.runningServers.has(id)) {
            this.logger.warn(`Server ${id} is already running`);
            return server;
        }

        await this.prisma.server.update({
            where: { id },
            data: { status: 'STARTING' },
        });

        this.events.emit('server.starting', { serverId: id });

        const fxServerPath = join(server.serverDataPath, process.platform === 'win32' ? 'FXServer.exe' : 'run.sh');
        const args = ['+exec', server.cfgPath, '+set', 'sv_maxclients', String(server.maxPlayers)];

        const proc = spawn(fxServerPath, args, {
            cwd: server.serverDataPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env },
        });

        const consoleBuffer: string[] = [];

        proc.stdout?.on('data', (data: Buffer) => {
            const line = data.toString();
            consoleBuffer.push(line);
            if (consoleBuffer.length > 5000) consoleBuffer.shift();
            this.redis.publish(`console:${id}`, line);
            this.events.emit('console.output', { serverId: id, data: line });
        });

        proc.stderr?.on('data', (data: Buffer) => {
            const line = data.toString();
            consoleBuffer.push(`[ERROR] ${line}`);
            this.redis.publish(`console:${id}`, `[ERROR] ${line}`);
            this.events.emit('console.error', { serverId: id, data: line });
        });

        proc.on('exit', (code) => {
            this.logger.warn(`Server ${id} exited with code ${code}`);
            this.runningServers.delete(id);
            const status = code === 0 ? 'OFFLINE' : 'CRASHED';
            this.prisma.server.update({ where: { id }, data: { status, pid: null } }).catch(() => { });
            this.events.emit(code === 0 ? 'server.stopped' : 'server.crashed', { serverId: id, code });
        });

        this.runningServers.set(id, {
            process: proc,
            startTime: Date.now(),
            consoleBuffer,
        });

        await this.prisma.server.update({
            where: { id },
            data: { status: 'ONLINE', pid: proc.pid },
        });

        this.events.emit('server.started', { serverId: id, pid: proc.pid });
        return this.getServer(id);
    }

    async stopServer(id: string) {
        const running = this.runningServers.get(id);
        if (!running) return;

        await this.prisma.server.update({
            where: { id },
            data: { status: 'STOPPING' },
        });

        this.events.emit('server.stopping', { serverId: id });

        running.process.kill('SIGTERM');

        await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                running.process.kill('SIGKILL');
                resolve();
            }, 10000);

            running.process.on('exit', () => {
                clearTimeout(timeout);
                resolve();
            });
        });

        this.runningServers.delete(id);
        await this.prisma.server.update({
            where: { id },
            data: { status: 'OFFLINE', pid: null },
        });
        this.events.emit('server.stopped', { serverId: id });
    }

    async restartServer(id: string) {
        await this.prisma.server.update({
            where: { id },
            data: { status: 'RESTARTING' },
        });
        this.events.emit('server.restarting', { serverId: id });
        await this.stopServer(id);
        return this.startServer(id);
    }

    async sendCommand(id: string, command: string) {
        const running = this.runningServers.get(id);
        if (!running) throw new NotFoundException('Server is not running');
        running.process.stdin?.write(`${command}\n`);
        this.events.emit('console.input', { serverId: id, command });
    }

    getConsoleBuffer(id: string): string[] {
        return this.runningServers.get(id)?.consoleBuffer || [];
    }

    isRunning(id: string): boolean {
        return this.runningServers.has(id);
    }

    private getUptime(id: string): number {
        const running = this.runningServers.get(id);
        return running ? Date.now() - running.startTime : 0;
    }
}
