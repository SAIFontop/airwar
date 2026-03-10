'use client';

import { Badge, Button, Card, Input, Skeleton } from '@/components/ui';
import { backupsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatBytes } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Archive, Database, Download, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Backup {
    id: string;
    label?: string;
    size?: number;
    createdAt: string;
}

export default function BackupsPage() {
    const token = useAuthStore((s) => s.accessToken)!;
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [label, setLabel] = useState('');
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchBackups = async () => {
        try {
            const res = await backupsApi.list(token);
            setBackups(res as Backup[]);
        } catch { }
        setLoading(false);
    };

    useEffect(() => {
        fetchBackups();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const createBackup = async () => {
        setCreating(true);
        try {
            await backupsApi.create(token, label || undefined);
            setLabel('');
            await fetchBackups();
        } catch { }
        setCreating(false);
    };

    const restoreBackup = async (id: string) => {
        setActionId(id);
        try {
            await backupsApi.restore(token, id);
        } catch { }
        setActionId(null);
    };

    const deleteBackup = async (id: string) => {
        setActionId(id);
        try {
            await backupsApi.remove(token, id);
            await fetchBackups();
        } catch { }
        setActionId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-text-primary">Backups</h1>
                    <p className="text-sm text-text-secondary mt-0.5">{backups.length} backup{backups.length !== 1 ? 's' : ''} available</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => { setLoading(true); fetchBackups(); }}>
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
            </div>

            {/* Create backup */}
            <Card>
                <form onSubmit={(e) => { e.preventDefault(); createBackup(); }} className="flex items-end gap-3">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">New Backup</label>
                        <Input
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Optional label..."
                            icon={<Archive className="h-4 w-4" />}
                        />
                    </div>
                    <Button type="submit" loading={creating}>
                        <Plus className="h-4 w-4" /> Create
                    </Button>
                </form>
            </Card>

            {/* Backup list */}
            {loading ? (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
            ) : backups.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12">
                    <Database className="h-10 w-10 text-text-muted mb-3" />
                    <p className="text-sm text-text-secondary">No backups yet</p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {backups.map((backup, i) => (
                        <motion.div
                            key={backup.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card className="flex items-center justify-between hover:border-border-hover transition-colors">
                                <div>
                                    <p className="text-sm font-medium text-text-primary">
                                        {backup.label || backup.id}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-text-muted">
                                            {new Date(backup.createdAt).toLocaleString()}
                                        </span>
                                        {backup.size != null && (
                                            <Badge variant="default" size="sm">{formatBytes(backup.size)}</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => restoreBackup(backup.id)}
                                        loading={actionId === backup.id}
                                    >
                                        <Download className="h-3.5 w-3.5" /> Restore
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteBackup(backup.id)}
                                        className="text-danger hover:text-danger hover:bg-danger-muted"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
