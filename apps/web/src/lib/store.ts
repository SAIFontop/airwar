import { create } from 'zustand';

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: { id: string; username: string; role: string } | null;
    setTokens: (access: string, refresh: string) => void;
    setUser: (user: AuthState['user']) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null,
    refreshToken: typeof window !== 'undefined' ? sessionStorage.getItem('refreshToken') : null,
    user: null,
    setTokens: (access, refresh) => {
        sessionStorage.setItem('accessToken', access);
        sessionStorage.setItem('refreshToken', refresh);
        set({ accessToken: access, refreshToken: refresh });
    },
    setUser: (user) => set({ user }),
    logout: () => {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        set({ accessToken: null, refreshToken: null, user: null });
    },
}));

interface SetupState {
    currentStep: number;
    completed: boolean;
    data: Record<string, unknown>;
    setStep: (step: number) => void;
    setCompleted: (v: boolean) => void;
    setData: (key: string, value: unknown) => void;
}

export const useSetupStore = create<SetupState>((set) => ({
    currentStep: 0,
    completed: false,
    data: {},
    setStep: (step) => set({ currentStep: step }),
    setCompleted: (v) => set({ completed: v }),
    setData: (key, value) =>
        set((state) => ({ data: { ...state.data, [key]: value } })),
}));

interface AppState {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    sidebarOpen: true,
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

interface UIState {
    commandPaletteOpen: boolean;
    setCommandPaletteOpen: (open: boolean) => void;
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    commandPaletteOpen: false,
    setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    sidebarCollapsed: false,
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));

interface Alert {
    id: string;
    message: string;
    severity: string;
    acknowledged: boolean;
    createdAt: string;
}

interface AlertState {
    alerts: Alert[];
    setAlerts: (alerts: Alert[]) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
    alerts: [],
    setAlerts: (alerts) => set({ alerts }),
}));

interface ServerEntry {
    id: string;
    name: string;
    status: string;
}

interface ServerState {
    servers: ServerEntry[];
    activeServerId: string | null;
    setServers: (servers: ServerEntry[]) => void;
    setActiveServerId: (id: string | null) => void;
}

export const useServerStore = create<ServerState>((set) => ({
    servers: [],
    activeServerId: null,
    setServers: (servers) => set({ servers }),
    setActiveServerId: (id) => set({ activeServerId: id }),
}));
