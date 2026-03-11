import { motion } from 'framer-motion'
import { useStore } from '../store'

export function ProgressBar() {
    const { progress, phaseLabel, resourcesLoaded, resourcesTotal } = useStore()

    return (
        <motion.div
            className="w-full max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
        >
            {/* Phase label */}
            <div className="flex justify-between items-center mb-3">
                <motion.span
                    key={phaseLabel}
                    className="font-mono text-xs text-aw-accent"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                >
                    {phaseLabel}
                </motion.span>
                <span className="font-mono text-xs text-gray-500">
                    {Math.round(progress)}%
                </span>
            </div>

            {/* Main progress bar */}
            <div className="relative h-1.5 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/30">
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full shimmer"
                    style={{
                        background: 'linear-gradient(90deg, #f59e0b, #f97316, #f59e0b)',
                    }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                {/* Glow at tip */}
                <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-8 h-4 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(245,158,11,0.6), transparent)',
                        filter: 'blur(4px)',
                    }}
                    animate={{ left: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>

            {/* Resource counter */}
            <div className="flex justify-between items-center mt-2">
                <span className="font-mono text-[10px] text-gray-600">
                    Resources: {resourcesLoaded} / {resourcesTotal}
                </span>
                <ConnectionStatus />
            </div>

            {/* Animated progress circle */}
            <div className="flex justify-center mt-4">
                <ProgressCircle progress={progress} />
            </div>
        </motion.div>
    )
}

function ConnectionStatus() {
    const { connected } = useStore()
    return (
        <div className="flex items-center gap-1.5">
            <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: connected ? '#22c55e' : '#f59e0b' }}
                animate={{ opacity: connected ? 1 : [1, 0.3, 1] }}
                transition={connected ? {} : { duration: 1, repeat: Infinity }}
            />
            <span className="font-mono text-[10px] text-gray-500">
                {connected ? 'Connected' : 'Connecting...'}
            </span>
        </div>
    )
}

function ProgressCircle({ progress }: { progress: number }) {
    const radius = 28
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
        <div className="relative w-16 h-16">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(55,65,81,0.3)" strokeWidth="2" />
                <motion.circle
                    cx="32" cy="32" r={radius} fill="none"
                    stroke="url(#progressGrad)" strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <defs>
                    <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-xs font-bold text-aw-accent">
                    {Math.round(progress)}
                </span>
            </div>
        </div>
    )
}
