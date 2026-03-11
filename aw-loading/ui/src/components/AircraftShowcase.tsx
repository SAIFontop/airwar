import { motion } from 'framer-motion'
import { AIRCRAFT, useStore } from '../store'

export function AircraftShowcase() {
    const { currentAircraft, nextAircraft, prevAircraft } = useStore()
    const ac = AIRCRAFT[currentAircraft]

    return (
        <motion.div
            className="glass rounded-lg p-4 w-full max-w-xs"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-xs font-bold text-aw-accent tracking-wider">
                    AIRCRAFT DATABASE
                </h3>
                <span className="font-mono text-[10px] text-gray-500">
                    {currentAircraft + 1}/{AIRCRAFT.length}
                </span>
            </div>

            {/* Aircraft display */}
            <motion.div
                key={currentAircraft}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-3"
            >
                {/* Aircraft icon */}
                <div className="text-5xl mb-2 animate-float">{ac.image}</div>
                <h4 className="font-display text-lg font-bold text-white">{ac.name}</h4>
                <p className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">{ac.type}</p>
            </motion.div>

            {/* Stats */}
            <div className="space-y-2">
                <StatBar label="SPEED" value={ac.speed} color="#f59e0b" />
                <StatBar label="MANEUVER" value={ac.maneuver} color="#3b82f6" />
                <StatBar label="ARMOR" value={ac.armor} color="#22c55e" />
            </div>

            {/* Weapons */}
            <div className="mt-3 pt-3 border-t border-gray-700/30">
                <p className="font-mono text-[10px] text-gray-500 mb-1">ARMAMENT</p>
                <p className="font-mono text-[10px] text-gray-300">{ac.weapons}</p>
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-3 mt-3">
                <button
                    onClick={prevAircraft}
                    className="w-7 h-7 rounded border border-gray-700/50 flex items-center justify-center text-gray-400 hover:text-aw-accent hover:border-aw-accent/30 transition-colors text-xs"
                >
                    ◀
                </button>
                {AIRCRAFT.map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentAircraft ? 'bg-aw-accent' : 'bg-gray-700'
                            }`}
                    />
                ))}
                <button
                    onClick={nextAircraft}
                    className="w-7 h-7 rounded border border-gray-700/50 flex items-center justify-center text-gray-400 hover:text-aw-accent hover:border-aw-accent/30 transition-colors text-xs"
                >
                    ▶
                </button>
            </div>
        </motion.div>
    )
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between mb-0.5">
                <span className="font-mono text-[10px] text-gray-400">{label}</span>
                <span className="font-mono text-[10px] text-gray-300">{value}</span>
            </div>
            <div className="h-1 bg-gray-800/50 rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                />
            </div>
        </div>
    )
}
