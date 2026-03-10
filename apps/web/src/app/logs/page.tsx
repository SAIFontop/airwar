'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, Bug, Download, FileText, Search } from 'lucide-react';
import { useState } from 'react';

interface LogEntry {
    id: number;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    resource: string;
    message: string;
}

const mockLogs: LogEntry[] = Array.from({ length: 50 }, (_, i) => {
    const levels: LogEntry['level'][] = ['info', 'info', 'warn', 'error', 'debug', 'info'];
    const resources = ['es_extended', 'garage', 'phone', 'monitor', 'txAdmin', 'ox_inventory', 'mysql-async'];
    const messages = [
        'Player connected successfully',
        'Resource heartbeat check passed',
        'Slow callback detected (>100ms)',
        'SCRIPT ERROR: attempt to index nil value',
        'Inventory sync completed',
        'Database query took 245ms',
        'Player disconnected (Timed out)',
        'Scheduled task executed',
        'Memory cleanup triggered',
        'Cache invalidated',
    ];
    return {
        id: i + 1,
        timestamp: `2024-01-15 12:${String(i % 60).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}.${String((i * 123) % 1000).padStart(3, '0')}`,
        level: levels[i % levels.length],
        resource: resources[i % resources.length],
        message: messages[i % messages.length],
    };
});

const levelColor: Record<string, string> = { info: 'text-blue-400', warn: 'text-yellow-400', error: 'text-red-400', debug: 'text-zinc-400' };
const levelBg: Record<string, string> = { info: 'bg-blue-400/10', warn: 'bg-yellow-400/10', error: 'bg-red-400/10', debug: 'bg-zinc-400/10' };

export default function LogsPage() {
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState<string[]>([]);

    const filtered = mockLogs.filter((log) => {
        if (levelFilter.length > 0 && !levelFilter.includes(log.level)) return false;
        if (search && !log.message.toLowerCase().includes(search.toLowerCase()) && !log.resource.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const errorCount = mockLogs.filter((l) => l.level === 'error').length;
    const warnCount = mockLogs.filter((l) => l.level === 'warn').length;

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Logs</h1>
                    <p className="text-sm text-muted-foreground mt-1">Browse and search server log entries</p>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-accent/30 text-muted-foreground hover:text-foreground transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    Export Logs
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-panel p-4 flex items-center gap-3">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <div><div className="text-lg font-semibold text-foreground">{mockLogs.length}</div><div className="text-[10px] text-muted-foreground">Total Entries</div></div>
                </div>
                <div className="glass-panel p-4 flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <div><div className="text-lg font-semibold text-foreground">{warnCount}</div><div className="text-[10px] text-muted-foreground">Warnings</div></div>
                </div>
                <div className="glass-panel p-4 flex items-center gap-3">
                    <Bug className="w-4 h-4 text-red-400" />
                    <div><div className="text-lg font-semibold text-foreground">{errorCount}</div><div className="text-[10px] text-muted-foreground">Errors</div></div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search logs..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                    />
                </div>
                <div className="flex items-center gap-1">
                    {(['info', 'warn', 'error', 'debug'] as const).map((level) => (
                        <button
                            key={level}
                            onClick={() => setLevelFilter((prev) => prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level])}
                            className={cn(
                                'px-2 py-1 rounded text-[10px] font-medium uppercase transition-colors',
                                levelFilter.includes(level) || levelFilter.length === 0 ? cn(levelColor[level], levelBg[level]) : 'text-zinc-600 bg-zinc-800/50',
                            )}
                        >
                            {level}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-muted-foreground ml-auto">{filtered.length} entries</span>
            </div>

            {/* Log table */}
            <div className="glass-panel overflow-hidden font-mono text-xs">
                <div className="grid grid-cols-[180px_60px_120px_1fr] gap-4 px-5 py-2.5 border-b border-border text-muted-foreground font-sans font-medium">
                    <span>Timestamp</span><span>Level</span><span>Resource</span><span>Message</span>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                    {filtered.map((log) => (
                        <div key={log.id} className={cn('grid grid-cols-[180px_60px_120px_1fr] gap-4 px-5 py-1.5 hover:bg-accent/20', log.level === 'error' && 'bg-red-500/5')}>
                            <span className="text-zinc-500">{log.timestamp}</span>
                            <span className={cn('uppercase font-medium', levelColor[log.level])}>{log.level}</span>
                            <span className="text-purple-400 truncate">{log.resource}</span>
                            <span className="text-zinc-300 break-all">{log.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
