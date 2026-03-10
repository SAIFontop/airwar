import type { SystemMetrics } from '@saifcontrol/shared';
import { exec } from 'child_process';
import { readFile } from 'fs/promises';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Collect system metrics (CPU, RAM, Disk, Network).
 * Linux-specific: reads from /proc and uses standard utilities.
 */
export async function collectMetrics(): Promise<SystemMetrics> {
    const [cpu, memory, disk, network, uptime] = await Promise.all([
        getCpuPercent(),
        getMemoryInfo(),
        getDiskInfo(),
        getNetworkInfo(),
        getUptime(),
    ]);

    return {
        cpuPercent: cpu,
        memoryUsedMb: memory.usedMb,
        memoryTotalMb: memory.totalMb,
        diskUsedGb: disk.usedGb,
        diskTotalGb: disk.totalGb,
        networkRxBytes: network.rxBytes,
        networkTxBytes: network.txBytes,
        uptime,
    };
}

async function getCpuPercent(): Promise<number> {
    try {
        // Read /proc/stat twice with a small delay
        const read = async () => {
            const content = await readFile('/proc/stat', 'utf-8');
            const line = content.split('\n')[0]; // cpu line
            const parts = line.split(/\s+/).slice(1).map(Number);
            const idle = parts[3];
            const total = parts.reduce((a, b) => a + b, 0);
            return { idle, total };
        };

        const first = await read();
        await new Promise((r) => setTimeout(r, 200));
        const second = await read();

        const idleDelta = second.idle - first.idle;
        const totalDelta = second.total - first.total;

        if (totalDelta === 0) return 0;
        return Math.round(((totalDelta - idleDelta) / totalDelta) * 100 * 10) / 10;
    } catch {
        return 0;
    }
}

async function getMemoryInfo(): Promise<{ usedMb: number; totalMb: number }> {
    try {
        const content = await readFile('/proc/meminfo', 'utf-8');
        const lines = content.split('\n');
        const getValue = (key: string) => {
            const line = lines.find((l) => l.startsWith(key));
            if (!line) return 0;
            const match = line.match(/(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        };

        const totalKb = getValue('MemTotal');
        const availableKb = getValue('MemAvailable');
        const totalMb = Math.round(totalKb / 1024);
        const usedMb = Math.round((totalKb - availableKb) / 1024);

        return { usedMb, totalMb };
    } catch {
        return { usedMb: 0, totalMb: 0 };
    }
}

async function getDiskInfo(): Promise<{ usedGb: number; totalGb: number }> {
    try {
        const { stdout } = await execAsync("df -BG / | tail -1 | awk '{print $2, $3}'");
        const parts = stdout.trim().split(/\s+/);
        const totalGb = parseFloat(parts[0]) || 0;
        const usedGb = parseFloat(parts[1]) || 0;
        return { usedGb, totalGb };
    } catch {
        return { usedGb: 0, totalGb: 0 };
    }
}

async function getNetworkInfo(): Promise<{ rxBytes: number; txBytes: number }> {
    try {
        const content = await readFile('/proc/net/dev', 'utf-8');
        const lines = content.split('\n').slice(2); // Skip headers
        let rxBytes = 0;
        let txBytes = 0;

        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 10) continue;
            const iface = parts[0].replace(':', '');
            if (iface === 'lo') continue; // Skip loopback

            rxBytes += parseInt(parts[1], 10) || 0;
            txBytes += parseInt(parts[9], 10) || 0;
        }

        return { rxBytes, txBytes };
    } catch {
        return { rxBytes: 0, txBytes: 0 };
    }
}

async function getUptime(): Promise<number> {
    try {
        const content = await readFile('/proc/uptime', 'utf-8');
        return Math.floor(parseFloat(content.split(' ')[0]));
    } catch {
        return 0;
    }
}
