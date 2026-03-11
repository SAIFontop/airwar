import { motion } from 'framer-motion'

export function Logo() {
    return (
        <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 0.8, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
        >
            {/* Main Logo */}
            <motion.div
                className="relative"
                animate={{ filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
                <h1 className="font-display text-6xl md:text-7xl font-black tracking-[0.3em] text-glow text-aw-accent">
                    AIRWAR
                </h1>

                {/* Metallic shine sweep */}
                <motion.div
                    className="absolute inset-0 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    <motion.div
                        className="absolute inset-y-0 w-20"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        }}
                        animate={{ x: ['-80px', '500px'] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                    />
                </motion.div>
            </motion.div>

            {/* Subtitle */}
            <motion.p
                className="font-mono text-xs tracking-[0.5em] text-gray-500 uppercase"
                initial={{ opacity: 0, letterSpacing: '1em' }}
                animate={{ opacity: 1, letterSpacing: '0.5em' }}
                transition={{ delay: 0.8, duration: 1 }}
            >
                Combat Aviation Server
            </motion.p>

            {/* Decorative line */}
            <motion.div
                className="h-px bg-gradient-to-r from-transparent via-aw-accent to-transparent mt-2"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 0.5 }}
                transition={{ delay: 1.2, duration: 1 }}
            />
        </motion.div>
    )
}
