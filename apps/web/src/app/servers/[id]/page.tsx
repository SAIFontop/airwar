'use client';

import { cn, formatUptime } from '@/lib/utils';
import {
    Activity,
    Cpu,
    FileText,
    HardDrive,
    Puzzle,
    RotateCcw,
    Settings,
    Square,
    Terminal,
    Users,
    Zap
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

type Tab = 'overview' | 'console' | 'resources' | 'players' | 'metrics' | 'logs' | 'files' | 'automation' | 'settings';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'console', label: 'Console', icon: Terminal },
    { id: 'resources', label: 'Resources', icon: Puzzle },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'metrics', label: 'Metrics', icon: Cpu },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
];

function OverviewTab() {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* System metrics */}
            <div className="glass-panel p-5 space-y-4">
                <h3 className="text-sm font-medium text-foreground">System Metrics</h3>
                <div className="space-y-3">
                    {[
                        { label: 'CPU Usage', value: 42, color: 'bg-emerald-500' },
                        { label: 'Memory Usage', value: 61, color: 'bg-blue-500' },
                        { label: 'Disk I/O', value: 23, color: 'bg-purple-500' },
                        { label: 'Network', value: 37, color: 'bg-yellow-500' },
                    ].map((metric) => (
                        <div key={metric.label}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">{metric.label}</span>
                                <span className="text-xs font-medium text-foreground">{metric.value}%</span>
                            </div>
                            <div className="h-1.5 bg-border rounded-full overflow-hidden">
                                <div
                                    className={cn('h-full rounded-full transition-all', metric.color)}
                                    style={{ width: `${metric.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Server info */}
            <div className="glass-panel p-5 space-y-4">
                <h3 className="text-sm font-medium text-foreground">Server Information</h3>
                <div className="space-y-3">
                    {[
                        { label: 'Endpoint', value: '0.0.0.0:30120' },
                        { label: 'Build', value: 'b2944' },
                        { label: 'Game Type', value: 'FXServer' },
                        { label: 'Resources', value: '142 loaded' },
                        { label: 'Tick Rate', value: '61.2 ms' },
                        { label: 'OneSync', value: 'Enabled (Infinity)' },
                    ].map((info) => (
                        <div key={info.label} className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{info.label}</span>
                            <span className="text-xs font-medium text-foreground">{info.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent activity */}
            <div className="glass-panel xl:col-span-2">
                <h3 className="text-sm font-medium text-foreground px-5 py-3 border-b border-border">Recent Activity</h3>
                <div className="divide-y divide-border/50">
                    {[
                        { time: '2 min ago', event: 'Player JohnDoe connected (ID: 42)' },
                        { time: '5 min ago', event: 'Resource "garage" restarted by admin' },
                        { time: '12 min ago', event: 'Player JaneDoe disconnected' },
                        { time: '1 hr ago', event: 'Server auto-restart completed' },
                        { time: '3 hr ago', event: 'CPU threshold alert triggered (92%)' },
                    ].map((activity, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-2.5">
                            <span className="text-[10px] text-muted-foreground w-16 shrink-0">{activity.time}</span>
                            <span className="text-sm text-foreground">{activity.event}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ConsoleTab() {
    const [command, setCommand] = useState('');
    const mockLogs = [
        { time: '12:34:56', level: 'info', msg: '[txAdmin] Player JohnDoe connected' },
        { time: '12:34:57', level: 'warn', msg: '[es_extended] Slow callback detected (>100ms)' },
        { time: '12:34:58', level: 'info', msg: '[monitor] Heartbeat OK - 61.2ms tick' },
        { time: '12:35:01', level: 'error', msg: '[garage] SCRIPT ERROR: attempt to index nil value' },
        { time: '12:35:02', level: 'info', msg: '[hardcap] Players: 87/128' },
        { time: '12:35:05', level: 'info', msg: '[txAdmin] Executing scheduled restart check' },
        { time: '12:35:06', level: 'info', msg: '[monitor] Heartbeat OK - 62.1ms tick' },
    ];

    const levelColor: Record<string, string> = {
        info: 'text-blue-400',
        warn: 'text-yellow-400',
        error: 'text-red-400',
    };

    return (
        <div className="glass-panel flex flex-col h-[calc(100vh-280px)]">
            {/* Console output */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-0.5">
                {mockLogs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                        <span className="text-muted-foreground shrink-0">{log.time}</span>
                        <span className={cn('shrink-0 w-12 uppercase', levelColor[log.level] ?? 'text-foreground')}>
                            [{log.level}]
                        </span>
                        <span className="text-foreground">{log.msg}</span>
                    </div>
                ))}
            </div>

            {/* Command input */}
            <div className="border-t border-border p-3 flex gap-2">
                <span className="text-primary font-mono text-sm">&gt;</span>
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && command.trim()) {
                            setCommand('');
                        }
                    }}
                    placeholder="Enter server command..."
                    className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none"
                />
            </div>
        </div>
    );
}

function ResourcesTab() {
    const mockResources = [
        { name: 'es_extended', status: 'started', cpu: 12.3, memory: 45, version: '1.10.4' },
        { name: 'esx_skin', status: 'started', cpu: 2.1, memory: 12, version: '1.4.0' },
        { name: 'garage', status: 'started', cpu: 8.7, memory: 28, version: '2.1.0' },
        { name: 'phone', status: 'started', cpu: 15.2, memory: 67, version: '1.0.0' },
        { name: 'admin_menu', status: 'stopped', cpu: 0, memory: 0, version: '3.2.1' },
    ];

    return (
        <div className="glass-panel">
            <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground">
                <span>Resource</span>
                <span className="text-right">Status</span>
                <span className="text-right">CPU (ms)</span>
                <span className="text-right">Memory</span>
                <span className="text-right">Version</span>
            </div>
            {mockResources.map((res) => (
                <div key={res.name} className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-4 px-5 py-2.5 hover:bg-accent/30 transition-colors items-center">
                    <div className="flex items-center gap-2">
                        <div className={cn('w-1.5 h-1.5 rounded-full', res.status === 'started' ? 'bg-emerald-500' : 'bg-zinc-500')} />
                        <span className="text-sm font-medium text-foreground">{res.name}</span>
                    </div>
                    <span className={cn('text-xs text-right', res.status === 'started' ? 'text-emerald-400' : 'text-muted-foreground')}>
                        {res.status}
                    </span>
                    <span className="text-xs text-right text-foreground">{res.cpu.toFixed(1)}</span>
                    <span className="text-xs text-right text-foreground">{res.memory} MB</span>
                    <span className="text-xs text-right text-muted-foreground">v{res.version}</span>
                </div>
            ))}
        </div>
    );
}

function PlayersTab() {
    const mockPlayers = [
        { id: 1, name: 'JohnDoe', ping: 42, identifier: 'steam:110000112345678', joined: '2h 15m ago' },
        { id: 2, name: 'JaneDoe', ping: 78, identifier: 'discord:123456789', joined: '45m ago' },
        { id: 3, name: 'AdminPlayer', ping: 12, identifier: 'license:abcdef123456', joined: '5h 30m ago' },
    ];

    return (
        <div className="glass-panel">
            <div className="grid grid-cols-[40px_1fr_1fr_80px_100px_100px] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground">
                <span>ID</span>
                <span>Name</span>
                <span>Identifier</span>
                <span className="text-right">Ping</span>
                <span className="text-right">Session</span>
                <span className="text-right">Actions</span>
            </div>
            {mockPlayers.map((player) => (
                <div key={player.id} className="grid grid-cols-[40px_1fr_1fr_80px_100px_100px] gap-4 px-5 py-2.5 hover:bg-accent/30 transition-colors items-center">
                    <span className="text-xs text-muted-foreground">#{player.id}</span>
                    <span className="text-sm font-medium text-foreground">{player.name}</span>
                    <span className="text-xs text-muted-foreground font-mono truncate">{player.identifier}</span>
                    <span className={cn('text-xs text-right', player.ping > 100 ? 'text-red-400' : 'text-foreground')}>
                        {player.ping}ms
                    </span>
                    <span className="text-xs text-right text-muted-foreground">{player.joined}</span>
                    <div className="flex items-center justify-end gap-1">
                        <button className="px-2 py-1 text-[10px] rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
                            Kick
                        </button>
                        <button className="px-2 py-1 text-[10px] rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                            Ban
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PlaceholderTab({ name }: { name: string }) {
    return (
        <div className="glass-panel p-12 flex items-center justify-center">
            <div className="text-center space-y-2">
                <Settings className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">{name} panel — connect to a running server to view data</p>
            </div>
        </div>
    );
}

const tabComponents: Record<Tab, React.ComponentType> = {
    overview: OverviewTab,
    console: ConsoleTab,
    resources: ResourcesTab,
    players: PlayersTab,
    metrics: () => <PlaceholderTab name="Metrics" />,
    logs: () => <PlaceholderTab name="Logs" />,
    files: () => <PlaceholderTab name="Files" />,
    automation: () => <PlaceholderTab name="Automation" />,
    settings: () => <PlaceholderTab name="Settings" />,
};

export default function ServerDetailPage() {
    const params = useParams();
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const ActiveTabComponent = tabComponents[activeTab];

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="status-dot status-dot-running" />
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">FiveM Production</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {params.id} · 0.0.0.0:30120 · {formatUptime(432000)} uptime
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restart
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                        <Square className="w-3.5 h-3.5" />
                        Stop
                    </button>
                </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-panel p-3 flex items-center gap-3">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <div>
                        <div className="text-lg font-semibold text-foreground">87</div>
                        <div className="text-[10px] text-muted-foreground">/ 128 players</div>
                    </div>
                </div>
                <div className="glass-panel p-3 flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <div>
                        <div className="text-lg font-semibold text-foreground">42%</div>
                        <div className="text-[10px] text-muted-foreground">CPU Usage</div>
                    </div>
                </div>
                <div className="glass-panel p-3 flex items-center gap-3">
                    <HardDrive className="w-4 h-4 text-purple-400" />
                    <div>
                        <div className="text-lg font-semibold text-foreground">61%</div>
                        <div className="text-[10px] text-muted-foreground">Memory</div>
                    </div>
                </div>
                <div className="glass-panel p-3 flex items-center gap-3">
                    <Activity className="w-4 h-4 text-yellow-400" />
                    <div>
                        <div className="text-lg font-semibold text-foreground">61.2</div>
                        <div className="text-[10px] text-muted-foreground">Tick Rate (ms)</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
                            activeTab === tab.id
                                ? 'text-primary border-primary'
                                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border',
                        )}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <ActiveTabComponent />
        </div>
    );
}
