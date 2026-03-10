'use client';

import { useResourceAction, useResources } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowUpDown,
    CheckCircle2,
    ChevronDown,
    Circle,
    Filter,
    FolderOpen,
    Grid3X3,
    LayoutList,
    Loader2,
    Package,
    Play,
    RefreshCw,
    RotateCcw,
    Search,
    Shield,
    Square,
    Tag,
    User,
    XCircle,
    Zap
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'status' | 'author';
type FilterStatus = 'all' | 'started' | 'stopped' | 'unknown';

interface Resource {
    name: string;
    status: string;
    description?: string;
    version?: string;
    author?: string;
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
    started: { color: 'text-success', bg: 'bg-success/10 border-success/20', icon: CheckCircle2, label: 'Running' },
    stopped: { color: 'text-danger', bg: 'bg-danger/10 border-danger/20', icon: XCircle, label: 'Stopped' },
    unknown: { color: 'text-muted', bg: 'bg-white/5 border-border', icon: Circle, label: 'Unknown' },
};

function getStatus(s: string) {
    return statusConfig[s] || statusConfig.unknown;
}

export default function ResourcesPage() {
    const { data: resources, isLoading, refetch } = useResources();
    const action = useResourceAction();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterStatus>('all');
    const [sortBy, setSortBy] = useState<SortBy>('name');
    const [view, setView] = useState<ViewMode>('grid');
    const [actioningResource, setActioningResource] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);

    const doAction = useCallback(async (name: string, act: 'start' | 'stop' | 'ensure' | 'restart') => {
        setActioningResource(name);
        await action.mutateAsync({ name, action: act });
        setActioningResource(null);
        await refetch();
    }, [action, refetch]);

    const doBulkAction = useCallback(async (act: 'start' | 'stop' | 'restart') => {
        for (const name of bulkSelected) {
            await action.mutateAsync({ name, action: act });
        }
        setBulkSelected(new Set());
        setShowBulkActions(false);
        await refetch();
    }, [bulkSelected, action, refetch]);

    // Extract categories from [bracket] folders
    const categories = useMemo(() => {
        if (!resources) return [];
        const cats = new Map<string, number>();
        (resources as Resource[]).forEach(r => {
            const match = r.name.match(/^\[([^\]]+)\]/);
            if (match) {
                cats.set(match[1], (cats.get(match[1]) || 0) + 1);
            } else {
                cats.set('ungrouped', (cats.get('ungrouped') || 0) + 1);
            }
        });
        return Array.from(cats.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    }, [resources]);

    // Filter + search + sort
    const filtered = useMemo(() => {
        if (!resources) return [];
        let list = [...(resources as Resource[])];

        if (filter !== 'all') {
            list = list.filter(r => r.status === filter);
        }

        if (selectedCategory) {
            if (selectedCategory === 'ungrouped') {
                list = list.filter(r => !r.name.includes('/'));
            } else {
                list = list.filter(r => r.name.startsWith(`[${selectedCategory}]`));
            }
        }

        if (search) {
            const q = search.toLowerCase();
            list = list.filter(r =>
                r.name.toLowerCase().includes(q) ||
                r.description?.toLowerCase().includes(q) ||
                r.author?.toLowerCase().includes(q)
            );
        }

        list.sort((a, b) => {
            switch (sortBy) {
                case 'status': return a.status.localeCompare(b.status);
                case 'author': return (a.author || 'zzz').localeCompare(b.author || 'zzz');
                default: return a.name.localeCompare(b.name);
            }
        });

        return list;
    }, [resources, filter, search, sortBy, selectedCategory]);

    // Stats
    const stats = useMemo(() => {
        if (!resources) return { total: 0, started: 0, stopped: 0, unknown: 0 };
        const list = resources as Resource[];
        return {
            total: list.length,
            started: list.filter(r => r.status === 'started').length,
            stopped: list.filter(r => r.status === 'stopped').length,
            unknown: list.filter(r => r.status === 'unknown').length,
        };
    }, [resources]);

    const toggleBulk = (name: string) => {
        setBulkSelected(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name); else next.add(name);
            return next;
        });
    };

    const selectAll = () => {
        if (bulkSelected.size === filtered.length) {
            setBulkSelected(new Set());
        } else {
            setBulkSelected(new Set(filtered.map(r => r.name)));
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text">Resources</h2>
                        <p className="text-xs text-muted">{stats.total} resources detected</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-muted hover:text-text border border-border hover:border-primary/30 text-sm transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    {bulkSelected.size > 0 && (
                        <button
                            onClick={() => setShowBulkActions(!showBulkActions)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-sm transition"
                        >
                            <Zap className="w-4 h-4" />
                            Bulk ({bulkSelected.size})
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Total', value: stats.total, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Running', value: stats.started, icon: Play, color: 'text-success', bg: 'bg-success/10' },
                    { label: 'Stopped', value: stats.stopped, icon: Square, color: 'text-danger', bg: 'bg-danger/10' },
                    { label: 'Unknown', value: stats.unknown, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
                ].map(s => (
                    <div key={s.label} className="glass-card p-4 flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.bg)}>
                            <s.icon className={cn('w-5 h-5', s.color)} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-text">{s.value}</p>
                            <p className="text-xs text-muted">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search resources..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-border text-text text-sm placeholder:text-muted/50 focus:border-primary/50 focus:outline-none transition"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex items-center rounded-xl bg-white/5 border border-border p-0.5">
                        {(['all', 'started', 'stopped', 'unknown'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    'px-3 py-2 rounded-lg text-xs font-medium transition capitalize',
                                    filter === f ? 'bg-primary/20 text-primary' : 'text-muted hover:text-text'
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-border text-muted text-xs hover:text-text transition">
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            Sort: {sortBy}
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-card border border-border shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                            {(['name', 'status', 'author'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSortBy(s)}
                                    className={cn(
                                        'w-full text-left px-4 py-2.5 text-xs first:rounded-t-xl last:rounded-b-xl transition capitalize',
                                        sortBy === s ? 'bg-primary/10 text-primary' : 'text-muted hover:text-text hover:bg-white/5'
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center rounded-xl bg-white/5 border border-border p-0.5">
                        <button onClick={() => setView('grid')} className={cn('p-2 rounded-lg transition', view === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted hover:text-text')}>
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setView('list')} className={cn('p-2 rounded-lg transition', view === 'list' ? 'bg-primary/20 text-primary' : 'text-muted hover:text-text')}>
                            <LayoutList className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Bulk Select All */}
                    <button
                        onClick={selectAll}
                        className="px-3 py-2.5 rounded-xl bg-white/5 border border-border text-muted hover:text-text text-xs transition"
                    >
                        {bulkSelected.size === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
                    </button>
                </div>

                {/* Category chips */}
                {categories.length > 1 && (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Filter className="w-3.5 h-3.5 text-muted" />
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={cn(
                                'px-3 py-1.5 rounded-full text-xs font-medium transition border',
                                !selectedCategory ? 'bg-primary/15 text-primary border-primary/20' : 'bg-white/5 text-muted border-border hover:text-text'
                            )}
                        >
                            All
                        </button>
                        {categories.map(c => (
                            <button
                                key={c.name}
                                onClick={() => setSelectedCategory(selectedCategory === c.name ? null : c.name)}
                                className={cn(
                                    'px-3 py-1.5 rounded-full text-xs font-medium transition border',
                                    selectedCategory === c.name ? 'bg-primary/15 text-primary border-primary/20' : 'bg-white/5 text-muted border-border hover:text-text'
                                )}
                            >
                                {c.name === 'ungrouped' ? 'Root' : `[${c.name}]`}
                                <span className="ml-1 opacity-60">{c.count}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {showBulkActions && bulkSelected.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass-card p-4 flex items-center justify-between"
                    >
                        <span className="text-sm text-text">{bulkSelected.size} resources selected</span>
                        <div className="flex gap-2">
                            <button onClick={() => doBulkAction('start')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-success/10 text-success border border-success/20 text-xs font-medium">
                                <Play className="w-3.5 h-3.5" /> Start All
                            </button>
                            <button onClick={() => doBulkAction('stop')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-danger/10 text-danger border border-danger/20 text-xs font-medium">
                                <Square className="w-3.5 h-3.5" /> Stop All
                            </button>
                            <button onClick={() => doBulkAction('restart')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-warning/10 text-warning border border-warning/20 text-xs font-medium">
                                <RotateCcw className="w-3.5 h-3.5" /> Restart All
                            </button>
                            <button onClick={() => { setBulkSelected(new Set()); setShowBulkActions(false); }} className="px-3 py-2 rounded-xl bg-white/5 text-muted text-xs">
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filtered.length === 0 && (
                <div className="glass-card p-16 text-center">
                    <FolderOpen className="w-12 h-12 text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text mb-2">No Resources Found</h3>
                    <p className="text-sm text-muted">
                        {search || filter !== 'all' ? 'Try adjusting your search or filters.' : 'No resources detected in your server directory.'}
                    </p>
                </div>
            )}

            {/* Grid View */}
            {!isLoading && filtered.length > 0 && view === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((r, i) => {
                            const st = getStatus(r.status);
                            const isActioning = actioningResource === r.name;
                            const isSelected = bulkSelected.has(r.name);
                            const shortName = r.name.includes('/') ? r.name.split('/').pop()! : r.name;

                            return (
                                <motion.div
                                    key={r.name}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.02, type: 'spring' as const, stiffness: 300, damping: 25 }}
                                    onClick={() => toggleBulk(r.name)}
                                    className={cn(
                                        'glass-card p-4 cursor-pointer group relative overflow-hidden transition-all',
                                        isSelected && 'ring-2 ring-primary/40 border-primary/30'
                                    )}
                                >
                                    {/* Selected indicator */}
                                    {isSelected && (
                                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                        </div>
                                    )}

                                    {/* Status dot + Name */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', r.status === 'started' ? 'bg-success' : r.status === 'stopped' ? 'bg-danger' : 'bg-muted')} />
                                            <h4 className="text-sm font-semibold text-text truncate" title={r.name}>{shortName}</h4>
                                        </div>
                                        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ml-2', st.bg, st.color)}>
                                            {st.label}
                                        </span>
                                    </div>

                                    {/* Category */}
                                    {r.name.includes('/') && (
                                        <p className="text-[10px] text-muted/60 mb-2 font-mono truncate">{r.name}</p>
                                    )}

                                    {/* Description */}
                                    <p className="text-xs text-muted line-clamp-2 mb-3 min-h-[2rem]">
                                        {r.description || 'No description available'}
                                    </p>

                                    {/* Meta */}
                                    <div className="flex items-center gap-3 text-[10px] text-muted/60 mb-3">
                                        {r.version && (
                                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{r.version}</span>
                                        )}
                                        {r.author && (
                                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.author}</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                        {r.status !== 'started' && (
                                            <button
                                                onClick={() => doAction(r.name, 'start')}
                                                disabled={isActioning}
                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-success/10 text-success text-[11px] font-medium hover:bg-success/20 transition disabled:opacity-50"
                                            >
                                                {isActioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                                Start
                                            </button>
                                        )}
                                        {r.status === 'started' && (
                                            <button
                                                onClick={() => doAction(r.name, 'stop')}
                                                disabled={isActioning}
                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-danger/10 text-danger text-[11px] font-medium hover:bg-danger/20 transition disabled:opacity-50"
                                            >
                                                {isActioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
                                                Stop
                                            </button>
                                        )}
                                        <button
                                            onClick={() => doAction(r.name, 'restart')}
                                            disabled={isActioning}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-warning/10 text-warning text-[11px] font-medium hover:bg-warning/20 transition disabled:opacity-50"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            Restart
                                        </button>
                                        <button
                                            onClick={() => doAction(r.name, 'ensure')}
                                            disabled={isActioning}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition disabled:opacity-50"
                                        >
                                            <Shield className="w-3 h-3" />
                                            Ensure
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* List View */}
            {!isLoading && filtered.length > 0 && view === 'list' && (
                <div className="glass-card overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-[auto_1fr_120px_120px_120px_180px] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted">
                        <div className="w-5" />
                        <div>Resource</div>
                        <div>Status</div>
                        <div>Version</div>
                        <div>Author</div>
                        <div className="text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-border/50">
                        {filtered.map((r) => {
                            const st = getStatus(r.status);
                            const isActioning = actioningResource === r.name;
                            const isSelected = bulkSelected.has(r.name);
                            const shortName = r.name.includes('/') ? r.name.split('/').pop()! : r.name;

                            return (
                                <motion.div
                                    key={r.name}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => toggleBulk(r.name)}
                                    className={cn(
                                        'grid grid-cols-[auto_1fr_120px_120px_120px_180px] gap-4 px-5 py-3 items-center hover:bg-white/[0.02] cursor-pointer transition',
                                        isSelected && 'bg-primary/5'
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleBulk(r.name)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 rounded border-border accent-primary"
                                    />

                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text truncate">{shortName}</p>
                                        {r.description && <p className="text-xs text-muted truncate">{r.description}</p>}
                                        {r.name.includes('/') && <p className="text-[10px] text-muted/40 font-mono truncate">{r.name}</p>}
                                    </div>

                                    <div>
                                        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border', st.bg, st.color)}>
                                            <st.icon className="w-3 h-3" />
                                            {st.label}
                                        </span>
                                    </div>

                                    <div className="text-xs text-muted font-mono">{r.version || '—'}</div>
                                    <div className="text-xs text-muted">{r.author || '—'}</div>

                                    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                                        {r.status !== 'started' && (
                                            <button onClick={() => doAction(r.name, 'start')} disabled={isActioning}
                                                className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition disabled:opacity-50" title="Start">
                                                {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                            </button>
                                        )}
                                        {r.status === 'started' && (
                                            <button onClick={() => doAction(r.name, 'stop')} disabled={isActioning}
                                                className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition disabled:opacity-50" title="Stop">
                                                {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                                            </button>
                                        )}
                                        <button onClick={() => doAction(r.name, 'restart')} disabled={isActioning}
                                            className="p-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition disabled:opacity-50" title="Restart">
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => doAction(r.name, 'ensure')} disabled={isActioning}
                                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition disabled:opacity-50" title="Ensure">
                                            <Shield className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Results count */}
            {!isLoading && filtered.length > 0 && (
                <div className="text-xs text-muted text-center">
                    Showing {filtered.length} of {stats.total} resources
                </div>
            )}
        </motion.div>
    );
}
