import { create } from 'zustand'

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface Notification {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration: number
}

export interface ModalState {
  title: string
  content: string
  buttons?: { label: string; action: string; variant?: string }[]
}

export interface MenuItem {
  id: string
  label: string
  icon?: string
  description?: string
  disabled?: boolean
}

export interface DialogField {
  name: string
  label: string
  type: 'text' | 'number' | 'password' | 'select'
  placeholder?: string
  options?: { label: string; value: string }[]
  required?: boolean
  default?: string
}

export interface ProgressState {
  label: string
  duration: number
}

export interface HUDData {
  health: number
  armor: number
  speed: number
  altitude: number
  fuel: number
  weapon?: string
  ammo?: number
}

export interface RadarTarget {
  id: string
  x: number
  y: number
  distance: number
  type: 'friendly' | 'enemy' | 'neutral' | 'missile'
  locked?: boolean
}

export interface ScoreboardPlayer {
  name: string
  kills: number
  deaths: number
  score: number
  team: string
  ping: number
}

export interface MatchState {
  timer: number
  teams: { name: string; score: number }[]
  phase: string
}

export interface AircraftStatus {
  engine: number
  leftWing: number
  rightWing: number
  tail: number
  fuselage: number
  cockpit: number
  fuel: number
  ammo: number
  countermeasures: number
  avionics: number
}

export interface KillEntry {
  id: string
  killer: string
  victim: string
  weapon: string
  timestamp: number
}

export interface Warning {
  id: string
  type: 'missile_lock' | 'low_fuel' | 'engine_damage' | 'stall' | 'terrain' | 'custom'
  message: string
  critical: boolean
}

// ═══════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════

interface AppState {
  notifications: Notification[]
  addNotification: (n: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void

  modal: ModalState | null
  openModal: (m: ModalState) => void
  closeModal: () => void

  menu: { title: string; items: MenuItem[] } | null
  openMenu: (title: string, items: MenuItem[]) => void
  closeMenu: () => void

  context: { x: number; y: number; items: MenuItem[] } | null
  openContext: (x: number, y: number, items: MenuItem[]) => void
  closeContext: () => void

  dialog: { title: string; fields: DialogField[] } | null
  openDialog: (title: string, fields: DialogField[]) => void
  closeDialog: () => void

  progress: ProgressState | null
  showProgress: (p: ProgressState) => void
  hideProgress: () => void

  hud: HUDData
  hudVisible: boolean
  setHUD: (data: Partial<HUDData>) => void
  setHUDVisible: (v: boolean) => void

  radar: { targets: RadarTarget[]; range: number; heading: number }
  radarVisible: boolean
  setRadar: (data: { targets?: RadarTarget[]; range?: number; heading?: number }) => void
  setRadarVisible: (v: boolean) => void

  scoreboard: ScoreboardPlayer[]
  scoreboardVisible: boolean
  setScoreboard: (players: ScoreboardPlayer[]) => void
  setScoreboardVisible: (v: boolean) => void

  match: MatchState | null
  matchVisible: boolean
  setMatch: (data: MatchState | null) => void
  setMatchVisible: (v: boolean) => void

  aircraft: AircraftStatus | null
  aircraftVisible: boolean
  setAircraft: (data: AircraftStatus | null) => void
  setAircraftVisible: (v: boolean) => void

  kills: KillEntry[]
  addKill: (k: Omit<KillEntry, 'id' | 'timestamp'>) => void

  warnings: Warning[]
  addWarning: (w: Omit<Warning, 'id'>) => void
  removeWarning: (id: string) => void
  clearWarnings: () => void

  loadout: any | null
  loadoutVisible: boolean
  setLoadout: (data: any) => void
  setLoadoutVisible: (v: boolean) => void
}

let notifId = 0
let killId = 0
let warnId = 0

export const useStore = create<AppState>((set) => ({
  // Notifications
  notifications: [],
  addNotification: (n) => {
    const id = `notif-${++notifId}`
    set((s) => ({ notifications: [...s.notifications, { ...n, id }] }))
    setTimeout(() => {
      set((s) => ({ notifications: s.notifications.filter((x) => x.id !== id) }))
    }, n.duration || 3000)
  },
  removeNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((x) => x.id !== id) })),

  // Modal
  modal: null,
  openModal: (m) => set({ modal: m }),
  closeModal: () => set({ modal: null }),

  // Menu
  menu: null,
  openMenu: (title, items) => set({ menu: { title, items } }),
  closeMenu: () => set({ menu: null }),

  // Context
  context: null,
  openContext: (x, y, items) => set({ context: { x, y, items } }),
  closeContext: () => set({ context: null }),

  // Dialog
  dialog: null,
  openDialog: (title, fields) => set({ dialog: { title, fields } }),
  closeDialog: () => set({ dialog: null }),

  // Progress
  progress: null,
  showProgress: (p) => set({ progress: p }),
  hideProgress: () => set({ progress: null }),

  // HUD
  hud: { health: 100, armor: 0, speed: 0, altitude: 0, fuel: 100 },
  hudVisible: false,
  setHUD: (data) => set((s) => ({ hud: { ...s.hud, ...data } })),
  setHUDVisible: (v) => set({ hudVisible: v }),

  // Radar
  radar: { targets: [], range: 2000, heading: 0 },
  radarVisible: false,
  setRadar: (data) => set((s) => ({ radar: { ...s.radar, ...data } })),
  setRadarVisible: (v) => set({ radarVisible: v }),

  // Scoreboard
  scoreboard: [],
  scoreboardVisible: false,
  setScoreboard: (players) => set({ scoreboard: players }),
  setScoreboardVisible: (v) => set({ scoreboardVisible: v }),

  // Match
  match: null,
  matchVisible: false,
  setMatch: (data) => set({ match: data }),
  setMatchVisible: (v) => set({ matchVisible: v }),

  // Aircraft
  aircraft: null,
  aircraftVisible: false,
  setAircraft: (data) => set({ aircraft: data }),
  setAircraftVisible: (v) => set({ aircraftVisible: v }),

  // Kill Feed
  kills: [],
  addKill: (k) => {
    const entry = { ...k, id: `kill-${++killId}`, timestamp: Date.now() }
    set((s) => ({ kills: [...s.kills.slice(-9), entry] }))
  },

  // Warnings
  warnings: [],
  addWarning: (w) => {
    const id = `warn-${++warnId}`
    set((s) => ({ warnings: [...s.warnings, { ...w, id }] }))
  },
  removeWarning: (id) =>
    set((s) => ({ warnings: s.warnings.filter((w) => w.id !== id) })),
  clearWarnings: () => set({ warnings: [] }),

  // Loadout
  loadout: null,
  loadoutVisible: false,
  setLoadout: (data) => set({ loadout: data }),
  setLoadoutVisible: (v) => set({ loadoutVisible: v }),
}))
