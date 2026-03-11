'use client';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BarChart3,
    Bell,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FileCode2,
    FolderOpen,
    Gamepad2,
    Globe,
    HardDrive,
    LayoutDashboard,
    type LucideIcon,
    Puzzle,
    ScrollText,
    Server,
    Settings,
    Shield,
    Terminal,
    Users,
    Wrench,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

interface NavGroup {
    title: string;
    icon: LucideIcon;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        title: 'Overview',
        icon: LayoutDashboard,
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { label: 'Console', href: '/console', icon: Terminal },
            { label: 'Analytics', href: '/analytics', icon: BarChart3 },
        ],
    },
    {
        title: 'Server',
        icon: Server,
        items: [
            { label: 'Players', href: '/players', icon: Users },
            { label: 'Resources', href: '/resources', icon: FolderOpen },
            { label: 'Config Editor', href: '/config-editor', icon: FileCode2 },
            { label: 'Server Logs', href: '/server-logs', icon: ScrollText },
        ],
    },
    {
        title: 'DevTools',
        icon: Wrench,
        items: [
            { label: 'Web Terminal', href: '/web-terminal', icon: Terminal },
            { label: 'File Manager', href: '/file-manager', icon: FileCode2 },
            { label: 'Plugins', href: '/plugins', icon: Puzzle },
        ],
    },
    {
        title: 'Automation',
        icon: Zap,
        items: [
            { label: 'Automation', href: '/automation', icon: Zap },
            { label: 'Scheduler', href: '/scheduler', icon: Calendar },
            { label: 'Alerts', href: '/alerts', icon: Bell },
        ],
    },
    {
        title: 'Infrastructure',
        icon: Shield,
        items: [
            { label: 'Tunnel & Tools', href: '/tunnel', icon: Globe },
            { label: 'Backups', href: '/backups', icon: HardDrive },
            { label: 'Audit Log', href: '/audit', icon: ScrollText },
            { label: 'Settings', href: '/settings', icon: Settings },
        ],
    },
];

function NavGroupSection({
    group,
    collapsed,
    pathname,
}: {
    group: NavGroup;
    collapsed: boolean;
    pathname: string | null;
}) {
    const hasActive = group.items.some(
        (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
    );
    const [open, setOpen] = useState(hasActive);

    if (collapsed) {
        return (
            <div className="space-y-0.5">
                {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={cn(
                                    'flex items-center justify-center w-full h-10 rounded-lg transition-colors relative group',
                                    isActive
                                        ? 'text-primary bg-primary/10'
                                        : 'text-muted hover:text-text hover:bg-white/5'
                                )}
                                title={item.label}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <item.icon className="w-[18px] h-[18px]" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        );
    }

    return (
        <div>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted/60 hover:text-muted transition-colors"
            >
                <span>{group.title}</span>
                <ChevronDown
                    className={cn(
                        'w-3 h-3 transition-transform duration-200',
                        !open && '-rotate-90'
                    )}
                />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-0.5 pb-1">
                            {group.items.map((item) => {
                                const isActive =
                                    pathname === item.href || pathname?.startsWith(item.href + '/');
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <div
                                            className={cn(
                                                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all relative',
                                                isActive
                                                    ? 'text-primary bg-primary/10'
                                                    : 'text-muted hover:text-text hover:bg-white/[0.04]'
                                            )}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="sidebar-active"
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 300,
                                                        damping: 30,
                                                    }}
                                                />
                                            )}
                                            <item.icon
                                                className={cn(
                                                    'w-4 h-4 shrink-0',
                                                    isActive ? 'text-primary' : 'text-muted/70'
                                                )}
                                            />
                                            <span>{item.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function Sidebar() {
    const pathname = usePathname();
    const collapsed = useAppStore((s) => s.sidebarCollapsed);
    const toggle = useAppStore((s) => s.toggleSidebar);

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 64 : 240 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-screen sticky top-0 z-40 flex flex-col border-r border-white/[0.06] bg-[#0c0c12]/80 backdrop-blur-xl"
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 h-14 shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent shrink-0">
                    <Gamepad2 className="w-4 h-4 text-white" />
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            className="text-[15px] font-bold tracking-tight text-text whitespace-nowrap"
                        >
                            SaifControl
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="mx-3 h-px bg-white/[0.06]" />

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3 scrollbar-thin">
                {navGroups.map((group) => (
                    <NavGroupSection
                        key={group.title}
                        group={group}
                        collapsed={collapsed}
                        pathname={pathname}
                    />
                ))}
            </nav>

            {/* Collapse Toggle */}
            <div className="mx-3 h-px bg-white/[0.06]" />
            <div className="p-2 shrink-0">
                <button
                    onClick={toggle}
                    className="flex items-center justify-center w-full py-2 rounded-lg text-muted/60 hover:text-text hover:bg-white/[0.04] transition-colors"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>
        </motion.aside>
    );
}
