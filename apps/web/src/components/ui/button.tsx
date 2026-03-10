'use client';

import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    {
        variants: {
            variant: {
                primary: 'bg-accent text-white hover:bg-accent-hover shadow-md hover:shadow-glow',
                secondary: 'bg-bg-tertiary text-text-primary border border-border-primary hover:bg-bg-elevated hover:border-border-hover',
                ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
                danger: 'bg-danger text-white hover:bg-red-600',
                success: 'bg-success text-white hover:bg-emerald-600',
                outline: 'border border-border-primary text-text-secondary hover:text-text-primary hover:border-accent hover:bg-accent-muted',
                link: 'text-accent hover:text-accent-hover underline-offset-4 hover:underline p-0 h-auto',
            },
            size: {
                sm: 'h-8 px-3 text-xs rounded-[var(--radius-sm)]',
                md: 'h-9 px-4 text-sm rounded-[var(--radius-md)]',
                lg: 'h-11 px-6 text-sm rounded-[var(--radius-md)]',
                xl: 'h-12 px-8 text-base rounded-[var(--radius-lg)]',
                icon: 'h-9 w-9 rounded-[var(--radius-md)]',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    }
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || loading}
                {...props}
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {children}
            </Comp>
        );
    }
);
Button.displayName = 'Button';

export { buttonVariants };
