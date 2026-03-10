'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// ─── Server ───
export function useServerStatus() {
    return useQuery({
        queryKey: ['server-status'],
        queryFn: async () => {
            const res = await api.getServerStatus();
            if (!res.success) throw new Error(res.error);
            return res.data!;
        },
        refetchInterval: 10000,
    });
}

export function useServerControl() {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: ['server-status'] });

    const start = useMutation({ mutationFn: () => api.startServer(), onSuccess: invalidate });
    const stop = useMutation({ mutationFn: () => api.stopServer(), onSuccess: invalidate });
    const restart = useMutation({ mutationFn: () => api.restartServer(), onSuccess: invalidate });
    const command = useMutation({ mutationFn: (cmd: string) => api.sendCommand(cmd) });

    return { start, stop, restart, command };
}

export function useConsole() {
    return useQuery({
        queryKey: ['console'],
        queryFn: async () => {
            const res = await api.getConsole();
            if (!res.success) throw new Error(res.error);
            return res.data!;
        },
    });
}

// ─── Metrics ───
export function useMetrics() {
    return useQuery({
        queryKey: ['metrics'],
        queryFn: async () => {
            const res = await api.getMetrics();
            if (!res.success) throw new Error(res.error);
            return res.data!;
        },
        refetchInterval: 5000,
    });
}

// ─── Players ───
export function usePlayers() {
    return useQuery({
        queryKey: ['players'],
        queryFn: async () => {
            const res = await api.getPlayers();
            if (!res.success) throw new Error(res.error);
            return res.data || [];
        },
        refetchInterval: 10000,
    });
}

export function useKickPlayer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: { playerId: number; reason?: string }) => api.kickPlayer(args.playerId, args.reason),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
    });
}

// ─── Resources ───
export function useResources() {
    return useQuery({
        queryKey: ['resources'],
        queryFn: async () => {
            const res = await api.getResources();
            if (!res.success) throw new Error(res.error);
            return res.data || [];
        },
    });
}

export function useResourceAction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: { name: string; action: 'start' | 'stop' | 'ensure' | 'restart' }) => api.resourceAction(args.name, args.action),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
    });
}

// ─── Backups ───
export function useBackups() {
    return useQuery({
        queryKey: ['backups'],
        queryFn: async () => {
            const res = await api.getBackups();
            if (!res.success) throw new Error(res.error);
            return res.data || [];
        },
    });
}

export function useCreateBackup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => api.createBackup(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['backups'] }),
    });
}

export function useRestoreBackup() {
    return useMutation({
        mutationFn: (backupId: string) => api.restoreBackup(backupId),
    });
}

export function useDeleteBackup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (backupId: string) => api.deleteBackup(backupId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['backups'] }),
    });
}

// ─── Automation ───
export function useAutomationRules() {
    return useQuery({
        queryKey: ['automation-rules'],
        queryFn: async () => {
            const res = await api.getAutomationRules();
            if (!res.success) throw new Error(res.error);
            return res.data || [];
        },
    });
}

export function useUpsertRule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (rule: Record<string, unknown>) => api.upsertAutomationRule(rule),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['automation-rules'] }),
    });
}

export function useDeleteRule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.deleteAutomationRule(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['automation-rules'] }),
    });
}

// ─── Audit ───
export function useAuditLog(limit = 200) {
    return useQuery({
        queryKey: ['audit', limit],
        queryFn: async () => {
            const res = await api.getAuditLog(limit);
            if (!res.success) throw new Error(res.error);
            return res.data || [];
        },
    });
}

// ─── Profiles ───
export function useProfiles() {
    return useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const res = await api.getProfiles();
            if (!res.success) throw new Error(res.error);
            return res.data!;
        },
    });
}

// ─── Plugins ───
export function usePlugins() {
    return useQuery({
        queryKey: ['plugins'],
        queryFn: async () => {
            const res = await api.getPlugins();
            if (!res.success && !res.ok) throw new Error(res.error);
            return res.data || [];
        },
    });
}

export function usePluginControl() {
    const qc = useQueryClient();
    const startP = useMutation({
        mutationFn: (id: string) => api.startPlugin(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['plugins'] }),
    });
    const stopP = useMutation({
        mutationFn: (id: string) => api.stopPlugin(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['plugins'] }),
    });
    const discover = useMutation({
        mutationFn: () => api.discoverPlugins(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['plugins'] }),
    });
    return { startPlugin: startP, stopPlugin: stopP, discover };
}

// ─── Users ───
export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.getUsers();
            if (!res.success) throw new Error(res.error);
            return res.data || [];
        },
    });
}

export function useCreateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: { username: string; password: string; role: string }) =>
            api.createUser(args.username, args.password, args.role),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    });
}

export function useDeleteUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => api.deleteUser(userId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    });
}

// ─── Bans ───
export function useBans() {
    return useQuery({
        queryKey: ['bans'],
        queryFn: async () => {
            const res = await api.getBans();
            if (!res.success) throw new Error(res.error);
            return res.data || [];
        },
    });
}

export function useCreateBan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { playerName: string; identifiers: string[]; reason: string; duration?: number }) =>
            api.createBan(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['bans'] });
            qc.invalidateQueries({ queryKey: ['players'] });
        },
    });
}

export function useDeleteBan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (banId: string) => api.deleteBan(banId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['bans'] }),
    });
}

// ─── Server Config ───
export function useServerConfig() {
    return useQuery({
        queryKey: ['server-config'],
        queryFn: async () => {
            const res = await api.getServerConfig();
            if (!res.success) throw new Error(res.error);
            return res.data!;
        },
        enabled: false, // load on demand
    });
}

export function useSaveServerConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (content: string) => api.saveServerConfig(content),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['server-config'] }),
    });
}

// ─── Webhooks ───
export function useWebhooks() {
    return useQuery({
        queryKey: ['webhooks'],
        queryFn: async () => {
            const res = await api.getWebhooks();
            if (!res.success) throw new Error(res.error);
            return res.data!;
        },
    });
}

export function useSaveWebhooks() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (discord: { enabled: boolean; url: string; events: string[] }) =>
            api.saveWebhooks(discord),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
    });
}

export function useTestWebhook() {
    return useMutation({
        mutationFn: () => api.testWebhook(),
    });
}

// ─── Alerts ───
export function useAlerts() {
    return useQuery({
        queryKey: ['alerts'],
        queryFn: async () => {
            const res = await api.getAlerts();
            if (!res.success) throw new Error(res.error);
            return res.data || [];
        },
        refetchInterval: 30000,
    });
}

export function useAcknowledgeAlert() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.acknowledgeAlert(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
    });
}

export function useAcknowledgeAllAlerts() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => api.acknowledgeAllAlerts(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
    });
}

export function useClearAlerts() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => api.clearAlerts(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
    });
}

// ─── Profile Switching ───
export function useSwitchProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (profileId: string) => api.switchProfile(profileId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
    });
}

// ─── Setup ───
export function useSetupStatus() {
    return useQuery({
        queryKey: ['setup-status'],
        queryFn: async () => {
            const res = await api.getSetupStatus();
            if (!res.success) throw new Error(res.error);
            return res.data!;
        },
    });
}
