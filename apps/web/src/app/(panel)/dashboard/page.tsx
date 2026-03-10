'use client';

import { useMetrics, usePlayers, useServerControl, useServerStatus } from '@/lib/hooks';
import { useWsStore } from '@/lib/store';
import { cn, formatDuration, getStatusDotClass } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    Activity,
    Clock,
    Cpu,
    HardDrive,
    MemoryStick,
    Play,
    RotateCw,
    Server,
    Square,
    Users,
    Wifi,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

export default function DashboardPage() {
    const { data: status } = useServerStatus();
    const { data: metrics } = useMetrics();
    const { data: players } = usePlayers();
    const wsMetrics = useWsStore((s) => s.latestMetrics);
    const metricsHistory = useWsStore((s) => s.metricsHistory);
    const serverStatus = useWsStore((s) => s.serverStatus);
    const wsConnected = useWsStore((s) => s.connected);
    const { start, stop, restart } = useServerControl();

    const currentMetrics = wsMetrics || metrics;
    const live = serverStatus !== 'unknown' ? serverStatus : status?.status;

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Server Control Bar */}
            <motion.div variants={item} className="glass-card p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center',
                            live === 'online' ? 'bg-success/15' :
                                live === 'starting' ? 'bg-warning/15' : 'bg-danger/15'
                        )}>
                            <Server className={cn('w-6 h-6',
                                live === 'online' ? 'text-success' :
                                    live === 'starting' ? 'text-warning' : 'text-danger'
                            )} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text">FiveM Server</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={cn('w-2 h-2 rounded-full', getStatusDotClass(live || 'offline'))} />
                                <span className="text-sm text-muted capitalize">{live || 'offline'}</span>
                                {wsConnected && (
                                    <span className="flex items-center gap-1 text-xs text-success">
                                        <Wifi className="w-3 h-3" /> Live
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => start.mutate()}
                            disabled={start.isPending || live === 'online'}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/15 text-success hover:bg-success/25 transition disabled:opacity-40 text-sm font-medium"
                        >
                            <Play className="w-4 h-4" /> Start
                        </button>
                        <button
                            onClick={() => stop.mutate()}
                            disabled={stop.isPending || live === 'offline'}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/15 text-danger hover:bg-danger/25 transition disabled:opacity-40 text-sm font-medium"
                        >
                            <Square className="w-4 h-4" /> Stop
                        </button>
                        <button
                            onClick={() => restart.mutate()}
                            disabled={restart.isPending || live === 'offline'}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning/15 text-warning hover:bg-warning/25 transition disabled:opacity-40 text-sm font-medium"
                        >
                            <RotateCw className="w-4 h-4" /> Restart
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Users}
                    label="Players Online"
                    value={players?.length?.toString() || '0'}
                    detail={`of ${status?.info?.maxClients || 32} slots`}
                    color="primary"
                />
                <StatCard
                    icon={Cpu}
                    label="CPU Usage"
                    value={currentMetrics?.cpuPercent != null ? `${Math.round(Number(currentMetrics.cpuPercent))}%` : '--'}
                    color="accent"
                    progress={Number(currentMetrics?.cpuPercent || 0)}
                />
                <StatCard
                    icon={MemoryStick}
                    label="Memory"
                    value={currentMetrics?.memoryUsedMb != null ? `${Math.round(Number(currentMetrics.memoryUsedMb))} MB` : '--'}
                    detail={currentMetrics?.memoryTotalMb ? `of ${Math.round(Number(currentMetrics.memoryTotalMb))} MB` : undefined}
                    color="warning"
                    progress={currentMetrics?.memoryTotalMb ? (Number(currentMetrics.memoryUsedMb) / Number(currentMetrics.memoryTotalMb)) * 100 : 0}
                />
                <StatCard
                    icon={HardDrive}
                    label="Disk"
                    value={currentMetrics?.diskUsedGb != null ? `${Number(currentMetrics.diskUsedGb).toFixed(1)} GB` : '--'}
                    detail={currentMetrics?.diskTotalGb ? `of ${Number(currentMetrics.diskTotalGb).toFixed(1)} GB` : undefined}
                    color="success"
                    progress={currentMetrics?.diskTotalGb ? (Number(currentMetrics.diskUsedGb) / Number(currentMetrics.diskTotalGb)) * 100 : 0}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* CPU Chart */}
                <motion.div variants={item} className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-text">CPU Usage</h3>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metricsHistory}>
                                <defs>
                                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="ts"
                                    tickFormatter={(v) => {
                                        const d = new Date(v);
                                        return `${d.getMinutes()}:${String(d.getSeconds()).padStart(2, '0')}`;
                                    }}
                                    stroke="var(--color-muted)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis domain={[0, 100]} stroke="var(--color-muted)" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '12px' }}
                                    labelStyle={{ color: 'var(--color-muted)' }}
                                    formatter={(v: number) => [`${Math.round(v)}%`, 'CPU']}
                                    labelFormatter={(v) => new Date(v).toLocaleTimeString()}
                                />
                                <Area type="monotone" dataKey="cpuPercent" stroke="var(--color-primary)" strokeWidth={2} fill="url(#cpuGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Memory Chart */}
                <motion.div variants={item} className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <MemoryStick className="w-4 h-4 text-accent" />
                        <h3 className="font-semibold text-text">Memory Usage</h3>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metricsHistory}>
                                <defs>
                                    <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="ts"
                                    tickFormatter={(v) => {
                                        const d = new Date(v);
                                        return `${d.getMinutes()}:${String(d.getSeconds()).padStart(2, '0')}`;
                                    }}
                                    stroke="var(--color-muted)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis stroke="var(--color-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v)} MB`} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '12px' }}
                                    labelStyle={{ color: 'var(--color-muted)' }}
                                    formatter={(v: number) => [`${Math.round(v)} MB`, 'Memory']}
                                    labelFormatter={(v) => new Date(v).toLocaleTimeString()}
                                />
                                <Area type="monotone" dataKey="memoryUsedMb" stroke="var(--color-accent)" strokeWidth={2} fill="url(#memGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Server Info */}
            <motion.div variants={item} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-muted" />
                    <h3 className="font-semibold text-text">Server Info</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <InfoItem label="Status" value={live || 'unknown'} />
                    <InfoItem label="Uptime" value={currentMetrics?.uptime ? formatDuration(Number(currentMetrics.uptime)) : '--'} />
                    <InfoItem label="Hostname" value={String(status?.info?.hostname || '--')} />
                    <InfoItem label="Game Type" value={String(status?.info?.gameType || 'FiveM')} />
                </div>
            </motion.div>
        </motion.div>
    );
}

function StatCard({ icon: Icon, label, value, detail, color, progress }: {
    icon: React.ElementType;
    label: string;
    value: string;
    detail?: string;
    color: string;
    progress?: number;
}) {
    const colorMap: Record<string, string> = {
        primary: 'text-primary bg-primary/15',
        accent: 'text-accent bg-accent/15',
        warning: 'text-warning bg-warning/15',
        success: 'text-success bg-success/15',
        danger: 'text-danger bg-danger/15',
    };
    const barColorMap: Record<string, string> = {
        primary: 'bg-primary',
        accent: 'bg-accent',
        warning: 'bg-warning',
        success: 'bg-success',
        danger: 'bg-danger',
    };

    return (
        <motion.div variants={item} className="glass-card p-5 group hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm text-muted">{label}</p>
                    <p className="text-2xl font-bold text-text">{value}</p>
                    {detail && <p className="text-xs text-muted">{detail}</p>}
                </div>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[color])}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            {progress != null && (
                <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', barColorMap[color])}
                    />
                </div>
            )}
        </motion.div>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-muted mb-1">{label}</p>
            <p className="text-sm font-medium text-text capitalize">{value}</p>
        </div>
    );
}
