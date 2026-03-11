import { motion } from 'framer-motion'
import { useStore } from '../store'
import { IconChart, IconJet, IconMedal, IconStar, IconTarget, IconTrophy } from './Icons'

export function PlayerStats() {
    const { playerStats } = useStore()

    const stats = [
        { label: 'Total Kills', value: playerStats.kills.toString(), icon: <IconTarget size={14} /> },
        { label: 'Flight Hours', value: playerStats.flightHours.toFixed(1) + 'h', icon: <IconJet size={14} /> },
        { label: 'Best Aircraft', value: playerStats.bestAircraft, icon: <IconTrophy size={14} /> },
        { label: 'Rank', value: playerStats.rank, icon: <IconStar size={14} /> },
        { label: 'K/D Ratio', value: (playerStats.kills / Math.max(playerStats.deaths, 1)).toFixed(2), icon: <IconChart size={14} /> },
        { label: 'Victories', value: playerStats.wins.toString(), icon: <IconMedal size={14} /> },
    ]

    return (
        <motion.div
            className="glass rounded-lg p-4 w-full max-w-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
        >
            <h3 className="font-display text-xs font-bold text-aw-accent tracking-wider mb-3">
                PILOT STATISTICS
            </h3>

            <div className="grid grid-cols-2 gap-2">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        className="p-2 rounded bg-gray-800/30 border border-gray-700/20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.6 + i * 0.1 }}
                    >
                        <div className="flex items-center gap-1 mb-1">
                            <span className="text-aw-accent">{stat.icon}</span>
                            <span className="font-mono text-[9px] text-gray-500 uppercase">{stat.label}</span>
                        </div>
                        <p className="font-display text-sm font-bold text-white">{stat.value}</p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}
