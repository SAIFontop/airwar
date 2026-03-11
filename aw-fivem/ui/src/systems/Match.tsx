import { useStore } from '../store'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Match() {
  const match = useStore((s) => s.match)
  const visible = useStore((s) => s.matchVisible)

  if (!visible || !match) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20">
      <div className="bg-aw-surface/90 border border-aw-border rounded-xl backdrop-blur-md px-6 py-2 flex items-center gap-6">
        {match.teams[0] && (
          <div className="text-center">
            <p className="text-xs text-aw-muted">{match.teams[0].name}</p>
            <p className="text-xl font-bold text-red-400">{match.teams[0].score}</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-xs text-aw-muted uppercase">{match.phase}</p>
          <p className="text-lg font-mono text-aw-text">{formatTime(match.timer)}</p>
        </div>
        {match.teams[1] && (
          <div className="text-center">
            <p className="text-xs text-aw-muted">{match.teams[1].name}</p>
            <p className="text-xl font-bold text-blue-400">{match.teams[1].score}</p>
          </div>
        )}
      </div>
    </div>
  )
}
