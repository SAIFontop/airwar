interface SliderProps {
  value: number
  min?: number
  max?: number
  step?: number
  label?: string
  onChange?: (value: number) => void
  className?: string
}

export default function Slider({ value, min = 0, max = 100, step = 1, label, onChange, className = '' }: SliderProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <div className="flex justify-between">
          <span className="text-xs text-aw-muted">{label}</span>
          <span className="text-xs text-aw-text">{value}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="w-full h-1.5 bg-aw-bg rounded-full appearance-none cursor-pointer accent-aw-primary"
      />
    </div>
  )
}
