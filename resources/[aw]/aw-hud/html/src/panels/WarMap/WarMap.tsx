import { useStore } from '../../store/useStore'
import './WarMap.css'

const FACTION_COLORS: Record<string, string> = {
    usaf: '#4488ff',
    redfor: '#ff4444',
    nato: '#44cc44',
    pmc: '#ffcc00',
}

export default function WarMap() {
    const war = useStore(s => s.war)

    return (
        <div className="warmap-overlay">
            <div className="warmap-panel">
                <div className="warmap-header">
                    <h2>WAR MAP — Round {war.round}</h2>
                    <span className={`warmap-phase ${war.phase}`}>{war.phase.replace('_', ' ').toUpperCase()}</span>
                </div>

                <div className="warmap-scores">
                    {Object.entries(war.scores).map(([faction, score]) => (
                        <div key={faction} className="warmap-faction-score">
                            <div className="warmap-faction-dot" style={{ background: FACTION_COLORS[faction] || '#888' }} />
                            <span className="warmap-faction-name">{faction.toUpperCase()}</span>
                            <span className="warmap-score-value">{score}</span>
                            <span className="warmap-zone-count">{war.territory[faction] || 0} zones</span>
                        </div>
                    ))}
                </div>

                <div className="warmap-territory">
                    <div className="warmap-territory-bar">
                        {Object.entries(war.territory).map(([faction, zones]) => {
                            const total = Object.values(war.territory).reduce((a, b) => a + b, 0) || 1
                            const pct = (zones / total) * 100
                            return (
                                <div
                                    key={faction}
                                    className="warmap-territory-segment"
                                    style={{ width: `${pct}%`, background: FACTION_COLORS[faction] || '#888' }}
                                />
                            )
                        })}
                    </div>
                </div>

                <div className="warmap-close" onClick={() => useStore.getState().setPanel('warMap', false)}>✕</div>
            </div>
        </div>
    )
}
