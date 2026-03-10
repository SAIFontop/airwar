'use client';

import { useAuthStore, useWsStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Search, Wifi, WifiOff } from 'lucide-react';
import { usePathname } from 'next/navigation';

const pathLabels: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/console': 'Console',
    '/players': 'Players',
    '/resources': 'Resources',
    '/analytics': 'Analytics',
    '/automation': 'Automation',
    '/alerts': 'Alerts',
    '/backups': 'Backups',
    '/plugins': 'Plugins',
    '/audit': 'Audit Log',
    '/settings': 'Settings',
    '/settings/security': 'Security Settings',
};

export function Header() {
    const pathname = usePathname();
    const connected = useWsStore((s) => s.connected);
    const serverStatus = useWsStore((s) => s.serverStatus);
    const user = useAuthStore((s) => s.user);

    const title = pathLabels[pathname || ''] || 'SaifControl';

    return (
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-surface/60 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
                <motion.h1
                    key={pathname}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-bold text-text"
                >
                    {title}
                </motion.h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Search trigger */}
                <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-border text-muted text-sm hover:text-text transition-colors"
                    onClick={() => {
                        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
                        document.dispatchEvent(event);
                    }}
                >
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Search...</span>
                    <kbd className="hidden sm:inline text-xs px-1.5 py-0.5 rounded bg-white/10 font-mono">⌘K</kbd>
                </button>

                {/* Server status + WS */}
                <div className="flex items-center gap-2">
                    <div className={cn('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                        serverStatus === 'online' ? 'bg-success/15 text-success' :
                            serverStatus === 'starting' ? 'bg-warning/15 text-warning' :
                                'bg-danger/15 text-danger'
                    )}>
                        <span className={cn('w-2 h-2 rounded-full',
                            serverStatus === 'online' ? 'bg-success status-online' :
                                serverStatus === 'starting' ? 'bg-warning status-warning' :
                                    'bg-danger'
                        )} />
                        {serverStatus}
                    </div>

                    {connected ? (
                        <Wifi className="w-4 h-4 text-success" />
                    ) : (
                        <WifiOff className="w-4 h-4 text-danger" />
                    )}
                </div>

                {/* User badge */}
                {user && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold uppercase">
                            {user.username?.charAt(0) || '?'}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
