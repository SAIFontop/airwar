'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { authApi } from '@/lib/api';
import { useAuthStore, useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const token = useAuthStore((s) => s.accessToken);
    const setUser = useAuthStore((s) => s.setUser);
    const logout = useAuthStore((s) => s.logout);
    const collapsed = useUIStore((s) => s.sidebarCollapsed);

    useEffect(() => {
        if (!token) {
            router.replace('/login');
            return;
        }
        authApi.me(token).then(setUser).catch(() => {
            logout();
            router.replace('/login');
        });
    }, [token, router, setUser, logout]);

    if (!token) return null;

    return (
        <div className="min-h-screen bg-bg-primary">
            <Sidebar />
            <TopBar />
            <main
                className={cn(
                    'pt-14 min-h-screen transition-all duration-300',
                    collapsed ? 'ml-16' : 'ml-60'
                )}
            >
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
