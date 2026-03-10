'use client';

import { Badge, Card, Skeleton } from '@/components/ui';
import { auditApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Clock, ScrollText, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuditEntry {
    id: string;
    action: string;
    user: string;
    details?: string;
    ip?: string;
    createdAt: string;
}

export default function AuditPage() {
    const token = useAuthStore((s) => s.accessToken)!;
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        auditApi.list(token, 100)
            .then((res) => setEntries(res as AuditEntry[]))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [token]);

    const actionColors: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
        login: 'info',
        logout: 'default',
        start: 'success',
        stop: 'danger',
        restart: 'warning',
        kick: 'danger',
        backup: 'info',
        command: 'accent' as 'default',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-text-primary">Audit Log</h1>
                <p className="text-sm text-text-secondary mt-0.5">Activity history and security events</p>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
            ) : entries.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12">
                    <ScrollText className="h-10 w-10 text-text-muted mb-3" />
                    <p className="text-sm text-text-secondary">No audit entries yet</p>
                </Card>
            ) : (
                <div className="rounded-[var(--radius-lg)] border border-border-primary overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border-primary bg-bg-secondary">
                                <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Action</th>
                                <th className="text-left text-xs font-medium text-text-muted px-4 py-3">User</th>
                                <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Details</th>
                                <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-primary">
                            {entries.map((entry, i) => (
                                <motion.tr
                                    key={entry.id ?? i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.015 }}
                                    className="bg-bg-card hover:bg-bg-card-hover transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <Badge variant={actionColors[entry.action] ?? 'default'} size="sm">
                                            {entry.action}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-1.5 text-sm text-text-primary">
                                            <User className="h-3 w-3 text-text-muted" /> {entry.user}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary font-mono text-xs max-w-xs truncate">
                                        {entry.details ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap">
                                            <Clock className="h-3 w-3" />
                                            {new Date(entry.createdAt).toLocaleString()}
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
