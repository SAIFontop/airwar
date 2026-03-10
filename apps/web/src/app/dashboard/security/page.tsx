'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
    Key, Loader2, RefreshCw,
    Shield, Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface User {
    id: string;
    username: string;
    role: string;
    has2FA: boolean;
    createdAt: string;
}

export default function SecurityPage() {
    const { accessToken, user } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const token = accessToken || '';

    const fetchUsers = useCallback(async () => {
        if (!token) return;
        try {
            const res = await usersApi.list(token);
            setUsers(res as User[]);
        } catch { }
        setLoading(false);
    }, [token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const roleLabel = (role: string) => {
        const map: Record<string, string> = { owner: 'مالك', admin: 'مدير', viewer: 'مشاهد' };
        return map[role] || role;
    };

    const roleVariant = (role: string) => {
        if (role === 'owner') return 'default' as const;
        if (role === 'admin') return 'info' as const;
        return 'outline' as const;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[var(--accent-primary)]" />
                    الحماية والمستخدمين
                </h2>
                <Button size="sm" variant="outline" onClick={fetchUsers}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* 2FA status of current user */}
            <Card className="glass">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Key className="h-4 w-4 text-[var(--accent-primary)]" />
                        المصادقة الثنائية (2FA)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-[var(--text-secondary)]">
                        المصادقة الثنائية تضيف طبقة حماية إضافية لحسابك باستخدام تطبيق المصادقة (Google Authenticator).
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                        <Badge variant={user?.role === 'owner' ? 'success' : 'outline'}>
                            {roleLabel(user?.role || '')}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Users list */}
            <Card className="glass">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-[var(--accent-primary)]" />
                        المستخدمين
                        <Badge variant="outline">{users.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {users.map((u) => (
                                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] text-sm font-bold">
                                            {u.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium">{u.username}</div>
                                            <div className="text-xs text-[var(--text-muted)]">
                                                {new Date(u.createdAt).toLocaleDateString('ar-SA')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {u.has2FA && (
                                            <Badge variant="success">
                                                <Shield className="h-3 w-3 mr-1" />
                                                2FA
                                            </Badge>
                                        )}
                                        <Badge variant={roleVariant(u.role)}>
                                            {roleLabel(u.role)}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
