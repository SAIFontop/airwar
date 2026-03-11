import { useStore } from '../../store/useStore'
import './HUD.css'

export default function HUD() {
    const flight = useStore(s => s.flight)
    const loadout = useStore(s => s.loadout)

    const healthZones = flight.health_zones || {}
    const warnings = flight.warnings || []

    return (
        <div className="hud-container">
            {/* Left panel - Flight instruments */}
            <div className="hud-left">
                <div className="hud-gauge">
                    <span className="hud-label">SPD</span>
                    <span className="hud-value">{Math.round(flight.speed)}</span>
                    <span className="hud-unit">kts</span>
                </div>
                <div className="hud-gauge">
                    <span className="hud-label">ALT</span>
                    <span className="hud-value">{Math.round(flight.altitude)}</span>
                    <span className="hud-unit">ft</span>
                </div>
                <div className="hud-gauge">
                    <span className="hud-label">HDG</span>
                    <span className="hud-value">{Math.round(flight.heading)}°</span>
                </div>
                <div className="hud-gauge">
                    <span className="hud-label">G</span>
                    <span className="hud-value">{flight.gforce.toFixed(1)}</span>
                </div>
            </div>

            {/* Center - Warnings */}
            {warnings.length > 0 && (
                <div className="hud-warnings">
                    {warnings.map((w, i) => (
                        <div key={i} className="hud-warning">{w}</div>
                    ))}
                </div>
            )}

            {/* Right panel - Systems */}
            <div className="hud-right">
                <div className="hud-bar">
                    <span className="hud-label">FUEL</span>
                    <div className="hud-bar-track">
                        <div className="hud-bar-fill fuel" style={{ width: `${flight.fuel}%` }} />
                    </div>
                    <span className="hud-pct">{Math.round(flight.fuel)}%</span>
                </div>
                <div className="hud-bar">
                    <span className="hud-label">THR</span>
                    <div className="hud-bar-track">
                        <div className="hud-bar-fill throttle" style={{ width: `${flight.throttle}%` }} />
                    </div>
                    <span className="hud-pct">{Math.round(flight.throttle)}%</span>
                </div>

                {/* Health zones */}
                {Object.entries(healthZones).map(([zone, hp]) => (
                    <div key={zone} className="hud-bar">
                        <span className="hud-label">{zone.substring(0, 4).toUpperCase()}</span>
                        <div className="hud-bar-track">
                            <div
                                className={`hud-bar-fill health ${(hp as number) < 30 ? 'critical' : (hp as number) < 60 ? 'damaged' : ''}`}
                                style={{ width: `${hp}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom - Weapon info */}
            <div className="hud-bottom">
                <div className="hud-weapon">
                    {loadout.hardpoints.map((hp, i) => (
                        <div key={i} className={`hud-hp ${i === loadout.selectedSlot ? 'selected' : ''} ${hp.ammo <= 0 ? 'empty' : ''}`}>
                            <span className="hud-hp-name">{hp.weapon || 'EMPTY'}</span>
                            <span className="hud-hp-ammo">{hp.ammo}/{hp.max_ammo}</span>
                        </div>
                    ))}
                </div>
                <div className="hud-cm">
                    <span>FLR: {loadout.flares}</span>
                    <span>CHF: {loadout.chaff}</span>
                </div>
            </div>
        </div>
    )
}
