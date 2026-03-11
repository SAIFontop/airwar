import { useStore } from '../../store/useStore'
import './Scoreboard.css'

export default function Scoreboard() {
    const scoreboard = useStore(s => s.scoreboard)
    const war = useStore(s => s.war)

    const factionColors: Record<string, string> = {
        usaf: '#4488ff',
        redfor: '#ff4444',
        nato: '#44cc44',
        pmc: '#ddcc00',
    }

    const sorted = [...scoreboard].sort((a, b) => b.score - a.score)

    return (
        <div className="scoreboard-overlay">
            <div className="scoreboard-panel">
                <div className="scoreboard-header">
                    <h2>SCOREBOARD</h2>
                    <span className="scoreboard-round">Round {war.round}</span>
                </div>

                <div className="scoreboard-faction-scores">
                    {Object.entries(war.scores).map(([faction, score]) => (
                        <div key={faction} className="scoreboard-faction-chip" style={{ borderColor: factionColors[faction] || '#888' }}>
                            <span style={{ color: factionColors[faction] || '#888' }}>{faction.toUpperCase()}</span>
                            <span className="scoreboard-faction-val">{score}</span>
                        </div>
                    ))}
                </div>

                <table className="scoreboard-table">
                    <thead>
                        <tr>
                            <th>CALLSIGN</th>
                            <th>FACTION</th>
                            <th>K</th>
                            <th>D</th>
                            <th>K/D</th>
                            <th>SCORE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((p) => (
                            <tr key={p.awid}>
                                <td className="scoreboard-callsign">{p.callsign}</td>
                                <td>
                                    <span className="scoreboard-faction-tag" style={{ color: factionColors[p.faction] || '#888' }}>
                                        {p.faction.toUpperCase()}
                                    </span>
                                </td>
                                <td>{p.kills}</td>
                                <td>{p.deaths}</td>
                                <td>{p.deaths > 0 ? (p.kills / p.deaths).toFixed(1) : p.kills.toFixed(1)}</td>
                                <td className="scoreboard-score">{p.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="scoreboard-footer">
                    {sorted.length} pilots in battle
                </div>
            </div>
        </div>
    )
}
