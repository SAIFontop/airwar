'use client';

import { useBackups, useCreateBackup, useDeleteBackup, useRestoreBackup } from '@/lib/hooks';
import { formatBytes, formatTimeAgo } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Clock, Download, HardDrive, Loader2, Plus, RotateCw, Trash2 } from 'lucide-react';

export default function BackupsPage() {
    const { data: backups, isLoading } = useBackups();
    const create = useCreateBackup();
    const restore = useRestoreBackup();
    const del = useDeleteBackup();

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <HardDrive className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-text">Backups</h2>
                    <span className="bg-primary/15 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                        {(backups || []).length}
                    </span>
                </div>
                <button onClick={() => create.mutate()} disabled={create.isPending} className="btn-primary text-sm">
                    {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create Backup
                </button>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="glass-card p-5 animate-pulse">
                            <div className="h-5 bg-white/10 rounded w-48 mb-3" />
                            <div className="h-3 bg-white/5 rounded w-32" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {(backups || []).map((b: Record<string, unknown>, i: number) => (
                        <motion.div
                            key={String(b.id || i)}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="glass-card p-5 group hover:border-primary/30 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-text">{String(b.filename || b.id || 'Backup')}</p>
                                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {b.createdAt ? formatTimeAgo(String(b.createdAt)) : '--'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Download className="w-3 h-3" />
                                            {b.size ? formatBytes(Number(b.size)) : '--'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        onClick={() => restore.mutate(String(b.id))}
                                        disabled={restore.isPending}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/15 text-warning hover:bg-warning/25 text-xs font-medium transition"
                                    >
                                        <RotateCw className="w-3.5 h-3.5" /> Restore
                                    </button>
                                    <button
                                        onClick={() => del.mutate(String(b.id))}
                                        disabled={del.isPending}
                                        className="p-2 rounded-lg text-danger/60 hover:text-danger hover:bg-danger/10 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {(backups || []).length === 0 && (
                        <div className="text-center py-12 text-muted">
                            <HardDrive className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No backups yet</p>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
