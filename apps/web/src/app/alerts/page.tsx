'use client';

import { cn } from '@/lib/utils';
import { AlertOctagon, AlertTriangle, Check, Info } from 'lucide-react';
import { useState } from 'react';

interface Alert {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    server: string;
    timestamp: string;
    acknowledged: boolean;
    resolved: boolean;
}

const mockAlerts: Alert[] = [
    { id: '1', severity: 'critical', title: 'CPU Threshold Exceeded', message: 'Production server CPU at 92% for over 5 minutes', server: 'FiveM Production', timestamp: '2 min ago', acknowledged: false, resolved: false },
    { id: '2', severity: 'warning', title: 'Player Count Drop', message: 'Player count dropped 30% in the last 15 minutes (87 → 61)', server: 'FiveM Production', timestamp: '12 min ago', acknowledged: false, resolved: false },
    { id: '3', severity: 'info', title: 'Resource Updated', message: 'es_extended updated to v1.10.4 automatically', server: 'FiveM Production', timestamp: '1 hr ago', acknowledged: true, resolved: false },
    { id: '4', severity: 'warning', title: 'Memory Trending Up', message: 'Memory usage increased from 55% to 72% over 2 hours', server: 'FiveM Staging', timestamp: '3 hr ago', acknowledged: true, resolved: false },
    { id: '5', severity: 'critical', title: 'Server Crashed', message: 'Dev server crashed with exit code 1. Auto-restart triggered.', server: 'FiveM Dev', timestamp: '6 hr ago', acknowledged: true, resolved: true },
    { id: '6', severity: 'info', title: 'Scheduled Restart', message: 'Daily scheduled restart completed successfully', server: 'FiveM Production', timestamp: '18 hr ago', acknowledged: true, resolved: true },
];

const sevIcon: Record<string, React.ElementType> = { critical: AlertOctagon, warning: AlertTriangle, info: Info };
const sevColor: Record<string, string> = { critical: 'text-red-400', warning: 'text-yellow-400', info: 'text-blue-400' };
const sevBg: Record<string, string> = { critical: 'bg-red-400/10', warning: 'bg-yellow-400/10', info: 'bg-blue-400/10' };

export default function AlertsPage() {
    const [alerts, setAlerts] = useState(mockAlerts);
    const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
    const [sevFilter, setSevFilter] = useState<string[]>([]);

    const filtered = alerts
        .filter((a) => {
            if (filter === 'active') return !a.resolved;
            if (filter === 'resolved') return a.resolved;
            return true;
        })
        .filter((a) => sevFilter.length === 0 || sevFilter.includes(a.severity));

    const acknowledge = (id: string) => setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
    const resolve = (id: string) => setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, resolved: true, acknowledged: true } : a));

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Alerts</h1>
                    <p className="text-sm text-muted-foreground mt-1">Monitor and manage system alerts and notifications</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-red-400 font-medium">{alerts.filter((a) => a.severity === 'critical' && !a.resolved).length} critical</span>
                    <span>·</span>
                    <span>{alerts.filter((a) => !a.acknowledged).length} unacknowledged</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {(['all', 'active', 'resolved'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                                filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground bg-accent/30',
                            )}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1">
                    {(['critical', 'warning', 'info'] as const).map((sev) => (
                        <button
                            key={sev}
                            onClick={() => setSevFilter((prev) => prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev])}
                            className={cn(
                                'px-2 py-1 rounded text-[10px] font-medium uppercase transition-colors',
                                sevFilter.includes(sev) || sevFilter.length === 0 ? cn(sevColor[sev], sevBg[sev]) : 'text-zinc-600 bg-zinc-800/50',
                            )}
                        >
                            {sev}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-muted-foreground ml-auto">{filtered.length} alerts</span>
            </div>

            {/* Alert list */}
            <div className="space-y-2">
                {filtered.map((alert) => {
                    const SevIcon = sevIcon[alert.severity] ?? Info;
                    return (
                        <div key={alert.id} className={cn('glass-panel p-4', alert.resolved && 'opacity-50')}>
                            <div className="flex items-start gap-3">
                                <SevIcon className={cn('w-5 h-5 mt-0.5 shrink-0', sevColor[alert.severity])} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                                        <span className={cn(
                                            'text-[10px] px-1.5 py-0.5 rounded font-medium uppercase',
                                            sevColor[alert.severity], sevBg[alert.severity],
                                        )}>
                                            {alert.severity}
                                        </span>
                                        {alert.resolved && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/20 text-emerald-400">Resolved</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                                    <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                                        <span>{alert.server}</span>
                                        <span>{alert.timestamp}</span>
                                    </div>
                                </div>
                                {!alert.resolved && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        {!alert.acknowledged && (
                                            <button
                                                onClick={() => acknowledge(alert.id)}
                                                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-blue-400 bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                                            >
                                                <Check className="w-3 h-3" />
                                                Ack
                                            </button>
                                        )}
                                        <button
                                            onClick={() => resolve(alert.id)}
                                            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
                                        >
                                            <Check className="w-3 h-3" />
                                            Resolve
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="glass-panel p-12 text-center text-sm text-muted-foreground">
                        No alerts match your current filters.
                    </div>
                )}
            </div>
        </div>
    );
}
