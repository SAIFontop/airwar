import { motion } from 'framer-motion'
import { IconJet } from './Icons'

export function JetFlyby() {
    return (
        <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden">
            {/* Jet 1 - Main */}
            <motion.div
                className="absolute"
                style={{ top: '25%' }}
                animate={{
                    x: ['-200px', `${window.innerWidth + 200}px`],
                    y: [0, -80, -40, -100],
                    rotate: [0, -2, 1, -1],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear', repeatDelay: 8 }}
            >
                <div className="relative">
                    <div className="opacity-60 text-amber-400" style={{ filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.5))' }}>
                        <IconJet size={40} />
                    </div>
                    {/* Contrail */}
                    <div
                        className="absolute top-1/2 right-full -translate-y-1/2"
                        style={{
                            width: '300px',
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), rgba(255,255,255,0.3))',
                            filter: 'blur(2px)',
                        }}
                    />
                </div>
            </motion.div>

            {/* Jet 2 - Background, smaller */}
            <motion.div
                className="absolute"
                style={{ top: '60%' }}
                animate={{
                    x: [`${window.innerWidth + 100}px`, '-200px'],
                    y: [0, -30, 20, -10],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear', repeatDelay: 15 }}
            >
                <div className="relative opacity-30">
                    <div className="text-gray-400" style={{ transform: 'scaleX(-1)' }}>
                        <IconJet size={28} />
                    </div>
                    <div
                        className="absolute top-1/2 left-full -translate-y-1/2"
                        style={{
                            width: '200px',
                            height: '1px',
                            background: 'linear-gradient(270deg, transparent, rgba(255,255,255,0.15))',
                            filter: 'blur(1px)',
                        }}
                    />
                </div>
            </motion.div>
        </div>
    )
}
