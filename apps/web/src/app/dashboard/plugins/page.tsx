'use client';

import { Badge, Button, Card, Input, Skeleton } from '@/components/ui';
import { pluginsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Download, HardDrive, Play, RefreshCw, Search, Square } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Plugin {
    id: string;
    name: string;
    version?: string;
    status: string;
    description?: string;
}

export default function PluginsPage() {
    const token = useAuthStore((s) => s.accessToken)!;
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionId, setActionId] = useState<string | null>(null);
    const [discovering, setDiscovering] = useState(false);

    const fetchPlugins = async () => {
        try {
            const res = await pluginsApi.list(token);
            setPlugins((res.data ?? []) as Plugin[]);
        } catch { }
        setLoading(false);
    };

    useEffect(() => {
        fetchPlugins();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const handleStart = async (id: string) => {
        setActionId(id);
        try {
            await pluginsApi.start(id, token);
            await fetchPlugins();
        } catch { }
        setActionId(null);
    };

    const handleStop = async (id: string) => {
        setActionId(id);
        try {
            await pluginsApi.stop(id, token);
            await fetchPlugins();
        } catch { }
        setActionId(null);
    };

    const handleDiscover = async () => {
        setDiscovering(true);
        try {
            await pluginsApi.discover(token);
            await fetchPlugins();
        } catch { }
        setDiscovering(false);
    };

    const filtered = plugins.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-text-primary">Plugins</h1>
                    <p className="text-sm text-text-secondary mt-0.5">{plugins.length} installed plugins</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={handleDiscover} loading={discovering}>
                        <Download className="h-3.5 w-3.5" /> Discover
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => { setLoading(true); fetchPlugins(); }}>
                        <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plugins..."
                icon={<Search className="h-4 w-4" />}
                className="max-w-sm"
            />

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
            ) : filtered.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12">
                    <HardDrive className="h-10 w-10 text-text-muted mb-3" />
                    <p className="text-sm text-text-secondary">{search ? 'No matching plugins' : 'No plugins installed'}</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map((plugin, i) => {
                        const isRunning = plugin.status === 'running' || plugin.status === 'started';
                        return (
                            <motion.div
                                key={plugin.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <Card className="hover:border-border-hover transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-text-primary">{plugin.name}</p>
                                                {plugin.version && (
                                                    <Badge variant="default" size="sm">v{plugin.version}</Badge>
                                                )}
                                                <Badge variant={isRunning ? 'success' : 'default'} size="sm">
                                                    {plugin.status}
                                                </Badge>
                                            </div>
                                            {plugin.description && (
                                                <p className="text-xs text-text-muted mt-1 line-clamp-2">{plugin.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 ml-3 shrink-0">
                                            {isRunning ? (
                                                <Button variant="ghost" size="icon" onClick={() => handleStop(plugin.id)} loading={actionId === plugin.id}>
                                                    <Square className="h-3.5 w-3.5 text-danger" />
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" onClick={() => handleStart(plugin.id)} loading={actionId === plugin.id}>
                                                    <Play className="h-3.5 w-3.5 text-success" />
                                                </Button>
                                            )}
                                        </div>
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
