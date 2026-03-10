'use client';

import { CommandPalette } from '@/components/command-palette';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { api } from '@/lib/api';
import { connectWs, disconnectWs, useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        checkAuth().then((ok) => {
            if (!ok) {
                router.replace('/login');
            } else {
                setReady(true);
                const token = api.getAccessToken();
                if (token) connectWs(token);
            }
        });
        return () => disconnectWs();
    }, [checkAuth, router]);

    if (isLoading || !ready) {
        return (
            <div className="min-h-screen flex items-center justify-center mesh-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-muted text-sm">Loading...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="flex min-h-screen mesh-bg">
            <CommandPalette />
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
