import { create } from 'zustand';

// ─── Server Store ──────────────────────────────────────────────
interface ServerState {
    servers: ServerData[];
    activeServerId: string | null;
    setServers: (servers: ServerData[]) => void;
    setActiveServer: (id: string | null) => void;
    updateServer: (id: string, data: Partial<ServerData>) => void;
}

export interface ServerData {
    id: string;
    name: string;
    hostname: string;
    port: number;
    status: string;
    playersOnline: number;
    maxPlayers: number;
    cpu: number;
    memory: number;
    tickRate: number;
    uptime: number;
    tags: string[];
}

export const useServerStore = create<ServerState>((set) => ({
    servers: [],
    activeServerId: null,
    setServers: (servers) => set({ servers }),
    setActiveServer: (id) => set({ activeServerId: id }),
    updateServer: (id, data) =>
        set((state) => ({
            servers: state.servers.map((s) => (s.id === id ? { ...s, ...data } : s)),
        })),
}));

// ─── UI Store ──────────────────────────────────────────────────
interface UIState {
    sidebarCollapsed: boolean;
    commandPaletteOpen: boolean;
    toggleSidebar: () => void;
    setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarCollapsed: false,
    commandPaletteOpen: false,
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));

// ─── Auth Store ────────────────────────────────────────────────
interface AuthState {
    user: {
        id: string;
        username: string;
        email: string;
        role: string;
        avatar?: string;
    } | null;
    token: string | null;
    setAuth: (user: AuthState['user'], token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    setAuth: (user, token) => set({ user, token }),
    logout: () => set({ user: null, token: null }),
}));

// ─── Console Store ─────────────────────────────────────────────
interface ConsoleState {
    lines: ConsoleLineData[];
    addLine: (line: ConsoleLineData) => void;
    addLines: (lines: ConsoleLineData[]) => void;
    clear: () => void;
}

export interface ConsoleLineData {
    id: string;
    timestamp: number;
    content: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    source?: string;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
    lines: [],
    addLine: (line) =>
        set((s) => ({
            lines: [...s.lines.slice(-4999), line],
        })),
    addLines: (lines) =>
        set((s) => ({
            lines: [...s.lines, ...lines].slice(-5000),
        })),
    clear: () => set({ lines: [] }),
}));

// ─── Alert Store ───────────────────────────────────────────────
interface AlertState {
    alerts: AlertData[];
    setAlerts: (alerts: AlertData[]) => void;
    addAlert: (alert: AlertData) => void;
    acknowledgeAlert: (id: string) => void;
}

export interface AlertData {
    id: string;
    serverId: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    timestamp: number;
    acknowledged: boolean;
}

export const useAlertStore = create<AlertState>((set) => ({
    alerts: [],
    setAlerts: (alerts) => set({ alerts }),
    addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts] })),
    acknowledgeAlert: (id) =>
        set((s) => ({
            alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
        })),
}));
