import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useStore } from '../framework/store'

export default function Progress() {
    const progress = useStore((s) => s.progress)
    const hideProgress = useStore((s) => s.hideProgress)
    const [pct, setPct] = useState(0)

    useEffect(() => {
        if (!progress) {
            setPct(0)
            return
        }
        setPct(0)
        const start = Date.now()
        const interval = setInterval(() => {
            const elapsed = Date.now() - start
            const p = Math.min(elapsed / progress.duration, 1)
            setPct(p * 100)
            if (p >= 1) {
                clearInterval(interval)
                setTimeout(hideProgress, 200)
            }
        }, 16)
        return () => clearInterval(interval)
    }, [progress])

    if (!progress) return null

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 w-72">
            <div className="bg-aw-surface/90 border border-aw-border rounded-lg p-3 backdrop-blur-md">
                <p className="text-xs text-aw-muted mb-2 text-center">{progress.label}</p>
                <div className="h-2 bg-aw-bg rounded-full overflow-hidden">
                    <motion.div className="h-full bg-aw-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
            </div>
        </div>
    )
}
