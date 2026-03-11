import { motion } from 'framer-motion'
import { useStore } from '../store'
import { IconBomber, IconCAS, IconChevronLeft, IconChevronRight, IconDrone, IconFighter, IconJet, IconStealth } from './Icons'

const AIRCRAFT_ICONS: Record<string, React.ReactNode> = {
    fighter: <IconFighter size={48} className="text-amber-400" />,
    stealth: <IconStealth size={48} className="text-blue-400" />,
    jet: <IconJet size={48} className="text-cyan-400" />,
    bomber: <IconBomber size={48} className="text-red-400" />,
    drone: <IconDrone size={48} className="text-emerald-400" />,
    cas: <IconCAS size={48} className="text-orange-400" />,
}

export function AircraftShowcase() {
    const { currentAircraft, nextAircraft, prevAircraft, config } = useStore()
    const ac = config.aircraft[currentAircraft]

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
                    {currentAircraft + 1}/{config.aircraft.length}
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
                <div className="flex justify-center mb-2 animate-float">
                    {AIRCRAFT_ICONS[ac.icon] || <IconJet size={48} className="text-gray-400" />}
                </div>
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
                    className="w-7 h-7 rounded border border-gray-700/50 flex items-center justify-center text-gray-400 hover:text-aw-accent hover:border-aw-accent/30 transition-colors"
                >
                    <IconChevronLeft size={14} />
                </button>
                {config.aircraft.map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentAircraft ? 'bg-aw-accent' : 'bg-gray-700'
                            }`}
                    />
                ))}
                <button
                    onClick={nextAircraft}
                    className="w-7 h-7 rounded border border-gray-700/50 flex items-center justify-center text-gray-400 hover:text-aw-accent hover:border-aw-accent/30 transition-colors"
                >
                    <IconChevronRight size={14} />
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
