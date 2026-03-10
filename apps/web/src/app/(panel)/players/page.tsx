'use client';

import { useKickPlayer, usePlayers } from '@/lib/hooks';
import { cn, formatDuration, getPingColor } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Clock, Search, Shield, Users, UserX, Wifi } from 'lucide-react';
import { useState } from 'react';

export default function PlayersPage() {
    const { data: players, isLoading } = usePlayers();
    const kick = useKickPlayer();
    const [search, setSearch] = useState('');
    const [kickDialog, setKickDialog] = useState<{ id: number; name: string } | null>(null);
    const [kickReason, setKickReason] = useState('');

    const filtered = (players || []).filter((p: Record<string, unknown>) =>
        String(p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        String(p.id || '').includes(search)
    );

    const handleKick = () => {
        if (!kickDialog) return;
        kick.mutate({ playerId: kickDialog.id, reason: kickReason || undefined });
        setKickDialog(null);
        setKickReason('');
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-text">Players</h2>
                    <span className="bg-primary/15 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                        {filtered.length} online
                    </span>
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-border text-text text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
                        placeholder="Search players..."
                    />
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="glass-card p-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-white/10 rounded w-2/3" />
                                    <div className="h-3 bg-white/5 rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Player Grid */}
            {!isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((player: Record<string, unknown>, i: number) => (
                        <motion.div
                            key={String(player.id)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="glass-card p-4 group hover:border-primary/30 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-text font-bold text-sm shrink-0">
                                        {String(player.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-text truncate">{String(player.name || 'Unknown')}</p>
                                        <p className="text-xs text-muted">ID: {String(player.id)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setKickDialog({ id: Number(player.id), name: String(player.name) })}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-danger/60 hover:text-danger hover:bg-danger/10 transition"
                                    title="Kick player"
                                >
                                    <UserX className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                                <span className={cn('flex items-center gap-1', getPingColor(Number(player.ping || 0)))}>
                                    <Wifi className="w-3 h-3" />{String(player.ping || '0')}ms
                                </span>
                                {player.playtime ? (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />{formatDuration(Number(player.playtime))}
                                    </span>
                                ) : null}
                                {player.identifiers ? (
                                    <span className="flex items-center gap-1">
                                        <Shield className="w-3 h-3" />{Array.isArray(player.identifiers) ? player.identifiers.length : 0} IDs
                                    </span>
                                ) : null}
                            </div>
                        </motion.div>
                    ))}
                    {filtered.length === 0 && !isLoading && (
                        <div className="col-span-full text-center py-12 text-muted">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No players online</p>
                        </div>
                    )}
                </div>
            )}

            {/* Kick Dialog */}
            {kickDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setKickDialog(null)}>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card p-6 w-full max-w-md mx-4 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-text">Kick Player</h3>
                        <p className="text-sm text-muted">
                            Kick <span className="text-text font-medium">{kickDialog.name}</span> from the server?
                        </p>
                        <input
                            value={kickReason}
                            onChange={(e) => setKickReason(e.target.value)}
                            className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm placeholder:text-muted/50"
                            placeholder="Reason (optional)"
                            autoFocus
                        />
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setKickDialog(null)} className="px-4 py-2 rounded-xl bg-white/5 text-muted hover:text-text text-sm transition">
                                Cancel
                            </button>
                            <button onClick={handleKick} className="px-4 py-2 rounded-xl bg-danger text-white text-sm hover:bg-danger/80 transition">
                                Kick
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
