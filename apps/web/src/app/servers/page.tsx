'use client';

import { cn, formatUptime } from '@/lib/utils';
import {
    Clock,
    Cpu,
    HardDrive,
    Play,
    Plus,
    RotateCcw,
    Square,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface ServerItem {
    id: string;
    name: string;
    status: 'running' | 'stopped' | 'crashed' | 'starting';
    players: number;
    maxPlayers: number;
    cpu: number;
    memory: number;
    uptime: number;
    endpoint: string;
    version: string;
}

const mockServers: ServerItem[] = [
    {
        id: 'srv-prod-1',
        name: 'FiveM Production',
        status: 'running',
        players: 87,
        maxPlayers: 128,
        cpu: 42,
        memory: 61,
        uptime: 432000,
        endpoint: '0.0.0.0:30120',
        version: 'b2944',
    },
    {
        id: 'srv-staging',
        name: 'FiveM Staging',
        status: 'running',
        players: 12,
        maxPlayers: 64,
        cpu: 18,
        memory: 34,
        uptime: 86400,
        endpoint: '0.0.0.0:30121',
        version: 'b2944',
    },
    {
        id: 'srv-dev',
        name: 'FiveM Dev',
        status: 'stopped',
        players: 0,
        maxPlayers: 32,
        cpu: 0,
        memory: 0,
        uptime: 0,
        endpoint: '0.0.0.0:30122',
        version: 'b2944',
    },
];

export default function ServersPage() {
    const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all');

    const filtered = mockServers.filter((s) => {
        if (filter === 'running') return s.status === 'running';
        if (filter === 'stopped') return s.status === 'stopped' || s.status === 'crashed';
        return true;
    });

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Servers</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage and monitor your FiveM server instances</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Server
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                {(['all', 'running', 'stopped'] as const).map((f) => (
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
                    </button>
                ))}
                <span className="ml-auto text-xs text-muted-foreground">
                    {filtered.length} server{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Server cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((server) => (
                    <Link
                        key={server.id}
                        href={`/servers/${server.id}`}
                        className="glass-panel p-5 hover:border-primary/40 transition-all group"
                    >
                        {/* Top row */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn('status-dot', `status-dot-${server.status}`)} />
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {server.name}
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{server.endpoint}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {server.status === 'stopped' ? (
                                    <button
                                        onClick={(e) => { e.preventDefault(); }}
                                        className="p-1.5 rounded-md hover:bg-emerald-500/20 text-emerald-400"
                                    >
                                        <Play className="w-3.5 h-3.5" />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={(e) => { e.preventDefault(); }}
                                            className="p-1.5 rounded-md hover:bg-yellow-500/20 text-yellow-400"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.preventDefault(); }}
                                            className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400"
                                        >
                                            <Square className="w-3.5 h-3.5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-3">
                            <div>
                                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                    <Users className="w-3 h-3" />
                                    <span className="text-[10px]">Players</span>
                                </div>
                                <span className="text-sm font-medium text-foreground">
                                    {server.players}/{server.maxPlayers}
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                    <Cpu className="w-3 h-3" />
                                    <span className="text-[10px]">CPU</span>
                                </div>
                                <span className={cn('text-sm font-medium', server.cpu > 80 ? 'text-red-400' : 'text-foreground')}>
                                    {server.cpu}%
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                    <HardDrive className="w-3 h-3" />
                                    <span className="text-[10px]">Memory</span>
                                </div>
                                <span className={cn('text-sm font-medium', server.memory > 80 ? 'text-red-400' : 'text-foreground')}>
                                    {server.memory}%
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[10px]">Uptime</span>
                                </div>
                                <span className="text-sm font-medium text-foreground">
                                    {server.uptime > 0 ? formatUptime(server.uptime) : '—'}
                                </span>
                            </div>
                        </div>

                        {/* Progress bars */}
                        <div className="mt-4 space-y-2">
                            <div>
                                <div className="h-1 bg-border rounded-full overflow-hidden">
                                    <div
                                        className={cn('h-full rounded-full transition-all', server.cpu > 80 ? 'bg-red-500' : 'bg-emerald-500')}
                                        style={{ width: `${server.cpu}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="h-1 bg-border rounded-full overflow-hidden">
                                    <div
                                        className={cn('h-full rounded-full transition-all', server.memory > 80 ? 'bg-red-500' : 'bg-blue-500')}
                                        style={{ width: `${server.memory}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
