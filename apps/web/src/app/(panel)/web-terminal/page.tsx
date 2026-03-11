'use client';

import { useTerminalCreate, useTerminalExec, useTerminalKill } from '@/lib/hooks';
import { motion } from 'framer-motion';
import { Plus, Send, Terminal, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface TerminalSession {
    id: string;
    lines: string[];
}

export default function WebTerminalPage() {
    const [sessions, setSessions] = useState<TerminalSession[]>([]);
    const [activeSession, setActiveSession] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const createTerm = useTerminalCreate();
    const execTerm = useTerminalExec();
    const killTerm = useTerminalKill();

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [sessions, activeSession]);

    const currentSession = sessions.find((s) => s.id === activeSession);

    const handleCreate = useCallback(async () => {
        const res = await createTerm.mutateAsync();
        if (res.success && res.data) {
            const newSession: TerminalSession = { id: res.data.sessionId, lines: ['Session started.'] };
            setSessions((prev) => [...prev, newSession]);
            setActiveSession(res.data!.sessionId);
        }
    }, [createTerm]);

    const handleExec = useCallback(async () => {
        const cmd = input.trim();
        if (!cmd || !activeSession) return;

        setSessions((prev) =>
            prev.map((s) =>
                s.id === activeSession
                    ? { ...s, lines: [...s.lines, `$ ${cmd}`] }
                    : s
            )
        );

        setHistory((prev) => [cmd, ...prev.slice(0, 99)]);
        setHistoryIndex(-1);
        setInput('');

        const res = await execTerm.mutateAsync({ sessionId: activeSession, command: cmd });
        if (res.success && res.data) {
            const output = res.data.output;
            if (output) {
                setSessions((prev) =>
                    prev.map((s) =>
                        s.id === activeSession
                            ? { ...s, lines: [...s.lines, ...output.split('\n')] }
                            : s
                    )
                );
            }
        } else {
            setSessions((prev) =>
                prev.map((s) =>
                    s.id === activeSession
                        ? { ...s, lines: [...s.lines, `Error: ${res.error || 'Command failed'}`] }
                        : s
                )
            );
        }
    }, [input, activeSession, execTerm]);

    const handleKill = useCallback(async (sessionId: string) => {
        await killTerm.mutateAsync(sessionId);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setActiveSession((prev) => prev === sessionId ? (sessions[0]?.id ?? null) : prev);
    }, [killTerm, sessions]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleExec();
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
                setHistoryIndex(historyIndex - 1);
                setInput(history[historyIndex - 1]);
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
                    <Terminal className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-text">Web Terminal</h2>
                </div>
                <button
                    onClick={handleCreate}
                    disabled={createTerm.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition text-xs font-medium"
                >
                    <Plus className="w-3.5 h-3.5" />
                    {createTerm.isPending ? 'Creating...' : 'New Session'}
                </button>
            </div>

            {/* Session Tabs */}
            {sessions.length > 0 && (
                <div className="flex items-center gap-1 mb-3 overflow-x-auto scrollbar-thin pb-1">
                    {sessions.map((s, i) => (
                        <div
                            key={s.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${activeSession === s.id
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-white/5 text-muted hover:text-text'
                                }`}
                            onClick={() => setActiveSession(s.id)}
                        >
                            <Terminal className="w-3 h-3" />
                            Shell {i + 1}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleKill(s.id);
                                }}
                                className="ml-1 hover:text-red-400 transition"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Terminal Output */}
            {currentSession ? (
                <>
                    <div className="flex-1 glass-card p-4 overflow-y-auto font-mono text-xs leading-relaxed scrollbar-thin">
                        {currentSession.lines.map((line, i) => (
                            <div
                                key={i}
                                className={`whitespace-pre-wrap break-all ${line.startsWith('$') ? 'text-primary font-semibold' : 'text-muted'
                                    }`}
                            >
                                {line}
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="mt-3 flex items-center gap-2 glass-card p-2">
                        <span className="text-primary font-mono text-sm font-bold pl-2">$</span>
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter command..."
                            className="flex-1 bg-transparent text-text font-mono text-sm outline-none placeholder:text-muted/40"
                            autoFocus
                        />
                        <button
                            onClick={handleExec}
                            disabled={execTerm.isPending || !input.trim()}
                            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition disabled:opacity-40"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex-1 glass-card flex flex-col items-center justify-center text-muted">
                    <Terminal className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-sm mb-4">No active terminal session</p>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition text-sm font-medium"
                    >
                        Create New Session
                    </button>
                </div>
            )}
        </motion.div>
    );
}
