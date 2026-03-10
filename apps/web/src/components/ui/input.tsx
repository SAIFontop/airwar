'use client';

import { cn } from '@/lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, error, icon, ...props }, ref) => {
        return (
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={cn(
                        'flex h-10 w-full rounded-[var(--radius-md)] border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-200',
                        'border-border-primary focus:border-accent focus:ring-1 focus:ring-accent/30 focus:outline-none',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        icon && 'pl-10',
                        error && 'border-danger focus:border-danger focus:ring-danger/30',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1.5 text-xs text-danger">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = 'Input';
