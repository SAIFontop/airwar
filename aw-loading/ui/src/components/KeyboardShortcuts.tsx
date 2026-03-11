import { motion } from 'framer-motion'
import { useStore } from '../store'
import { IconFlame, IconFlare, IconGun, IconJet, IconMissile, IconRadar, IconScoreboard, IconThrottle } from './Icons'

const CONTROL_ICONS: Record<string, React.ReactNode> = {
    gun: <IconGun size={14} />,
    missile: <IconMissile size={14} />,
    flare: <IconFlare size={14} />,
    radar: <IconRadar size={14} />,
    flame: <IconFlame size={14} />,
    scoreboard: <IconScoreboard size={14} />,
    jet: <IconJet size={14} />,
    throttle: <IconThrottle size={14} />,
}

export function KeyboardShortcuts() {
    const { config } = useStore()

    return (
        <motion.div
            className="glass rounded-lg p-4 w-full max-w-xs"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.8, duration: 0.8 }}
        >
            <h3 className="font-display text-xs font-bold text-aw-accent tracking-wider mb-3">
                CONTROLS
            </h3>

            <div className="space-y-1.5">
                {config.controls.map((ctrl, i) => (
                    <motion.div
                        key={ctrl.key}
                        className="flex items-center justify-between"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 2 + i * 0.05 }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">{CONTROL_ICONS[ctrl.icon] || <IconJet size={14} />}</span>
                            <span className="font-mono text-[11px] text-gray-400">{ctrl.action}</span>
                        </div>
                        <kbd className="px-1.5 py-0.5 rounded bg-gray-800/60 border border-gray-700/30 font-mono text-[10px] text-aw-accent">
                            {ctrl.key}
                        </kbd>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}
