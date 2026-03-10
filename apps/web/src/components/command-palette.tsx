'use client';

import { useUIStore } from '@/lib/store';
import {
    Activity,
    Bell,
    FileText,
    LayoutDashboard,
    Puzzle,
    Server,
    Settings,
    Terminal,
    Users,
    Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

const commands = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, href: '/' },
    { id: 'servers', label: 'Go to Servers', icon: Server, href: '/servers' },
    { id: 'players', label: 'Go to Players', icon: Users, href: '/players' },
    { id: 'console', label: 'Go to Console', icon: Terminal, href: '/console' },
    { id: 'resources', label: 'Go to Resources', icon: Puzzle, href: '/resources' },
    { id: 'metrics', label: 'Go to Metrics', icon: Activity, href: '/metrics' },
    { id: 'logs', label: 'Go to Logs', icon: FileText, href: '/logs' },
    { id: 'automation', label: 'Go to Automation', icon: Zap, href: '/automation' },
    { id: 'alerts', label: 'Go to Alerts', icon: Bell, href: '/alerts' },
    { id: 'settings', label: 'Go to Settings', icon: Settings, href: '/settings' },
];

export function CommandPalette() {
    const router = useRouter();
    const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(!commandPaletteOpen);
            }
            if (e.key === 'Escape') {
                setCommandPaletteOpen(false);
            }
        },
        [commandPaletteOpen, setCommandPaletteOpen],
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!commandPaletteOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setCommandPaletteOpen(false)}
            />

            {/* Palette */}
            <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-slide-in">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 border-b border-border">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        autoFocus
                        type="text"
                        placeholder="Type a command or search..."
                        className="flex-1 py-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                </div>

                {/* Command list */}
                <div className="max-h-80 overflow-y-auto p-1">
                    <div className="px-2 py-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Navigation
                        </span>
                    </div>
                    {commands.map((cmd) => (
                        <button
                            key={cmd.id}
                            onClick={() => {
                                router.push(cmd.href);
                                setCommandPaletteOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                        >
                            <cmd.icon className="w-4 h-4" />
                            <span>{cmd.label}</span>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
                    <span>↑↓ Navigate</span>
                    <span>↵ Select</span>
                    <span>Esc Close</span>
                </div>
            </div>
        </div>
    );
}
