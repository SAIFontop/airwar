'use client';

import { useAuditLog } from '@/lib/hooks';
import { cn, formatTimeAgo } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Clock, ScrollText, Search, Server, Settings, Shield, User } from 'lucide-react';
import { useState } from 'react';

const actionIcons: Record<string, React.ElementType> = {
    login: Shield,
    logout: Shield,
    'server.start': Server,
    'server.stop': Server,
    'server.restart': Server,
    'server.command': Server,
    default: Settings,
};

const actionColors: Record<string, string> = {
    login: 'text-success bg-success/15',
    logout: 'text-muted bg-white/5',
    'server.start': 'text-success bg-success/15',
    'server.stop': 'text-danger bg-danger/15',
    'server.restart': 'text-warning bg-warning/15',
    'server.command': 'text-primary bg-primary/15',
    default: 'text-muted bg-white/5',
};

export default function AuditPage() {
    const [limit, setLimit] = useState(200);
    const { data: entries, isLoading } = useAuditLog(limit);
    const [search, setSearch] = useState('');

    const filtered = (entries || []).filter((e: Record<string, unknown>) =>
        String(e.action || '').toLowerCase().includes(search.toLowerCase()) ||
        String(e.actor || e.username || '').toLowerCase().includes(search.toLowerCase()) ||
        String(e.details || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <ScrollText className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-text">Audit Log</h2>
                    <span className="bg-primary/15 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                        {filtered.length} entries
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-border text-text text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 w-56"
                            placeholder="Search audit log..."
                        />
                    </div>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="rounded-xl bg-white/5 border border-border px-3 py-2 text-text text-sm"
                    >
                        <option value={50}>50</option>
                        <option value={200}>200</option>
                        <option value={500}>500</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="glass-card p-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/10" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-white/10 rounded w-48" />
                                    <div className="h-3 bg-white/5 rounded w-32" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-1.5">
                    {filtered.map((entry: Record<string, unknown>, i: number) => {
                        const action = String(entry.action || '');
                        const Icon = actionIcons[action] || actionIcons.default;
                        const colorClass = actionColors[action] || actionColors.default;

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(i * 0.01, 0.5) }}
                                className="glass-card px-4 py-3 flex items-center gap-3 hover:border-primary/20 transition-colors"
                            >
                                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-text">{action}</span>
                                        {entry.details ? (
                                            <span className="text-xs text-muted truncate max-w-xs">{String(entry.details)}</span>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {String(entry.actor || entry.username || 'system')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {entry.timestamp ? formatTimeAgo(String(entry.timestamp)) : '--'}
                                        </span>
                                        {entry.ip ? <span className="font-mono">{String(entry.ip)}</span> : null}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-muted">
                            <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No audit entries</p>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
