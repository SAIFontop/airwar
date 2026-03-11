'use client';

import { useConsole, useServerControl } from '@/lib/hooks';
import { useWsStore } from '@/lib/store';
import { motion } from 'framer-motion';
import {
    ArrowDown,
    Copy,
    Pause,
    Play,
    Search,
    Send,
    Terminal as TermIcon,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// ─── FiveM ^0-^9 color map ───
const FIVEM_COLORS: Record<string, string> = {
    '^0': '#F2F2F2', // white (reset)
    '^1': '#FF3333', // red
    '^2': '#33FF33', // green
    '^3': '#FFFF33', // yellow
    '^4': '#3366FF', // blue
    '^5': '#33FFFF', // cyan
    '^6': '#FF33FF', // magenta
    '^7': '#F2F2F2', // white
    '^8': '#FF6633', // orange
    '^9': '#A0A0A0', // grey
};

// ─── Standard ANSI 16-color palette ───
const ANSI_FG: Record<number, string> = {
    30: '#1a1a1a', 31: '#cc3333', 32: '#33cc33', 33: '#cccc33',
    34: '#3366cc', 35: '#cc33cc', 36: '#33cccc', 37: '#cccccc',
    90: '#666666', 91: '#ff5555', 92: '#55ff55', 93: '#ffff55',
    94: '#5577ff', 95: '#ff55ff', 96: '#55ffff', 97: '#ffffff',
};

const ANSI_BG: Record<number, string> = {
    40: '#1a1a1a', 41: '#cc3333', 42: '#33cc33', 43: '#cccc33',
    44: '#3366cc', 45: '#cc33cc', 46: '#33cccc', 47: '#cccccc',
    100: '#666666', 101: '#ff5555', 102: '#55ff55', 103: '#ffff55',
    104: '#5577ff', 105: '#ff55ff', 106: '#55ffff', 107: '#ffffff',
};

// ─── 256-color palette (indices 0-255) ───
const PALETTE_256: string[] = (() => {
    const p: string[] = [];
    // 0-7: standard
    const std = ['#000000', '#cc3333', '#33cc33', '#cccc33', '#3366cc', '#cc33cc', '#33cccc', '#cccccc'];
    // 8-15: bright
    const bright = ['#666666', '#ff5555', '#55ff55', '#ffff55', '#5577ff', '#ff55ff', '#55ffff', '#ffffff'];
    p.push(...std, ...bright);
    // 16-231: 6x6x6 color cube
    const v = [0, 95, 135, 175, 215, 255];
    for (let r = 0; r < 6; r++)
        for (let g = 0; g < 6; g++)
            for (let b = 0; b < 6; b++)
                p.push(`#${v[r].toString(16).padStart(2, '0')}${v[g].toString(16).padStart(2, '0')}${v[b].toString(16).padStart(2, '0')}`);
    // 232-255: grayscale
    for (let i = 0; i < 24; i++) {
        const c = (8 + i * 10).toString(16).padStart(2, '0');
        p.push(`#${c}${c}${c}`);
    }
    return p;
})();

interface Span {
    text: string;
    color?: string;
    bg?: string;
    bold?: boolean;
    dim?: boolean;
    italic?: boolean;
    underline?: boolean;
}

/** Parse a single line containing ANSI escape codes AND FiveM ^N color codes into styled spans. */
function parseLine(raw: string): Span[] {
    const spans: Span[] = [];
    let color: string | undefined;
    let bg: string | undefined;
    let bold = false;
    let dim = false;
    let italic = false;
    let underline = false;
    let buffer = '';

    const flush = () => {
        if (buffer) {
            spans.push({ text: buffer, color, bg, bold, dim, italic, underline });
            buffer = '';
        }
    };

    let i = 0;
    while (i < raw.length) {
        // FiveM ^N codes
        if (raw[i] === '^' && i + 1 < raw.length && raw[i + 1] >= '0' && raw[i + 1] <= '9') {
            flush();
            const code = raw.substring(i, i + 2);
            color = FIVEM_COLORS[code];
            if (code === '^0' || code === '^7') color = undefined; // reset
            i += 2;
            continue;
        }

        // ANSI: ESC [ ... m
        if (raw[i] === '\x1b' && raw[i + 1] === '[') {
            const end = raw.indexOf('m', i + 2);
            if (end !== -1) {
                flush();
                const params = raw.substring(i + 2, end).split(';').map(Number);
                let pi = 0;
                while (pi < params.length) {
                    const p = params[pi];
                    if (p === 0) { color = undefined; bg = undefined; bold = false; dim = false; italic = false; underline = false; }
                    else if (p === 1) bold = true;
                    else if (p === 2) dim = true;
                    else if (p === 3) italic = true;
                    else if (p === 4) underline = true;
                    else if (p === 22) { bold = false; dim = false; }
                    else if (p === 23) italic = false;
                    else if (p === 24) underline = false;
                    else if (p === 39) color = undefined;
                    else if (p === 49) bg = undefined;
                    // 256-color: 38;5;N (fg) or 48;5;N (bg)
                    else if (p === 38 && params[pi + 1] === 5 && pi + 2 < params.length) {
                        color = PALETTE_256[params[pi + 2]] || undefined;
                        pi += 2;
                    }
                    else if (p === 48 && params[pi + 1] === 5 && pi + 2 < params.length) {
                        bg = PALETTE_256[params[pi + 2]] || undefined;
                        pi += 2;
                    }
                    // Truecolor: 38;2;R;G;B (fg) or 48;2;R;G;B (bg)
                    else if (p === 38 && params[pi + 1] === 2 && pi + 4 < params.length) {
                        color = `rgb(${params[pi + 2]},${params[pi + 3]},${params[pi + 4]})`;
                        pi += 4;
                    }
                    else if (p === 48 && params[pi + 1] === 2 && pi + 4 < params.length) {
                        bg = `rgb(${params[pi + 2]},${params[pi + 3]},${params[pi + 4]})`;
                        pi += 4;
                    }
                    else if (ANSI_FG[p]) color = ANSI_FG[p];
                    else if (ANSI_BG[p]) bg = ANSI_BG[p];
                    pi++;
                }
                i = end + 1;
                continue;
            }
        }

        // Strip other ESC sequences (OSC, etc.)
        if (raw[i] === '\x1b') {
            i++;
            continue;
        }

        buffer += raw[i];
        i++;
    }
    flush();
    return spans;
}

/** Detect line type for the gutter icon */
function getLineType(raw: string): 'error' | 'warn' | 'info' | 'script' | 'normal' {
    const lower = raw.toLowerCase();
    if (lower.includes('error') || lower.includes('^1') || lower.includes('\x1b[31m') || lower.includes('[stderr]')) return 'error';
    if (lower.includes('warning') || lower.includes('^3') || lower.includes('\x1b[33m')) return 'warn';
    if (lower.includes('[script:') || lower.includes('> ')) return 'script';
    if (lower.includes('[info]') || lower.includes('started resource') || lower.includes('authenticated')) return 'info';
    return 'normal';
}

const LINE_TYPE_COLORS: Record<string, string> = {
    error: '#ef4444',
    warn: '#f59e0b',
    info: '#6366f1',
    script: '#06b6d4',
    normal: 'transparent',
};

function ConsoleLine({ raw, index }: { raw: string; index: number }) {
    const spans = parseLine(raw);
    const lineType = getLineType(raw);

    return (
        <div
            className="group flex hover:bg-white/[0.02] transition-colors"
            style={{ minHeight: 20 }}
        >
            {/* Line number gutter */}
            <span
                className="select-none shrink-0 text-right pr-3 text-muted/30 group-hover:text-muted/60"
                style={{
                    width: 56,
                    fontSize: 11,
                    lineHeight: '20px',
                    borderRight: `2px solid ${LINE_TYPE_COLORS[lineType]}`,
                    marginRight: 12,
                }}
            >
                {index + 1}
            </span>

            {/* Colored content */}
            <span className="whitespace-pre-wrap break-all" style={{ lineHeight: '20px' }}>
                {spans.map((s, j) => (
                    <span
                        key={j}
                        style={{
                            color: s.color,
                            backgroundColor: s.bg,
                            fontWeight: s.bold ? 700 : undefined,
                            opacity: s.dim ? 0.6 : undefined,
                            fontStyle: s.italic ? 'italic' : undefined,
                            textDecoration: s.underline ? 'underline' : undefined,
                        }}
                    >
                        {s.text}
                    </span>
                ))}
            </span>
        </div>
    );
}

export default function ConsolePage() {
    const { data: initialLines } = useConsole();
    const { command } = useServerControl();
    const consoleLine = useWsStore((s) => s.consoleLine);
    const serverStatus = useWsStore((s) => s.serverStatus);
    const wsConnected = useWsStore((s) => s.connected);

    const [lines, setLines] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [autoScroll, setAutoScroll] = useState(true);
    const [paused, setPaused] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const pauseBuffer = useRef<string[]>([]);

    // Load initial console history
    useEffect(() => {
        if (initialLines?.lines) {
            setLines(initialLines.lines);
        }
    }, [initialLines]);

    // Append new WebSocket console lines
    useEffect(() => {
        if (!consoleLine) return;
        if (paused) {
            pauseBuffer.current.push(consoleLine);
            return;
        }
        setLines((prev) => {
            const next = [...prev, consoleLine];
            return next.length > 10000 ? next.slice(-10000) : next;
        });
    }, [consoleLine, paused]);

    // Auto-scroll
    useEffect(() => {
        if (autoScroll && !paused) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [lines, autoScroll, paused]);

    // Detect scroll position to toggle auto-scroll
    const handleScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        setAutoScroll(nearBottom);
    }, []);

    // Resume: flush buffered lines
    const handleResume = useCallback(() => {
        setPaused(false);
        if (pauseBuffer.current.length > 0) {
            setLines((prev) => {
                const merged = [...prev, ...pauseBuffer.current];
                pauseBuffer.current = [];
                return merged.length > 10000 ? merged.slice(-10000) : merged;
            });
        }
    }, []);

    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        setAutoScroll(true);
    }, []);

    const handleCopyAll = useCallback(() => {
        navigator.clipboard.writeText(lines.join('\n'));
    }, [lines]);

    const handleSend = useCallback(() => {
        const cmd = input.trim();
        if (!cmd) return;
        command.mutate(cmd);
        setHistory((prev) => [cmd, ...prev.slice(0, 99)]);
        setHistoryIndex(-1);
        setInput('');
        inputRef.current?.focus();
    }, [input, command]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length > 0) {
                const next = Math.min(historyIndex + 1, history.length - 1);
                setHistoryIndex(next);
                setInput(history[next]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const next = historyIndex - 1;
                setHistoryIndex(next);
                setInput(history[next]);
            } else {
                setHistoryIndex(-1);
                setInput('');
            }
        } else if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            setSearchOpen((v) => !v);
        }
    };

    // Filter lines
    const filteredLines = lines.filter((line) => {
        if (filterType !== 'all') {
            const type = getLineType(line);
            if (filterType === 'errors' && type !== 'error') return false;
            if (filterType === 'warnings' && type !== 'warn') return false;
            if (filterType === 'scripts' && type !== 'script') return false;
        }
        if (searchTerm) {
            // Strip ANSI / FiveM codes for searching
            const clean = line.replace(/\x1b\[[0-9;]*m/g, '').replace(/\^[0-9]/g, '').toLowerCase();
            if (!clean.includes(searchTerm.toLowerCase())) return false;
        }
        return true;
    });

    const statusColor = serverStatus === 'online' ? '#10b981' : serverStatus === 'starting' ? '#f59e0b' : '#ef4444';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-[calc(100vh-8rem)]"
        >
            {/* Header Bar */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <TermIcon className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold text-text">Server Console</h2>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
                        />
                        <span className="capitalize">{serverStatus || 'offline'}</span>
                    </div>
                    {wsConnected && (
                        <span className="text-[10px] text-success bg-success/10 px-2 py-0.5 rounded-full">LIVE</span>
                    )}
                    <span className="text-xs text-muted/50">{lines.length.toLocaleString()} lines</span>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Filter buttons */}
                    {(['all', 'errors', 'warnings', 'scripts'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilterType(f)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition ${filterType === f
                                ? 'bg-primary/20 text-primary'
                                : 'text-muted/60 hover:text-muted hover:bg-white/5'
                                }`}
                        >
                            {f}
                        </button>
                    ))}

                    <div className="w-px h-5 bg-border mx-1" />

                    <button
                        onClick={() => setSearchOpen((v) => !v)}
                        className="p-1.5 rounded-md text-muted hover:text-text hover:bg-white/5 transition"
                        title="Search (Ctrl+F)"
                    >
                        <Search className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={paused ? handleResume : () => setPaused(true)}
                        className={`p-1.5 rounded-md transition ${paused
                            ? 'text-warning bg-warning/10'
                            : 'text-muted hover:text-text hover:bg-white/5'
                            }`}
                        title={paused ? `Resume (${pauseBuffer.current.length} buffered)` : 'Pause'}
                    >
                        {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={handleCopyAll}
                        className="p-1.5 rounded-md text-muted hover:text-text hover:bg-white/5 transition"
                        title="Copy all"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setLines([])}
                        className="p-1.5 rounded-md text-muted hover:text-danger hover:bg-danger/5 transition"
                        title="Clear console"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            {searchOpen && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-white/5 border border-border">
                    <Search className="w-3.5 h-3.5 text-muted shrink-0" />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-text font-mono outline-none placeholder:text-muted/40"
                        placeholder="Search console output..."
                        autoFocus
                    />
                    {searchTerm && (
                        <span className="text-xs text-muted shrink-0">
                            {filteredLines.length} matches
                        </span>
                    )}
                    <button
                        onClick={() => { setSearchOpen(false); setSearchTerm(''); }}
                        className="p-1 text-muted hover:text-text transition"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Pause indicator */}
            {paused && (
                <div
                    className="flex items-center justify-center gap-2 mb-2 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                >
                    <Pause className="w-3 h-3" />
                    PAUSED — {pauseBuffer.current.length} lines buffered
                    <button onClick={handleResume} className="ml-2 underline">Resume</button>
                </div>
            )}

            {/* Console Output — Real terminal look */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
                style={{
                    background: '#0c0c0c',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.04)',
                    fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Consolas', 'Courier New', monospace",
                    fontSize: 12.5,
                    lineHeight: '20px',
                    padding: '8px 0',
                }}
            >
                {filteredLines.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted/40 gap-2">
                        <TermIcon className="w-10 h-10 opacity-30" />
                        <span className="text-xs">
                            {lines.length === 0
                                ? 'No console output yet. Start the server to see output here.'
                                : 'No lines match the current filter.'}
                        </span>
                    </div>
                )}
                {filteredLines.map((line, i) => (
                    <ConsoleLine key={i} raw={line} index={i} />
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Scroll-to-bottom FAB */}
            {!autoScroll && !paused && (
                <div className="relative">
                    <button
                        onClick={scrollToBottom}
                        className="absolute -top-12 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition"
                        style={{
                            background: 'rgba(99, 102, 241, 0.9)',
                            color: '#fff',
                            boxShadow: '0 2px 12px rgba(99, 102, 241, 0.4)',
                        }}
                    >
                        <ArrowDown className="w-3 h-3" /> New output
                    </button>
                </div>
            )}

            {/* Command Input */}
            <div className="mt-3 flex gap-2">
                <div className="flex-1 relative flex items-center">
                    <span
                        className="absolute left-4 font-mono text-sm font-bold"
                        style={{ color: '#6366f1' }}
                    >
                        &gt;
                    </span>
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full rounded-xl border py-3 pl-8 pr-4 text-sm transition focus:outline-none focus:ring-2"
                        style={{
                            background: '#0c0c0c',
                            borderColor: 'rgba(255,255,255,0.06)',
                            color: '#ececef',
                            fontFamily: "'JetBrains Mono', 'Cascadia Code', monospace",
                            caretColor: '#6366f1',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                        placeholder="Enter server command..."
                        autoFocus
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="px-4 rounded-xl text-white transition disabled:opacity-30 flex items-center"
                    style={{ background: '#6366f1' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#818cf8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#6366f1'; }}
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
