import { create } from 'zustand'

export interface Aircraft {
    name: string
    type: string
    speed: number
    maneuver: number
    armor: number
    weapons: string
    icon: 'fighter' | 'stealth' | 'jet' | 'bomber' | 'drone' | 'cas'
}

export interface ServerStatus {
    players: number
    maxPlayers: number
    ping: number
    uptime: string
    status: 'online' | 'starting' | 'offline'
}

export interface PlayerStats {
    kills: number
    deaths: number
    flightHours: number
    bestAircraft: string
    rank: string
    wins: number
}

export interface NewsItem {
    title: string
    body: string
    date: string
    type: 'update' | 'event' | 'balance' | 'announcement'
}

export interface ControlItem {
    key: string
    action: string
    icon: string
}

export interface LoadingScreenConfig {
    title: string
    subtitle: string
    version: string
    tips: string[]
    tipRotationMs: number
    aircraft: Aircraft[]
    news: NewsItem[]
    controls: ControlItem[]
    maxPlayers: number
    showParticles: boolean
    showJetFlyby: boolean
    showMusicPlayer: boolean
    showAircraftShowcase: boolean
    showPlayerStats: boolean
    showServerInfo: boolean
    showNewsPanel: boolean
    showKeyboardShortcuts: boolean
    showTips: boolean
    musicEnabled: boolean
    musicVolume: number
    musicUrl: string
    backgroundVideo: string
}

interface LoadingState {
    config: LoadingScreenConfig
    configLoaded: boolean
    phase: number
    phaseLabel: string
    progress: number
    resourcesLoaded: number
    resourcesTotal: number
    connected: boolean
    shutdownTriggered: boolean
    serverStatus: ServerStatus
    playerStats: PlayerStats
    currentTip: number
    musicPlaying: boolean
    musicVolume: number
    currentAircraft: number

    loadConfig: () => Promise<void>
    setPhase: (phase: number, label: string) => void
    setProgress: (n: number) => void
    setResources: (loaded: number, total: number) => void
    setConnected: (v: boolean) => void
    triggerShutdown: () => void
    setServerStatus: (s: Partial<ServerStatus>) => void
    nextTip: () => void
    toggleMusic: () => void
    setMusicVolume: (v: number) => void
    nextAircraft: () => void
    prevAircraft: () => void
}

export const DEFAULT_TIPS = [
    'Use flares (G) to break missile locks',
    'Stay above enemies for a tactical advantage',
    'High speed helps avoid radar locks',
    'Use terrain for cover against missiles',
    'Switch between missiles and guns for efficiency',
    'Keep an eye on your fuel gauge',
    'Afterburner drains fuel faster — use wisely',
    'Barrel rolls can dodge incoming fire',
    'Team communication wins battles',
    'Check your radar frequently for bogeys',
    'Altitude gives you energy for maneuvers',
    'Head-on attacks are risky — approach from angles',
]

export const DEFAULT_AIRCRAFT: Aircraft[] = [
    { name: 'F-22 Raptor', type: 'Air Superiority Fighter', speed: 95, maneuver: 90, armor: 70, weapons: 'AIM-120 AMRAAM, AIM-9X, M61A2', icon: 'fighter' },
    { name: 'Su-57 Felon', type: 'Stealth Fighter', speed: 92, maneuver: 95, armor: 75, weapons: 'R-77, R-73, GSh-30-1', icon: 'stealth' },
    { name: 'F-35 Lightning', type: 'Multi-Role Stealth', speed: 88, maneuver: 80, armor: 80, weapons: 'AIM-120, GBU-31, GAU-22/A', icon: 'jet' },
    { name: 'B-2 Spirit', type: 'Strategic Bomber', speed: 60, maneuver: 30, armor: 95, weapons: 'JDAM, B83, AGM-158', icon: 'bomber' },
    { name: 'MQ-9 Reaper', type: 'Combat Drone', speed: 40, maneuver: 50, armor: 20, weapons: 'AGM-114 Hellfire, GBU-12', icon: 'drone' },
    { name: 'A-10 Warthog', type: 'Close Air Support', speed: 55, maneuver: 65, armor: 98, weapons: 'GAU-8 Avenger, AGM-65', icon: 'cas' },
]

export const DEFAULT_NEWS: NewsItem[] = [
    { title: 'New Aircraft: Su-57 Felon', body: 'The Russian stealth fighter joins the hangar. Master its unique capabilities.', date: '2026-03-12', type: 'update' },
    { title: 'Season 2 Tournament', body: 'Sign up for the upcoming dogfight tournament. Prize pool: $10,000 in-game credits.', date: '2026-03-15', type: 'event' },
    { title: 'Balance Patch v2.1', body: 'Missile tracking adjusted. Flare cooldown reduced. Gun damage rebalanced.', date: '2026-03-10', type: 'balance' },
    { title: 'Server Maintenance', body: 'Scheduled maintenance this weekend. Expect 2 hours of downtime.', date: '2026-03-14', type: 'announcement' },
]

