import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useStore } from '../store'

export function MusicPlayer() {
    const { musicPlaying, musicVolume, toggleMusic, setMusicVolume, config } = useStore()
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Play actual audio file if musicUrl is set
    useEffect(() => {
        if (!config.musicUrl) return
        const audio = new Audio(config.musicUrl)
        audio.loop = true
        audio.volume = musicVolume
        audioRef.current = audio

        if (musicPlaying) {
            audio.play().catch(() => {})
        }

        return () => {
            audio.pause()
            audio.src = ''
            audioRef.current = null
        }
    }, [config.musicUrl])

    // Sync play/pause state
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        if (musicPlaying) {
            audio.play().catch(() => {})
        } else {
            audio.pause()
        }
    }, [musicPlaying])

    // Sync volume
    useEffect(() => {
        const audio = audioRef.current
        if (audio) audio.volume = musicVolume
    }, [musicVolume])

    // Fallback ambient tone when no musicUrl
    useEffect(() => {
        if (config.musicUrl) return
        const ctx = new AudioContext()
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()

        oscillator.type = 'sine'
        oscillator.frequency.value = 120

        filter.type = 'lowpass'
        filter.frequency.value = 200

        gain.gain.value = 0

        oscillator.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)

        oscillator.start()

        const updateGain = () => {
            const state = useStore.getState()
            gain.gain.setTargetAtTime(state.musicPlaying ? state.musicVolume * 0.05 : 0, ctx.currentTime, 0.3)
        }

        updateGain()
        const unsub = useStore.subscribe(updateGain)

        return () => {
            unsub()
            oscillator.stop()
            ctx.close()
        }
    }, [config.musicUrl])

    return (
        <motion.div
            className="flex items-center gap-3 glass rounded-full px-3 py-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
        >
            {/* Visualizer bars */}
            <div className="flex items-end gap-0.5 h-3">
                {[0.6, 1, 0.4, 0.8, 0.5].map((h, i) => (
                    <motion.div
                        key={i}
                        className="w-0.5 bg-aw-accent rounded-full"
                        animate={musicPlaying ? {
                            height: [`${h * 12}px`, `${h * 4}px`, `${h * 12}px`],
                        } : { height: '2px' }}
                        transition={musicPlaying ? {
                            duration: 0.5 + i * 0.1,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        } : { duration: 0.3 }}
                    />
                ))}
            </div>

            {/* Play/Pause */}
            <button
                onClick={toggleMusic}
                className="text-xs text-gray-400 hover:text-aw-accent transition-colors"
            >
                {musicPlaying ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                    </svg>
                ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5,3 19,12 5,21" />
                    </svg>
                )}
            </button>

            {/* Volume slider */}
            <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                className="w-16 h-0.5 appearance-none bg-gray-700 rounded-full cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-2
                    [&::-webkit-slider-thumb]:h-2
                    [&::-webkit-slider-thumb]:bg-aw-accent
                    [&::-webkit-slider-thumb]:rounded-full"
            />

            <span className="font-mono text-[9px] text-gray-500">
                {Math.round(musicVolume * 100)}%
            </span>
        </motion.div>
    )
}
