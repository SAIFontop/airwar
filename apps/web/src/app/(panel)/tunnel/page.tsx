'use client';

import {
    useAutoRestart,
    useInstallResource,
    usePanelTunnelStatus,
    useServerHealth,
    useStartPanelTunnel,
    useStartTunnel,
    useStopPanelTunnel,
    useStopTunnel,
    useToggleAutoRestart,
    useTunnelStatus,
} from '@/lib/hooks';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowDownToLine,
    Check,
    Copy,
    Globe,
    Heart,
    HeartOff,
    Loader2,
    Power,
    PowerOff,
    RefreshCw,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useCallback, useState } from 'react';

export default function TunnelPage() {
    const { data: tunnel, isLoading: tunnelLoading } = useTunnelStatus();
    const { data: panelTunnel } = usePanelTunnelStatus();
    const { data: health } = useServerHealth();
    const { data: autoRestart } = useAutoRestart();

    const startTunnel = useStartTunnel();
    const stopTunnel = useStopTunnel();
    const startPanelTunnel = useStartPanelTunnel();
    const stopPanelTunnel = useStopPanelTunnel();
    const toggleAutoRestart = useToggleAutoRestart();

    const [port, setPort] = useState('30120');
    const [token, setToken] = useState('');
    const [panelToken, setPanelToken] = useState('');
    const [copied, setCopied] = useState(false);
    const [panelCopied, setPanelCopied] = useState(false);

    // Resource installer state
    const [repoUrl, setRepoUrl] = useState('');
    const [resourceName, setResourceName] = useState('');
    const installResource = useInstallResource();
    const [installResult, setInstallResult] = useState<string | null>(null);

    const handleStart = useCallback(async () => {
        await startTunnel.mutateAsync({
            port: parseInt(port) || 30120,
            token: token.trim() || undefined,
        });
    }, [port, token, startTunnel]);

    const handleCopy = useCallback(() => {
        if (tunnel?.url) {
            navigator.clipboard.writeText(tunnel.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [tunnel]);

    const handleInstall = useCallback(async () => {
        if (!repoUrl.trim()) return;
        setInstallResult(null);
        const res = await installResource.mutateAsync({
            repoUrl: repoUrl.trim(),
            resourceName: resourceName.trim() || undefined,
        });
        if (res.success && res.data) {
            setInstallResult(`Installed "${res.data.name}" successfully`);
            setRepoUrl('');
            setResourceName('');
        } else {
            setInstallResult(`Error: ${res.error || 'Install failed'}`);
        }
    }, [repoUrl, resourceName, installResource]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-text">Network & Tools</h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* ── Pinggy Tunnel ── */}
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl ${tunnel?.active ? 'bg-emerald-400/10' : 'bg-white/5'}`}>
                                {tunnel?.active ? (
                                    <Wifi className="w-5 h-5 text-emerald-400" />
                                ) : (
                                    <WifiOff className="w-5 h-5 text-muted" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-text text-sm">Pinggy Tunnel</h3>
                                <p className="text-xs text-muted">
                                    {tunnel?.active ? 'Connected' : 'Disconnected'}
                                </p>
                            </div>
                        </div>
                        <div className={`text-[10px] px-2 py-1 rounded-full font-medium ${tunnel?.active
                            ? 'bg-emerald-400/10 text-emerald-400'
                            : 'bg-red-400/10 text-red-400'
                            }`}>
                            {tunnel?.active ? 'LIVE' : 'OFF'}
                        </div>
                    </div>

                    {tunnel?.active && tunnel.url ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                                <Globe className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-sm text-text font-mono flex-1 truncate">{tunnel.url}</span>
                                <button onClick={handleCopy} className="text-muted hover:text-primary transition">
                                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <button
                                onClick={() => stopTunnel.mutate()}
                                disabled={stopTunnel.isPending}
                                className="w-full py-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm font-medium flex items-center justify-center gap-2"
                            >
                                {stopTunnel.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <PowerOff className="w-4 h-4" />
                                )}
                                Stop Tunnel
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-muted mb-1 block">Port</label>
                                <input
                                    value={port}
                                    onChange={(e) => setPort(e.target.value)}
                                    placeholder="30120"
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-sm text-text outline-none focus:border-primary transition"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted mb-1 block">Token (optional)</label>
                                <input
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Pinggy token"
                                    type="password"
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-sm text-text outline-none focus:border-primary transition"
                                />
                            </div>
                            <button
                                onClick={handleStart}
                                disabled={startTunnel.isPending}
                                className="w-full py-2.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition text-sm font-medium flex items-center justify-center gap-2"
                            >
                                {startTunnel.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Power className="w-4 h-4" />
                                )}
                                Start Tunnel
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Panel Tunnel ── */}
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl ${panelTunnel?.active ? 'bg-blue-400/10' : 'bg-white/5'}`}>
                                {panelTunnel?.active ? (
                                    <Globe className="w-5 h-5 text-blue-400" />
                                ) : (
                                    <Globe className="w-5 h-5 text-muted" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-text text-sm">Panel Tunnel</h3>
                                <p className="text-xs text-muted">
                                    {panelTunnel?.active ? 'Panel accessible online' : 'Panel local only'}
                                </p>
                            </div>
                        </div>
                        <div className={`text-[10px] px-2 py-1 rounded-full font-medium ${panelTunnel?.active
                            ? 'bg-blue-400/10 text-blue-400'
                            : 'bg-red-400/10 text-red-400'
                            }`}>
                            {panelTunnel?.active ? 'LIVE' : 'OFF'}
                        </div>
                    </div>

                    {panelTunnel?.active && panelTunnel.url ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                                <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                                <span className="text-sm text-text font-mono flex-1 truncate">{panelTunnel.url}</span>
                                <button onClick={() => { navigator.clipboard.writeText(panelTunnel.url); setPanelCopied(true); setTimeout(() => setPanelCopied(false), 2000); }} className="text-muted hover:text-blue-400 transition">
                                    {panelCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <button
                                onClick={() => stopPanelTunnel.mutate()}
                                disabled={stopPanelTunnel.isPending}
                                className="w-full py-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm font-medium flex items-center justify-center gap-2"
                            >
                                {stopPanelTunnel.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <PowerOff className="w-4 h-4" />
                                )}
                                Stop Panel Tunnel
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-muted mb-1 block">Token (optional)</label>
                                <input
                                    value={panelToken}
                                    onChange={(e) => setPanelToken(e.target.value)}
                                    placeholder="Pinggy token"
                                    type="password"
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-sm text-text outline-none focus:border-primary transition"
                                />
                            </div>
                            <button
                                onClick={() => startPanelTunnel.mutateAsync({ token: panelToken.trim() || undefined })}
                                disabled={startPanelTunnel.isPending}
                                className="w-full py-2.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition text-sm font-medium flex items-center justify-center gap-2"
                            >
                                {startPanelTunnel.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Power className="w-4 h-4" />
                                )}
                                Start Panel Tunnel
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Server Health ── */}
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl ${health?.healthy ? 'bg-emerald-400/10' : 'bg-red-400/10'}`}>
                                {health?.healthy ? (
                                    <Heart className="w-5 h-5 text-emerald-400" />
                                ) : (
                                    <HeartOff className="w-5 h-5 text-red-400" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-text text-sm">Server Health</h3>
                                <p className="text-xs text-muted">
                                    {health?.healthy ? 'Server is healthy' : health?.status || 'Checking...'}
                                </p>
                            </div>
                        </div>
                        <div className={`text-[10px] px-2 py-1 rounded-full font-medium ${health?.healthy
                            ? 'bg-emerald-400/10 text-emerald-400'
                            : 'bg-red-400/10 text-red-400'
                            }`}>
                            {health?.healthy ? 'HEALTHY' : 'DOWN'}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-muted" />
                            <span className="text-sm text-text">Auto-Restart on Crash</span>
                        </div>
                        <button
                            onClick={() => toggleAutoRestart.mutate(!autoRestart?.enabled)}
                            disabled={toggleAutoRestart.isPending}
                            className={`relative w-10 h-5 rounded-full transition ${autoRestart?.enabled ? 'bg-primary' : 'bg-white/10'
                                }`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoRestart?.enabled ? 'translate-x-5' : 'translate-x-0.5'
                                }`} />
                        </button>
                    </div>

                    {health && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-white/5">
                                <span className="text-muted">Status</span>
                                <p className="text-text font-medium mt-0.5">{health.status}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-white/5">
                                <span className="text-muted">Responding</span>
                                <p className={`font-medium mt-0.5 ${health.responding ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {health.responding ? 'Yes' : 'No'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Resource Installer ── */}
                <div className="glass-card p-6 space-y-4 lg:col-span-2">
                    <div className="flex items-center gap-2">
                        <ArrowDownToLine className="w-5 h-5 text-accent" />
                        <h3 className="font-bold text-text text-sm">Quick Resource Installer</h3>
                    </div>
                    <p className="text-xs text-muted">
                        Install FiveM resources directly from GitHub repositories.
                    </p>
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-muted mb-1 block">GitHub Repository URL</label>
                            <input
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                placeholder="https://github.com/user/resource-name"
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-sm text-text outline-none focus:border-primary transition"
                            />
                        </div>
                        <div className="w-48">
                            <label className="text-xs text-muted mb-1 block">Name (optional)</label>
                            <input
                                value={resourceName}
                                onChange={(e) => setResourceName(e.target.value)}
                                placeholder="custom-name"
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-sm text-text outline-none focus:border-primary transition"
                            />
                        </div>
                        <button
                            onClick={handleInstall}
                            disabled={!repoUrl.trim() || installResource.isPending}
                            className="px-5 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition text-sm font-medium flex items-center gap-2 disabled:opacity-40 shrink-0"
                        >
                            {installResource.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ArrowDownToLine className="w-4 h-4" />
                            )}
                            Install
                        </button>
                    </div>

                    <AnimatePresence>
                        {installResult && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`p-3 rounded-lg text-sm ${installResult.startsWith('Error')
                                    ? 'bg-red-400/10 text-red-400'
                                    : 'bg-emerald-400/10 text-emerald-400'
                                    }`}
                            >
                                {installResult}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