export const DEFAULT_CONTROLS: ControlItem[] = [
    { key: 'Mouse 1', action: 'Fire Guns', icon: 'gun' },
    { key: 'Mouse 2', action: 'Lock & Fire Missile', icon: 'missile' },
    { key: 'G', action: 'Deploy Flares', icon: 'flare' },
    { key: 'R', action: 'Toggle Radar', icon: 'radar' },
    { key: 'F', action: 'Afterburner', icon: 'flame' },
    { key: 'TAB', action: 'Scoreboard', icon: 'scoreboard' },
    { key: 'E', action: 'Enter/Exit Aircraft', icon: 'jet' },
    { key: 'SHIFT', action: 'Throttle Up', icon: 'throttle' },
]

const DEFAULT_CONFIG: LoadingScreenConfig = {
    title: 'AIRWAR',
    subtitle: 'Combat Aviation Server',
    version: 'v2.0.0',
    tips: DEFAULT_TIPS,
    tipRotationMs: 6000,
    aircraft: DEFAULT_AIRCRAFT,
    news: DEFAULT_NEWS,
    controls: DEFAULT_CONTROLS,
    maxPlayers: 64,
    showParticles: true,
    showJetFlyby: true,
    showMusicPlayer: true,
    showAircraftShowcase: true,
    showPlayerStats: true,
    showServerInfo: true,
    showNewsPanel: true,
    showKeyboardShortcuts: true,
    showTips: true,
    musicEnabled: true,
    musicVolume: 0.3,
    musicUrl: '',
    backgroundVideo: '',
}

const PHASES = [
    'Initializing resources...',
    'Loading UI framework...',
    'Synchronizing player data...',
    'Loading aircraft assets...',
    'Preparing battle environment...',
    'Establishing secure connection...',
    'Calibrating radar systems...',
    'Finalizing connection...',
]

export const useStore = create<LoadingState>((set, get) => ({
    config: DEFAULT_CONFIG,
    configLoaded: false,
    phase: 0,
    phaseLabel: PHASES[0],
    progress: 0,
    resourcesLoaded: 0,
    resourcesTotal: 120,
    connected: false,
    shutdownTriggered: false,
    serverStatus: { players: 0, maxPlayers: 64, ping: 0, uptime: '0h 0m', status: 'starting' },
    playerStats: { kills: 247, deaths: 89, flightHours: 156.4, bestAircraft: 'F-22 Raptor', rank: 'Captain', wins: 42 },
    currentTip: 0,
    musicPlaying: true,
    musicVolume: 0.3,
    currentAircraft: 0,

    loadConfig: async () => {
        try {
            const res = await fetch('./config.json')
            if (res.ok) {
                const data = await res.json()
                const cfg = { ...DEFAULT_CONFIG, ...data }
                set({
                    config: cfg,
                    configLoaded: true,
                    musicPlaying: cfg.musicEnabled,
                    musicVolume: cfg.musicVolume,
                    serverStatus: { players: 0, maxPlayers: cfg.maxPlayers, ping: 0, uptime: '0h 0m', status: 'starting' },
                })
                return
            }
        } catch { /* config.json not available, use defaults */ }
        set({ configLoaded: true })
    },
    setPhase: (phase, label) => set({ phase, phaseLabel: label }),
    setProgress: (progress) => {
        const phaseIndex = Math.min(Math.floor(progress / (100 / PHASES.length)), PHASES.length - 1)
        set({ progress, phase: phaseIndex, phaseLabel: PHASES[phaseIndex] })
    },
    setResources: (loaded, total) => set({ resourcesLoaded: loaded, resourcesTotal: total }),
    setConnected: (connected) => set({ connected }),
    triggerShutdown: () => set({ shutdownTriggered: true }),
    setServerStatus: (s) => set((state) => ({ serverStatus: { ...state.serverStatus, ...s } })),
    nextTip: () => set((state) => ({ currentTip: (state.currentTip + 1) % get().config.tips.length })),
    toggleMusic: () => set((state) => ({ musicPlaying: !state.musicPlaying })),
    setMusicVolume: (v) => set({ musicVolume: v }),
    nextAircraft: () => set((state) => ({ currentAircraft: (state.currentAircraft + 1) % get().config.aircraft.length })),
    prevAircraft: () => set((state) => ({ currentAircraft: (state.currentAircraft - 1 + get().config.aircraft.length) % get().config.aircraft.length })),
}))
