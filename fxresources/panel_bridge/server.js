/**
 * panel_bridge — SaifControl
 * 
 * FiveM server-side resource providing a documented HTTP API layer.
 * 
 * Uses ONLY documented FiveM server APIs:
 * - SetHttpHandler: Register HTTP request handler
 * - ExecuteCommand: Execute a server command
 * - GetPlayers/GetPlayerName/GetPlayerIdentifiers: Player info
 * - GetNumResources/GetResourceByFindIndex/GetResourceState: Resource info
 * - DropPlayer: Kick player (documented)
 * 
 * DOES NOT USE:
 * - Any txAdmin internal API (UNDOCUMENTED)
 * - RCON protocol (UNSPECIFIED packet format)
 * - Any undocumented endpoints
 * 
 * Security: Requires Bearer token matching convar 'panel_bridge_token'
 */

const BRIDGE_TOKEN = GetConvar('panel_bridge_token', '');
const BRIDGE_VERSION = '1.0.0';

if (!BRIDGE_TOKEN) {
    console.log('^1[panel_bridge] WARNING: panel_bridge_token convar is empty! API will reject all requests.^0');
}

/**
 * Authenticate request via Bearer token.
 */
function checkAuth(req) {
    const auth = req.headers['authorization'] || req.headers['Authorization'] || '';
    return auth === 'Bearer ' + BRIDGE_TOKEN;
}

/**
 * Send JSON response.
 */
function jsonResponse(res, status, data) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'X-Panel-Bridge-Version': BRIDGE_VERSION,
    });
    res.send(JSON.stringify(data));
}

/**
 * Get all online player indices.
 */
function getPlayerList() {
    const players = [];
    const count = GetNumPlayerIndices();
    for (let i = 0; i < count; i++) {
        players.push(GetPlayerFromIndex(i));
    }
    return players;
}

/**
 * Get player identifiers array.
 */
function getPlayerIdentifiers(playerId) {
    const identifiers = [];
    const count = GetNumPlayerIdentifiers(playerId);
    for (let i = 0; i < count; i++) {
        identifiers.push(GetPlayerIdentifier(playerId, i));
    }
    return identifiers;
}

/**
 * Documented command allowlist.
 * Only these commands can be executed via the bridge.
 * Reference: https://docs.fivem.net/docs/server-manual/server-commands/
 */
const ALLOWED_COMMANDS = [
    'start',
    'stop',
    'ensure',
    'restart',
    'refresh',
    'status',
    'clientkick',
    'say',
    'exec',
    'quit',
];

// ─── HTTP Handler ───

SetHttpHandler((req, res) => {
    const path = req.path;

    // Only handle /panel_bridge/* paths
    if (!path.startsWith('/panel_bridge/')) {
        return;
    }

    // Auth check
    if (!BRIDGE_TOKEN) {
        return jsonResponse(res, 503, {
            error: 'panel_bridge_token not configured',
        });
    }

    if (!checkAuth(req)) {
        return jsonResponse(res, 401, { error: 'Unauthorized' });
    }

    // ─── GET /panel_bridge/health ───
    if (path === '/panel_bridge/health' && req.method === 'GET') {
        return jsonResponse(res, 200, {
            status: 'ok',
            version: BRIDGE_VERSION,
            timestamp: new Date().toISOString(),
            players: GetNumPlayerIndices(),
            resources: GetNumResources(),
        });
    }

    // ─── GET /panel_bridge/players ───
    if (path === '/panel_bridge/players' && req.method === 'GET') {
        const playerIndices = getPlayerList();
        const players = [];

        for (const idx of playerIndices) {
            const id = parseInt(idx);
            players.push({
                id,
                name: GetPlayerName(id) || 'Unknown',
                identifiers: getPlayerIdentifiers(id),
                ping: GetPlayerPing(id) || 0,
            });
        }

        return jsonResponse(res, 200, players);
    }

    // ─── GET /panel_bridge/resources ───
    if (path === '/panel_bridge/resources' && req.method === 'GET') {
        const count = GetNumResources();
        const resources = [];

        for (let i = 0; i < count; i++) {
            const name = GetResourceByFindIndex(i);
            if (name) {
                resources.push({
                    name,
                    state: GetResourceState(name),
                });
            }
        }

        return jsonResponse(res, 200, resources);
    }

    // ─── POST /panel_bridge/command ───
    if (path === '/panel_bridge/command' && req.method === 'POST') {
        req.setDataHandler((body) => {
            try {
                const data = JSON.parse(body);

                if (!data.command || typeof data.command !== 'string') {
                    return jsonResponse(res, 400, { error: 'Missing or invalid "command" field' });
                }

                // Validate against allowlist
                const cmdBase = data.command.trim().split(/\s+/)[0].toLowerCase();

                if (!ALLOWED_COMMANDS.includes(cmdBase)) {
                    return jsonResponse(res, 403, {
                        error: 'Command not in allowlist',
                        command: cmdBase,
                        allowed: ALLOWED_COMMANDS,
                    });
                }

                // Execute the command (documented API)
                ExecuteCommand(data.command);

                return jsonResponse(res, 200, {
                    success: true,
                    command: data.command,
                    executedAt: new Date().toISOString(),
                });
            } catch (e) {
                return jsonResponse(res, 400, { error: 'Invalid JSON body' });
            }
        });
        return;
    }

    // ─── POST /panel_bridge/kick ───
    if (path === '/panel_bridge/kick' && req.method === 'POST') {
        req.setDataHandler((body) => {
            try {
                const data = JSON.parse(body);

                if (data.playerId === undefined || data.playerId === null) {
                    return jsonResponse(res, 400, { error: 'Missing "playerId" field' });
                }

                const reason = typeof data.reason === 'string' ? data.reason : 'Kicked by admin panel';

                // DropPlayer is a documented native function
                DropPlayer(data.playerId.toString(), reason);

                return jsonResponse(res, 200, {
                    success: true,
                    playerId: data.playerId,
                    reason,
                });
            } catch (e) {
                return jsonResponse(res, 400, { error: 'Invalid JSON body' });
            }
        });
        return;
    }

    // ─── GET /panel_bridge/info ───
    // Alternative to /info.json when sv_requestParanoia blocks it
    if (path === '/panel_bridge/info' && req.method === 'GET') {
        return jsonResponse(res, 200, {
            players: GetNumPlayerIndices(),
            resources: GetNumResources(),
            timestamp: new Date().toISOString(),
        });
    }

    // 404 for unknown paths
    jsonResponse(res, 404, { error: 'Not found' });
});

console.log('^2[panel_bridge] SaifControl Bridge loaded successfully (v' + BRIDGE_VERSION + ')^0');
