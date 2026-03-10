'use client';

import { cn } from '@/lib/utils';
import {
    Search
} from 'lucide-react';
import { useState } from 'react';

interface Player {
    id: number;
    name: string;
    identifiers: { type: string; value: string }[];
    ping: number;
    source: string;
    joinedAt: string;
    playtime: string;
    warnings: number;
    banned: boolean;
}

const mockPlayers: Player[] = [
    {
        id: 1, name: 'JohnDoe', ping: 42, source: 'FiveM Production',
        identifiers: [{ type: 'steam', value: 'steam:110000112345678' }, { type: 'discord', value: 'discord:987654321' }],
        joinedAt: '2h 15m ago', playtime: '342h', warnings: 0, banned: false,
    },
    {
        id: 2, name: 'JaneDoe', ping: 78, source: 'FiveM Production',
        identifiers: [{ type: 'discord', value: 'discord:123456789' }],
        joinedAt: '45m ago', playtime: '89h', warnings: 2, banned: false,
    },
    {
        id: 3, name: 'AdminPlayer', ping: 12, source: 'FiveM Production',
        identifiers: [{ type: 'license', value: 'license:abcdef123456' }],
        joinedAt: '5h 30m ago', playtime: '1204h', warnings: 0, banned: false,
    },
    {
        id: 4, name: 'TroubleMaker', ping: 156, source: 'FiveM Staging',
        identifiers: [{ type: 'steam', value: 'steam:110000198765432' }],
        joinedAt: '10m ago', playtime: '12h', warnings: 5, banned: false,
    },
    {
        id: 5, name: 'BannedUser', ping: 0, source: '—',
        identifiers: [{ type: 'steam', value: 'steam:110000100000001' }],
        joinedAt: '—', playtime: '3h', warnings: 8, banned: true,
    },
];

export default function PlayersPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'online' | 'banned'>('all');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const filtered = mockPlayers.filter((p) => {
        if (filter === 'online') return !p.banned && p.ping > 0;
        if (filter === 'banned') return p.banned;
        return true;
    }).filter((p) =>
        search === '' || p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.identifiers.some((id) => id.value.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Players</h1>
                <p className="text-sm text-muted-foreground mt-1">Monitor and manage connected players across all servers</p>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search players or identifiers..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {(['all', 'online', 'banned'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                                filter === f
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground bg-accent/30',
                            )}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                            {f === 'online' && <span className="ml-1 text-emerald-400">({mockPlayers.filter((p) => p.ping > 0 && !p.banned).length})</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Player table */}
            <div className="glass-panel">
                <div className="grid grid-cols-[40px_1fr_120px_80px_80px_80px_80px] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground">
                    <span>ID</span>
                    <span>Player</span>
                    <span>Server</span>
                    <span className="text-right">Ping</span>
                    <span className="text-right">Playtime</span>
                    <span className="text-right">Warns</span>
                    <span className="text-right">Actions</span>
                </div>
                {filtered.map((player) => (
                    <div key={player.id}>
                        <div
                            className="grid grid-cols-[40px_1fr_120px_80px_80px_80px_80px] gap-4 px-5 py-3 hover:bg-accent/30 transition-colors items-center cursor-pointer"
                            onClick={() => setExpandedId(expandedId === player.id ? null : player.id)}
                        >
                            <span className="text-xs text-muted-foreground">#{player.id}</span>
                            <div className="flex items-center gap-2">
                                <div className={cn('w-2 h-2 rounded-full', player.banned ? 'bg-red-500' : player.ping > 0 ? 'bg-emerald-500' : 'bg-zinc-500')} />
                                <span className="text-sm font-medium text-foreground">{player.name}</span>
                                {player.banned && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">BANNED</span>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground truncate">{player.source}</span>
                            <span className={cn('text-xs text-right', player.ping > 100 ? 'text-red-400' : 'text-foreground')}>
                                {player.ping > 0 ? `${player.ping}ms` : '—'}
                            </span>
                            <span className="text-xs text-right text-foreground">{player.playtime}</span>
                            <span className={cn('text-xs text-right', player.warnings > 3 ? 'text-red-400' : player.warnings > 0 ? 'text-yellow-400' : 'text-foreground')}>
                                {player.warnings}
                            </span>
                            <div className="flex items-center justify-end gap-1">
                                <button className="px-2 py-1 text-[10px] rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
                                    Kick
                                </button>
                                <button className="px-2 py-1 text-[10px] rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                                    Ban
                                </button>
                            </div>
                        </div>
                        {/* Expanded details */}
                        {expandedId === player.id && (
                            <div className="px-5 py-3 bg-accent/20 border-t border-border/50 space-y-2">
                                <div className="text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">Identifiers:</span>
                                    {player.identifiers.map((id) => (
                                        <span key={id.value} className="ml-2 font-mono text-[11px] bg-accent/30 px-1.5 py-0.5 rounded">
                                            {id.value}
                                        </span>
                                    ))}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">Session started:</span> {player.joinedAt}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                        No players found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
}
