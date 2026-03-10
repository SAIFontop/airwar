'use client';

import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Fingerprint, KeyRound, Lock, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserEntry {
    id: string;
    username: string;
    role: string;
    createdAt?: string;
    totpEnabled?: boolean;
}

export default function SecurityPage() {
    const token = useAuthStore((s) => s.accessToken)!;
    const currentUser = useAuthStore((s) => s.user);
    const [users, setUsers] = useState<UserEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        usersApi.list(token)
            .then((res) => setUsers(res as UserEntry[]))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
            </div>
        );
    }

    const adminCount = users.filter((u) => u.role === 'admin').length;
    const totpCount = users.filter((u) => u.totpEnabled).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-text-primary">Security</h1>
                <p className="text-sm text-text-secondary mt-0.5">User accounts and access control overview</p>
            </div>

            {/* Overview cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    { icon: User, label: 'Total Users', value: users.length, color: 'text-accent' },
                    { icon: Shield, label: 'Admins', value: adminCount, color: 'text-status-warning' },
                    { icon: Fingerprint, label: '2FA Enabled', value: totpCount, color: 'text-status-success' },
                ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card>
                            <CardContent className="flex items-center gap-3 py-4">
                                <div className={`p-2 rounded-[var(--radius-md)] bg-bg-secondary ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted">{stat.label}</p>
                                    <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Current Session */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Lock className="h-4 w-4 text-accent" /> Current Session
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-text-muted">Logged in as</span>
                            <span className="text-text-primary font-medium">{currentUser?.username ?? '—'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-text-muted">Role</span>
                            <Badge variant={currentUser?.role === 'admin' ? 'accent' : 'default'} size="sm">
                                {currentUser?.role ?? '—'}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-text-muted">Auth Method</span>
                            <span className="text-text-primary font-medium">JWT + Bearer Token</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* User accounts */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <KeyRound className="h-4 w-4 text-accent" /> User Accounts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {users.length === 0 ? (
                            <p className="text-sm text-text-muted">No user accounts found</p>
                        ) : (
                            <div className="rounded-[var(--radius-lg)] border border-border-primary overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border-primary bg-bg-secondary">
                                            <th className="text-left text-xs font-medium text-text-muted px-4 py-2.5">Username</th>
                                            <th className="text-left text-xs font-medium text-text-muted px-4 py-2.5">Role</th>
                                            <th className="text-left text-xs font-medium text-text-muted px-4 py-2.5">2FA</th>
                                            <th className="text-left text-xs font-medium text-text-muted px-4 py-2.5">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-primary">
                                        {users.map((u) => (
                                            <tr key={u.id} className="bg-bg-card hover:bg-bg-card-hover transition-colors">
                                                <td className="px-4 py-2.5 text-sm text-text-primary font-medium">{u.username}</td>
                                                <td className="px-4 py-2.5">
                                                    <Badge variant={u.role === 'admin' ? 'accent' : 'default'} size="sm">{u.role}</Badge>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <Badge variant={u.totpEnabled ? 'success' : 'danger'} size="sm">
                                                        {u.totpEnabled ? 'Enabled' : 'Disabled'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-2.5 text-xs text-text-muted">
                                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
