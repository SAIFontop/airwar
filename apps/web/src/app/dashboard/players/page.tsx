'use client';

import { Badge, Button, Card, Input, Skeleton } from '@/components/ui';
import { playersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Ban, RefreshCw, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Player {
    id: number;
    name: string;
    identifiers?: string[];
    ping?: number;
}

export default function PlayersPage() {
    const token = useAuthStore((s) => s.accessToken)!;
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [kicking, setKicking] = useState<number | null>(null);

    const fetchPlayers = async () => {
        try {
            const res = await playersApi.list(token);
            setPlayers(res as Player[]);
        } catch { }
        setLoading(false);
    };

    useEffect(() => {
        fetchPlayers();
        const id = setInterval(fetchPlayers, 5000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const handleKick = async (playerId: number) => {
        setKicking(playerId);
        try {
            await playersApi.kick(token, playerId, 'Kicked by admin');
            await fetchPlayers();
        } catch { }
        setKicking(null);
    };

    const filtered = players.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-text-primary">Players</h1>
                    <p className="text-sm text-text-secondary mt-0.5">{players.length} connected players</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => { setLoading(true); fetchPlayers(); }}>
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
            </div>

            <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search players..."
                icon={<Search className="h-4 w-4" />}
                className="max-w-sm"
            />

            {loading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
            ) : filtered.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12">
                    <Users className="h-10 w-10 text-text-muted mb-3" />
                    <p className="text-sm text-text-secondary">{search ? 'No matching players' : 'No players online'}</p>
                </Card>
            ) : (
                <div className="rounded-[var(--radius-lg)] border border-border-primary overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border-primary bg-bg-secondary">
                                <th className="text-left text-xs font-medium text-text-muted px-4 py-3">ID</th>
                                <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Name</th>
                                <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Ping</th>
                                <th className="text-right text-xs font-medium text-text-muted px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-primary">
                            {filtered.map((player, i) => (
                                <motion.tr
                                    key={player.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.02 }}
                                    className="bg-bg-card hover:bg-bg-card-hover transition-colors"
                                >
                                    <td className="px-4 py-3 text-sm font-mono text-text-muted">{player.id}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{player.name}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={
                                            (player.ping ?? 0) < 80 ? 'success' :
                                                (player.ping ?? 0) < 150 ? 'warning' : 'danger'
                                        } size="sm">
                                            {player.ping ?? '—'}ms
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleKick(player.id)}
                                            loading={kicking === player.id}
                                            className="text-danger hover:text-danger hover:bg-danger-muted"
                                        >
                                            <Ban className="h-3.5 w-3.5" /> Kick
                                        </Button>
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
