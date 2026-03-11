import { useStore } from '../store'

export default function Radar() {
  const { targets, range, heading } = useStore((s) => s.radar)
  const visible = useStore((s) => s.radarVisible)

  if (!visible) return null

  const size = 180
  const center = size / 2
  const radius = center - 4

  return (
    <div className="fixed bottom-4 right-4 z-10">
      <div className="bg-aw-surface/80 border border-aw-border/50 rounded-full backdrop-blur-sm p-1">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background */}
          <circle cx={center} cy={center} r={radius} fill="rgba(0,0,0,0.4)" stroke="#1f2937" strokeWidth="1" />
          <circle cx={center} cy={center} r={radius * 0.66} fill="none" stroke="#1f2937" strokeWidth="0.5" />
          <circle cx={center} cy={center} r={radius * 0.33} fill="none" stroke="#1f2937" strokeWidth="0.5" />

          {/* Crosshair */}
          <line x1={center} y1={4} x2={center} y2={size - 4} stroke="#1f2937" strokeWidth="0.5" />
          <line x1={4} y1={center} x2={size - 4} y2={center} stroke="#1f2937" strokeWidth="0.5" />

          {/* Heading */}
          <text x={center} y={14} textAnchor="middle" fill="#9ca3af" fontSize="9">
            {Math.round(heading)}°
          </text>

          {/* Targets */}
          {targets.map((t) => {
            const scale = (radius - 4) / range
            const rad = ((heading - 90) * Math.PI) / 180
            const rx = t.x * Math.cos(rad) - t.y * Math.sin(rad)
            const ry = t.x * Math.sin(rad) + t.y * Math.cos(rad)
            const px = center + rx * scale
            const py = center - ry * scale

            if (px < 4 || px > size - 4 || py < 4 || py > size - 4) return null

            const color =
              t.type === 'enemy'
                ? '#ef4444'
                : t.type === 'friendly'
                ? '#22c55e'
                : t.type === 'missile'
                ? '#eab308'
                : '#9ca3af'

            return (
              <g key={t.id}>
                <circle cx={px} cy={py} r={t.locked ? 5 : 3} fill={color} opacity={0.8} />
                {t.locked && <circle cx={px} cy={py} r={7} fill="none" stroke={color} strokeWidth="1" />}
              </g>
            )
          })}

          {/* Player */}
          <circle cx={center} cy={center} r={3} fill="#3b82f6" />
        </svg>
      </div>
    </div>
  )
}
