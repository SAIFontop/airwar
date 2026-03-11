import { nuiAction } from '../../bridge/actions'
import { useStore } from '../../store/useStore'
import './MissionBoard.css'

export default function MissionBoard() {
    const activeMissions = useStore(s => s.activeMissions)
    const currentMission = useStore(s => s.currentMission)

    const close = () => nuiAction('closePanel', { panel: 'missionBoard' })
    const join = (missionId: number) => nuiAction('joinMission', { mission_id: missionId })
    const leave = () => nuiAction('leaveMission', {})

    const typeColors: Record<string, string> = {
        air_superiority: '#ff4444',
        strike: '#ff8800',
        defense: '#4488ff',
        escort: '#44cc44',
        recon: '#cc88ff',
        supply_run: '#ddcc00',
        sead: '#ff44aa',
        intercept: '#ff6644',
    }

    return (
        <div className="mboard-overlay">
            <div className="mboard-panel">
                <div className="mboard-header">
                    <h2>MISSION BOARD</h2>
                    <span className="mboard-close" onClick={close}>✕</span>
                </div>

                {currentMission && (
                    <div className="mboard-current">
                        <div className="mboard-current-header">
                            <span className="mboard-type-badge" style={{ borderColor: typeColors[currentMission.type] || '#888' }}>
                                {currentMission.type.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            <span className="mboard-current-name">{currentMission.display_name}</span>
                            <button className="mboard-leave-btn" onClick={leave}>LEAVE</button>
                        </div>
                        <div className="mboard-objectives">
                            {currentMission.objectives.map((obj, i) => (
                                <div key={i} className={`mboard-objective ${obj.complete ? 'done' : ''}`}>
                                    <span className="mboard-obj-check">{obj.complete ? '✓' : '○'}</span>
                                    <span className="mboard-obj-desc">{obj.desc}</span>
                                    {obj.target != null && (
                                        <span className="mboard-obj-progress">{obj.current ?? 0}/{obj.target}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mboard-available">
                    <h3>AVAILABLE MISSIONS</h3>
                    {activeMissions.length === 0 && (
                        <div className="mboard-empty">No missions available. Stand by for tasking.</div>
                    )}
                    {activeMissions.map((m) => (
                        <div key={m.id} className="mboard-mission-card">
                            <div className="mboard-mission-top">
                                <span className="mboard-type-badge" style={{ borderColor: typeColors[m.type] || '#888' }}>
                                    {m.type.replace(/_/g, ' ').toUpperCase()}
                                </span>
                                <span className="mboard-mission-name">{m.display_name}</span>
                            </div>
                            <div className="mboard-mission-rewards">
                                <span>+{m.rewards.credits} credits</span>
                                <span>+{m.rewards.faction_score} faction score</span>
                            </div>
                            <button
                                className="mboard-join-btn"
                                onClick={() => join(m.id)}
                                disabled={currentMission != null}
                            >
                                {currentMission ? 'ALREADY ON MISSION' : 'JOIN'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
