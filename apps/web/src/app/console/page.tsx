'use client';

import { cn } from '@/lib/utils';
import {
    Download,
    Pause,
    Play,
    Search,
    Terminal,
    Trash2
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface LogLine {
    time: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    resource: string;
    message: string;
}

const mockLogs: LogLine[] = [
    { time: '12:34:56.123', level: 'info', resource: 'txAdmin', message: 'Player JohnDoe connected (steam:110000112345678)' },
    { time: '12:34:56.456', level: 'info', resource: 'es_extended', message: 'Loading user data for JohnDoe' },
    { time: '12:34:57.012', level: 'warn', resource: 'es_extended', message: 'Slow callback detected: onPlayerLoaded took 142ms' },
    { time: '12:34:57.234', level: 'info', resource: 'monitor', message: 'Heartbeat OK - tick: 61.2ms, players: 87/128' },
    { time: '12:34:58.001', level: 'error', resource: 'garage', message: 'SCRIPT ERROR: attempt to index nil value @ garage/server.lua:142' },
    { time: '12:34:58.002', level: 'error', resource: 'garage', message: '  > function \'getVehicle\' (garage/server.lua:142)' },
    { time: '12:34:58.003', level: 'error', resource: 'garage', message: '  > function \'onPlayerUse\' (garage/server.lua:87)' },
    { time: '12:35:00.000', level: 'info', resource: 'hardcap', message: 'Player count: 87/128 (68%)' },
    { time: '12:35:01.100', level: 'debug', resource: 'ox_inventory', message: 'Syncing inventory for player 42' },
    { time: '12:35:02.200', level: 'info', resource: 'txAdmin', message: 'Executing scheduled restart check' },
    { time: '12:35:03.300', level: 'info', resource: 'monitor', message: 'Heartbeat OK - tick: 62.1ms, players: 87/128' },
    { time: '12:35:04.400', level: 'warn', resource: 'phone', message: 'High memory usage detected: 67MB (threshold: 50MB)' },
    { time: '12:35:05.500', level: 'info', resource: 'txAdmin', message: 'Player JaneDoe disconnected (Timed out)' },
    { time: '12:35:06.600', level: 'info', resource: 'es_extended', message: 'Saving user data for JaneDoe' },
    { time: '12:35:07.700', level: 'info', resource: 'monitor', message: 'Heartbeat OK - tick: 60.8ms, players: 86/128' },
];

const levelColor: Record<string, string> = {
    info: 'text-blue-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
    debug: 'text-zinc-400',
};

const levelBg: Record<string, string> = {
    info: 'bg-blue-400/10',
    warn: 'bg-yellow-400/10',
    error: 'bg-red-400/10',
    debug: 'bg-zinc-400/10',
};

export default function ConsolePage() {
    const [command, setCommand] = useState('');
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState<string[]>([]);
    const [paused, setPaused] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const filtered = mockLogs.filter((log) => {
        if (levelFilter.length > 0 && !levelFilter.includes(log.level)) return false;
        if (search && !log.message.toLowerCase().includes(search.toLowerCase()) && !log.resource.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    useEffect(() => {
        if (!paused && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [filtered.length, paused]);

    return (
        <div className="p-6 space-y-4 max-w-[1600px] mx-auto h-[calc(100vh-80px)] flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Console</h1>
                    <p className="text-sm text-muted-foreground mt-1">Live server console output and command execution</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPaused(!paused)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                            paused ? 'bg-yellow-500/20 text-yellow-400' : 'bg-accent/30 text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        {paused ? 'Resume' : 'Pause'}
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-accent/30 text-muted-foreground hover:text-foreground transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear
                    </button>
                </div>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter logs..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-md bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                    />
                </div>
                <div className="flex items-center gap-1">
                    {(['info', 'warn', 'error', 'debug'] as const).map((level) => (
                        <button
                            key={level}
                            onClick={() =>
                                setLevelFilter((prev) =>
                                    prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
                                )
                            }
                            className={cn(
                                'px-2 py-1 rounded text-[10px] font-medium uppercase transition-colors',
                                levelFilter.includes(level) || levelFilter.length === 0
                                    ? cn(levelColor[level], levelBg[level])
                                    : 'text-zinc-600 bg-zinc-800/50',
                            )}
                        >
                            {level}
                        </button>
                    ))}
                </div>
                <span className="text-[10px] text-muted-foreground ml-auto">
                    {filtered.length} lines
                </span>
            </div>

            {/* Console output */}
            <div
                ref={scrollRef}
                className="glass-panel flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-5 custom-scrollbar"
            >
                {filtered.map((log, i) => (
                    <div key={i} className={cn('flex gap-2 px-1 py-0.5 rounded', log.level === 'error' && 'bg-red-500/5')}>
                        <span className="text-zinc-600 shrink-0 select-none">{log.time}</span>
                        <span className={cn('shrink-0 w-12 uppercase font-medium', levelColor[log.level])}>
                            {log.level}
                        </span>
                        <span className="shrink-0 text-purple-400 w-24 truncate">[{log.resource}]</span>
                        <span className="text-zinc-300 break-all">{log.message}</span>
                    </div>
                ))}
                {paused && (
                    <div className="sticky bottom-0 text-center py-2 text-yellow-400 text-xs bg-background/80 backdrop-blur-sm">
                        ⏸ Console paused — new output buffered
                    </div>
                )}
            </div>

            {/* Command input */}
            <div className="glass-panel flex items-center gap-3 px-4 py-3">
                <Terminal className="w-4 h-4 text-primary shrink-0" />
                <span className="text-primary font-mono text-sm shrink-0">&gt;</span>
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && command.trim()) {
                            setCommand('');
                        }
                    }}
                    placeholder="Enter server command..."
                    className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none"
                />
                <kbd className="text-[10px] text-muted-foreground bg-accent/30 px-1.5 py-0.5 rounded">Enter</kbd>
            </div>
        </div>
    );
}
