const API_BASE = '/api';

interface FetchOptions extends RequestInit {
    token?: string;
}

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
    const { token, headers: extraHeaders, ...rest } = opts;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((extraHeaders as Record<string, string>) || {}),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { headers, ...rest });
    const json = await res.json();

    if (!res.ok) {
        throw new ApiError(json.error || res.statusText, res.status, json);
    }

    return json as T;
}

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public body?: unknown,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// ─── Setup Wizard ───

export const setupApi = {
    getStatus: () => request<{ completed: boolean; currentStep: number }>('/setup/status'),
    scan: () => request<{ results: unknown[] }>('/setup/scan', { method: 'POST' }),
    validatePaths: (binPath: string, dataPath: string) =>
        request('/setup/validate-paths', {
            method: 'POST',
            body: JSON.stringify({ binariesPath: binPath, serverDataPath: dataPath }),
        }),
    analyzeCfg: (cfgPath: string) =>
        request('/setup/analyze-cfg', {
            method: 'POST',
            body: JSON.stringify({ cfgPath }),
        }),
    checkPorts: (ports: { tcp: number; udp: number }) =>
        request('/setup/check-ports', {
            method: 'POST',
            body: JSON.stringify(ports),
        }),
    detectTxAdmin: (basePath: string) =>
        request('/setup/detect-txadmin', {
            method: 'POST',
            body: JSON.stringify({ basePath }),
        }),
    testInfoJson: (host: string, port: number) =>
        request('/setup/test-info-json', {
            method: 'POST',
            body: JSON.stringify({ host, port }),
        }),
    installBridge: (serverDataPath: string) =>
        request('/setup/install-bridge', {
            method: 'POST',
            body: JSON.stringify({ serverDataPath }),
        }),
    autoFix: (fixes: string[]) =>
        request('/setup/auto-fix', {
            method: 'POST',
            body: JSON.stringify({ fixes }),
        }),
    createSystemdUnit: (data: { binPath: string; dataPath: string; user: string }) =>
        request('/setup/create-systemd-unit', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    saveProfile: (profile: { name: string; binariesPath: string; serverDataPath: string; cfgPath: string; managementMode: string }) =>
        request('/setup/save-profile', {
            method: 'POST',
            body: JSON.stringify(profile),
        }),
    complete: () => request('/setup/complete', { method: 'POST' }),
};

// ─── Auth ───

export const authApi = {
    login: (username: string, password: string, totp?: string) =>
        request<{ accessToken: string; refreshToken: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password, totp }),
        }),
    refresh: (refreshToken: string) =>
        request<{ accessToken: string }>('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        }),
    me: (token: string) =>
        request<{ id: string; username: string; role: string }>('/auth/me', { token }),
    logout: (token: string) =>
        request('/auth/logout', { method: 'POST', token }),
};

// ─── Dashboard (requires token) ───

export const serverApi = {
    status: (token: string) =>
        request<{ status: string; info: unknown }>('/server/status', { token }),
    start: (token: string) =>
        request('/server/start', { method: 'POST', token }),
    stop: (token: string) =>
        request('/server/stop', { method: 'POST', token }),
    restart: (token: string) =>
        request('/server/restart', { method: 'POST', token }),
    command: (token: string, cmd: string) =>
        request('/server/command', { method: 'POST', token, body: JSON.stringify({ command: cmd }) }),
};

export const metricsApi = {
    get: (token: string) => request<unknown>('/metrics/system', { token }),
};

export const playersApi = {
    list: (token: string) => request<unknown[]>('/players', { token }),
    kick: (token: string, playerId: number, reason?: string) =>
        request('/players/kick', { method: 'POST', token, body: JSON.stringify({ playerId, reason }) }),
};

export const resourcesApi = {
    list: (token: string) => request<unknown[]>('/resources', { token }),
    action: (token: string, name: string, action: 'start' | 'stop' | 'restart') =>
        request('/resources/action', { method: 'POST', token, body: JSON.stringify({ name, action }) }),
};

export const backupsApi = {
    list: (token: string) => request<unknown[]>('/backups', { token }),
    create: (token: string, label?: string) =>
        request('/backups', { method: 'POST', token, body: JSON.stringify({ label }) }),
    restore: (token: string, id: string) =>
        request(`/backups/${encodeURIComponent(id)}/restore`, { method: 'POST', token }),
    remove: (token: string, id: string) =>
        request(`/backups/${encodeURIComponent(id)}`, { method: 'DELETE', token }),
};

export const automationApi = {
    list: (token: string) => request<unknown[]>('/automation', { token }),
    create: (token: string, rule: unknown) =>
        request('/automation', { method: 'POST', token, body: JSON.stringify(rule) }),
    update: (token: string, id: string, rule: unknown) =>
        request(`/automation/${encodeURIComponent(id)}`, { method: 'PUT', token, body: JSON.stringify(rule) }),
    remove: (token: string, id: string) =>
        request(`/automation/${encodeURIComponent(id)}`, { method: 'DELETE', token }),
};

export const auditApi = {
    list: (token: string, limit = 50) =>
        request<unknown[]>(`/audit?limit=${limit}`, { token }),
};

export const usersApi = {
    list: (token: string) => request<unknown[]>('/users', { token }),
};

// ─── Plugins ───

export const pluginsApi = {
    list: (token: string) => request<{ ok: boolean; data: unknown[] }>('/plugins', { token }),
    discover: (token: string) => request<{ ok: boolean; data: unknown[] }>('/plugins/discover', { method: 'POST', token }),
    get: (id: string, token: string) => request<{ ok: boolean; data: unknown }>(`/plugins/${encodeURIComponent(id)}`, { token }),
    start: (id: string, token: string) => request<{ ok: boolean }>(`/plugins/${encodeURIComponent(id)}/start`, { method: 'POST', token }),
    stop: (id: string, token: string) => request<{ ok: boolean }>(`/plugins/${encodeURIComponent(id)}/stop`, { method: 'POST', token }),
};
