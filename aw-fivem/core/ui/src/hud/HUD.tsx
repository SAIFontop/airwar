import { useStore } from '../framework/store';

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
    const pct = Math.min((value / max) * 100, 100)
    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-aw-muted w-6 text-right">{label}</span>
            <div className="h-1.5 w-20 bg-aw-bg rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-aw-muted w-8">{Math.round(value)}</span>
        </div>
    )
}

export default function HUD() {
    const hud = useStore((s) => s.hud)
    const visible = useStore((s) => s.hudVisible)

    if (!visible) return null

    return (
        <div className="fixed bottom-4 left-4 z-10">
            <div className="bg-aw-surface/80 border border-aw-border/50 rounded-lg p-2.5 backdrop-blur-sm space-y-1">
                <Bar value={hud.health} max={100} color="bg-green-500" label="HP" />
                <Bar value={hud.armor} max={100} color="bg-blue-500" label="AR" />
                <Bar value={hud.fuel} max={100} color="bg-yellow-500" label="FL" />
                <div className="flex gap-3 mt-1.5 pt-1.5 border-t border-aw-border/30">
                    <div className="text-center">
                        <p className="text-[10px] text-aw-muted">SPD</p>
                        <p className="text-xs font-mono text-aw-text">{Math.round(hud.speed)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-aw-muted">ALT</p>
                        <p className="text-xs font-mono text-aw-text">{Math.round(hud.altitude)}</p>
                    </div>
                    {hud.ammo !== undefined && (
                        <div className="text-center">
                            <p className="text-[10px] text-aw-muted">AMO</p>
                            <p className="text-xs font-mono text-aw-text">{hud.ammo}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
