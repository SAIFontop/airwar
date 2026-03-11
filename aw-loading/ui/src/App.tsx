import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect } from 'react'
import { AircraftShowcase } from './components/AircraftShowcase'
import { JetFlyby } from './components/JetFlyby'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { Logo } from './components/Logo'
import { MusicPlayer } from './components/MusicPlayer'
import { NewsPanel } from './components/NewsPanel'
import { ParticleBackground } from './components/ParticleBackground'
import { PlayerStats } from './components/PlayerStats'
import { ProgressBar } from './components/ProgressBar'
import { ServerInfo } from './components/ServerInfo'
import { Tips } from './components/Tips'
import { VideoBackground } from './components/VideoBackground'
import { useStore } from './store'

export default function App() {
    const { shutdownTriggered, setProgress, setResources, setConnected, setServerStatus, triggerShutdown, loadConfig, config, configLoaded } = useStore()

    // Load config on mount
    useEffect(() => { loadConfig() }, [loadConfig])

    // Simulate loading progress
    useEffect(() => {
        let progress = 0
        let resources = 0
        const total = 120

        const interval = setInterval(() => {
            // Realistic non-linear progress
            const remaining = 100 - progress
            const increment = Math.max(0.3, remaining * 0.02 + Math.random() * 1.5)
            progress = Math.min(progress + increment, 99)
            resources = Math.min(Math.floor((progress / 100) * total), total)

            setProgress(progress)
            setResources(resources, total)
        }, 200)

        return () => clearInterval(interval)
    }, [setProgress, setResources])

    // Simulate server status updates
    useEffect(() => {
        const timeout = setTimeout(() => {
            setServerStatus({ status: 'online', players: 24, ping: 32, uptime: '14h 32m' })
            setConnected(true)
        }, 5000)

        return () => clearTimeout(timeout)
    }, [setConnected, setServerStatus])

    // Auto-complete loading
    useEffect(() => {
        const timeout = setTimeout(() => {
            setProgress(100)
            setResources(120, 120)
        }, 30000)
        return () => clearTimeout(timeout)
    }, [setProgress, setResources])

    // Listen for FiveM shutdown message
    const handleMessage = useCallback((event: MessageEvent) => {
        if (event.data?.type === 'shutdown') {
            triggerShutdown()
        }
    }, [triggerShutdown])

    useEffect(() => {
        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [handleMessage])

    // Aircraft carousel auto-rotate
    const { nextAircraft } = useStore()
    useEffect(() => {
        const interval = setInterval(nextAircraft, 10000)
        return () => clearInterval(interval)
    }, [nextAircraft])

    return (
        <AnimatePresence>
            {!shutdownTriggered ? (
                <motion.div
                    className="w-screen h-screen relative overflow-hidden bg-aw-darker"
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                >
                    {/* Background layers */}
                    <VideoBackground />
                    {config.showParticles && <ParticleBackground />}
                    <div className="scan-overlay" />
                    <div className="vignette" />
                    {config.showJetFlyby && <JetFlyby />}

                    {/* Ambient gradient background */}
                    <div className="fixed inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-aw-darker via-aw-dark to-aw-darker" />
                        <motion.div
                            className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
                            style={{
                                background: 'radial-gradient(circle, rgba(245,158,11,0.03), transparent 70%)',
                            }}
                            animate={{
                                x: [0, 50, 0],
                                y: [0, 30, 0],
                            }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.div
                            className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full"
                            style={{
                                background: 'radial-gradient(circle, rgba(59,130,246,0.03), transparent 70%)',
                            }}
                            animate={{
                                x: [0, -30, 0],
                                y: [0, -40, 0],
                            }}
                            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </div>

                    {/* Main content */}
                    <div className="relative z-10 w-full h-full flex flex-col">
                        {/* Top bar */}
                        <motion.div
                            className="flex items-center justify-between px-6 py-3"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2 }}
                        >
                            {config.showMusicPlayer ? <MusicPlayer /> : <div />}
                            <div className="font-mono text-[10px] text-gray-600">
                                {config.version} | FiveM
                            </div>
                        </motion.div>

                        {/* Center area: Logo + Progress */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
                            <Logo />
                            <ProgressBar />
                            {config.showTips && <Tips />}
                        </div>

                        {/* Bottom panels - 3 column layout */}
                        <div className="px-6 pb-6">
                            <div className="flex justify-between items-end gap-4">
                                {/* Left column */}
                                <div className="flex flex-col gap-3 w-80">
                                    {config.showAircraftShowcase && <AircraftShowcase />}
                                    {config.showPlayerStats && <PlayerStats />}
                                </div>

                                {/* Center - Keyboard shortcuts hint */}
                                <motion.div
                                    className="flex flex-col items-center gap-2 pb-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 3 }}
                                >
                                    <div className="font-mono text-[9px] text-gray-600 tracking-wider">
                                        {config.title} © 2026
                                    </div>
                                </motion.div>

                                {/* Right column */}
                                <div className="flex flex-col gap-3 w-80">
                                    {config.showServerInfo && <ServerInfo />}
                                    {config.showNewsPanel && <NewsPanel />}
                                    {config.showKeyboardShortcuts && <KeyboardShortcuts />}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                /* Shutdown fade-out */
                <motion.div
                    className="w-screen h-screen bg-black flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                >
                    <motion.p
                        className="font-display text-lg text-aw-accent tracking-widest"
                        animate={{ opacity: [1, 0] }}
                        transition={{ delay: 0.5, duration: 1.5 }}
                    >
                        ENTERING COMBAT ZONE
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
