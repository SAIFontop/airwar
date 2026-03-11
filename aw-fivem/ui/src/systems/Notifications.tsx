import { useStore } from '../store'
import { AnimatePresence, motion } from 'framer-motion'

const COLORS: Record<string, string> = {
  info: 'bg-blue-500/20 border-blue-500/50 text-blue-200',
  success: 'bg-green-500/20 border-green-500/50 text-green-200',
  warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200',
  error: 'bg-red-500/20 border-red-500/50 text-red-200',
}

export default function Notifications() {
  const notifications = useStore((s) => s.notifications)

  return (
    <div className="fixed top-4 right-4 flex flex-col gap-2 z-50 pointer-events-auto max-w-sm">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`px-4 py-3 rounded-lg border backdrop-blur-md ${COLORS[n.type] || COLORS.info}`}
          >
            <p className="text-sm font-medium">{n.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
