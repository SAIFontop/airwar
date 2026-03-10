'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
    Bot,
    ChevronLeft, ChevronRight,
    Database,
    Gamepad2,
    HardDrive,
    LayoutDashboard,
    Puzzle,
    ScrollText,
    Settings, Shield,
    Terminal, Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/console', label: 'Console', icon: Terminal },
    { href: '/dashboard/players', label: 'Players', icon: Users },
    { href: '/dashboard/resources', label: 'Resources', icon: Puzzle },
    { href: '/dashboard/backups', label: 'Backups', icon: Database },
    { href: '/dashboard/automation', label: 'Automation', icon: Bot },
    { href: '/dashboard/plugins', label: 'Plugins', icon: HardDrive },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    { href: '/dashboard/security', label: 'Security', icon: Shield },
    { href: '/dashboard/audit', label: 'Audit Log', icon: ScrollText },
];

export function Sidebar() {
    const pathname = usePathname();
    const collapsed = useUIStore((s) => s.sidebarCollapsed);
    const toggle = useUIStore((s) => s.toggleSidebar);

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border-primary bg-bg-secondary transition-all duration-300',
                    collapsed ? 'w-16' : 'w-60'
                )}
            >
                {/* Logo */}
                <div className={cn('flex h-14 items-center border-b border-border-primary px-4', collapsed && 'justify-center')}>
                    <Gamepad2 className="h-6 w-6 text-accent shrink-0" />
                    {!collapsed && (
                        <span className="ml-2.5 text-sm font-bold tracking-tight text-text-primary">
                            SaifControl
                        </span>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                    {navItems.map((item) => {
                        const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                        const link = (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors duration-150',
                                    active
                                        ? 'bg-accent-muted text-accent'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
                                    collapsed && 'justify-center px-0'
                                )}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {!collapsed && item.label}
                            </Link>
                        );

                        if (collapsed) {
                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                                    <TooltipContent side="right">{item.label}</TooltipContent>
                                </Tooltip>
                            );
                        }
                        return link;
                    })}
                </nav>

                {/* Collapse toggle */}
                <div className="border-t border-border-primary p-2">
                    <button
                        onClick={toggle}
                        className="flex w-full items-center justify-center rounded-[var(--radius-md)] py-2 text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                    >
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </button>
                </div>
            </aside>
        </TooltipProvider>
    );
}
