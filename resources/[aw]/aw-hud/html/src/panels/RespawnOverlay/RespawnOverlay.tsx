import { nuiAction } from '../../bridge/actions'
import { useStore } from '../../store/useStore'
import './RespawnOverlay.css'

export default function RespawnOverlay() {
    const respawn = useStore(s => s.respawn)

    const selectAircraft = (type: string) => {
        nuiAction('respawn_select_aircraft', { aircraft_type: type })
    }

    const formatTimer = (ms: number) => {
        const s = Math.ceil(ms / 1000)
        return `${s}s`
    }

    return (
        <div className="respawn-overlay">
            {!respawn.selecting ? (
                <div className="respawn-timer-panel">
                    <div className="respawn-skull">✦</div>
                    <div className="respawn-label">AIRCRAFT DESTROYED</div>
                    <div className="respawn-timer">{formatTimer(respawn.timer)}</div>
                    <div className="respawn-hint">Respawning at {respawn.base?.name ?? 'nearest base'}...</div>
                    <div className="respawn-spectate-hint">Arrow Keys: Cycle View &nbsp;|&nbsp; F: Freecam</div>
                </div>
            ) : (
                <div className="respawn-select-panel">
                    <h2>SELECT AIRCRAFT</h2>
                    <p className="respawn-select-hint">Choose your next aircraft to deploy</p>
                    <div className="respawn-aircraft-grid" id="respawn-aircraft-grid">
                        <div className="respawn-placeholder">Loading available aircraft...</div>
                    </div>
                </div>
            )}
        </div>
    )
}
