import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
}

const VARIANTS = {
    primary: 'bg-aw-primary/20 text-blue-300 hover:bg-aw-primary/30 border-aw-primary/30',
    secondary: 'bg-aw-secondary/20 text-indigo-300 hover:bg-aw-secondary/30 border-aw-secondary/30',
    danger: 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border-red-500/30',
    ghost: 'bg-transparent text-aw-muted hover:bg-white/10 border-transparent',
}

const SIZES = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
    return (
        <button
            className={`rounded-lg font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}
