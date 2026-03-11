import { useStore } from '../../store/useStore'
import './RadarScope.css'

export default function RadarScope() {
    const contacts = useStore(s => s.contacts)
    const lockState = useStore(s => s.lockState)
    const lockTarget = useStore(s => s.lockTarget)
    const lockProgress = useStore(s => s.lockProgress)
    const rwr = useStore(s => s.rwr)
    const heading = useStore(s => s.flight.heading)

    const SCOPE_SIZE = 200
    const SCOPE_R = SCOPE_SIZE / 2
    const MAX_RANGE = 8000 // meters

    return (
        <div className="radar-container">
            <svg width={SCOPE_SIZE} height={SCOPE_SIZE} viewBox={`0 0 ${SCOPE_SIZE} ${SCOPE_SIZE}`}>
                {/* Background */}
                <circle cx={SCOPE_R} cy={SCOPE_R} r={SCOPE_R - 2} fill="rgba(0,20,0,0.7)" stroke="#00ff88" strokeWidth="1" />

                {/* Range rings */}
                {[0.25, 0.5, 0.75, 1].map(r => (
                    <circle key={r} cx={SCOPE_R} cy={SCOPE_R} r={SCOPE_R * r} fill="none" stroke="rgba(0,255,136,0.15)" strokeWidth="0.5" />
                ))}

                {/* Cross */}
                <line x1={SCOPE_R} y1={4} x2={SCOPE_R} y2={SCOPE_SIZE - 4} stroke="rgba(0,255,136,0.15)" strokeWidth="0.5" />
                <line x1={4} y1={SCOPE_R} x2={SCOPE_SIZE - 4} y2={SCOPE_R} stroke="rgba(0,255,136,0.15)" strokeWidth="0.5" />

                {/* Heading indicator */}
                <text x={SCOPE_R} y={14} textAnchor="middle" fill="#00ff88" fontSize="10">{Math.round(heading)}°</text>

                {/* Contacts */}
                {contacts.map(c => {
                    const relBearing = ((c.bearing - heading + 360) % 360) * (Math.PI / 180)
                    const rangePct = Math.min(c.distance / MAX_RANGE, 1)
                    const x = SCOPE_R + Math.sin(relBearing) * rangePct * (SCOPE_R - 10)
                    const y = SCOPE_R - Math.cos(relBearing) * rangePct * (SCOPE_R - 10)

                    const color = c.iff === 'friendly' ? '#00aaff' : c.iff === 'hostile' ? '#ff3333' : '#ffff00'

                    return (
                        <g key={c.aeid}>
                            {c.locked ? (
                                <rect x={x - 5} y={y - 5} width={10} height={10} fill="none" stroke={color} strokeWidth="1.5" />
                            ) : c.locking ? (
                                <rect x={x - 4} y={y - 4} width={8} height={8} fill="none" stroke={color} strokeWidth="1" strokeDasharray="2,2" />
                            ) : (
                                <circle cx={x} cy={y} r={3} fill={color} />
                            )}
                        </g>
                    )
                })}

                {/* Own aircraft (center) */}
                <polygon points={`${SCOPE_R},${SCOPE_R - 5} ${SCOPE_R - 3},${SCOPE_R + 3} ${SCOPE_R + 3},${SCOPE_R + 3}`} fill="#00ff88" />
            </svg>

            {/* Lock indicator */}
            {lockState && (
                <div className={`radar-lock ${lockState}`}>
                    {lockState === 'locking' ? `LOCKING ${Math.round(lockProgress * 100)}%` : 'LOCKED'}
                </div>
            )}

            {/* RWR */}
            {rwr.length > 0 && (
                <div className="rwr-container">
                    {rwr.map((w, i) => (
                        <div key={i} className={`rwr-warning ${w.lock_state}`}>
                            {w.lock_state === 'locked' ? '⚠ MISSILE' : '⚠ RWR'}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
