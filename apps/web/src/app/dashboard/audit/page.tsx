'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { auditApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import {
    Clock,
    Loader2,
    RefreshCw,
    ScrollText
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface AuditEntry {
    timestamp: string;
    userId: string;
    username: string;
    action: string;
    details?: string;
    ip?: string;
}

export default function AuditPage() {
    const { accessToken } = useAuthStore();
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const token = accessToken || '';

    const fetchAudit = useCallback(async () => {
        if (!token) return;
        try {
            const res = await auditApi.list(token, 100);
            setEntries(res as AuditEntry[]);
        } catch { }
        setLoading(false);
    }, [token]);

    useEffect(() => {
        fetchAudit();
    }, [fetchAudit]);

    const actionColor = (action: string) => {
        if (action.includes('delete') || action.includes('kick') || action.includes('stop')) return 'danger' as const;
        if (action.includes('create') || action.includes('start') || action.includes('login')) return 'success' as const;
        if (action.includes('update') || action.includes('restart')) return 'warning' as const;
        return 'info' as const;
    };

    const actionLabel = (action: string) => {
        const map: Record<string, string> = {
            login: 'تسجيل دخول',
            logout: 'تسجيل خروج',
            'server.start': 'تشغيل السيرفر',
            'server.stop': 'إيقاف السيرفر',
            'server.restart': 'إعادة تشغيل',
            'server.command': 'تنفيذ أمر',
            'backup.create': 'إنشاء نسخة',
            'backup.restore': 'استعادة نسخة',
            'backup.delete': 'حذف نسخة',
            'player.kick': 'طرد لاعب',
            'resource.action': 'إجراء ريسورس',
        };
        return map[action] || action;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <ScrollText className="h-5 w-5 text-[var(--accent-primary)]" />
                    سجل العمليات
                    <Badge variant="outline">{entries.length}</Badge>
                </h2>
                <Button size="sm" variant="outline" onClick={fetchAudit}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
                </div>
            ) : entries.length === 0 ? (
                <Card className="glass">
                    <CardContent className="text-center py-12 text-[var(--text-muted)]">
                        لا توجد عمليات مسجلة
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {entries.map((entry, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                        >
                            <Card className="glass">
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant={actionColor(entry.action)}>
                                                {actionLabel(entry.action)}
                                            </Badge>
                                            <span className="text-sm font-medium">{entry.username}</span>
                                        </div>
                                        {entry.details && (
                                            <div className="text-xs text-[var(--text-muted)] mt-1 font-mono" dir="ltr">
                                                {entry.details}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)] flex flex-col items-end gap-0.5 flex-shrink-0">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(entry.timestamp).toLocaleTimeString('ar-SA', { hour12: false })}
                                        </span>
                                        <span>{new Date(entry.timestamp).toLocaleDateString('ar-SA')}</span>
                                        {entry.ip && <span className="font-mono">{entry.ip}</span>}
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
