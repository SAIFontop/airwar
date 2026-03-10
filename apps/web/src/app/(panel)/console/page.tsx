'use client';

import { useConsole, useServerControl } from '@/lib/hooks';
import { useWsStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Send, Terminal as TermIcon, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function ConsolePage() {
    const { data: initialLines } = useConsole();
    const { command } = useServerControl();
    const consoleLine = useWsStore((s) => s.consoleLine);
    const [lines, setLines] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load initial console lines
    useEffect(() => {
        if (initialLines?.lines) {
            setLines(initialLines.lines);
        }
    }, [initialLines]);

    // Append new WebSocket console lines
    useEffect(() => {
        if (consoleLine) {
            setLines((prev) => [...prev.slice(-4999), consoleLine]);
        }
    }, [consoleLine]);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);

    const handleSend = useCallback(() => {
        const cmd = input.trim();
        if (!cmd) return;
        command.mutate(cmd);
        setHistory((prev) => [cmd, ...prev.slice(0, 49)]);
        setHistoryIndex(-1);
        setInput('');
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
        }
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
                    <TermIcon className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-text">Server Console</h2>
                    <span className="text-xs text-muted ml-2">{lines.length} lines</span>
                </div>
                <button
                    onClick={() => setLines([])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-muted hover:text-text transition text-xs"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
            </div>

            {/* Console Output */}
            <div
                ref={containerRef}
                className="flex-1 glass-card p-4 overflow-y-auto font-mono text-xs leading-relaxed scrollbar-thin"
            >
                {lines.map((line, i) => (
                    <div key={i} className="text-muted hover:text-text transition-colors whitespace-pre-wrap break-all">
                        {line}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="mt-3 flex gap-2">
                <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-mono text-sm">&gt;</span>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full rounded-xl bg-white/5 border border-border pl-8 pr-4 py-3 text-text font-mono text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                        placeholder="Enter command..."
                        autoFocus
                    />
                </div>
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="px-4 rounded-xl bg-primary text-white hover:bg-primary/80 transition disabled:opacity-40 flex items-center"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
