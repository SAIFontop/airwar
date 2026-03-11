import { useStore } from '../store'
import { AnimatePresence, motion } from 'framer-motion'

export default function KillFeed() {
  const kills = useStore((s) => s.kills)

  if (kills.length === 0) return null

  return (
    <div className="fixed top-16 right-4 z-10 flex flex-col gap-1 items-end max-w-xs">
      <AnimatePresence>
        {kills.slice(-5).map((k) => (
          <motion.div
            key={k.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="bg-aw-surface/80 border border-aw-border/50 rounded px-3 py-1 backdrop-blur-sm text-xs"
          >
            <span className="text-red-400">{k.killer}</span>
            <span className="text-aw-muted mx-1.5">[{k.weapon}]</span>
            <span className="text-blue-400">{k.victim}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
