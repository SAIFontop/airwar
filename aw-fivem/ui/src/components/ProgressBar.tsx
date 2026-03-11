interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  label?: string
  showValue?: boolean
  className?: string
}

export default function ProgressBar({ value, max = 100, color = 'bg-aw-primary', label, showValue, className = '' }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100)

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-xs text-aw-muted">{label}</span>}
          {showValue && <span className="text-xs text-aw-text">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="h-2 bg-aw-bg rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
