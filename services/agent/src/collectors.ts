import * as http from 'http';
import * as os from 'os';

export interface SystemMetrics {
    cpuPercent: number;
    memoryUsedMb: number;
    memoryTotalMb: number;
    memoryPercent: number;
    diskUsedGb: number;
    diskTotalGb: number;
    uptime: number;
}

export interface FxServerMetrics {
    players: number;
    maxPlayers: number;
    resources: ResourceMetric[];
    tickRate: number;
    hostname: string;
}

export interface ResourceMetric {
    name: string;
    status: 'started' | 'stopped' | 'unknown';
    cpuMs: number;
    memoryMb: number;
}

let prevCpuIdle = 0;
let prevCpuTotal = 0;

function getCpuPercent(): number {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;

    for (const cpu of cpus) {
        idle += cpu.times.idle;
        total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle;
    }

    const idleDiff = idle - prevCpuIdle;
    const totalDiff = total - prevCpuTotal;

    prevCpuIdle = idle;
    prevCpuTotal = total;

    if (totalDiff === 0) return 0;
    return Math.round(((totalDiff - idleDiff) / totalDiff) * 100 * 10) / 10;
}

export function collectSystemMetrics(): SystemMetrics {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
        cpuPercent: getCpuPercent(),
        memoryUsedMb: Math.round(usedMem / 1024 / 1024),
        memoryTotalMb: Math.round(totalMem / 1024 / 1024),
        memoryPercent: Math.round((usedMem / totalMem) * 100 * 10) / 10,
        diskUsedGb: 0,
        diskTotalGb: 0,
        uptime: os.uptime(),
    };
}

export function collectFxMetrics(fxServerPath: string): Promise<FxServerMetrics> {
    return new Promise((resolve) => {
        // Try fetching from FXServer's built-in HTTP info endpoint
        const infoUrl = 'http://127.0.0.1:30120/info.json';
        const playersUrl = 'http://127.0.0.1:30120/players.json';

        const defaultMetrics: FxServerMetrics = {
            players: 0,
            maxPlayers: 48,
            resources: [],
            tickRate: 0,
            hostname: 'Unknown',
        };

        httpGet(infoUrl)
            .then((infoData) => {
                const info = JSON.parse(infoData);
                defaultMetrics.hostname = info.vars?.sv_projectName || info.vars?.sv_hostname || 'FiveM Server';
                defaultMetrics.maxPlayers = info.vars?.sv_maxClients ? parseInt(info.vars.sv_maxClients, 10) : 48;

                return httpGet(playersUrl);
            })
            .then((playersData) => {
                const players = JSON.parse(playersData);
                defaultMetrics.players = Array.isArray(players) ? players.length : 0;
                resolve(defaultMetrics);
            })
            .catch(() => {
                // Server might not be running
                resolve(defaultMetrics);
            });
    });
}

function httpGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const req = http.get(url, { timeout: 3000 }, (res) => {
            let data = '';
            res.on('data', (chunk: Buffer) => (data += chunk.toString()));
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('timeout'));
        });
    });
}
