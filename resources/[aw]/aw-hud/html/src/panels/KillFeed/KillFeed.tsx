import { useStore } from '../../store/useStore'
import './KillFeed.css'

export default function KillFeed() {
    const killFeed = useStore(s => s.killFeed)

    if (killFeed.length === 0) return null

    return (
        <div className="killfeed-container">
            {killFeed.map((entry, i) => (
                <div key={`${entry.timestamp}-${i}`} className="killfeed-entry" style={{ opacity: 1 - i * 0.1 }}>
                    <span className="killfeed-killer">{entry.killer}</span>
                    <span className="killfeed-weapon">[{entry.weapon}]</span>
                    <span className="killfeed-victim">{entry.victim}</span>
                </div>
            ))}
        </div>
    )
}
