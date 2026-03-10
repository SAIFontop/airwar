'use client';

import { cn } from '@/lib/utils';
import {
    Edit,
    Pause,
    Play,
    Plus,
    RotateCcw,
    Trash2,
    Zap
} from 'lucide-react';
import { useState } from 'react';

interface AutomationRule {
    id: string;
    name: string;
    description: string;
    trigger: string;
    condition: string;
    action: string;
    enabled: boolean;
    lastTriggered: string | null;
    triggerCount: number;
}

const mockRules: AutomationRule[] = [
    {
        id: '1', name: 'High CPU Auto-Restart', description: 'Restart server when CPU exceeds 90% for 5 minutes',
        trigger: 'CPU > 90%', condition: 'Duration > 5min', action: 'Restart Server',
        enabled: true, lastTriggered: '2h ago', triggerCount: 3,
    },
    {
        id: '2', name: 'Memory Leak Detection', description: 'Alert and restart when memory grows above 85%',
        trigger: 'Memory > 85%', condition: 'Trending upward', action: 'Alert + Restart',
        enabled: true, lastTriggered: '1d ago', triggerCount: 1,
    },
    {
        id: '3', name: 'Crash Recovery', description: 'Automatically restart server after crash with 10s delay',
        trigger: 'Server Crashed', condition: 'Always', action: 'Restart (10s delay)',
        enabled: true, lastTriggered: '3d ago', triggerCount: 2,
    },
    {
        id: '4', name: 'Low Player Count Shutdown', description: 'Stop staging server when no players for 30 minutes',
        trigger: 'Players == 0', condition: 'Duration > 30min', action: 'Stop Server',
        enabled: false, lastTriggered: null, triggerCount: 0,
    },
    {
        id: '5', name: 'Scheduled Restart', description: 'Restart production server every day at 6 AM',
        trigger: 'Cron: 0 6 * * *', condition: 'Always', action: 'Restart Server',
        enabled: true, lastTriggered: '18h ago', triggerCount: 14,
    },
];

export default function AutomationPage() {
    const [rules, setRules] = useState(mockRules);

    const toggleRule = (id: string) => {
        setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Automation</h1>
                    <p className="text-sm text-muted-foreground mt-1">Configure automated rules and triggers for your servers</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" />
                    New Rule
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-panel p-4 flex items-center gap-3">
                    <Zap className="w-4 h-4 text-primary" />
                    <div><div className="text-lg font-semibold text-foreground">{rules.length}</div><div className="text-[10px] text-muted-foreground">Total Rules</div></div>
                </div>
                <div className="glass-panel p-4 flex items-center gap-3">
                    <Play className="w-4 h-4 text-emerald-400" />
                    <div><div className="text-lg font-semibold text-foreground">{rules.filter((r) => r.enabled).length}</div><div className="text-[10px] text-muted-foreground">Active</div></div>
                </div>
                <div className="glass-panel p-4 flex items-center gap-3">
                    <RotateCcw className="w-4 h-4 text-yellow-400" />
                    <div><div className="text-lg font-semibold text-foreground">{rules.reduce((sum, r) => sum + r.triggerCount, 0)}</div><div className="text-[10px] text-muted-foreground">Total Triggers</div></div>
                </div>
            </div>

            {/* Rules list */}
            <div className="space-y-3">
                {rules.map((rule) => (
                    <div key={rule.id} className={cn('glass-panel p-5', !rule.enabled && 'opacity-60')}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-sm font-semibold text-foreground">{rule.name}</h3>
                                    <span className={cn(
                                        'text-[10px] px-1.5 py-0.5 rounded font-medium',
                                        rule.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400',
                                    )}>
                                        {rule.enabled ? 'Active' : 'Disabled'}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">{rule.description}</p>
                                <div className="flex items-center gap-6 text-xs">
                                    <div><span className="text-muted-foreground">Trigger: </span><span className="text-foreground font-medium">{rule.trigger}</span></div>
                                    <div><span className="text-muted-foreground">Condition: </span><span className="text-foreground font-medium">{rule.condition}</span></div>
                                    <div><span className="text-muted-foreground">Action: </span><span className="text-primary font-medium">{rule.action}</span></div>
                                </div>
                                {rule.lastTriggered && (
                                    <div className="mt-2 text-[10px] text-muted-foreground">
                                        Last triggered: {rule.lastTriggered} · Triggered {rule.triggerCount} time{rule.triggerCount !== 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => toggleRule(rule.id)}
                                    className={cn('p-1.5 rounded transition-colors', rule.enabled ? 'hover:bg-yellow-500/20 text-yellow-400' : 'hover:bg-emerald-500/20 text-emerald-400')}
                                >
                                    {rule.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                </button>
                                <button className="p-1.5 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors">
                                    <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
