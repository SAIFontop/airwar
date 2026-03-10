'use client';

import { cn } from '@/lib/utils';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { forwardRef } from 'react';

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<
    React.ComponentRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.List
        ref={ref}
        className={cn(
            'inline-flex items-center gap-1 rounded-[var(--radius-lg)] bg-bg-secondary p-1 border border-border-primary',
            className
        )}
        {...props}
    />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<
    React.ComponentRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
            'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium text-text-muted transition-all',
            'hover:text-text-secondary',
            'data-[state=active]:bg-bg-card data-[state=active]:text-text-primary data-[state=active]:shadow-sm',
            className
        )}
        {...props}
    />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef<
    React.ComponentRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Content
        ref={ref}
        className={cn('mt-3 focus-visible:outline-none', className)}
        {...props}
    />
));
TabsContent.displayName = 'TabsContent';
