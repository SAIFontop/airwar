'use client';

import { useServerLogs } from '@/lib/hooks';
import { motion } from 'framer-motion';
import { Download, ScrollText, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function ServerLogsPage() {
    const { data } = useServerLogs();
    const [filter, setFilter] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);
    const [levelFilter, setLevelFilter] = useState<string>('all');
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const lines = data?.lines || [];

    const filteredLines = useMemo(() => {
        let result = lines;
        if (filter) {
            const re = new RegExp(filter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            result = result.filter((l) => re.test(l));
        }
        if (levelFilter !== 'all') {
            result = result.filter((l) => {
                const lower = l.toLowerCase();
                if (levelFilter === 'error') return lower.includes('error') || lower.includes('err');
                if (levelFilter === 'warn') return lower.includes('warn') || lower.includes('warning');
                if (levelFilter === 'info') return lower.includes('info');
                return true;
            });
        }
        return result;
    }, [lines, filter, levelFilter]);

    useEffect(() => {
        if (autoScroll) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [filteredLines, autoScroll]);

    const getLineColor = (line: string) => {
        const lower = line.toLowerCase();
        if (lower.includes('error') || lower.includes('err')) return 'text-red-400';
        if (lower.includes('warn') || lower.includes('warning')) return 'text-amber-400';
        if (lower.includes('info')) return 'text-cyan-400';
        if (lower.includes('success') || lower.includes('started')) return 'text-emerald-400';
        return 'text-muted';
    };

    const handleDownload = () => {
        const content = filteredLines.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `server-logs-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-[calc(100vh-8rem)]"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ScrollText className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-text">Server Logs</h2>
                    <span className="text-xs text-muted ml-2">{filteredLines.length} lines</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition ${autoScroll ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted hover:text-text'
                            }`}
                    >
                        Auto-scroll {autoScroll ? 'ON' : 'OFF'}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-muted hover:text-text transition text-xs"
                    >
                        <Download className="w-3.5 h-3.5" /> Export
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 flex-1 glass-card px-3 py-2">
                    <Search className="w-4 h-4 text-muted" />
                    <input
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Search logs..."
                        className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted/40"
                    />
                </div>
                <div className="flex items-center gap-1">
                    {['all', 'error', 'warn', 'info'].map((level) => (
                        <button
                            key={level}
                            onClick={() => setLevelFilter(level)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition ${levelFilter === level
                                    ? level === 'error'
                                        ? 'bg-red-400/20 text-red-400'
                                        : level === 'warn'
                                            ? 'bg-amber-400/20 text-amber-400'
                                            : level === 'info'
                                                ? 'bg-cyan-400/20 text-cyan-400'
                                                : 'bg-primary/20 text-primary'
                                    : 'bg-white/5 text-muted hover:text-text'
                                }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            {/* Log Output */}
            <div
                ref={containerRef}
                className="flex-1 glass-card p-4 overflow-y-auto font-mono text-xs leading-relaxed scrollbar-thin"
                onScroll={() => {
                    if (!containerRef.current) return;
                    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
                    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
                    if (!atBottom && autoScroll) setAutoScroll(false);
                }}
            >
                {filteredLines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted">
                        <ScrollText className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm">{filter || levelFilter !== 'all' ? 'No matching logs' : 'No logs available'}</p>
                    </div>
                ) : (
                    filteredLines.map((line, i) => (
                        <div
                            key={i}
                            className={`whitespace-pre-wrap break-all hover:bg-white/5 px-1 -mx-1 rounded ${getLineColor(line)}`}
                        >
                            {line}
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>
        </motion.div>
    );
}
