import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useStore } from '../store'

export function NewsPanel() {
    const { config } = useStore()
    const news = config.news
    const [current, setCurrent] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((c) => (c + 1) % news.length)
        }, 8000)
        return () => clearInterval(interval)
    }, [news.length])

    const typeColors: Record<string, string> = {
        update: '#3b82f6',
        event: '#f59e0b',
        balance: '#22c55e',
        announcement: '#ef4444',
    }

    const item = news[current]

    return (
        <motion.div
            className="glass rounded-lg p-4 w-full max-w-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-xs font-bold text-aw-accent tracking-wider">
                    SERVER NEWS
                </h3>
                <div className="flex gap-1">
                    {news.map((_, i) => (
                        <div
                            key={i}
                            className={`w-1 h-1 rounded-full transition-colors ${i === current ? 'bg-aw-accent' : 'bg-gray-700'
                                }`}
                        />
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="flex items-center gap-2 mb-1.5">
                        <span
                            className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase"
                            style={{
                                backgroundColor: `${typeColors[item.type]}20`,
                                color: typeColors[item.type],
                            }}
                        >
                            {item.type}
                        </span>
                        <span className="font-mono text-[9px] text-gray-600">{item.date}</span>
                    </div>
                    <h4 className="font-sans text-sm font-semibold text-white mb-1">{item.title}</h4>
                    <p className="font-mono text-[11px] text-gray-400 leading-relaxed">{item.body}</p>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    )
}
