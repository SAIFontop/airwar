'use client';

import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { useAppStore, useAuthStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';
import {
    FolderArchive,
    LayoutDashboard,
    LogOut, Menu,
    Package,
    Puzzle,
    ScrollText, Settings,
    Shield,
    Terminal, Users,
    X,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
    { href: '/dashboard/console', label: 'الكونسول', icon: Terminal },
    { href: '/dashboard/players', label: 'اللاعبين', icon: Users },
    { href: '/dashboard/resources', label: 'الريسورسات', icon: Package },
    { href: '/dashboard/backups', label: 'النسخ الاحتياطية', icon: FolderArchive },
    { href: '/dashboard/automation', label: 'الأتمتة', icon: Zap },
    { href: '/dashboard/plugins', label: 'الإضافات', icon: Puzzle },
    { href: '/dashboard/security', label: 'الحماية', icon: Shield },
    { href: '/dashboard/audit', label: 'سجل العمليات', icon: ScrollText },
    { href: '/dashboard/settings', label: 'الإعدادات', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { accessToken, user, setUser, logout } = useAuthStore();
    const { sidebarOpen, toggleSidebar } = useAppStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!accessToken) {
            window.location.href = '/login';
            return;
        }
        authApi
            .me(accessToken)
            .then(setUser)
            .catch(() => {
                logout();
                window.location.href = '/login';
            })
            .finally(() => setLoading(false));
    }, [accessToken, setUser, logout]);

    const handleLogout = useCallback(async () => {
        if (accessToken) {
            try { await authApi.logout(accessToken); } catch { }
        }
        logout();
        window.location.href = '/login';
    }, [accessToken, logout]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="h-8 w-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-[var(--bg-primary)]">
            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {sidebarOpen && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 260, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-0 right-0 h-screen z-40 flex flex-col border-l border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden"
                    >
                        {/* Logo */}
                        <div className="p-5 border-b border-[var(--border-primary)]">
                            <div className="flex items-center justify-between">
                                <h1 className="text-xl font-bold glow-text text-[var(--accent-primary)]">
                                    SaifControl
                                </h1>
                                <button onClick={toggleSidebar} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            {user && (
                                <div className="mt-3 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] text-sm font-bold">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">{user.username}</div>
                                        <div className="text-xs text-[var(--text-muted)]">{user.role}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Nav */}
                        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
                            {NAV_ITEMS.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive
                                                ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4 flex-shrink-0" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Footer */}
                        <div className="p-3 border-t border-[var(--border-primary)]">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-[var(--text-muted)] hover:text-[var(--danger)]"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                تسجيل الخروج
                            </Button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main content */}
            <main
                className="flex-1 min-h-screen transition-all duration-200"
                style={{ marginRight: sidebarOpen ? 260 : 0 }}
            >
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/80 backdrop-blur-md">
                    {!sidebarOpen && (
                        <button onClick={toggleSidebar} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                            <Menu className="h-5 w-5" />
                        </button>
                    )}
                    <div className="flex-1" />
                    <span className="text-xs text-[var(--text-muted)]">
                        {pathname?.replace('/dashboard', '').replace('/', '') || 'نظرة عامة'}
                    </span>
                </header>

                {/* Page content */}
                <div className="p-5">
                    {children}
                </div>
            </main>
        </div>
    );
}
