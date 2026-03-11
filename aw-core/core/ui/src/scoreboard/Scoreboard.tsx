import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../framework/store'

export default function Scoreboard() {
    const players = useStore((s) => s.scoreboard)
    const visible = useStore((s) => s.scoreboardVisible)

    if (!visible || players.length === 0) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed inset-x-0 top-16 flex justify-center z-20 pointer-events-auto"
            >
                <div className="bg-aw-surface/95 border border-aw-border rounded-xl backdrop-blur-md w-[600px] max-h-[70vh] overflow-hidden">
                    <div className="px-4 py-2 border-b border-aw-border bg-aw-bg/50">
                        <div className="grid grid-cols-6 text-[10px] text-aw-muted font-medium uppercase tracking-wider">
                            <span className="col-span-2">Player</span>
                            <span className="text-center">Kills</span>
                            <span className="text-center">Deaths</span>
                            <span className="text-center">Score</span>
                            <span className="text-center">Ping</span>
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-[60vh]">
                        {players.map((p, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-6 px-4 py-2 border-b border-aw-border/30 hover:bg-white/5 text-sm"
                            >
                                <div className="col-span-2 flex items-center gap-2">
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: p.team === 'red' ? '#ef4444' : '#3b82f6' }}
                                    />
                                    <span className="text-aw-text truncate">{p.name}</span>
                                </div>
                                <span className="text-center text-aw-text">{p.kills}</span>
                                <span className="text-center text-aw-muted">{p.deaths}</span>
                                <span className="text-center text-aw-accent font-medium">{p.score}</span>
                                <span className="text-center text-aw-muted">{p.ping}ms</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
