'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { serverApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
    ArrowDown,
    Download,
    Loader2,
    Pause, Play,
    Send,
    Terminal,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ConsoleLine {
    time: string;
    text: string;
    type: 'stdout' | 'stderr' | 'system' | 'command';
}

export default function ConsolePage() {
    const { accessToken } = useAuthStore();
    const [lines, setLines] = useState<ConsoleLine[]>([]);
    const [command, setCommand] = useState('');
    const [connected, setConnected] = useState(false);
    const [paused, setPaused] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [sending, setSending] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const logRef = useRef<HTMLDivElement>(null);
    const commandHistory = useRef<string[]>([]);
    const historyIndex = useRef(-1);

    const token = accessToken || '';

    // WebSocket connection
    useEffect(() => {
        if (!token) return;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            addSystemLine('متصل بالكونسول');
            ws.send(JSON.stringify({ type: 'subscribe', channel: 'console' }));
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'console' && !paused) {
                    addLine(msg.data || msg.line, msg.stream || 'stdout');
                }
            } catch { }
        };

        ws.onclose = () => {
            setConnected(false);
            addSystemLine('انقطع الاتصال');
        };

        ws.onerror = () => {
            addSystemLine('خطأ في الاتصال');
        };

        return () => ws.close();
    }, [token, paused]);

    const addLine = (text: string, type: ConsoleLine['type'] = 'stdout') => {
        const line: ConsoleLine = {
            time: new Date().toLocaleTimeString('ar-SA', { hour12: false }),
            text: stripAnsi(text),
            type,
        };
        setLines((prev) => {
            const next = [...prev, line];
            return next.length > 5000 ? next.slice(-3000) : next;
        });
    };

    const addSystemLine = (text: string) => addLine(text, 'system');

    // Auto-scroll
    useEffect(() => {
        if (autoScroll && logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [lines, autoScroll]);

    // Strip ANSI codes
    function stripAnsi(str: string): string {
        return str.replace(/\x1b\[[0-9;]*m/g, '').replace(/\^[0-9]/g, '');
    }

    // Send command
    const sendCommand = useCallback(async () => {
        if (!command.trim() || !token) return;
        setSending(true);
        try {
            addLine(`> ${command}`, 'command');
            await serverApi.command(token, command.trim());
            commandHistory.current.unshift(command);
            if (commandHistory.current.length > 50) commandHistory.current.pop();
            historyIndex.current = -1;
            setCommand('');
        } catch (e: unknown) {
            addLine(`خطأ: ${e instanceof Error ? e.message : 'فشل إرسال الأمر'}`, 'stderr');
        } finally {
            setSending(false);
        }
    }, [command, token]);

    // Keyboard navigation for command history
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            sendCommand();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex.current < commandHistory.current.length - 1) {
                historyIndex.current++;
                setCommand(commandHistory.current[historyIndex.current]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex.current > 0) {
                historyIndex.current--;
                setCommand(commandHistory.current[historyIndex.current]);
            } else {
                historyIndex.current = -1;
                setCommand('');
            }
        }
    };

    const clearConsole = () => setLines([]);

    const exportLog = () => {
        const text = lines.map((l) => `[${l.time}] ${l.text}`).join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `saifcontrol-console-${new Date().toISOString().slice(0, 10)}.log`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const lineColor = (type: ConsoleLine['type']) => {
        switch (type) {
            case 'stderr': return 'text-[var(--danger)]';
            case 'system': return 'text-[var(--info)]';
            case 'command': return 'text-[var(--accent-primary)]';
            default: return 'text-[var(--text-primary)]';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-[var(--accent-primary)]" />
                    كونسول السيرفر
                </h2>
                <div className="flex items-center gap-2">
                    <Badge variant={connected ? 'success' : 'danger'}>
                        {connected ? 'متصل' : 'غير متصل'}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => setPaused(!paused)}>
                        {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAutoScroll(!autoScroll)}>
                        <ArrowDown className={`h-4 w-4 ${autoScroll ? 'text-[var(--accent-primary)]' : ''}`} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={exportLog}>
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={clearConsole}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card className="glass">
                <CardContent className="p-0">
                    {/* Log area */}
                    <div
                        ref={logRef}
                        className="h-[calc(100vh-280px)] overflow-y-auto font-mono text-xs p-4 space-y-0.5"
                        dir="ltr"
                    >
                        {lines.length === 0 ? (
                            <div className="text-[var(--text-muted)] text-center py-12">
                                لا توجد رسائل بعد. سيظهر هنا ناتج الكونسول مباشرة.
                            </div>
                        ) : (
                            lines.map((line, i) => (
                                <div key={i} className={`flex gap-2 leading-5 ${lineColor(line.type)}`}>
                                    <span className="text-[var(--text-muted)] flex-shrink-0 select-none w-16">
                                        {line.time}
                                    </span>
                                    <span className="whitespace-pre-wrap break-all">{line.text}</span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Command input */}
                    <div className="border-t border-[var(--border-primary)] p-3 flex gap-2" dir="ltr">
                        <span className="text-[var(--accent-primary)] font-mono self-center">{'>'}</span>
                        <Input
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter a server command..."
                            className="font-mono text-sm flex-1"
                            dir="ltr"
                            disabled={!connected}
                        />
                        <Button
                            size="sm"
                            onClick={sendCommand}
                            disabled={!command.trim() || !connected || sending}
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
