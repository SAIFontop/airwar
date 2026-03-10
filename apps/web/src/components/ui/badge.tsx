import { cn } from '@/lib/utils';
import * as React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

const variantClasses: Record<string, string> = {
    default: 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary-hover)] border-[var(--accent-primary)]/30',
    success: 'bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30',
    warning: 'bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30',
    danger: 'bg-[var(--danger)]/20 text-[var(--danger)] border-[var(--danger)]/30',
    info: 'bg-[var(--info)]/20 text-[var(--info)] border-[var(--info)]/30',
    outline: 'bg-transparent text-[var(--text-secondary)] border-[var(--border-primary)]',
};

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                variantClasses[variant],
                className,
            )}
            {...props}
        />
    );
}

export { Badge };
export type { BadgeProps };

