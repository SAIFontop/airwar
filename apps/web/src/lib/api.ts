type ApiResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
    ok?: boolean;
};

class ApiClient {
    private accessToken: string | null = null;
    private refreshTokenValue: string | null = null;
    private onUnauthorized?: () => void;

    setTokens(access: string, refresh: string) {
        this.accessToken = access;
        this.refreshTokenValue = refresh;
        if (typeof window !== 'undefined') {
            localStorage.setItem('sc_access', access);
            localStorage.setItem('sc_refresh', refresh);
        }
    }

    loadTokens() {
        if (typeof window !== 'undefined') {
            this.accessToken = localStorage.getItem('sc_access');
            this.refreshTokenValue = localStorage.getItem('sc_refresh');
        }
    }

    clearTokens() {
        this.accessToken = null;
        this.refreshTokenValue = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('sc_access');
            localStorage.removeItem('sc_refresh');
        }
    }

    getAccessToken() {
        return this.accessToken;
    }

    setOnUnauthorized(fn: () => void) {
        this.onUnauthorized = fn;
    }

    private async request<T>(
        method: string,
        path: string,
        body?: unknown,
        skipAuth = false,
    ): Promise<ApiResponse<T>> {
        const headers: Record<string, string> = {};
        if (body !== undefined) {
            headers['Content-Type'] = 'application/json';
        }
        if (!skipAuth && this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        try {
            let res = await fetch(path, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            if (res.status === 401 && !skipAuth && this.refreshTokenValue) {
                const refreshed = await this.tryRefresh();
                if (refreshed) {
                    headers['Authorization'] = `Bearer ${this.accessToken}`;
                    res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
                } else {
                    this.clearTokens();
                    this.onUnauthorized?.();
                    return { success: false, error: 'انتهت الجلسة' };
                }
            }

            if (res.status === 401) {
                this.clearTokens();
                this.onUnauthorized?.();
                return { success: false, error: 'غير مصرح' };
            }

            return await res.json();
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'خطأ في الاتصال' };
        }
    }

    private async tryRefresh(): Promise<boolean> {
        if (!this.refreshTokenValue || !this.accessToken) return false;
        try {
            const res = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`,
                },
                body: JSON.stringify({ refreshToken: this.refreshTokenValue }),
            });
            const data = await res.json();
            if (data.success && data.data?.accessToken) {
                this.accessToken = data.data.accessToken;
                if (typeof window !== 'undefined') {
                    localStorage.setItem('sc_access', this.accessToken!);
                }
                return true;
            }
        } catch { /* ignore */ }
        return false;
    }

    // ─── Auth ───
    async login(username: string, password: string, totpCode?: string) {
        return this.request<{ accessToken: string; refreshToken: string; user: Record<string, unknown> }>(
            'POST', '/api/auth/login', { username, password, totpCode }, true,
        );
    }

    async getMe() {
        return this.request<{ sub: string; role: string; username: string }>('GET', '/api/auth/me');
    }

    async logout() {
        const result = await this.request('POST', '/api/auth/logout', { refreshToken: this.refreshTokenValue });
        this.clearTokens();
        return result;
    }

    async setup2FA() {
        return this.request<{ secret: string; otpauth: string; qrCode?: string }>('POST', '/api/auth/2fa/setup');
    }

    async confirm2FA(code: string) {
        return this.request<{ success: boolean }>('POST', '/api/auth/2fa/confirm', { code });
    }

    // ─── Setup ───
    async getSetupStatus() {
        return this.request<{ setupCompleted: boolean; currentStep: number }>('GET', '/api/setup/status');
    }

    async scanForServer() {
        return this.request<{ candidates: Array<{ binariesPath: string; serverDataPath: string | null; confidence: number; details: string }> }>('POST', '/api/setup/scan');
    }

    async validatePaths(binariesPath: string, serverDataPath: string) {
        return this.request<{ binariesChecks: Check[]; dataChecks: Check[] }>('POST', '/api/setup/validate-paths', { binariesPath, serverDataPath });
    }

    async analyzeCfg(serverDataPath: string) {
        return this.request<{ parsed: Record<string, unknown>; checks: Check[] }>('POST', '/api/setup/analyze-cfg', { serverDataPath });
    }

    async checkPorts(port: number) {
        return this.request<{ checks: Check[] }>('POST', '/api/setup/check-ports', { port });
    }

    async detectTxAdmin(serverDataPath: string) {
        return this.request<{ detected: boolean; txDataPath: string | null; txAdminPort: number | null; details: string[] }>('POST', '/api/setup/detect-txadmin', { serverDataPath });
    }

    async testInfoJson(port: number) {
        return this.request<{ status: string; message: string; serverInfo?: Record<string, unknown> }>('POST', '/api/setup/test-info-json', { port });
    }

    async installBridge(serverDataPath: string) {
        return this.request<{ checks: Check[]; bridgeToken: string }>('POST', '/api/setup/install-bridge', { serverDataPath });
    }

    async autoFix(fixId: string, serverDataPath: string, binariesPath?: string) {
        return this.request<{ results: Check[] }>('POST', '/api/setup/auto-fix', { fixId, serverDataPath, binariesPath });
    }

    async saveProfile(data: Record<string, unknown>) {
        return this.request<{ profile: Record<string, unknown> }>('POST', '/api/setup/save-profile', data);
    }

    async completeSetup(username: string, password: string) {
        return this.request<{ user: Record<string, unknown> }>('POST', '/api/setup/complete', { username, password });
    }

    // ─── Server ───
    async getServerStatus() {
        return this.request<{ status: string; info: Record<string, unknown> | null }>('GET', '/api/server/status');
    }

    async startServer() {
        return this.request<{ status: string }>('POST', '/api/server/start');
    }

    async stopServer() {
        return this.request<{ status: string }>('POST', '/api/server/stop');
    }

    async restartServer() {
        return this.request<{ status: string }>('POST', '/api/server/restart');
    }

    async sendCommand(command: string) {
        return this.request<{ success: boolean; data?: Record<string, unknown> }>('POST', '/api/server/command', { command });
    }

    async getConsole() {
        return this.request<{ lines: string[] }>('GET', '/api/server/console');
    }

    // ─── Metrics ───
    async getMetrics() {
        return this.request<{
            cpuPercent: number;
            memoryUsedMb: number;
            memoryTotalMb: number;
            diskUsedGb: number;
            diskTotalGb: number;
            networkRxBytes: number;
            networkTxBytes: number;
            uptime: number;
        }>('GET', '/api/metrics');
    }

    // ─── Players ───
    async getPlayers() {
        return this.request<Array<{ id: number; name: string; identifiers: string[]; ping: number }>>('GET', '/api/players');
    }

    async kickPlayer(playerId: number, reason?: string) {
        return this.request<{ success: boolean }>('POST', '/api/players/kick', { playerId, reason });
    }

    // ─── Resources ───
    async getResources() {
        return this.request<Array<{ name: string; status: string; description?: string; version?: string; author?: string }>>('GET', '/api/resources');
    }

    async resourceAction(name: string, action: 'start' | 'stop' | 'ensure' | 'restart') {
        return this.request<{ success: boolean }>('POST', '/api/resources/action', { name, action });
    }

    // ─── Backups ───
    async getBackups() {
        return this.request<Array<{ id: string; profileId: string; filename: string; size: number; type: string; createdAt: string }>>('GET', '/api/backups');
    }

    async createBackup() {
        return this.request<{ id: string; filename: string; size: number; type: string; createdAt: string }>('POST', '/api/backups/create');
    }

    async restoreBackup(backupId: string) {
        return this.request<{ success: boolean }>('POST', '/api/backups/restore', { backupId });
    }

    async deleteBackup(backupId: string) {
        return this.request<{ success: boolean }>('DELETE', `/api/backups/${backupId}`);
    }

    // ─── Automation ───
    async getAutomationRules() {
        return this.request<Array<Record<string, unknown>>>('GET', '/api/automation/rules');
    }

    async upsertAutomationRule(rule: Record<string, unknown>) {
        return this.request<Record<string, unknown>>('POST', '/api/automation/rules', rule);
    }

    async deleteAutomationRule(ruleId: string) {
        return this.request<{ success: boolean }>('DELETE', `/api/automation/rules/${ruleId}`);
    }

    // ─── Audit ───
    async getAuditLog(limit = 200) {
        return this.request<Array<{ timestamp: string; userId: string | null; action: string; details?: Record<string, unknown>; ip?: string }>>('GET', `/api/audit?limit=${limit}`);
    }

    // ─── Users ───
    async getUsers() {
        return this.request<Array<Record<string, unknown>>>('GET', '/api/users');
    }

    // ─── Profiles ───
    async getProfiles() {
        return this.request<{ activeProfileId: string | null; profiles: Array<Record<string, unknown>> }>('GET', '/api/profiles');
    }

    // ─── Plugins ───
    async getPlugins() {
        return this.request<Array<{ id: string; manifest: { name: string; version: string; description?: string; author?: string }; status: string; error?: string }>>('GET', '/plugins');
    }

    async discoverPlugins() {
        return this.request<Array<Record<string, unknown>>>('POST', '/plugins/discover');
    }

    async startPlugin(id: string) {
        return this.request<{ ok: boolean }>('POST', `/plugins/${id}/start`);
    }

    async stopPlugin(id: string) {
        return this.request<{ ok: boolean }>('POST', `/plugins/${id}/stop`);
    }
}

export type Check = { id: string; label: string; status: string; message: string; details?: string; autoFixAvailable: boolean };

export const api = new ApiClient();
