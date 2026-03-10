import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
    'inline-flex items-center gap-1 font-medium transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-bg-tertiary text-text-secondary border border-border-primary',
                accent: 'bg-accent-muted text-accent border border-accent/20',
                success: 'bg-success-muted text-success border border-success/20',
                warning: 'bg-warning-muted text-warning border border-warning/20',
                danger: 'bg-danger-muted text-danger border border-danger/20',
                info: 'bg-info-muted text-info border border-info/20',
            },
            size: {
                sm: 'px-1.5 py-0.5 text-[10px] rounded-[var(--radius-sm)]',
                md: 'px-2 py-0.5 text-xs rounded-[var(--radius-sm)]',
                lg: 'px-2.5 py-1 text-xs rounded-[var(--radius-md)]',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> { }

export function Badge({ className, variant, size, ...props }: BadgeProps) {
    return <span className={cn(badgeVariants({ variant, size, className }))} {...props} />;
}
