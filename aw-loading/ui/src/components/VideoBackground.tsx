import { useStore } from '../store'

export function VideoBackground() {
    const { config } = useStore()

    if (!config.backgroundVideo) return null

    return (
        <div className="fixed inset-0 z-0">
            <video
                src={config.backgroundVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
            />
            {/* Dark overlay so UI stays readable */}
            <div className="absolute inset-0 bg-black/60" />
        </div>
    )
}
