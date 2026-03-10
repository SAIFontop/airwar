'use client';

import { useResourceAction, useResources } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, FolderOpen, Play, RefreshCw, RotateCw, Search, Square, XCircle } from 'lucide-react';
import { useState } from 'react';

export default function ResourcesPage() {
    const { data: resources, isLoading, refetch } = useResources();
    const action = useResourceAction();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'started' | 'stopped'>('all');

    const filtered = (resources || []).filter((r: Record<string, unknown>) => {
        const matchSearch = String(r.name || '').toLowerCase().includes(search.toLowerCase());
        if (filter === 'all') return matchSearch;
        if (filter === 'started') return matchSearch && r.status === 'started';
        return matchSearch && r.status !== 'started';
    });

    const statusIcon = (status: string) => {
        if (status === 'started') return <CheckCircle2 className="w-4 h-4 text-success" />;
        if (status === 'stopped') return <XCircle className="w-4 h-4 text-danger" />;
        return <AlertCircle className="w-4 h-4 text-warning" />;
    };

    const startedCount = (resources || []).filter((r: Record<string, unknown>) => r.status === 'started').length;
    const total = (resources || []).length;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <FolderOpen className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-text">Resources</h2>
                    <span className="bg-success/15 text-success text-xs font-medium px-2.5 py-1 rounded-full">
                        {startedCount}/{total}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Filters */}
                    <div className="flex rounded-xl bg-white/5 border border-border p-0.5">
                        {(['all', 'started', 'stopped'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize',
                                    filter === f ? 'bg-primary/20 text-primary' : 'text-muted hover:text-text'
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-border text-text text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 w-56"
                            placeholder="Search resources..."
                        />
                    </div>
                    <button onClick={() => refetch()} className="p-2 rounded-xl bg-white/5 border border-border text-muted hover:text-text transition">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="space-y-3">
                    {[...Array(8)].map((_, i) => (
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
            )}

            {/* Resource List */}
            {!isLoading && (
                <div className="space-y-2">
                    {filtered.map((res: Record<string, unknown>, i: number) => (
                        <motion.div
                            key={String(res.name)}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="glass-card p-4 flex items-center justify-between group hover:border-primary/30 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {statusIcon(String(res.status || ''))}
                                <div className="min-w-0">
                                    <p className="font-medium text-text text-sm truncate">{String(res.name)}</p>
                                    {res.description ? (
                                        <p className="text-xs text-muted truncate max-w-md">{String(res.description)}</p>
                                    ) : null}
                                </div>
                                {res.version ? (
                                    <span className="text-xs text-muted bg-white/5 px-2 py-0.5 rounded-full hidden sm:inline">
                                        v{String(res.version)}
                                    </span>
                                ) : null}
                                {res.author ? (
                                    <span className="text-xs text-muted hidden md:inline">
                                        by {String(res.author)}
                                    </span>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                {String(res.status) !== 'started' && (
                                    <button
                                        onClick={() => action.mutate({ name: String(res.name), action: 'start' })}
                                        disabled={action.isPending}
                                        className="p-2 rounded-lg text-success hover:bg-success/15 transition"
                                        title="Start"
                                    >
                                        <Play className="w-4 h-4" />
                                    </button>
                                )}
                                {String(res.status) === 'started' && (
                                    <>
                                        <button
                                            onClick={() => action.mutate({ name: String(res.name), action: 'restart' })}
                                            disabled={action.isPending}
                                            className="p-2 rounded-lg text-warning hover:bg-warning/15 transition"
                                            title="Restart"
                                        >
                                            <RotateCw className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => action.mutate({ name: String(res.name), action: 'stop' })}
                                            disabled={action.isPending}
                                            className="p-2 rounded-lg text-danger hover:bg-danger/15 transition"
                                            title="Stop"
                                        >
                                            <Square className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-muted">
                            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No resources found</p>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
