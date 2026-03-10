'use client';

import { Badge, Button, Card, Skeleton } from '@/components/ui';
import { metricsApi, playersApi, serverApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatBytes, formatUptime } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    Activity,
    ChevronRight,
    Clock,
    Cpu,
    HardDrive,
    MemoryStick,
    Play,
    RotateCcw,
    Square,
    Users,
    Wifi, WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Metrics {
    cpu?: number;
    memory?: { used: number; total: number };
    disk?: { used: number; total: number };
    uptime?: number;
    network?: { rx: number; tx: number };
}

interface ServerStatus {
    status: string;
    info: Record<string, unknown>;
}

export default function DashboardPage() {
    const token = useAuthStore((s) => s.accessToken)!;
    const [server, setServer] = useState<ServerStatus | null>(null);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [players, setPlayers] = useState<unknown[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');

    const fetchAll = async () => {
        try {
            const [s, m, p] = await Promise.all([
                serverApi.status(token),
                metricsApi.get(token),
                playersApi.list(token),
            ]);
            setServer(s as ServerStatus);
            setMetrics(m as Metrics);
            setPlayers(p as unknown[]);
        } catch { }
        setLoading(false);
    };

    useEffect(() => {
        fetchAll();
        const id = setInterval(fetchAll, 5000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const handleAction = async (action: 'start' | 'stop' | 'restart') => {
        setActionLoading(action);
        try {
            await serverApi[action](token);
            await fetchAll();
        } catch { }
        setActionLoading('');
    };

    const isOnline = server?.status === 'running' || server?.status === 'online';

    const kpiCards = [
        {
            label: 'CPU Usage',
            value: metrics?.cpu != null ? `${metrics.cpu.toFixed(1)}%` : '—',
            icon: Cpu,
            color: 'text-info',
            bg: 'bg-info-muted',
        },
        {
            label: 'Memory',
            value: metrics?.memory ? `${formatBytes(metrics.memory.used)} / ${formatBytes(metrics.memory.total)}` : '—',
            icon: MemoryStick,
            color: 'text-accent',
            bg: 'bg-accent-muted',
        },
        {
            label: 'Disk',
            value: metrics?.disk ? `${formatBytes(metrics.disk.used)} / ${formatBytes(metrics.disk.total)}` : '—',
            icon: HardDrive,
            color: 'text-warning',
            bg: 'bg-warning-muted',
        },
        {
            label: 'Players',
            value: String(players.length),
            icon: Users,
            color: 'text-success',
            bg: 'bg-success-muted',
        },
        {
            label: 'Uptime',
            value: metrics?.uptime != null ? formatUptime(metrics.uptime) : '—',
            icon: Clock,
            color: 'text-text-secondary',
            bg: 'bg-bg-tertiary',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
                    <p className="text-sm text-text-secondary mt-0.5">Server overview and quick actions</p>
                </div>
            </div>

            {/* Server status bar */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] ${isOnline ? 'bg-success-muted' : 'bg-danger-muted'}`}>
                            {isOnline ? <Wifi className="h-5 w-5 text-success" /> : <WifiOff className="h-5 w-5 text-danger" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-text-primary">Server Status</span>
                                <Badge variant={isOnline ? 'success' : 'danger'}>
                                    {isOnline ? 'Online' : server?.status ?? 'Unknown'}
                                </Badge>
                            </div>
                            <p className="text-xs text-text-muted mt-0.5">
                                {isOnline ? `${players.length} players connected` : 'Server is not running'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleAction('start')}
                            loading={actionLoading === 'start'}
                            disabled={isOnline}
                        >
                            <Play className="h-3.5 w-3.5" /> Start
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleAction('stop')}
                            loading={actionLoading === 'stop'}
                            disabled={!isOnline}
                        >
                            <Square className="h-3.5 w-3.5" /> Stop
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAction('restart')}
                            loading={actionLoading === 'restart'}
                            disabled={!isOnline}
                        >
                            <RotateCcw className="h-3.5 w-3.5" /> Restart
                        </Button>
                    </div>
                </Card>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {kpiCards.map((kpi, i) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                    >
                        <Card className="hover:border-border-hover transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] ${kpi.bg}`}>
                                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted">{kpi.label}</p>
                                    {loading ? (
                                        <Skeleton className="h-5 w-16 mt-0.5" />
                                    ) : (
                                        <p className="text-sm font-semibold text-text-primary">{kpi.value}</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Quick navigation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { href: '/dashboard/console', label: 'Server Console', desc: 'Send commands and view output', icon: Activity },
                    { href: '/dashboard/players', label: 'Players', desc: `${players.length} currently connected`, icon: Users },
                    { href: '/dashboard/resources', label: 'Resources', desc: 'Manage server resources', icon: HardDrive },
                ].map((item, i) => (
                    <motion.div
                        key={item.href}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                    >
                        <Link href={item.href}>
                            <Card className="group hover:border-accent/30 hover:bg-bg-card-hover cursor-pointer transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-accent-muted">
                                            <item.icon className="h-4 w-4 text-accent" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                                            <p className="text-xs text-text-muted">{item.desc}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-accent transition-colors" />
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
