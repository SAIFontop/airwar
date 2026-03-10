'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { backupsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import {
    Clock,
    FolderArchive,
    HardDrive,
    Loader2,
    Plus,
    RefreshCw,
    RotateCcw, Trash2
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Backup {
    id: string;
    label: string;
    filename: string;
    createdAt: string;
    size: number;
}

export default function BackupsPage() {
    const { accessToken } = useAuthStore();
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [label, setLabel] = useState('');
    const [actionId, setActionId] = useState<string | null>(null);
    const token = accessToken || '';

    const fetchBackups = useCallback(async () => {
        if (!token) return;
        try {
            const res = await backupsApi.list(token);
            setBackups(res as Backup[]);
        } catch { }
        setLoading(false);
    }, [token]);

    useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            await backupsApi.create(token, label || undefined);
            setLabel('');
            fetchBackups();
        } catch { }
        setCreating(false);
    };

    const handleRestore = async (id: string) => {
        if (!confirm('هل أنت متأكد من استعادة هذا النسخة؟ سيتم استبدال الملفات الحالية.')) return;
        setActionId(id);
        try {
            await backupsApi.restore(token, id);
        } catch { }
        setActionId(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا النسخة الاحتياطية؟')) return;
        setActionId(id);
        try {
            await backupsApi.remove(token, id);
            setBackups((prev) => prev.filter((b) => b.id !== id));
        } catch { }
        setActionId(null);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        return (bytes / 1073741824).toFixed(2) + ' GB';
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('ar-SA') + ' ' + d.toLocaleTimeString('ar-SA', { hour12: false });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <FolderArchive className="h-5 w-5 text-[var(--accent-primary)]" />
                    النسخ الاحتياطية
                    <Badge variant="outline">{backups.length}</Badge>
                </h2>
                <Button size="sm" variant="outline" onClick={fetchBackups}>
                    <RefreshCw className="h-4 w-4" />
                    تحديث
                </Button>
            </div>

            {/* Create backup */}
            <Card className="glass">
                <CardContent className="p-4">
                    <div className="flex gap-3">
                        <Input
                            placeholder="وصف النسخة (اختياري)..."
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            className="flex-1"
                        />
                        <Button onClick={handleCreate} disabled={creating}>
                            {creating ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> جارِ الإنشاء...</>
                            ) : (
                                <><Plus className="h-4 w-4" /> إنشاء نسخة</>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Backups list */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
                </div>
            ) : backups.length === 0 ? (
                <Card className="glass">
                    <CardContent className="text-center py-12 text-[var(--text-muted)]">
                        لا توجد نسخ احتياطية. أنشئ واحدة الآن.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-2">
                    {backups.map((backup, i) => (
                        <motion.div
                            key={backup.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card className="glass hover:border-[var(--border-hover)] transition-all">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="font-medium">
                                            {backup.label || backup.filename}
                                        </div>
                                        <div className="flex gap-4 mt-1 text-xs text-[var(--text-muted)]">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(backup.createdAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <HardDrive className="h-3 w-3" />
                                                {formatSize(backup.size)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRestore(backup.id)}
                                            disabled={actionId === backup.id}
                                        >
                                            {actionId === backup.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <RotateCcw className="h-4 w-4" />
                                            )}
                                            استعادة
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(backup.id)}
                                            disabled={actionId === backup.id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
