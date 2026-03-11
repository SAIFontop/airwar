import { useStore } from '../store'
import { AnimatePresence, motion } from 'framer-motion'

const LABELS: Record<string, string> = {
  missile_lock: 'MISSILE LOCK',
  low_fuel: 'LOW FUEL',
  engine_damage: 'ENGINE DAMAGE',
  stall: 'STALL WARNING',
  terrain: 'PULL UP',
  custom: 'WARNING',
}

export default function Warning() {
  const warnings = useStore((s) => s.warnings)

  if (warnings.length === 0) return null

  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
      <AnimatePresence>
        {warnings.map((w) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.6, 1, 0.6], scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ opacity: { repeat: Infinity, duration: w.critical ? 0.5 : 1 } }}
            className={`px-6 py-2 rounded-lg text-center font-bold text-sm tracking-wider ${
              w.critical
                ? 'bg-red-500/30 border border-red-500 text-red-300'
                : 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-300'
            }`}
          >
            {w.message || LABELS[w.type] || w.type}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
