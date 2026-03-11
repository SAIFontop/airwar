import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { TIPS, useStore } from '../store'

export function Tips() {
    const { currentTip, nextTip } = useStore()

    useEffect(() => {
        const interval = setInterval(nextTip, 6000)
        return () => clearInterval(interval)
    }, [nextTip])

    return (
        <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
        >
            <span className="font-display text-[10px] text-aw-accent font-bold tracking-wider shrink-0">
                TIP
            </span>
            <div className="h-3 w-px bg-gray-700" />
            <AnimatePresence mode="wait">
                <motion.p
                    key={currentTip}
                    className="font-mono text-xs text-gray-400"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                >
                    💡 {TIPS[currentTip]}
                </motion.p>
            </AnimatePresence>
        </motion.div>
    )
}
