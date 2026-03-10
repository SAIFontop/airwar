'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { playersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import {
    Loader2,
    RefreshCw,
    Search,
    Users,
    UserX,
    Wifi,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Player {
    id: number;
    name: string;
    identifiers: string[];
    ping: number;
}

export default function PlayersPage() {
    const { accessToken } = useAuthStore();
    const [players, setPlayers] = useState<Player[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [kickingId, setKickingId] = useState<number | null>(null);
    const token = accessToken || '';

    const fetchPlayers = useCallback(async () => {
        if (!token) return;
        try {
            const res = await playersApi.list(token);
            setPlayers(res as Player[]);
        } catch { }
        setLoading(false);
    }, [token]);

    useEffect(() => {
        fetchPlayers();
        const iv = setInterval(fetchPlayers, 10000);
        return () => clearInterval(iv);
    }, [fetchPlayers]);

    const handleKick = async (playerId: number) => {
        setKickingId(playerId);
        try {
            await playersApi.kick(token, playerId, 'تم الطرد من لوحة التحكم');
            setPlayers((prev) => prev.filter((p) => p.id !== playerId));
        } catch { }
        setKickingId(null);
    };

    const filtered = players.filter(
        (p) =>
            p.name.toLowerCase().includes(filter.toLowerCase()) ||
            p.identifiers.some((id) => id.includes(filter)),
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-[var(--accent-primary)]" />
                    اللاعبين المتصلين
                    <Badge variant="default">{players.length}</Badge>
                </h2>
                <Button size="sm" variant="outline" onClick={fetchPlayers}>
                    <RefreshCw className="h-4 w-4" />
                    تحديث
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <Input
                    placeholder="بحث بالاسم أو المعرف..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pr-10"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
                </div>
            ) : filtered.length === 0 ? (
                <Card className="glass">
                    <CardContent className="text-center py-12 text-[var(--text-muted)]">
                        {players.length === 0 ? 'لا يوجد لاعبين متصلين' : 'لا نتائج للبحث'}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-2">
                    {filtered.map((player, i) => (
                        <motion.div
                            key={player.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card className="glass hover:border-[var(--border-hover)] transition-all">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] font-bold text-sm">
                                            #{player.id}
                                        </div>
                                        <div>
                                            <div className="font-medium">{player.name}</div>
                                            <div className="text-xs text-[var(--text-muted)] font-mono" dir="ltr">
                                                {player.identifiers.find((id) => id.startsWith('steam:')) || player.identifiers[0] || '—'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={player.ping < 100 ? 'success' : player.ping < 200 ? 'warning' : 'danger'}>
                                            <Wifi className="h-3 w-3 mr-1" />
                                            {player.ping}ms
                                        </Badge>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleKick(player.id)}
                                            disabled={kickingId === player.id}
                                        >
                                            {kickingId === player.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <UserX className="h-4 w-4" />
                                            )}
                                            طرد
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
