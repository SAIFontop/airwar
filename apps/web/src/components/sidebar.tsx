'use client';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BarChart3,
    Bell,
    ChevronLeft,
    ChevronRight,
    FileCode2,
    FolderOpen,
    Gamepad2,
    HardDrive,
    LayoutDashboard,
    Puzzle,
    ScrollText,
    Settings,
    Terminal,
    Users,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Console', href: '/console', icon: Terminal },
    { label: 'Players', href: '/players', icon: Users },
    { label: 'Resources', href: '/resources', icon: FolderOpen },
    { label: 'Config Editor', href: '/config-editor', icon: FileCode2 },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Automation', href: '/automation', icon: Zap },
    { label: 'Alerts', href: '/alerts', icon: Bell },
    { label: 'Backups', href: '/backups', icon: HardDrive },
    { label: 'Plugins', href: '/plugins', icon: Puzzle },
    { label: 'Audit Log', href: '/audit', icon: ScrollText },
    { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const collapsed = useAppStore((s) => s.sidebarCollapsed);
    const toggle = useAppStore((s) => s.toggleSidebar);

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 72 : 256 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-screen sticky top-0 z-40 flex flex-col border-r border-border bg-surface/60 backdrop-blur-xl"
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent shrink-0">
                    <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="text-lg font-bold tracking-tight text-text whitespace-nowrap"
                        >
                            SaifControl
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                whileHover={{ x: 2 }}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative group',
                                    isActive
                                        ? 'text-primary bg-primary/10'
                                        : 'text-muted hover:text-text hover:bg-white/5'
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-primary')} />
                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="overflow-hidden whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse Toggle */}
            <div className="border-t border-border p-3 shrink-0">
                <button
                    onClick={toggle}
                    className="flex items-center justify-center w-full py-2 rounded-xl text-muted hover:text-text hover:bg-white/5 transition-colors"
                >
                    {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>
        </motion.aside>
    );
}
