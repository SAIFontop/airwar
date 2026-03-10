import type { ServerCfgParsed, SetupCheckResult } from '@saifcontrol/shared';
import { constants, existsSync } from 'fs';
import { access, readFile } from 'fs/promises';
import { join } from 'path';

/** Helper to build a check result with autoFixAvailable defaulting to false */
function check(c: Omit<SetupCheckResult, 'autoFixAvailable'> & { autoFixAvailable?: boolean }): SetupCheckResult {
    return { autoFixAvailable: false, ...c };
}

/**
 * Scan common paths for FXServer installation.
 * Looks for run.sh (Linux FXServer binary launcher).
 */
export async function discoverFxServer(): Promise<{
    candidates: Array<{
        binariesPath: string;
        serverDataPath: string | null;
        confidence: number;
        details: string;
    }>;
}> {
    const home = process.env.HOME || '/root';
    const searchPaths = [
        join(home, 'FXServer'),
        join(home, 'fxserver'),
        join(home, 'fx-server'),
        join(home, 'server'),
        '/opt/fxserver',
        '/opt/FXServer',
        '/home/fxserver',
        '/srv/fxserver',
    ];

    const candidates: Array<{
        binariesPath: string;
        serverDataPath: string | null;
        confidence: number;
        details: string;
    }> = [];

    for (const basePath of searchPaths) {
        if (!existsSync(basePath)) continue;

        // Look for run.sh in common structures
        const possibleBinPaths = [
            basePath,
            join(basePath, 'server'),
            join(basePath, 'alpine'),
            join(basePath, 'server-bin'),
        ];

        for (const binPath of possibleBinPaths) {
            const runShPath = join(binPath, 'run.sh');
            if (existsSync(runShPath)) {
                let confidence = 0.7;
                let serverDataPath: string | null = null;
                const details: string[] = [`run.sh found at ${runShPath}`];

                // Look for server-data nearby
                const possibleDataPaths = [
                    join(basePath, 'server-data'),
                    join(basePath, 'txData', 'default'),
                    join(binPath, '..', 'server-data'),
                ];

                for (const dataPath of possibleDataPaths) {
                    if (existsSync(dataPath)) {
                        const cfgPath = join(dataPath, 'server.cfg');
                        if (existsSync(cfgPath)) {
                            serverDataPath = dataPath;
                            confidence += 0.2;
                            details.push(`server.cfg found at ${cfgPath}`);
                        }

                        const resPath = join(dataPath, 'resources');
                        if (existsSync(resPath)) {
                            confidence += 0.1;
                            details.push(`resources/ found`);
                        }
                    }
                }

                candidates.push({
                    binariesPath: binPath,
                    serverDataPath,
                    confidence: Math.min(confidence, 1),
                    details: details.join('; '),
                });
            }
        }
    }

    // Sort by confidence descending
    candidates.sort((a, b) => b.confidence - a.confidence);
    return { candidates };
}

/**
 * Validate FXServer binaries path.
 */
export async function validateBinariesPath(path: string): Promise<SetupCheckResult[]> {
    const checks: SetupCheckResult[] = [];

    // Check run.sh exists
    const runShPath = join(path, 'run.sh');
    if (existsSync(runShPath)) {
        checks.push(check({
            id: 'runsh_exists',
            label: 'run.sh موجود',
            status: 'pass',
            message: `تم العثور على run.sh في ${runShPath}`,
        }));

        // Check run.sh is executable
        try {
            await access(runShPath, constants.X_OK);
            checks.push(check({
                id: 'runsh_executable',
                label: 'run.sh قابل للتنفيذ',
                status: 'pass',
                message: 'صلاحية التنفيذ متوفرة',
            }));
        } catch {
            checks.push(check({
                id: 'runsh_executable',
                label: 'run.sh قابل للتنفيذ',
                status: 'warn',
                message: 'run.sh غير قابل للتنفيذ — يمكن إصلاحه تلقائياً بـ chmod +x',
                autoFixAvailable: true,
            }));
        }
    } else {
        checks.push(check({
            id: 'runsh_exists',
            label: 'run.sh موجود',
            status: 'fail',
            message: `لم يتم العثور على run.sh في ${path}`,
            details: 'تأكد أن المسار يشير لمجلد FXServer الذي يحتوي run.sh',
        }));
    }

    // Check FXServer binary
    const fxBinaryPath = join(path, 'FXServer');
    if (existsSync(fxBinaryPath)) {
        checks.push(check({
            id: 'fxserver_binary',
            label: 'FXServer binary',
            status: 'pass',
            message: 'تم العثور على FXServer binary',
        }));
    }

    return checks;
}

/**
 * Validate server-data path.
 */
