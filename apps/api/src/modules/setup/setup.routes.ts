import type { ServerProfile, SetupCheckResult } from '@saifcontrol/shared';
import { ProfilesSchema, STORAGE_FILES, now, uuid } from '@saifcontrol/shared';
import type { FastifyInstance } from 'fastify';
import { existsSync, writeFileSync } from 'fs';
import { chmod, copyFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { writeAudit } from '../../lib/audit.js';
import { generateToken } from '../../lib/crypto.js';
import { getState, updateState } from '../../lib/data.js';
import { getStore } from '../../lib/store.js';
import {
    detectTxAdmin,
    discoverFxServer,
    parseServerCfg,
    validateBinariesPath,
    validateServerCfg,
    validateServerDataPath,
} from '../discovery/discovery.service.js';
import { runPortChecks } from '../discovery/port-check.service.js';

function check(c: Omit<SetupCheckResult, 'autoFixAvailable'> & { autoFixAvailable?: boolean }): SetupCheckResult {
    return { autoFixAvailable: false, ...c };
}

/**
 * Register setup wizard routes.
 * These are accessible WITHOUT authentication (but only before setup is complete).
 */
export async function setupWizardRoutes(app: FastifyInstance): Promise<void> {
    // Middleware: block if setup already completed
    app.addHook('onRequest', async (request, reply) => {
        if (!request.url.startsWith('/api/setup')) return;

        // Allow status check always
        if (request.url === '/api/setup/status') return;

        const state = await getState();
        if (state.setupCompleted) {
            reply.code(403).send({ success: false, error: 'الإعداد مكتمل بالفعل' });
        }
    });

    // ─── GET /api/setup/status ───
    app.get('/api/setup/status', async () => {
        const state = await getState();
        return { success: true, data: { setupCompleted: state.setupCompleted, currentStep: state.setupStep } };
    });

    // ─── POST /api/setup/scan ───
    app.post('/api/setup/scan', async () => {
        const discovery = await discoverFxServer();
        return { success: true, data: discovery };
    });

    // ─── POST /api/setup/validate-paths ───
    app.post<{ Body: { binariesPath: string; serverDataPath: string } }>(
        '/api/setup/validate-paths',
        async (request) => {
            const { binariesPath, serverDataPath } = request.body;
            const [binChecks, dataChecks] = await Promise.all([
                validateBinariesPath(binariesPath),
                validateServerDataPath(serverDataPath),
            ]);
            return { success: true, data: { binariesChecks: binChecks, dataChecks } };
        },
    );

    // ─── POST /api/setup/analyze-cfg ───
    app.post<{ Body: { serverDataPath: string } }>(
        '/api/setup/analyze-cfg',
        async (request) => {
            const { serverDataPath } = request.body;
            const cfgPath = join(serverDataPath, 'server.cfg');

            if (!existsSync(cfgPath)) {
                return { success: false, error: 'server.cfg غير موجود' };
            }

            const content = await readFile(cfgPath, 'utf-8');
            const parsed = parseServerCfg(content);
            const checks = validateServerCfg(parsed);

            return { success: true, data: { parsed, checks } };
        },
    );

    // ─── POST /api/setup/check-ports ───
    app.post<{ Body: { port: number } }>(
        '/api/setup/check-ports',
        async (request) => {
            const { port } = request.body;
            const checks = await runPortChecks(port);
            return { success: true, data: { checks } };
        },
    );

    // ─── POST /api/setup/detect-txadmin ───
    app.post<{ Body: { serverDataPath: string } }>(
        '/api/setup/detect-txadmin',
        async (request) => {
            const { serverDataPath } = request.body;
            const result = await detectTxAdmin(serverDataPath);
            return { success: true, data: result };
        },
    );

    // ─── POST /api/setup/test-info-json ───
    app.post<{ Body: { port: number } }>(
        '/api/setup/test-info-json',
        async (request) => {
            const { port } = request.body;
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                const res = await fetch(`http://127.0.0.1:${port}/info.json`, {
                    signal: controller.signal,
                });
                clearTimeout(timeout);

                if (res.ok) {
                    const data = await res.json();
                    return {
                        success: true,
                        data: {
                            status: 'pass' as const,
                            message: 'info.json يعمل بنجاح',
                            serverInfo: data,
                        },
                    };
                }

                const text = await res.text();
                if (text.includes('Nope')) {
                    return {
                        success: true,
                        data: {
                            status: 'warn' as const,
                            message: 'sv_requestParanoia يمنع الوصول لـ info.json — استخدم panel_bridge كبديل',
                        },
                    };
                }

                return {
                    success: true,
                    data: { status: 'warn' as const, message: `HTTP ${res.status}: ${text}` },
                };
            } catch (err) {
                return {
                    success: true,
                    data: {
                        status: 'skip' as const,
                        message: 'السيرفر غير متاح — سيتم الاختبار بعد التشغيل',
                    },
                };
            }
        },
    );

    // ─── POST /api/setup/install-bridge ───
    app.post<{ Body: { serverDataPath: string } }>(
        '/api/setup/install-bridge',
        async (request) => {
            const { serverDataPath } = request.body;
            const checks: SetupCheckResult[] = [];

            try {
                // Create panel_bridge resource
                const bridgeDir = join(serverDataPath, 'resources', 'panel_bridge');
                if (!existsSync(bridgeDir)) {
                    await mkdir(bridgeDir, { recursive: true });
                }

                // Generate secure token
                const bridgeToken = generateToken(48);

                // fxmanifest.lua
                const manifest = `fx_version 'cerulean'
game 'common'

name 'panel_bridge'
description 'SaifControl Panel Bridge — Documented API layer'
author 'SaifControl'
version '1.0.0'

server_script 'server.js'
`;
                writeFileSync(join(bridgeDir, 'fxmanifest.lua'), manifest, 'utf-8');

                // server.js — Uses SetHttpHandler and ExecuteCommand (both documented)
                const serverJs = `
// panel_bridge — SaifControl
// Uses only documented FiveM server APIs:
// - SetHttpHandler: https://docs.fivem.net/docs/scripting-reference/
// - ExecuteCommand: documented server command execution
// - GetPlayers/GetPlayerName/GetPlayerIdentifiers: documented native functions

const BRIDGE_TOKEN = GetConvar('panel_bridge_token', '');

function checkAuth(req) {
  const auth = req.headers['authorization'] || '';
  return auth === 'Bearer ' + BRIDGE_TOKEN;
}

function jsonResponse(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.send(JSON.stringify(data));
}

SetHttpHandler((req, res) => {
  const path = req.path;

  if (!path.startsWith('/panel_bridge/')) return;

  if (!BRIDGE_TOKEN || !checkAuth(req)) {
    return jsonResponse(res, 401, { error: 'Unauthorized' });
  }

  // Health check
  if (path === '/panel_bridge/health') {
    return jsonResponse(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
  }

  // Players list
  if (path === '/panel_bridge/players' && req.method === 'GET') {
    const players = [];
    const playerIndices = getPlayers();
    for (const idx of playerIndices) {
      const id = parseInt(idx);
      players.push({
        id,
        name: GetPlayerName(id) || 'Unknown',
        identifiers: getPlayerIdentifiers(id) || [],
        ping: GetPlayerPing(id) || 0,
      });
    }
    return jsonResponse(res, 200, players);
  }

  // Resources list
  if (path === '/panel_bridge/resources' && req.method === 'GET') {
    const count = GetNumResources();
    const resources = [];
    for (let i = 0; i < count; i++) {
      const name = GetResourceByFindIndex(i);
      resources.push({
        name,
        status: GetResourceState(name),
      });
    }
    return jsonResponse(res, 200, resources);
  }

  // Execute command (documented: start/stop/ensure/restart/refresh/status/clientkick/say/exec/quit)
  if (path === '/panel_bridge/command' && req.method === 'POST') {
    req.setDataHandler((body) => {
      try {
        const data = JSON.parse(body);
        if (!data.command || typeof data.command !== 'string') {
          return jsonResponse(res, 400, { error: 'Missing command' });
        }

        // Allowlist of documented commands for safety
        const allowed = ['start', 'stop', 'ensure', 'restart', 'refresh', 'status', 'clientkick', 'say', 'exec', 'quit'];
        const cmdBase = data.command.split(' ')[0].toLowerCase();

        if (!allowed.includes(cmdBase)) {
          return jsonResponse(res, 403, { error: 'Command not in allowlist: ' + cmdBase });
        }

        ExecuteCommand(data.command);
        return jsonResponse(res, 200, { success: true, command: data.command });
      } catch (e) {
        return jsonResponse(res, 400, { error: 'Invalid JSON body' });
      }
    });
    return;
  }

  // Kick player
  if (path === '/panel_bridge/kick' && req.method === 'POST') {
    req.setDataHandler((body) => {
      try {
        const data = JSON.parse(body);
        if (!data.playerId) return jsonResponse(res, 400, { error: 'Missing playerId' });
        const reason = data.reason || 'Kicked by admin';
        DropPlayer(data.playerId.toString(), reason);
        return jsonResponse(res, 200, { success: true });
      } catch (e) {
        return jsonResponse(res, 400, { error: 'Invalid JSON body' });
      }
    });
    return;
  }

  jsonResponse(res, 404, { error: 'Not found' });
});

// Helper to get player identifiers
function getPlayerIdentifiers(playerId) {
  const identifiers = [];
  const count = GetNumPlayerIdentifiers(playerId);
  for (let i = 0; i < count; i++) {
    identifiers.push(GetPlayerIdentifier(playerId, i));
  }
  return identifiers;
}

// Helper: getPlayers polyfill
function getPlayers() {
  const players = [];
  const count = GetNumPlayerIndices();
  for (let i = 0; i < count; i++) {
    players.push(GetPlayerFromIndex(i));
  }
  return players;
}
`;
                writeFileSync(join(bridgeDir, 'server.js'), serverJs, 'utf-8');

                checks.push(check({
                    id: 'bridge_files',
                    label: 'ملفات panel_bridge',
                    status: 'pass',
                    message: 'تم إنشاء الملفات بنجاح',
                }));

                // Add to server.cfg
                const cfgPath = join(serverDataPath, 'server.cfg');
                if (existsSync(cfgPath)) {
                    let cfg = await readFile(cfgPath, 'utf-8');

                    // Add convar if not present
                    if (!cfg.includes('panel_bridge_token')) {
                        cfg += `\n\n# SaifControl Panel Bridge\nset panel_bridge_token "${bridgeToken}"\nensure panel_bridge\n`;

                        // Atomic write with backup
                        const backupPath = cfgPath + '.bak.' + Date.now();
                        await copyFile(cfgPath, backupPath);
                        writeFileSync(cfgPath, cfg, 'utf-8');

                        checks.push(check({
                            id: 'bridge_cfg',
                            label: 'تعديل server.cfg',
                            status: 'pass',
                            message: 'تمت إضافة panel_bridge token و ensure في server.cfg',
                            details: `نسخة احتياطية: ${backupPath}`,
                        }));
                    } else {
                        checks.push(check({
                            id: 'bridge_cfg',
                            label: 'server.cfg',
                            status: 'pass',
                            message: 'panel_bridge مضاف بالفعل في server.cfg',
                        }));
                    }
                }

                return { success: true, data: { checks, bridgeToken } };
            } catch (err) {
                return {
                    success: false,
                    error: `فشل تثبيت panel_bridge: ${err instanceof Error ? err.message : String(err)}`,
                    data: { checks },
                };
            }
        },
    );

    // ─── POST /api/setup/auto-fix ───
    app.post<{ Body: { fixId: string; serverDataPath: string; binariesPath?: string } }>(
        '/api/setup/auto-fix',
        async (request) => {
            const { fixId, serverDataPath, binariesPath } = request.body;
            const results: SetupCheckResult[] = [];

            switch (fixId) {
                case 'runsh_executable': {
                    if (binariesPath) {
                        await chmod(join(binariesPath, 'run.sh'), 0o755);
                        results.push(check({ id: fixId, label: 'chmod +x run.sh', status: 'pass', message: 'تم إصلاح صلاحيات run.sh' }));
                    }
                    break;
                }
                case 'resources_dir': {
                    const resDir = join(serverDataPath, 'resources');
                    if (!existsSync(resDir)) {
                        await mkdir(resDir, { recursive: true });
                        results.push(check({ id: fixId, label: 'إنشاء resources/', status: 'pass', message: 'تم إنشاء مجلد resources' }));
                    }
                    break;
                }
                case 'endpoint_tcp': {
                    const cfgPath = join(serverDataPath, 'server.cfg');
                    if (existsSync(cfgPath)) {
                        let cfg = await readFile(cfgPath, 'utf-8');
                        if (!cfg.includes('endpoint_add_tcp')) {
                            cfg = `endpoint_add_tcp "0.0.0.0:30120"\n${cfg}`;
                            const backupPath = cfgPath + '.bak.' + Date.now();
                            await copyFile(cfgPath, backupPath);
                            writeFileSync(cfgPath, cfg, 'utf-8');
                            results.push(check({ id: fixId, label: 'endpoint_add_tcp', status: 'pass', message: 'تمت الإضافة' }));
                        }
                    }
                    break;
                }
                case 'endpoint_udp': {
                    const cfgPath = join(serverDataPath, 'server.cfg');
                    if (existsSync(cfgPath)) {
                        let cfg = await readFile(cfgPath, 'utf-8');
                        if (!cfg.includes('endpoint_add_udp')) {
                            cfg = `endpoint_add_udp "0.0.0.0:30120"\n${cfg}`;
                            const backupPath = cfgPath + '.bak.' + Date.now();
                            await copyFile(cfgPath, backupPath);
                            writeFileSync(cfgPath, cfg, 'utf-8');
                            results.push(check({ id: fixId, label: 'endpoint_add_udp', status: 'pass', message: 'تمت الإضافة' }));
                        }
                    }
                    break;
                }
                case 'rconlog': {
                    const cfgPath = join(serverDataPath, 'server.cfg');
                    if (existsSync(cfgPath)) {
                        let cfg = await readFile(cfgPath, 'utf-8');
                        if (!cfg.includes('ensure rconlog')) {
                            cfg += '\nensure rconlog\n';
                            const backupPath = cfgPath + '.bak.' + Date.now();
                            await copyFile(cfgPath, backupPath);
                            writeFileSync(cfgPath, cfg, 'utf-8');
                            results.push(check({ id: fixId, label: 'ensure rconlog', status: 'pass', message: 'تمت الإضافة' }));
                        }
                    }
                    break;
                }
                default:
                    results.push(check({ id: fixId, label: fixId, status: 'fail', message: 'إصلاح غير معروف' }));
            }

            return { success: true, data: { results } };
        },
    );

    // ─── POST /api/setup/create-systemd-unit ───
    app.post<{ Body: { binariesPath: string; serverDataPath: string; unitName?: string } }>(
        '/api/setup/create-systemd-unit',
        async (request) => {
            const { binariesPath, serverDataPath, unitName = 'fxserver' } = request.body;

            const unit = `[Unit]
Description=FXServer (FiveM) — managed by SaifControl
After=network.target

[Service]
Type=simple
User=${process.env.USER || 'fxserver'}
WorkingDirectory=${serverDataPath}
ExecStart=/bin/bash ${join(binariesPath, 'run.sh')} +exec server.cfg
Restart=on-failure
RestartSec=10
StartLimitIntervalSec=300
StartLimitBurst=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
`;

            return {
                success: true,
                data: {
                    unitContent: unit,
                    unitName: `${unitName}.service`,
                    installPath: `/etc/systemd/system/${unitName}.service`,
                    instructions: [
                        `sudo tee /etc/systemd/system/${unitName}.service <<'EOF'\n${unit}EOF`,
                        'sudo systemctl daemon-reload',
                        `sudo systemctl enable ${unitName}`,
                        `sudo systemctl start ${unitName}`,
                    ],
                },
            };
        },
    );

    // ─── POST /api/setup/save-profile ───
    app.post<{ Body: Partial<ServerProfile> & { binariesPath: string; serverDataPath: string } }>(
        '/api/setup/save-profile',
        async (request) => {
            const body = request.body;
            const store = getStore();

            const profile: ServerProfile = {
                id: uuid(),
                name: body.name || 'My FiveM Server',
                fxServerBinariesPath: body.binariesPath,
                serverDataPath: body.serverDataPath,
                managementMode: body.managementMode || 'process',
                systemdUnit: body.systemdUnit,
                port: body.port || 30120,
                txAdminDetected: body.txAdminDetected || false,
                txAdminPort: body.txAdminPort,
                txDataPath: body.txDataPath,
                panelBridgeInstalled: body.panelBridgeInstalled || false,
                panelBridgeToken: body.panelBridgeToken,
                createdAt: now(),
                updatedAt: now(),
            };

            await store.update(STORAGE_FILES.PROFILES, ProfilesSchema, (data) => {
                data.profiles.push(profile);
                data.activeProfileId = profile.id;
                data.updatedAt = now();
                return data;
            });

            return { success: true, data: { profile } };
        },
    );

    // ─── POST /api/setup/complete ───
    app.post<{ Body: { username: string; password: string } }>(
        '/api/setup/complete',
        async (request) => {
            const { username, password } = request.body;

            // Import auth service dynamically to avoid circular deps
            const { createUser } = await import('../auth/auth.service.js');

            // Create owner user
            const user = await createUser(username, password, 'owner');

            // Mark setup as completed
            await updateState((s) => ({
                ...s,
                setupCompleted: true,
                setupStep: undefined,
            }));

            writeAudit({ userId: user.id, action: 'setup.completed' });

            return { success: true, data: { user } };
        },
    );
}
