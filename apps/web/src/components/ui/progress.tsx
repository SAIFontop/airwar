'use client';

import { cn } from '@/lib/utils';

interface ProgressProps {
    value: number;
    max?: number;
    className?: string;
    variant?: 'accent' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

const variantColors = {
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
};

const sizeHeights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
};

export function Progress({ value, max = 100, className, variant = 'accent', size = 'md', showLabel }: ProgressProps) {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className={cn('w-full', className)}>
            {showLabel && (
                <div className="flex justify-between mb-1">
                    <span className="text-xs text-text-muted">{Math.round(pct)}%</span>
                </div>
            )}
            <div className={cn('w-full rounded-full bg-bg-tertiary overflow-hidden', sizeHeights[size])}>
                <div
                    className={cn('h-full rounded-full transition-all duration-500 ease-out', variantColors[variant])}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