export async function validateServerDataPath(path: string): Promise<SetupCheckResult[]> {
    const checks: SetupCheckResult[] = [];

    if (!existsSync(path)) {
        checks.push(check({
            id: 'serverdata_exists',
            label: 'مجلد server-data',
            status: 'fail',
            message: `المجلد غير موجود: ${path}`,
        }));
        return checks;
    }

    checks.push(check({
        id: 'serverdata_exists',
        label: 'مجلد server-data',
        status: 'pass',
        message: 'المجلد موجود',
    }));

    // server.cfg
    const cfgPath = join(path, 'server.cfg');
    if (existsSync(cfgPath)) {
        checks.push(check({
            id: 'servercfg_exists',
            label: 'server.cfg',
            status: 'pass',
            message: 'ملف الإعدادات موجود',
        }));
    } else {
        checks.push(check({
            id: 'servercfg_exists',
            label: 'server.cfg',
            status: 'fail',
            message: 'server.cfg غير موجود — مطلوب لتشغيل السيرفر',
        }));
    }

    // resources/
    const resPath = join(path, 'resources');
    if (existsSync(resPath)) {
        checks.push(check({
            id: 'resources_dir',
            label: 'مجلد resources',
            status: 'pass',
            message: 'مجلد الموارد موجود',
        }));
    } else {
        checks.push(check({
            id: 'resources_dir',
            label: 'مجلد resources',
            status: 'warn',
            message: 'مجلد resources غير موجود — يمكن إنشاؤه تلقائياً',
            autoFixAvailable: true,
        }));
    }

    return checks;
}

/**
 * Detect txAdmin presence by checking file system artifacts.
 * Does NOT call any txAdmin API (undocumented).
 */
export async function detectTxAdmin(serverDataPath: string): Promise<{
    detected: boolean;
    txDataPath: string | null;
    adminsJsonExists: boolean;
    txAdminPort: number | null;
    details: string[];
}> {
    const details: string[] = [];
    let detected = false;
    let txDataPath: string | null = null;
    let adminsJsonExists = false;
    let txAdminPort: number | null = null;

    // Check common txData paths
    const possibleTxDataPaths = [
        join(serverDataPath, '..', 'txData'),
        join(serverDataPath, 'txData'),
        join(process.env.HOME || '/root', 'txData'),
    ];

    for (const tPath of possibleTxDataPaths) {
        if (existsSync(tPath)) {
            detected = true;
            txDataPath = tPath;
            details.push(`txData folder found at: ${tPath}`);

            // Check admins.json (documented file)
            const adminsPath = join(tPath, 'admins.json');
            if (existsSync(adminsPath)) {
                adminsJsonExists = true;
                details.push('admins.json found in txData');
            }

            break;
        }
    }

    // Try to read txAdmin port from process cmdline or config
    // (only from files, NOT from undocumented API)
    if (txDataPath) {
        const configPath = join(txDataPath, 'config.json');
        if (existsSync(configPath)) {
            try {
                const configRaw = await readFile(configPath, 'utf-8');
                const config = JSON.parse(configRaw);
                if (config.txAdminPort) {
                    txAdminPort = parseInt(config.txAdminPort, 10);
                    details.push(`txAdmin port from config: ${txAdminPort}`);
                }
            } catch {
                details.push('Could not parse txData/config.json');
            }
        }
    }

    if (!detected) {
        details.push('txAdmin not detected on filesystem');
    }

    return { detected, txDataPath, adminsJsonExists, txAdminPort, details };
}

/**
 * Parse server.cfg to extract documented settings.
 * Based on official FiveM documentation format.
 */
