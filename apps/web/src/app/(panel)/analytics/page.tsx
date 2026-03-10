'use client';

import { useMetrics } from '@/lib/hooks';
import { useWsStore } from '@/lib/store';
import { formatBytes, formatDuration } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Activity, BarChart3, Clock, Cpu, HardDrive, MemoryStick, TrendingUp, Users } from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AnalyticsPage() {
    const { data: metrics } = useMetrics();
    const metricsHistory = useWsStore((s) => s.metricsHistory);
    const current = useWsStore((s) => s.latestMetrics) || metrics;

    const tooltipStyle = {
        contentStyle: { background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '12px' },
        labelStyle: { color: 'var(--color-muted)' },
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickStat icon={Cpu} label="CPU" value={current?.cpuPercent != null ? `${Math.round(Number(current.cpuPercent))}%` : '--'} />
                <QuickStat icon={MemoryStick} label="RAM" value={current?.memoryUsedMb ? `${Math.round(Number(current.memoryUsedMb))} MB` : '--'} />
                <QuickStat icon={HardDrive} label="Disk" value={current?.diskUsedGb ? `${Number(current.diskUsedGb).toFixed(1)} GB` : '--'} />
                <QuickStat icon={Clock} label="Uptime" value={current?.uptime ? formatDuration(Number(current.uptime)) : '--'} />
            </div>

            {/* CPU + Memory combined timeline */}
            <motion.div variants={item} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-text">System Performance</h3>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metricsHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis
                                dataKey="ts"
                                tickFormatter={(v) => new Date(v).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                                stroke="var(--color-muted)" fontSize={10} tickLine={false} axisLine={false}
                            />
                            <YAxis yAxisId="cpu" domain={[0, 100]} stroke="var(--color-muted)" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="mem" orientation="right" stroke="var(--color-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v)} MB`} />
                            <Tooltip
                                {...tooltipStyle}
                                labelFormatter={(v) => new Date(v).toLocaleTimeString()}
                                formatter={(v: number, name: string) => {
                                    if (name === 'CPU %') return [`${Math.round(v)}%`, name];
                                    return [`${Math.round(v)} MB`, name];
                                }}
                            />
                            <Legend />
                            <Line yAxisId="cpu" type="monotone" dataKey="cpuPercent" name="CPU %" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                            <Line yAxisId="mem" type="monotone" dataKey="memoryUsedMb" name="Memory" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Network I/O */}
                <motion.div variants={item} className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-success" />
                        <h3 className="font-semibold text-text">Network I/O</h3>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metricsHistory}>
                                <defs>
                                    <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-warning)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-warning)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="ts" tickFormatter={(v) => new Date(v).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })} stroke="var(--color-muted)" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--color-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatBytes(v)} />
                                <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [formatBytes(v) + '/s', name]} labelFormatter={(v) => new Date(v).toLocaleTimeString()} />
                                <Legend />
                                <Area type="monotone" dataKey="networkRxBytes" name="RX" stroke="var(--color-success)" strokeWidth={2} fill="url(#rxGrad)" />
                                <Area type="monotone" dataKey="networkTxBytes" name="TX" stroke="var(--color-warning)" strokeWidth={2} fill="url(#txGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Players bar */}
                <motion.div variants={item} className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-text">Player Count</h3>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metricsHistory}>
                                <XAxis dataKey="ts" tickFormatter={(v) => new Date(v).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })} stroke="var(--color-muted)" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--color-muted)" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip {...tooltipStyle} formatter={(v: number) => [v, 'Players']} labelFormatter={(v) => new Date(v).toLocaleTimeString()} />
                                <Bar dataKey="playerCount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Raw Metrics Table */}
            {current && (
                <motion.div variants={item} className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-4 h-4 text-muted" />
                        <h3 className="font-semibold text-text">Raw Metrics</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                        {Object.entries(current).map(([k, v]) => (
                            <div key={k} className="bg-white/5 rounded-xl p-3">
                                <p className="text-xs text-muted">{k}</p>
                                <p className="text-text font-mono mt-1 truncate">{typeof v === 'number' ? (v > 1e6 ? formatBytes(v) : Math.round(v * 100) / 100) : String(v)}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

function QuickStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <motion.div variants={item} className="glass-card p-4 text-center">
            <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-xl font-bold text-text">{value}</p>
            <p className="text-xs text-muted mt-1">{label}</p>
        </motion.div>
    );
}
