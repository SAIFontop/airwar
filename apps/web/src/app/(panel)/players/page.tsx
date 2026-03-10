'use client';

import { useBans, useCreateBan, useDeleteBan, useKickPlayer, usePlayers } from '@/lib/hooks';
import { cn, formatDuration, getPingColor } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Ban, Clock, Gavel, Search, Shield, ShieldOff, Trash2, Users, UserX, Wifi } from 'lucide-react';
import { useState } from 'react';

type TabId = 'online' | 'bans';

export default function PlayersPage() {
    const { data: players, isLoading } = usePlayers();
    const { data: bans, isLoading: bansLoading } = useBans();
    const kick = useKickPlayer();
    const createBan = useCreateBan();
    const deleteBan = useDeleteBan();

    const [tab, setTab] = useState<TabId>('online');
    const [search, setSearch] = useState('');
    const [kickDialog, setKickDialog] = useState<{ id: number; name: string; identifiers?: string[] } | null>(null);
    const [kickReason, setKickReason] = useState('');
    const [banDialog, setBanDialog] = useState<{ playerName: string; identifiers: string[] } | null>(null);
    const [banReason, setBanReason] = useState('');
    const [banDuration, setBanDuration] = useState<string>('permanent');
    const [customDuration, setCustomDuration] = useState('60');

    const filtered = (players || []).filter((p: Record<string, unknown>) =>
        String(p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        String(p.id || '').includes(search)
    );

    const filteredBans = (bans || []).filter((b: Record<string, unknown>) =>
        String(b.playerName || '').toLowerCase().includes(search.toLowerCase()) ||
        String(b.reason || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleKick = () => {
        if (!kickDialog) return;
        kick.mutate({ playerId: kickDialog.id, reason: kickReason || undefined });
        setKickDialog(null);
        setKickReason('');
    };

    const handleBan = () => {
        if (!banDialog) return;
        const duration = banDuration === 'permanent' ? undefined :
            banDuration === 'custom' ? Number(customDuration) :
            Number(banDuration);
        createBan.mutate({
            playerName: banDialog.playerName,
            identifiers: banDialog.identifiers,
            reason: banReason || 'No reason provided',
            duration,
        });
        setBanDialog(null);
        setBanReason('');
        setBanDuration('permanent');
    };

    const openBanFromPlayer = (player: Record<string, unknown>) => {
        setBanDialog({
            playerName: String(player.name || 'Unknown'),
            identifiers: Array.isArray(player.identifiers) ? (player.identifiers as string[]) : [],
        });
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-text">Players</h2>
                </div>
                <div className="flex items-center gap-3">
                    {/* Tabs */}
                    <div className="flex rounded-xl bg-white/5 border border-border p-0.5">
                        {([
                            { id: 'online' as TabId, label: 'Online', icon: Users, count: filtered.length },
                            { id: 'bans' as TabId, label: 'Bans', icon: Ban, count: (bans || []).length },
                        ]).map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                    tab === t.id
                                        ? 'bg-primary/20 text-primary shadow-sm'
                                        : 'text-muted hover:text-text'
                                )}
                            >
                                <t.icon className="w-4 h-4" />
                                {t.label}
                                <span className={cn(
                                    'text-xs px-1.5 py-0.5 rounded-full',
                                    tab === t.id ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted'
                                )}>{t.count}</span>
                            </button>
                        ))}
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-border text-text text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
                            placeholder={tab === 'online' ? 'Search players...' : 'Search bans...'}
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* ─── ONLINE PLAYERS TAB ─── */}
                {tab === 'online' && (
                    <motion.div key="online" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
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
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button
                                                    onClick={() => openBanFromPlayer(player)}
                                                    className="p-1.5 rounded-lg text-warning/60 hover:text-warning hover:bg-warning/10 transition"
                                                    title="Ban player"
                                                >
                                                    <Gavel className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setKickDialog({ id: Number(player.id), name: String(player.name), identifiers: Array.isArray(player.identifiers) ? (player.identifiers as string[]) : [] })}
                                                    className="p-1.5 rounded-lg text-danger/60 hover:text-danger hover:bg-danger/10 transition"
                                                    title="Kick player"
                                                >
                                                    <UserX className="w-4 h-4" />
                                                </button>
                                            </div>
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
                    </motion.div>
                )}

                {/* ─── BANS TAB ─── */}
                {tab === 'bans' && (
                    <motion.div key="bans" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        {/* Add Manual Ban Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={() => setBanDialog({ playerName: '', identifiers: [] })}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 text-sm font-medium transition"
                            >
                                <Gavel className="w-4 h-4" /> Add Ban
                            </button>
                        </div>

                        {bansLoading && (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="glass-card p-4 animate-pulse">
                                        <div className="h-5 bg-white/10 rounded w-1/3 mb-2" />
                                        <div className="h-4 bg-white/5 rounded w-2/3" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!bansLoading && (
                            <div className="space-y-3">
                                {filteredBans.map((ban: Record<string, unknown>) => {
                                    const isExpired = Boolean(ban.expiresAt && new Date(String(ban.expiresAt)) < new Date());
                                    return (
                                        <motion.div
                                            key={String(ban.id)}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                'glass-card p-4 group',
                                                isExpired ? 'opacity-50 border-border' : 'border-danger/20'
                                            )}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Ban className="w-4 h-4 text-danger shrink-0" />
                                                        <span className="font-medium text-text">{String(ban.playerName)}</span>
                                                        {isExpired && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted">Expired</span>
                                                        )}
                                                        {!ban.expiresAt && !isExpired && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-danger/15 text-danger">Permanent</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted">{String(ban.reason)}</p>
                                                    <div className="flex items-center gap-4 text-xs text-muted">
                                                        <span>by {String(ban.bannedBy)}</span>
                                                        <span>{new Date(String(ban.createdAt)).toLocaleDateString()}</span>
                                                        {Boolean(ban.expiresAt) && !isExpired && (
                                                            <span className="text-warning">Expires: {new Date(String(ban.expiresAt)).toLocaleString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteBan.mutate(String(ban.id))}
                                                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-muted hover:text-success hover:bg-success/10 transition"
                                                    title="Unban"
                                                >
                                                    <ShieldOff className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                {filteredBans.length === 0 && (
                                    <div className="text-center py-12 text-muted">
                                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>No bans found</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Kick Dialog ─── */}
            {kickDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setKickDialog(null)}>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card p-6 w-full max-w-md mx-4 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-text flex items-center gap-2"><UserX className="w-5 h-5 text-danger" /> Kick Player</h3>
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
                            <button
                                onClick={() => {
                                    handleKick();
                                    // Offer ban after kick
                                    if (kickDialog.identifiers?.length) {
                                        setBanDialog({ playerName: kickDialog.name, identifiers: kickDialog.identifiers });
                                    }
                                }}
                                className="px-4 py-2 rounded-xl bg-danger text-white text-sm hover:bg-danger/80 transition"
                            >
                                Kick
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ─── Ban Dialog ─── */}
            {banDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setBanDialog(null)}>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card p-6 w-full max-w-lg mx-4 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-text flex items-center gap-2"><Gavel className="w-5 h-5 text-warning" /> Ban Player</h3>

                        {/* Player Name (editable for manual bans) */}
                        <div>
                            <label className="text-xs text-muted block mb-1">Player Name</label>
                            <input
                                value={banDialog.playerName}
                                onChange={(e) => setBanDialog({ ...banDialog, playerName: e.target.value })}
                                className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm placeholder:text-muted/50"
                                placeholder="Player name"
                            />
                        </div>

                        {/* Identifiers */}
                        <div>
                            <label className="text-xs text-muted block mb-1">Identifiers</label>
                            <input
                                value={banDialog.identifiers.join(', ')}
                                onChange={(e) => setBanDialog({ ...banDialog, identifiers: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm placeholder:text-muted/50"
                                placeholder="steam:xxx, license:xxx (comma separated)"
                            />
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="text-xs text-muted block mb-1">Reason</label>
                            <input
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm placeholder:text-muted/50"
                                placeholder="Ban reason"
                                autoFocus
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="text-xs text-muted block mb-1">Duration</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'permanent', label: 'Permanent' },
                                    { value: '60', label: '1 Hour' },
                                    { value: '1440', label: '1 Day' },
                                    { value: '10080', label: '1 Week' },
                                    { value: '43200', label: '30 Days' },
                                    { value: 'custom', label: 'Custom' },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setBanDuration(opt.value)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg text-xs font-medium transition',
                                            banDuration === opt.value ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-muted border border-border hover:text-text'
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            {banDuration === 'custom' && (
                                <div className="mt-2 flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={customDuration}
                                        onChange={(e) => setCustomDuration(e.target.value)}
                                        className="w-24 rounded-xl bg-white/5 border border-border px-3 py-2 text-text text-sm"
                                        min="1"
                                    />
                                    <span className="text-sm text-muted">minutes</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button onClick={() => { setBanDialog(null); setBanReason(''); }} className="px-4 py-2 rounded-xl bg-white/5 text-muted hover:text-text text-sm transition">
                                Cancel
                            </button>
                            <button
                                onClick={handleBan}
                                disabled={!banDialog.playerName}
                                className="px-4 py-2 rounded-xl bg-danger text-white text-sm hover:bg-danger/80 transition disabled:opacity-50"
                            >
                                Ban Player
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
