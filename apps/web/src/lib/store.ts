'use client';

import { create } from 'zustand';
import { api } from './api';

interface User {
    sub: string;
    role: string;
    username: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string, totpCode?: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<boolean>;
    setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (username, password, totpCode) => {
        const res = await api.login(username, password, totpCode);
        if (res.success && res.data) {
            api.setTokens(res.data.accessToken, res.data.refreshToken);
            const me = await api.getMe();
            if (me.success && me.data) {
                set({ user: me.data, isAuthenticated: true, isLoading: false });
                return { success: true };
            }
        }
        return { success: false, error: res.error || 'فشل تسجيل الدخول' };
    },

    logout: async () => {
        await api.logout();
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        api.loadTokens();
        if (!api.getAccessToken()) {
            set({ isLoading: false, isAuthenticated: false });
            return false;
        }
        const res = await api.getMe();
        if (res.success && res.data) {
            set({ user: res.data, isAuthenticated: true, isLoading: false });
            return true;
        }
        api.clearTokens();
        set({ user: null, isAuthenticated: false, isLoading: false });
        return false;
    },

    setUser: (user) => set({ user, isAuthenticated: !!user }),
}));

interface AppState {
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    sidebarCollapsed: false,
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
}));

interface WsState {
    connected: boolean;
    serverStatus: string;
    latestMetrics: Record<string, number> | null;
    consoleLine: string | null;
    metricsHistory: Array<Record<string, number>>;
}

export const useWsStore = create<WsState>(() => ({
    connected: false,
    serverStatus: 'unknown',
    latestMetrics: null,
    consoleLine: null,
    metricsHistory: [],
}));

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 2000;

export function connectWs(token: string) {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const port = '4800';
    const url = `${protocol}://${host}:${port}/ws?token=${encodeURIComponent(token)}`;

    ws = new WebSocket(url);

    ws.onopen = () => {
        useWsStore.setState({ connected: true });
        reconnectDelay = 2000;
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            switch (msg.event) {
                case 'server:status':
                    useWsStore.setState({ serverStatus: msg.data?.status || 'unknown' });
                    break;
                case 'server:metrics':
                    useWsStore.setState((s) => ({
                        latestMetrics: msg.data,
                        metricsHistory: [...s.metricsHistory.slice(-59), { ...msg.data, ts: Date.now() }],
                    }));
                    break;
                case 'console:line':
                    useWsStore.setState({ consoleLine: msg.data?.line || '' });
                    break;
            }
        } catch { /* ignore malformed messages */ }
    };

    ws.onclose = () => {
        useWsStore.setState({ connected: false });
        ws = null;
        reconnectTimer = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 1.5, 30000);
            connectWs(token);
        }, reconnectDelay);
    };

    ws.onerror = () => {
        ws?.close();
    };
}

export function disconnectWs() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    if (ws) {
        ws.onclose = null;
        ws.close();
        ws = null;
    }
    useWsStore.setState({ connected: false });
}
