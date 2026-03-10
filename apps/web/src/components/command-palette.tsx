'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
    BarChart3,
    Bell,
    FolderOpen,
    HardDrive,
    LayoutDashboard,
    Puzzle,
    ScrollText,
    Search,
    Settings,
    Terminal,
    Users,
    Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const commands = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Console', href: '/console', icon: Terminal },
    { label: 'Players', href: '/players', icon: Users },
    { label: 'Resources', href: '/resources', icon: FolderOpen },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Automation', href: '/automation', icon: Zap },
    { label: 'Alerts', href: '/alerts', icon: Bell },
    { label: 'Backups', href: '/backups', icon: HardDrive },
    { label: 'Plugins', href: '/plugins', icon: Puzzle },
    { label: 'Audit Log', href: '/audit', icon: ScrollText },
    { label: 'Settings', href: '/settings', icon: Settings },
];

export function CommandPalette() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = commands.filter((c) =>
        c.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setOpen((prev) => !prev);
            setSearch('');
            setSelected(0);
        }
        if (e.key === 'Escape') setOpen(false);
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    const handleSelect = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelected((s) => Math.min(s + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelected((s) => Math.max(s - 1, 0));
        } else if (e.key === 'Enter' && filtered[selected]) {
            handleSelect(filtered[selected].href);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="relative z-10 w-full max-w-lg mx-4 glass-card overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search */}
                        <div className="flex items-center gap-3 px-4 border-b border-border">
                            <Search className="w-5 h-5 text-muted shrink-0" />
                            <input
                                ref={inputRef}
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setSelected(0); }}
                                onKeyDown={handleInputKeyDown}
                                className="flex-1 py-4 bg-transparent text-text text-sm focus:outline-none placeholder:text-muted/50"
                                placeholder="Navigate to..."
                            />
                            <kbd className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-muted font-mono">ESC</kbd>
                        </div>

                        {/* Results */}
                        <div className="max-h-72 overflow-y-auto py-2">
                            {filtered.map((cmd, i) => (
                                <button
                                    key={cmd.href}
                                    onClick={() => handleSelect(cmd.href)}
                                    onMouseEnter={() => setSelected(i)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${i === selected ? 'bg-primary/10 text-primary' : 'text-muted hover:text-text'
                                        }`}
                                >
                                    <cmd.icon className="w-4 h-4" />
                                    {cmd.label}
                                </button>
                            ))}
                            {filtered.length === 0 && (
                                <p className="text-sm text-muted text-center py-6">No results</p>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
