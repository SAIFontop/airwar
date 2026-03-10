'use client';

import { useMemo } from 'react';
import { useAlertStore, useServerStore, useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Bell, Command, Search } from 'lucide-react';

export function TopBar() {
    const { setCommandPaletteOpen } = useUIStore();
    const allAlerts = useAlertStore((s) => s.alerts);
    const alerts = useMemo(() => allAlerts.filter((a) => !a.acknowledged), [allAlerts]);
    const activeServerId = useServerStore((s) => s.activeServerId);
    const servers = useServerStore((s) => s.servers);
    const activeServer = servers.find((s) => s.id === activeServerId);

    return (
        <header className="flex items-center justify-between h-14 px-6 border-b border-border/50 bg-card/20 backdrop-blur-sm">
            {/* Search trigger */}
            <button
                onClick={() => setCommandPaletteOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
            >
                <Search className="w-3.5 h-3.5" />
                <span>Search...</span>
                <div className="flex items-center gap-0.5 ml-4">
                    <kbd className="kbd"><Command className="w-2.5 h-2.5" /></kbd>
                    <kbd className="kbd">K</kbd>
                </div>
            </button>

            <div className="flex items-center gap-4">
                {/* Active server indicator */}
                {activeServer && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-xs">
                        <div className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            activeServer.status === 'ONLINE' ? 'bg-green-500' : 'bg-zinc-500'
                        )} />
                        <span className="text-muted-foreground">{activeServer.name}</span>
                    </div>
                )}

                {/* Alerts */}
                <button className="relative p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    {alerts.length > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                    )}
                </button>

                {/* User avatar */}
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">S</span>
                </div>
            </div>
        </header>
    );
}
