'use client';

import { useAuthStore, useWsStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Search, Wifi, WifiOff } from 'lucide-react';
import { usePathname } from 'next/navigation';

const pathLabels: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/console': 'Console',
    '/web-terminal': 'Web Terminal',
    '/players': 'Players',
    '/resources': 'Resources',
    '/file-manager': 'File Manager',
    '/server-logs': 'Server Logs',
    '/scheduler': 'Scheduler',
    '/tunnel': 'Tunnel & Tools',
    '/config-editor': 'Config Editor',
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
        <header className="sticky top-0 z-30 h-14 border-b border-white/[0.06] bg-[#0c0c12]/60 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
                <motion.h1
                    key={pathname}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[15px] font-semibold text-text"
                >
                    {title}
                </motion.h1>
            </div>

            <div className="flex items-center gap-3">
                {/* Search trigger */}
                <button
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-muted text-xs hover:text-text hover:border-white/[0.1] transition-all"
                    onClick={() => {
                        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
                        document.dispatchEvent(event);
                    }}
                >
                    <Search className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Search</span>
                    <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] font-mono text-muted/60">⌘K</kbd>
                </button>

                {/* Server status */}
                <div className={cn(
                    'flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full',
                    serverStatus === 'online' ? 'bg-success/10 text-success' :
                        serverStatus === 'starting' ? 'bg-warning/10 text-warning' :
                            'bg-danger/10 text-danger'
                )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full',
                        serverStatus === 'online' ? 'bg-success' :
                            serverStatus === 'starting' ? 'bg-warning' :
                                'bg-danger'
                    )} />
                    {serverStatus}
                </div>

                {/* WS indicator */}
                {connected ? (
                    <Wifi className="w-3.5 h-3.5 text-success/60" />
                ) : (
                    <WifiOff className="w-3.5 h-3.5 text-danger/60" />
                )}

                {/* User avatar */}
                {user && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center text-white text-[11px] font-bold uppercase">
                        {user.username?.charAt(0) || '?'}
                    </div>
                )}
            </div>
        </header>
    );
}
