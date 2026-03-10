'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { serverApi, usersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { HardDrive, RefreshCw, Server, Settings2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ServerInfo {
    status: string;
    info?: {
        hostname?: string;
        maxClients?: number;
        gametype?: string;
        mapname?: string;
        [key: string]: unknown;
    };
}

interface UserEntry {
    id: string;
    username: string;
    role: string;
    createdAt?: string;
}

export default function SettingsPage() {
    const token = useAuthStore((s) => s.accessToken)!;
    const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
    const [users, setUsers] = useState<UserEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [srv, usr] = await Promise.all([
                serverApi.status(token).catch(() => null),
                usersApi.list(token).catch(() => []),
            ]);
            setServerInfo(srv as ServerInfo | null);
            setUsers(usr as UserEntry[]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
            </div>
        );
    }

    const info = serverInfo?.info ?? {};

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-text-primary">Settings</h1>
                    <p className="text-sm text-text-secondary mt-0.5">Server configuration and panel management</p>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Server Info */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <Server className="h-4 w-4 text-accent" /> Server Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <InfoRow label="Status">
                                <Badge variant={serverInfo?.status === 'online' ? 'success' : 'danger'} size="sm">
                                    {serverInfo?.status ?? 'unknown'}
                                </Badge>
                            </InfoRow>
                            <InfoRow label="Hostname">{String(info.hostname ?? '—')}</InfoRow>
                            <InfoRow label="Max Clients">{String(info.maxClients ?? '—')}</InfoRow>
                            <InfoRow label="Game Type">{String(info.gametype ?? '—')}</InfoRow>
                            <InfoRow label="Map">{String(info.mapname ?? '—')}</InfoRow>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Panel Users */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-accent" /> Panel Users
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {users.length === 0 ? (
                                <p className="text-sm text-text-muted">No users found</p>
                            ) : (
                                <div className="space-y-2">
                                    {users.map((u) => (
                                        <div key={u.id} className="flex items-center justify-between rounded-[var(--radius-md)] bg-bg-secondary p-2.5">
                                            <span className="text-sm text-text-primary">{u.username}</span>
                                            <Badge variant={u.role === 'admin' ? 'accent' : 'default'} size="sm">{u.role}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Panel Info */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <Settings2 className="h-4 w-4 text-accent" /> Panel Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <InfoRow label="Panel Version">1.0.0</InfoRow>
                            <InfoRow label="API Port">4800</InfoRow>
                            <InfoRow label="Storage">JSON File Store</InfoRow>
                            <InfoRow label="Auth">JWT + TOTP</InfoRow>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Quick Info */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <HardDrive className="h-4 w-4 text-accent" /> Environment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <InfoRow label="Runtime">Node.js</InfoRow>
                            <InfoRow label="Framework">Fastify 5</InfoRow>
                            <InfoRow label="Frontend">Next.js 15</InfoRow>
                            <InfoRow label="OS">{typeof navigator !== 'undefined' ? navigator.platform : 'Server'}</InfoRow>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">{label}</span>
            <span className="text-text-primary font-medium">{children}</span>
        </div>
    );
}
