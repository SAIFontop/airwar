import { create } from 'zustand'

export interface Contact {
    aeid: string
    bearing: number
    distance: number
    altitude: number
    iff: 'friendly' | 'hostile' | 'unknown'
    type: string
    speed: number
    locked: boolean
    locking: boolean
}

export interface RwrWarning {
    type: string
    lock_state: string
    direction: number
}

export interface KillFeedEntry {
    killer: string
    victim: string
    weapon: string
    timestamp: number
}

export interface FlightData {
    speed: number
    altitude: number
    heading: number
    fuel: number
    throttle: number
    gforce: number
    health_zones: Record<string, number>
    warnings: string[]
}

export interface MissionData {
    id: number
    type: string
    display_name: string
    objectives: Array<{ desc: string; current?: number; target?: number; complete?: boolean }>
    rewards: { credits: number; faction_score: number }
}

export interface WarState {
    phase: string
    round: number
    scores: Record<string, number>
    territory: Record<string, number>
}

export interface Store {
    // HUD visibility
    hudVisible: boolean

    // Panel visibility
    panels: Record<string, boolean>

    // Flight data
    flight: FlightData

    // Radar
    contacts: Contact[]
    lockState: string | null
    lockTarget: string | null
    lockProgress: number
    rwr: RwrWarning[]

    // Kill feed
    killFeed: KillFeedEntry[]

    // War
    war: WarState

    // Missions
    activeMissions: MissionData[]
    currentMission: MissionData | null

    // Respawn
    respawn: {
        show: boolean
        timer: number
        selecting: boolean
        base: { id: string; name: string } | null
    }

    // Loadout (hardpoints, ammo, CMs)
    loadout: {
        hardpoints: Array<{ slot: number; weapon: string; ammo: number; max_ammo: number }>
        selectedSlot: number
        flares: number
        chaff: number
    }

    // Squadron
    squadron: {
        id: number | null
        members: Array<{ awid: string; callsign: string; slot: number }>
        formation: string | null
    }

    // Scoreboard
    scoreboard: Array<{ awid: string; callsign: string; faction: string; kills: number; deaths: number; score: number }>

    // Dashboard / profile
    profile: {
        callsign: string
        rank: string
        faction: string
        balance: number
        kills: number
        deaths: number
        sorties: number
    }

    // Actions
    setHudVisible: (v: boolean) => void
    setPanel: (panel: string, visible: boolean) => void
    updateFlight: (data: Partial<FlightData>) => void
    setContacts: (contacts: Contact[]) => void
    setLock: (state: string | null, target: string | null, progress: number) => void
    setRwr: (rwr: RwrWarning[]) => void
    addKillFeedEntry: (entry: KillFeedEntry) => void
    setWar: (war: Partial<WarState>) => void
    setMissions: (missions: MissionData[]) => void
    setCurrentMission: (mission: MissionData | null) => void
    setRespawn: (respawn: Partial<Store['respawn']>) => void
    setLoadout: (loadout: Partial<Store['loadout']>) => void
    setSquadron: (squadron: Partial<Store['squadron']>) => void
    setScoreboard: (scoreboard: Store['scoreboard']) => void
    setProfile: (profile: Partial<Store['profile']>) => void
}

export const useStore = create<Store>((set) => ({
    hudVisible: false,
    panels: {},
    flight: {
        speed: 0, altitude: 0, heading: 0, fuel: 100,
        throttle: 0, gforce: 1, health_zones: {}, warnings: [],
    },
    contacts: [],
    lockState: null,
    lockTarget: null,
    lockProgress: 0,
    rwr: [],
    killFeed: [],
    war: { phase: 'ceasefire', round: 1, scores: {}, territory: {} },
    activeMissions: [],
    currentMission: null,
    respawn: { show: false, timer: 0, selecting: false, base: null },
    loadout: { hardpoints: [], selectedSlot: 0, flares: 0, chaff: 0 },
    squadron: { id: null, members: [], formation: null },
    scoreboard: [],
    profile: { callsign: '', rank: '', faction: '', balance: 0, kills: 0, deaths: 0, sorties: 0 },

    setHudVisible: (v) => set({ hudVisible: v }),
    setPanel: (panel, visible) => set((s) => ({ panels: { ...s.panels, [panel]: visible } })),
    updateFlight: (data) => set((s) => ({ flight: { ...s.flight, ...data } })),
    setContacts: (contacts) => set({ contacts }),
    setLock: (state, target, progress) => set({ lockState: state, lockTarget: target, lockProgress: progress }),
    setRwr: (rwr) => set({ rwr }),
    addKillFeedEntry: (entry) => set((s) => ({
        killFeed: [entry, ...s.killFeed].slice(0, 10),
    })),
    setWar: (war) => set((s) => ({ war: { ...s.war, ...war } })),
    setMissions: (missions) => set({ activeMissions: missions }),
    setCurrentMission: (mission) => set({ currentMission: mission }),
    setRespawn: (respawn) => set((s) => ({ respawn: { ...s.respawn, ...respawn } })),
    setLoadout: (loadout) => set((s) => ({ loadout: { ...s.loadout, ...loadout } })),
    setSquadron: (squadron) => set((s) => ({ squadron: { ...s.squadron, ...squadron } })),
    setScoreboard: (scoreboard) => set({ scoreboard }),
    setProfile: (profile) => set((s) => ({ profile: { ...s.profile, ...profile } })),
}))
