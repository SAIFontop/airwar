import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useStore } from '../store'
import { IconLightbulb } from './Icons'

export function Tips() {
    const { currentTip, nextTip, config } = useStore()

    useEffect(() => {
        const interval = setInterval(nextTip, config.tipRotationMs)
        return () => clearInterval(interval)
    }, [nextTip, config.tipRotationMs])

    return (
        <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
        >
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-aw-accent">
                    <IconLightbulb size={14} />
                </span>
                <span className="font-display text-[10px] text-aw-accent font-bold tracking-wider">
                    TIP
                </span>
            </div>
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
                    {config.tips[currentTip]}
                </motion.p>
            </AnimatePresence>
        </motion.div>
    )
}
