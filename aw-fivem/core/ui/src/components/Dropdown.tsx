import { useEffect, useRef, useState } from 'react'

interface Option {
    value: string
    label: string
}

interface DropdownProps {
    options: Option[]
    value?: string
    placeholder?: string
    onChange?: (value: string) => void
    className?: string
}

export default function Dropdown({ options, value, placeholder = 'Select...', onChange, className = '' }: DropdownProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const selected = options.find((o) => o.value === value)

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full bg-aw-bg border border-aw-border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between hover:border-aw-primary/50 transition-colors"
            >
                <span className={selected ? 'text-aw-text' : 'text-aw-muted'}>{selected?.label || placeholder}</span>
                <span className="text-aw-muted text-xs">▼</span>
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-aw-surface border border-aw-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => {
                                onChange?.(opt.value)
                                setOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors ${opt.value === value ? 'text-aw-primary' : 'text-aw-text'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
