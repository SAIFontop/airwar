'use client';

import { usePluginControl, usePlugins } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, Play, Puzzle, RefreshCw, Square, XCircle } from 'lucide-react';

export default function PluginsPage() {
    const { data: plugins, isLoading } = usePlugins();
    const { startPlugin, stopPlugin, discover } = usePluginControl();

    const statusIcon = (status: string) => {
        if (status === 'running') return <CheckCircle2 className="w-4 h-4 text-success" />;
        if (status === 'error') return <XCircle className="w-4 h-4 text-danger" />;
        return <AlertCircle className="w-4 h-4 text-muted" />;
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Puzzle className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-text">Plugins</h2>
                    <span className="bg-primary/15 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                        {(plugins || []).length}
                    </span>
                </div>
                <button onClick={() => discover.mutate()} disabled={discover.isPending} className="btn-primary text-sm">
                    {discover.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Discover
                </button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card p-5 animate-pulse">
                            <div className="h-5 bg-white/10 rounded w-40 mb-3" />
                            <div className="h-3 bg-white/5 rounded w-64" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(plugins || []).map((p: Record<string, unknown>, i: number) => (
                        <motion.div
                            key={String(p.id || i)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="glass-card p-5 group hover:border-primary/30 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    {statusIcon(String(p.status || ''))}
                                    <div>
                                        <p className="font-medium text-text">{String(p.name || p.id || 'Plugin')}</p>
                                        {p.description ? <p className="text-xs text-muted mt-1">{String(p.description)}</p> : null}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                                            {p.version ? <span>v{String(p.version)}</span> : null}
                                            {p.author ? <span>by {String(p.author)}</span> : null}
                                            <span className={cn(
                                                'px-2 py-0.5 rounded-full',
                                                p.trusted ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                                            )}>
                                                {p.trusted ? 'trusted' : 'sandboxed'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                    {String(p.status) !== 'running' ? (
                                        <button
                                            onClick={() => startPlugin.mutate(String(p.id))}
                                            disabled={startPlugin.isPending}
                                            className="p-2 rounded-lg text-success hover:bg-success/15 transition"
                                        >
                                            <Play className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => stopPlugin.mutate(String(p.id))}
                                            disabled={stopPlugin.isPending}
                                            className="p-2 rounded-lg text-danger hover:bg-danger/15 transition"
                                        >
                                            <Square className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {(plugins || []).length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted">
                            <Puzzle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No plugins installed</p>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
