'use client';

import { cn, formatUptime } from '@/lib/utils';
import {
    Activity,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    Server,
    Users,
    Zap
} from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    trend?: { value: number; up: boolean };
    color?: string;
}

function StatCard({ label, value, icon: Icon, trend, color = 'text-primary' }: StatCardProps) {
    return (
        <div className="glass-panel p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className={cn('w-4 h-4', color)} />
            </div>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-semibold text-foreground">{value}</span>
                {trend && (
                    <span
                        className={cn(
                            'flex items-center gap-0.5 text-xs font-medium',
                            trend.up ? 'text-emerald-400' : 'text-red-400',
                        )}
                    >
                        {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trend.value}%
                    </span>
                )}
            </div>
        </div>
    );
}

interface GaugeProps {
    label: string;
    value: number;
    max: number;
    unit?: string;
    color?: string;
}

function Gauge({ label, value, max, unit = '%', color = 'stroke-primary' }: GaugeProps) {
    const pct = Math.min((value / max) * 100, 100);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2">
            <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
                <circle
                    cx="50" cy="50" r={radius}
                    fill="none"
                    strokeWidth="8"
                    className="stroke-border"
                />
                <circle
                    cx="50" cy="50" r={radius}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={cn(color, 'transition-all duration-700')}
                />
            </svg>
            <div className="text-center -mt-16">
                <div className="text-lg font-semibold text-foreground">{value}{unit}</div>
                <div className="text-[10px] text-muted-foreground">{label}</div>
            </div>
        </div>
    );
}

interface ServerRowProps {
    name: string;
    status: 'running' | 'stopped' | 'crashed' | 'starting';
    players: number;
    maxPlayers: number;
    cpu: number;
    memory: number;
    uptime: number;
}

function ServerRow({ name, status, players, maxPlayers, cpu, memory, uptime }: ServerRowProps) {
    return (
        <div className="flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors rounded-lg">
            <div className={cn('status-dot', `status-dot-${status}`)} />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{name}</div>
                <div className="text-xs text-muted-foreground">{formatUptime(uptime)}</div>
            </div>
            <div className="text-xs text-muted-foreground w-20 text-right">
                <span className="text-foreground font-medium">{players}</span>/{maxPlayers}
            </div>
            <div className="w-16">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>CPU</span>
                    <span>{cpu.toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div
                        className={cn('h-full rounded-full transition-all', cpu > 80 ? 'bg-red-500' : 'bg-emerald-500')}
                        style={{ width: `${cpu}%` }}
                    />
                </div>
            </div>
            <div className="w-16">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>RAM</span>
                    <span>{memory.toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div
                        className={cn('h-full rounded-full transition-all', memory > 80 ? 'bg-red-500' : 'bg-blue-500')}
                        style={{ width: `${memory}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

function AlertRow({ severity, message, time }: { severity: string; message: string; time: string }) {
    const sevColor: Record<string, string> = {
        critical: 'text-red-400 bg-red-400/10',
        warning: 'text-yellow-400 bg-yellow-400/10',
        info: 'text-blue-400 bg-blue-400/10',
    };

    return (
        <div className="flex items-start gap-3 px-4 py-2.5">
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded uppercase', sevColor[severity] ?? 'text-muted-foreground')}>
                {severity}
            </span>
            <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground truncate">{message}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{time}</div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    // Mock data — in production these come from API/WebSocket
    const mockServers: ServerRowProps[] = [
        { name: 'FiveM Production', status: 'running', players: 87, maxPlayers: 128, cpu: 42, memory: 61, uptime: 432000 },
        { name: 'FiveM Staging', status: 'running', players: 12, maxPlayers: 64, cpu: 18, memory: 34, uptime: 86400 },
        { name: 'FiveM Dev', status: 'stopped', players: 0, maxPlayers: 32, cpu: 0, memory: 0, uptime: 0 },
    ];

    const mockAlerts = [
        { severity: 'critical', message: 'Production server CPU exceeded 90% threshold', time: '2 min ago' },
        { severity: 'warning', message: 'Player count dropped 30% in last 15 minutes', time: '12 min ago' },
        { severity: 'info', message: 'Resource "es_extended" updated to v1.10.4', time: '1 hr ago' },
        { severity: 'warning', message: 'Memory usage trending upward on Staging', time: '3 hr ago' },
    ];

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">Real-time overview of your FiveM infrastructure</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Players"
                    value={99}
                    icon={Users}
                    trend={{ value: 12, up: true }}
                    color="text-emerald-400"
                />
                <StatCard
                    label="Active Servers"
                    value="2 / 3"
                    icon={Server}
                    color="text-blue-400"
                />
                <StatCard
                    label="Avg Tick Rate"
                    value="61.2 ms"
                    icon={Activity}
                    trend={{ value: 3, up: false }}
                    color="text-yellow-400"
                />
                <StatCard
                    label="Active Alerts"
                    value={4}
                    icon={AlertTriangle}
                    color="text-red-400"
                />
            </div>

            {/* Gauges + Servers */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* System metrics gauges */}
                <div className="glass-panel p-6">
                    <h2 className="text-sm font-medium text-foreground mb-6">System Health</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <Gauge label="CPU Usage" value={42} max={100} color="stroke-emerald-400" />
                        <Gauge label="Memory" value={61} max={100} color="stroke-blue-400" />
                        <Gauge label="Disk I/O" value={23} max={100} color="stroke-purple-400" />
                        <Gauge label="Network" value={37} max={100} color="stroke-yellow-400" />
                    </div>
                </div>

                {/* Server list */}
                <div className="glass-panel xl:col-span-2">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h2 className="text-sm font-medium text-foreground">Servers</h2>
                        <span className="text-xs text-muted-foreground">
                            {mockServers.filter((s) => s.status === 'running').length} running
                        </span>
                    </div>
                    <div className="divide-y divide-border/50">
                        {mockServers.map((server) => (
                            <ServerRow key={server.name} {...server} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Alerts + Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Recent alerts */}
                <div className="glass-panel">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h2 className="text-sm font-medium text-foreground">Recent Alerts</h2>
                        <button className="text-xs text-primary hover:underline">View all</button>
                    </div>
                    <div className="divide-y divide-border/50">
                        {mockAlerts.map((alert, i) => (
                            <AlertRow key={i} {...alert} />
                        ))}
                    </div>
                </div>

                {/* Quick metrics sparkline area — placeholder */}
                <div className="glass-panel p-6">
                    <h2 className="text-sm font-medium text-foreground mb-4">Player Trend (24h)</h2>
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                        <div className="text-center space-y-2">
                            <BarChart3 className="w-8 h-8 mx-auto opacity-40" />
                            <p>Connect to a running server to see live metrics</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="glass-panel p-4">
                <h2 className="text-sm font-medium text-foreground mb-3">Quick Actions</h2>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'Start All Servers', icon: Zap },
                        { label: 'Restart Production', icon: Server },
                        { label: 'Clear Alerts', icon: AlertTriangle },
                        { label: 'View Logs', icon: Activity },
                    ].map((action) => (
                        <button
                            key={action.label}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground bg-accent/30 hover:bg-accent/50 transition-colors"
                        >
                            <action.icon className="w-3.5 h-3.5" />
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
