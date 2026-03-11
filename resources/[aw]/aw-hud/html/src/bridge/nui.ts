import { useStore } from '../store/useStore'

type NUIMessage = {
    type: string
    data: any
}

export function initNuiBridge() {
    window.addEventListener('message', (event: MessageEvent<NUIMessage>) => {
        const { type, data } = event.data
        if (!type) return

        const store = useStore.getState()

        switch (type) {
            // Panel visibility
            case 'panel_visibility':
                store.setPanel(data.panel, data.visible)
                break

            case 'hud_visibility':
                store.setHudVisible(data.visible)
                break

            // Flight instruments
            case 'flight_data':
                store.updateFlight(data)
                break

            // Radar
            case 'radar_update':
                if (data.contacts) store.setContacts(data.contacts)
                if (data.lock_state !== undefined) store.setLock(data.lock_state, data.lock_target, data.lock_progress || 0)
                if (data.rwr) store.setRwr(data.rwr)
                break

            case 'rwr_warning':
                store.setRwr([...(useStore.getState().rwr), data])
                break

            // Kill feed
            case 'kill_feed':
                if (data.entries) {
                    for (const entry of data.entries) {
                        store.addKillFeedEntry(entry)
                    }
                } else {
                    store.addKillFeedEntry(data)
                }
                break

            // War state
            case 'war_state':
                store.setWar(data)
                break

            case 'war_phase':
                store.setWar({ phase: data.phase })
                break

            case 'war_victory':
                store.setWar({ phase: 'victory' })
                break

            // Missions
            case 'mission_available':
                store.setMissions([...useStore.getState().activeMissions, data])
                break

            case 'mission_started':
                store.setCurrentMission(data)
                break

            case 'mission_completed':
            case 'mission_failed':
            case 'mission_expired':
                store.setCurrentMission(null)
                store.setMissions(useStore.getState().activeMissions.filter(m => m.id !== data.id))
                break

            // Respawn
            case 'respawn_timer':
                store.setRespawn({ show: data.show, timer: data.duration || 0 })
                break

            case 'respawn_timer_update':
                store.setRespawn({ timer: data.remaining })
                break

            case 'respawn_select':
                store.setRespawn({ selecting: data.show, base: data.base })
                break

            case 'respawn_error':
                // Could show a toast notification
                break

            // Loadout
            case 'loadout_update':
                store.setLoadout(data)
                break

            // Squadron
            case 'squadron_update':
                store.setSquadron(data)
                break

            // Scoreboard (from periodic pushes)
            case 'scoreboard_update':
                if (data.players) store.setScoreboard(data.players)
                break

            // Profile / dashboard
            case 'profile_update':
                store.setProfile(data)
                break

            // Generic state update from core pipeline
            case 'state_update':
                handleStateUpdate(data)
                break
        }
    })
}

function handleStateUpdate(payload: { panel: string; state: Record<string, any> }) {
    const store = useStore.getState()

    switch (payload.panel) {
        case 'hud':
            store.updateFlight(payload.state)
            break
        case 'radarScope':
            if (payload.state.contacts) store.setContacts(payload.state.contacts)
            break
        case 'warMap':
            store.setWar(payload.state)
            break
        case 'scoreboard':
            if (payload.state.players) store.setScoreboard(payload.state.players)
            break
        case 'dashboard':
            store.setProfile(payload.state)
            break
    }
}