export function parseServerCfg(content: string): ServerCfgParsed {
    const lines = content.split('\n').map((l) => l.trim());
    const result: ServerCfgParsed = {
        endpointTcp: undefined,
        endpointUdp: undefined,
        port: undefined,
        svLicenseKey: undefined,
        svLicenseKeyValid: false,
        onesync: undefined,
        svRequestParanoia: undefined,
        ensuredResources: [],
        rconlogEnsured: false,
        rawLines: lines,
    };

    for (const line of lines) {
        // Skip comments and empty lines
        if (line.startsWith('#') || line === '') continue;

        // endpoint_add_tcp
        const tcpMatch = line.match(/^endpoint_add_tcp\s+"?([^"]+)"?/);
        if (tcpMatch) {
            result.endpointTcp = tcpMatch[1];
            const portStr = tcpMatch[1].match(/:(\d+)/);
            if (portStr) result.port = parseInt(portStr[1], 10);
            continue;
        }

        // endpoint_add_udp
        const udpMatch = line.match(/^endpoint_add_udp\s+"?([^"]+)"?/);
        if (udpMatch) {
            result.endpointUdp = udpMatch[1];
            if (!result.port) {
                const portStr = udpMatch[1].match(/:(\d+)/);
                if (portStr) result.port = parseInt(portStr[1], 10);
            }
            continue;
        }

        // sv_licenseKey
        const licenseMatch = line.match(/^sv_licenseKey\s+"?([^"]+)"?/);
        if (licenseMatch) {
            result.svLicenseKey = licenseMatch[1];
            result.svLicenseKeyValid =
                licenseMatch[1] !== 'changeme' &&
                licenseMatch[1] !== '' &&
                licenseMatch[1].length > 10;
            continue;
        }

        // set onesync
        const onesyncMatch = line.match(/^set\s+onesync\s+"?([^"]+)"?/);
        if (onesyncMatch) {
            result.onesync = onesyncMatch[1];
            continue;
        }

        // sv_requestParanoia
        const paranoiaMatch = line.match(/^(?:set(?:s|a)?|)\s*sv_requestParanoia\s+"?(\d+)"?/);
        if (paranoiaMatch) {
            result.svRequestParanoia = parseInt(paranoiaMatch[1], 10);
            continue;
        }

        // ensure resource
        const ensureMatch = line.match(/^ensure\s+(\S+)/);
        if (ensureMatch) {
            result.ensuredResources.push(ensureMatch[1]);
            if (ensureMatch[1] === 'rconlog') {
                result.rconlogEnsured = true;
            }
            continue;
        }

        // start resource (also loads resources)
        const startMatch = line.match(/^start\s+(\S+)/);
        if (startMatch) {
            result.ensuredResources.push(startMatch[1]);
            if (startMatch[1] === 'rconlog') {
                result.rconlogEnsured = true;
            }
            continue;
        }
    }

    return result;
}

/**
 * Validate parsed server.cfg with checks.
 */
export function validateServerCfg(parsed: ServerCfgParsed): SetupCheckResult[] {
    const checks: SetupCheckResult[] = [];

    // Endpoints
    if (parsed.endpointTcp) {
        checks.push(check({
            id: 'endpoint_tcp',
            label: 'endpoint_add_tcp',
            status: 'pass',
            message: `TCP: ${parsed.endpointTcp}`,
        }));
    } else {
        checks.push(check({
            id: 'endpoint_tcp',
            label: 'endpoint_add_tcp',
            status: 'fail',
            message: 'لم يتم العثور على endpoint_add_tcp في server.cfg',
            details: 'أضف مثل: endpoint_add_tcp "0.0.0.0:30120"',
            autoFixAvailable: true,
        }));
    }

    if (parsed.endpointUdp) {
        checks.push(check({
            id: 'endpoint_udp',
            label: 'endpoint_add_udp',
            status: 'pass',
            message: `UDP: ${parsed.endpointUdp}`,
        }));
    } else {
        checks.push(check({
            id: 'endpoint_udp',
            label: 'endpoint_add_udp',
            status: 'fail',
            message: 'لم يتم العثور على endpoint_add_udp في server.cfg',
            details: 'أضف مثل: endpoint_add_udp "0.0.0.0:30120"',
            autoFixAvailable: true,
        }));
    }

    // License Key
    if (parsed.svLicenseKeyValid) {
        checks.push(check({
            id: 'license_key',
            label: 'sv_licenseKey',
            status: 'pass',
            message: 'مفتاح الترخيص موجود',
        }));
    } else if (parsed.svLicenseKey) {
        checks.push(check({
            id: 'license_key',
            label: 'sv_licenseKey',
            status: 'fail',
            message: 'مفتاح الترخيص غير صالح (placeholder أو changeme)',
            details: 'احصل على مفتاح من https://keymaster.fivem.net/',
        }));
    } else {
        checks.push(check({
            id: 'license_key',
            label: 'sv_licenseKey',
            status: 'fail',
            message: 'مفتاح الترخيص غير موجود في server.cfg',
            details: 'أضف: sv_licenseKey "your_key_here"',
        }));
    }

    // rconlog
    if (parsed.rconlogEnsured) {
        checks.push(check({
            id: 'rconlog',
            label: 'ensure rconlog',
            status: 'pass',
            message: 'rconlog resource مفعّل',
        }));
    } else {
        checks.push(check({
            id: 'rconlog',
            label: 'ensure rconlog',
            status: 'warn',
            message: 'rconlog غير مفعّل — يوفر أوامر status/clientkick',
            autoFixAvailable: true,
        }));
    }

    // sv_requestParanoia
    if (parsed.svRequestParanoia !== undefined && parsed.svRequestParanoia > 0) {
        checks.push(check({
            id: 'request_paranoia',
            label: 'sv_requestParanoia',
            status: 'warn',
            message: `مستوى ${parsed.svRequestParanoia} — قد يمنع info.json/dynamic.json/players.json (يُرجع "Nope.")`,
            details: 'panel_bridge resource يتجاوز هذا القيد بتوفير API داخلي بديل',
        }));
    }

    return checks;
}