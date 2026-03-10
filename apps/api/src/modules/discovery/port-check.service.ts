import type { SetupCheckResult } from '@saifcontrol/shared';
import { exec } from 'child_process';
import { createSocket } from 'dgram';
import { createServer } from 'net';
import { promisify } from 'util';

function check(c: Omit<SetupCheckResult, 'autoFixAvailable'> & { autoFixAvailable?: boolean }): SetupCheckResult {
    return { autoFixAvailable: false, ...c };
}

const execAsync = promisify(exec);

/**
 * Test if a TCP port is available by trying to bind to it.
 */
export function testTcpPort(port: number, host = '0.0.0.0'): Promise<{ available: boolean; error?: string }> {
    return new Promise((resolve) => {
        const server = createServer();

        server.once('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EADDRINUSE') {
                resolve({ available: false, error: `TCP port ${port} is already in use` });
            } else {
                resolve({ available: false, error: err.message });
            }
        });

        server.once('listening', () => {
            server.close(() => {
                resolve({ available: true });
            });
        });

        server.listen(port, host);
    });
}

/**
 * Test if a UDP port is available by trying to bind to it.
 */
export function testUdpPort(port: number, host = '0.0.0.0'): Promise<{ available: boolean; error?: string }> {
    return new Promise((resolve) => {
        const socket = createSocket('udp4');

        socket.once('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EADDRINUSE') {
                resolve({ available: false, error: `UDP port ${port} is already in use` });
            } else {
                resolve({ available: false, error: err.message });
            }
        });

        socket.once('listening', () => {
            socket.close(() => {
                resolve({ available: true });
            });
        });

        socket.bind(port, host);
    });
}

/**
 * Find which process is using a port (Linux: ss or lsof).
 */
export async function findProcessOnPort(port: number): Promise<string | null> {
    try {
        const { stdout } = await execAsync(`ss -lptn 'sport = :${port}' 2>/dev/null || lsof -i :${port} -P -n 2>/dev/null`);
        return stdout.trim() || null;
    } catch {
        return null;
    }
}

/**
 * Check ufw firewall rules for a port.
 */
export async function checkUfwRules(port: number): Promise<{
    ufwActive: boolean;
    tcpAllowed: boolean;
    udpAllowed: boolean;
    details: string;
}> {
    try {
        const { stdout: statusOut } = await execAsync('ufw status 2>/dev/null');
        const ufwActive = statusOut.includes('Status: active');

        if (!ufwActive) {
            return { ufwActive: false, tcpAllowed: true, udpAllowed: true, details: 'ufw غير مفعّل أو غير مثبت' };
        }

        const tcpAllowed = statusOut.includes(`${port}/tcp`) && statusOut.includes('ALLOW');
        const udpAllowed = statusOut.includes(`${port}/udp`) && statusOut.includes('ALLOW');
        const bothAllowed = statusOut.includes(`${port}`) && !statusOut.includes(`${port}/tcp`) && !statusOut.includes(`${port}/udp`);

        return {
            ufwActive: true,
            tcpAllowed: tcpAllowed || bothAllowed,
            udpAllowed: udpAllowed || bothAllowed,
            details: statusOut.trim(),
        };
    } catch {
        return { ufwActive: false, tcpAllowed: true, udpAllowed: true, details: 'لم يتم العثور على ufw' };
    }
}

/**
 * Run all port checks and return setup check results.
 */
export async function runPortChecks(port: number): Promise<SetupCheckResult[]> {
    const checks: SetupCheckResult[] = [];

    // TCP test
    const tcp = await testTcpPort(port);
    if (tcp.available) {
        checks.push(check({
            id: 'port_tcp',
            label: `TCP ${port}`,
            status: 'pass',
            message: `منفذ TCP ${port} متاح`,
        }));
    } else {
        const processInfo = await findProcessOnPort(port);
        checks.push(check({
            id: 'port_tcp',
            label: `TCP ${port}`,
            status: 'warn',
            message: `منفذ TCP ${port} مستخدم${processInfo ? ` — ربما FXServer شغال بالفعل` : ''}`,
            details: processInfo || undefined,
        }));
    }

    // UDP test
    const udp = await testUdpPort(port);
    if (udp.available) {
        checks.push(check({
            id: 'port_udp',
            label: `UDP ${port}`,
            status: 'pass',
            message: `منفذ UDP ${port} متاح`,
        }));
    } else {
        checks.push(check({
            id: 'port_udp',
            label: `UDP ${port}`,
            status: 'warn',
            message: `منفذ UDP ${port} مستخدم`,
        }));
    }

    // Firewall check
    const ufw = await checkUfwRules(port);
    if (ufw.ufwActive) {
        if (ufw.tcpAllowed && ufw.udpAllowed) {
            checks.push(check({
                id: 'firewall',
                label: 'جدار الحماية (ufw)',
                status: 'pass',
                message: `المنفذ ${port} مسموح في ufw (TCP + UDP)`,
            }));
        } else {
            const missing = [];
            if (!ufw.tcpAllowed) missing.push('TCP');
            if (!ufw.udpAllowed) missing.push('UDP');
            checks.push({
                id: 'firewall',
                label: 'جدار الحماية (ufw)',
                status: 'warn',
                message: `المنفذ ${port} غير مسموح لـ ${missing.join(' و ')} في ufw`,
                details: `لفتح المنفذ: sudo ufw allow ${port}`,
                autoFixAvailable: false, // Needs sudo
            });
        }
    } else {
        checks.push(check({
            id: 'firewall',
            label: 'جدار الحماية',
            status: 'pass',
            message: 'ufw غير مفعّل — لا حاجة لإعداد إضافي (تحقق من iptables يدوياً إن كنت تستخدمه)',
        }));
    }

    return checks;
}
