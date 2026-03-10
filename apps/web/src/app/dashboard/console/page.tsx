'use client';

import { Button, Card, Input } from '@/components/ui';
import { serverApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Send, Terminal, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function ConsolePage() {
    const token = useAuthStore((s) => s.accessToken)!;
    const termRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<import('@xterm/xterm').Terminal | null>(null);
    const [command, setCommand] = useState('');
    const [sending, setSending] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        let term: import('@xterm/xterm').Terminal | null = null;
        let fitAddon: import('@xterm/addon-fit').FitAddon | null = null;

        const init = async () => {
            const { Terminal } = await import('@xterm/xterm');
            const { FitAddon } = await import('@xterm/addon-fit');
            const { WebLinksAddon } = await import('@xterm/addon-web-links');
            // @ts-expect-error -- xterm CSS import handled by bundler
            await import('@xterm/xterm/css/xterm.css');

            if (!termRef.current) return;

            term = new Terminal({
                theme: {
                    background: '#0d0d12',
                    foreground: '#f4f4f7',
                    cursor: '#6c5ce7',
                    selectionBackground: 'rgba(108, 92, 231, 0.3)',
                    black: '#09090b',
                    red: '#ef4444',
                    green: '#10b981',
                    yellow: '#f59e0b',
                    blue: '#3b82f6',
                    magenta: '#6c5ce7',
                    cyan: '#06b6d4',
                    white: '#f4f4f7',
                },
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 13,
                lineHeight: 1.4,
                cursorBlink: true,
                cursorStyle: 'bar',
                scrollback: 5000,
            });

            fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.loadAddon(new WebLinksAddon());
            term.open(termRef.current);
            fitAddon.fit();
            xtermRef.current = term;

            term.writeln('\x1b[38;2;108;92;231m╔═══════════════════════════════════╗\x1b[0m');
            term.writeln('\x1b[38;2;108;92;231m║     SaifControl Server Console    ║\x1b[0m');
            term.writeln('\x1b[38;2;108;92;231m╚═══════════════════════════════════╝\x1b[0m');
            term.writeln('');

            setMounted(true);

            const resizeOb = new ResizeObserver(() => fitAddon?.fit());
            resizeOb.observe(termRef.current);

            return () => {
                resizeOb.disconnect();
                term?.dispose();
            };
        };

        init();
        return () => { term?.dispose(); };
    }, []);

    const sendCommand = async () => {
        const cmd = command.trim();
        if (!cmd) return;
        setSending(true);
        const term = xtermRef.current;
        term?.writeln(`\x1b[38;2;108;92;231m>\x1b[0m ${cmd}`);
        try {
            const res = await serverApi.command(token, cmd);
            const output = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
            output.split('\n').forEach((line: string) => term?.writeln(line));
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Command failed';
            term?.writeln(`\x1b[31m✗ ${msg}\x1b[0m`);
        }
        setCommand('');
        setSending(false);
    };

    const clearTerminal = () => {
        xtermRef.current?.clear();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-text-primary">Server Console</h1>
                    <p className="text-sm text-text-secondary mt-0.5">Execute commands on your FiveM server</p>
                </div>
                <Button variant="ghost" size="sm" onClick={clearTerminal}>
                    <Trash2 className="h-3.5 w-3.5" /> Clear
                </Button>
            </div>

            <Card className="p-0 overflow-hidden">
                <div ref={termRef} className="h-[500px]" />
            </Card>

            <form
                onSubmit={(e) => { e.preventDefault(); sendCommand(); }}
                className="flex gap-2"
            >
                <Input
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter command..."
                    icon={<Terminal className="h-4 w-4" />}
                    className="flex-1 font-mono"
                    disabled={!mounted}
                />
                <Button type="submit" loading={sending} disabled={!mounted}>
                    <Send className="h-4 w-4" /> Send
                </Button>
            </form>
        </div>
    );
}
