'use client';

import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
    Activity,
    Bell,
    ChevronLeft,
    ChevronRight,
    Cpu,
    FileText,
    LayoutDashboard,
    Puzzle,
    Server,
    Settings,
    Shield,
    Terminal,
    Users,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/servers', icon: Server, label: 'Servers' },
    { href: '/players', icon: Users, label: 'Players' },
    { href: '/console', icon: Terminal, label: 'Console' },
    { href: '/resources', icon: Puzzle, label: 'Resources' },
    { href: '/metrics', icon: Activity, label: 'Metrics' },
    { href: '/logs', icon: FileText, label: 'Logs' },
    { href: '/automation', icon: Zap, label: 'Automation' },
    { href: '/alerts', icon: Bell, label: 'Alerts' },
    { href: '/files', icon: FileText, label: 'Files' },
    { href: '/security', icon: Shield, label: 'Security' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();

    return (
        <aside
            className={cn(
                'flex flex-col h-full bg-card/30 border-r border-border/50 transition-all duration-300 ease-in-out',
                sidebarCollapsed ? 'w-16' : 'w-60',
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-border/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                    <Cpu className="w-4 h-4 text-primary" />
                </div>
                {!sidebarCollapsed && (
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold tracking-tight">Saif Control</span>
                        <span className="text-[10px] text-muted-foreground">v1.0.0</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150',
                                'hover:bg-accent/50',
                                isActive
                                    ? 'bg-accent text-accent-foreground font-medium'
                                    : 'text-muted-foreground hover:text-foreground',
                                sidebarCollapsed && 'justify-center px-0',
                            )}
                        >
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            {!sidebarCollapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <button
                onClick={toggleSidebar}
                className="flex items-center justify-center h-10 border-t border-border/50 text-muted-foreground hover:text-foreground transition-colors"
            >
                {sidebarCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                ) : (
                    <ChevronLeft className="w-4 h-4" />
                )}
            </button>
        </aside>
    );
}
