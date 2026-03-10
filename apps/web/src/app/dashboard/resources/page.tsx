'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { resourcesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import {
    Loader2,
    Package,
    Play,
    RefreshCw,
    RotateCcw,
    Search,
    Square,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Resource {
    name: string;
    state: string;
    description?: string;
    version?: string;
    author?: string;
}

export default function ResourcesPage() {
    const { accessToken } = useAuthStore();
    const [resources, setResources] = useState<Resource[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState<string | null>(null);
    const token = accessToken || '';

    const fetchResources = useCallback(async () => {
        if (!token) return;
        try {
            const res = await resourcesApi.list(token);
            setResources(res as Resource[]);
        } catch { }
        setLoading(false);
    }, [token]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    const doAction = async (name: string, action: 'start' | 'stop' | 'restart') => {
        setActioning(`${name}-${action}`);
        try {
            await resourcesApi.action(token, name, action);
            setTimeout(fetchResources, 1500);
        } catch { }
        setActioning(null);
    };

    const filtered = resources.filter((r) =>
        r.name.toLowerCase().includes(filter.toLowerCase()),
    );

    const started = resources.filter((r) => r.state === 'started').length;
    const stopped = resources.filter((r) => r.state === 'stopped').length;

    const stateVariant = (state: string) => {
        if (state === 'started') return 'success' as const;
        if (state === 'stopped') return 'danger' as const;
        return 'warning' as const;
    };

    const stateLabel = (state: string) => {
        if (state === 'started') return 'يعمل';
        if (state === 'stopped') return 'متوقف';
        return state;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Package className="h-5 w-5 text-[var(--accent-primary)]" />
                        الريسورسات
                    </h2>
                    <div className="flex gap-2 mt-1">
                        <Badge variant="success">{started} يعمل</Badge>
                        <Badge variant="danger">{stopped} متوقف</Badge>
                        <Badge variant="outline">{resources.length} إجمالي</Badge>
                    </div>
                </div>
                <Button size="sm" variant="outline" onClick={fetchResources}>
                    <RefreshCw className="h-4 w-4" />
                    تحديث
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <Input
                    placeholder="بحث عن ريسورس..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pr-10"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
                </div>
            ) : (
                <div className="grid gap-2">
                    {filtered.map((res, i) => (
                        <motion.div
                            key={res.name}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                        >
                            <Card className="glass hover:border-[var(--border-hover)] transition-all">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${res.state === 'started' ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'
                                            }`} />
                                        <div>
                                            <div className="font-medium font-mono text-sm" dir="ltr">{res.name}</div>
                                            {res.author && (
                                                <div className="text-xs text-[var(--text-muted)]">{res.author}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={stateVariant(res.state)}>{stateLabel(res.state)}</Badge>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() => doAction(res.name, res.state === 'started' ? 'stop' : 'start')}
                                            disabled={actioning === `${res.name}-start` || actioning === `${res.name}-stop`}
                                        >
                                            {res.state === 'started' ? (
                                                <Square className="h-3.5 w-3.5" />
                                            ) : (
                                                <Play className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() => doAction(res.name, 'restart')}
                                            disabled={actioning === `${res.name}-restart`}
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
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
