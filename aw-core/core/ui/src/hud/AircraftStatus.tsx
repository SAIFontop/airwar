import { useStore } from '../framework/store';

function StatusBar({ label, value, critical }: { label: string; value: number; critical?: number }) {
    const pct = Math.min(value, 100)
    const isCritical = critical !== undefined && value <= critical
    const color = isCritical ? 'bg-red-500' : value < 50 ? 'bg-yellow-500' : 'bg-green-500'

    return (
        <div className="flex items-center gap-1.5">
            <span className={`text-[9px] w-10 text-right ${isCritical ? 'text-red-400' : 'text-aw-muted'}`}>{label}</span>
            <div className="h-1 w-16 bg-aw-bg rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-[9px] w-6 ${isCritical ? 'text-red-400' : 'text-aw-muted'}`}>{Math.round(value)}</span>
        </div>
    )
}

export default function AircraftStatus() {
    const aircraft = useStore((s) => s.aircraft)
    const visible = useStore((s) => s.aircraftVisible)

    if (!visible || !aircraft) return null

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-aw-surface/80 border border-aw-border/50 rounded-lg p-3 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <StatusBar label="ENG" value={aircraft.engine} critical={25} />
                    <StatusBar label="FUSE" value={aircraft.fuselage} critical={20} />
                    <StatusBar label="L.WNG" value={aircraft.leftWing} critical={25} />
                    <StatusBar label="R.WNG" value={aircraft.rightWing} critical={25} />
                    <StatusBar label="TAIL" value={aircraft.tail} critical={25} />
                    <StatusBar label="COCK" value={aircraft.cockpit} critical={15} />
                    <StatusBar label="FUEL" value={aircraft.fuel} critical={15} />
                    <StatusBar label="AVIO" value={aircraft.avionics} critical={20} />
                </div>
                <div className="flex gap-4 mt-2 pt-2 border-t border-aw-border/30 justify-center">
                    <div className="text-center">
                        <p className="text-[9px] text-aw-muted">AMMO</p>
                        <p className="text-xs font-mono text-aw-text">{aircraft.ammo}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] text-aw-muted">CM</p>
                        <p className="text-xs font-mono text-aw-text">{aircraft.countermeasures}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
