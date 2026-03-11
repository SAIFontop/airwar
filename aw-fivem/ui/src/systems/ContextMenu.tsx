import { useStore } from '../store'
import { fetchNUI } from '../nui'
import { AnimatePresence, motion } from 'framer-motion'

export default function ContextMenu() {
  const context = useStore((s) => s.context)
  const closeContext = useStore((s) => s.closeContext)

  if (!context) return null

  const handleClick = (id: string) => {
    fetchNUI('action', { type: 'context', id })
    closeContext()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-auto"
        onClick={closeContext}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          style={{ left: context.x, top: context.y }}
          className="absolute bg-aw-surface border border-aw-border rounded-lg shadow-xl overflow-hidden min-w-[160px]"
          onClick={(e) => e.stopPropagation()}
        >
          {context.items.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.disabled && handleClick(item.id)}
              disabled={item.disabled}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                item.disabled
                  ? 'opacity-40 cursor-not-allowed text-aw-muted'
                  : 'hover:bg-white/10 text-aw-text cursor-pointer'
              }`}
            >
              {item.label}
            </button>
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
