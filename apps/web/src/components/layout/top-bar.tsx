'use client';

import { Button } from '@/components/ui';
import { authApi } from '@/lib/api';
import { useAuthStore, useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Bell, Command, LogOut, Search, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function TopBar() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const token = useAuthStore((s) => s.accessToken);
    const collapsed = useUIStore((s) => s.sidebarCollapsed);
    const setCommandPalette = useUIStore((s) => s.setCommandPaletteOpen);

    const handleLogout = async () => {
        if (token) {
            try { await authApi.logout(token); } catch { }
        }
        logout();
        router.push('/login');
    };

    return (
        <header
            className={cn(
                'fixed top-0 right-0 z-30 flex h-14 items-center justify-between border-b border-border-primary bg-bg-secondary/80 backdrop-blur-md px-6 transition-all duration-300',
                collapsed ? 'left-16' : 'left-60'
            )}
        >
            {/* Search trigger */}
            <button
                onClick={() => setCommandPalette(true)}
                className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border-primary bg-bg-input px-3 py-1.5 text-sm text-text-muted hover:border-border-hover transition-colors w-64"
            >
                <Search className="h-3.5 w-3.5" />
                <span>Search...</span>
                <kbd className="ml-auto flex gap-0.5 items-center text-[10px] text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">
                    <Command className="h-2.5 w-2.5" />K
                </kbd>
            </button>

            {/* Right actions */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                </Button>

                <div className="h-6 w-px bg-border-primary" />

                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-muted text-accent">
                        <User className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium text-text-primary">{user?.username ?? 'Admin'}</span>
                </div>

                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-text-muted hover:text-danger">
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </header>
    );
}
