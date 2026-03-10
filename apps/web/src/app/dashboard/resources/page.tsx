'use client';

import { Badge, Button, Card, Input, Skeleton } from '@/components/ui';
import { resourcesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Play, Puzzle, RefreshCw, RotateCcw, Search, Square } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Resource {
    name: string;
    status: string;
}

export default function ResourcesPage() {
    const token = useAuthStore((s) => s.accessToken)!;
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchResources = async () => {
        try {
            const res = await resourcesApi.list(token);
            setResources(res as Resource[]);
        } catch { }
        setLoading(false);
    };

    useEffect(() => {
        fetchResources();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const handleAction = async (name: string, action: 'start' | 'stop' | 'restart') => {
        setActionLoading(`${name}-${action}`);
        try {
            await resourcesApi.action(token, name, action);
            await fetchResources();
        } catch { }
        setActionLoading(null);
    };

    const filtered = resources.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase())
    );

    const running = resources.filter((r) => r.status === 'started' || r.status === 'running').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-text-primary">Resources</h1>
                    <p className="text-sm text-text-secondary mt-0.5">{running} running / {resources.length} total</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => { setLoading(true); fetchResources(); }}>
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
            </div>

            <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources..."
                icon={<Search className="h-4 w-4" />}
                className="max-w-sm"
            />

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
            ) : filtered.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12">
                    <Puzzle className="h-10 w-10 text-text-muted mb-3" />
                    <p className="text-sm text-text-secondary">{search ? 'No matching resources' : 'No resources loaded'}</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map((res, i) => {
                        const isRunning = res.status === 'started' || res.status === 'running';
                        return (
                            <motion.div
                                key={res.name}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.02 }}
                            >
                                <Card className="flex items-center justify-between hover:border-border-hover transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`h-2 w-2 rounded-full shrink-0 ${isRunning ? 'bg-success' : 'bg-text-muted'}`} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-text-primary truncate font-mono">{res.name}</p>
                                            <Badge variant={isRunning ? 'success' : 'default'} size="sm">{res.status}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {!isRunning && (
                                            <Button variant="ghost" size="icon" onClick={() => handleAction(res.name, 'start')} loading={actionLoading === `${res.name}-start`}>
                                                <Play className="h-3.5 w-3.5 text-success" />
                                            </Button>
                                        )}
                                        {isRunning && (
                                            <>
                                                <Button variant="ghost" size="icon" onClick={() => handleAction(res.name, 'restart')} loading={actionLoading === `${res.name}-restart`}>
                                                    <RotateCcw className="h-3.5 w-3.5 text-accent" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleAction(res.name, 'stop')} loading={actionLoading === `${res.name}-stop`}>
                                                    <Square className="h-3.5 w-3.5 text-danger" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
