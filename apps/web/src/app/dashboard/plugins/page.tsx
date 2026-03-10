'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { pluginsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Play, Puzzle, RefreshCw, Square } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface PluginInfo {
    id: string;
    manifest: {
        name: string;
        version: string;
        description?: string;
        author?: string;
        trusted?: boolean;
    };
    status: 'loaded' | 'running' | 'stopped' | 'error';
    error?: string;
    loadedAt?: string;
}

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'default' }> = {
    loaded: { label: 'محمّل', variant: 'info' },
    running: { label: 'يعمل', variant: 'success' },
    stopped: { label: 'متوقف', variant: 'default' },
    error: { label: 'خطأ', variant: 'danger' },
};

export default function PluginsPage() {
    const { accessToken } = useAuthStore();
    const [plugins, setPlugins] = useState<PluginInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchPlugins = useCallback(async () => {
        if (!accessToken) return;
        try {
            const res = await pluginsApi.list(accessToken);
            setPlugins(res.data as PluginInfo[]);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchPlugins();
    }, [fetchPlugins]);

    const handleDiscover = async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const res = await pluginsApi.discover(accessToken);
            setPlugins(res.data as PluginInfo[]);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async (id: string) => {
        if (!accessToken) return;
        setActionLoading(id);
        try {
            await pluginsApi.start(id, accessToken);
            await fetchPlugins();
        } catch {
            /* ignore */
        } finally {
            setActionLoading(null);
        }
    };

    const handleStop = async (id: string) => {
        if (!accessToken) return;
        setActionLoading(id);
        try {
            await pluginsApi.stop(id, accessToken);
            await fetchPlugins();
        } catch {
            /* ignore */
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">الإضافات</h1>
                    <p className="text-[var(--text-muted)] mt-1">
                        إدارة إضافات لوحة التحكم
                    </p>
                </div>
                <Button onClick={handleDiscover} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                    اكتشاف الإضافات
                </Button>
            </div>

            {/* Info card */}
            <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Puzzle className="h-5 w-5 text-[var(--accent-primary)] mt-0.5" />
                        <div>
                            <p className="text-sm text-[var(--text-secondary)]">
                                ضع مجلد الإضافة داخل <code className="text-[var(--accent-primary)] bg-[var(--bg-tertiary)] px-1 rounded text-xs">~/.saifcontrol/plugins/</code> مع ملف <code className="text-[var(--accent-primary)] bg-[var(--bg-tertiary)] px-1 rounded text-xs">manifest.json</code> ثم اضغط &ldquo;اكتشاف الإضافات&rdquo;.
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                الإضافات غير الموثوقة تعمل في عملية معزولة (sandboxed).
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Plugins list */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : plugins.length === 0 ? (
                <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
                    <CardContent className="p-12 text-center">
                        <Puzzle className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-4" />
                        <p className="text-[var(--text-secondary)]">لا توجد إضافات مثبتة</p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                            أضف مجلد إضافة وأعد الاكتشاف
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {plugins.map((plugin, i) => {
                        const statusInfo = STATUS_MAP[plugin.status] || STATUS_MAP.stopped;
                        const isRunning = plugin.status === 'running';

                        return (
                            <motion.div
                                key={plugin.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="bg-[var(--bg-secondary)] border-[var(--border-primary)]">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isRunning ? 'bg-emerald-500/10' : 'bg-[var(--bg-tertiary)]'
                                                    }`}>
                                                    {isRunning ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                                    ) : plugin.status === 'error' ? (
                                                        <AlertCircle className="h-5 w-5 text-red-400" />
                                                    ) : (
                                                        <Puzzle className="h-5 w-5 text-[var(--text-muted)]" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-white font-medium">{plugin.manifest.name}</h3>
                                                        <span className="text-xs text-[var(--text-muted)]">v{plugin.manifest.version}</span>
                                                        {plugin.manifest.trusted && (
                                                            <Badge variant="success">موثوق</Badge>
                                                        )}
                                                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                                                    </div>
                                                    {plugin.manifest.description && (
                                                        <p className="text-sm text-[var(--text-secondary)] mt-0.5">{plugin.manifest.description}</p>
                                                    )}
                                                    {plugin.manifest.author && (
                                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">المطور: {plugin.manifest.author}</p>
                                                    )}
                                                    {plugin.error && (
                                                        <p className="text-xs text-red-400 mt-1">{plugin.error}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isRunning ? (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        disabled={actionLoading === plugin.id}
                                                        onClick={() => handleStop(plugin.id)}
                                                    >
                                                        <Square className="h-3.5 w-3.5 ml-1.5" />
                                                        إيقاف
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        disabled={actionLoading === plugin.id}
                                                        onClick={() => handleStart(plugin.id)}
                                                    >
                                                        <Play className="h-3.5 w-3.5 ml-1.5" />
                                                        تشغيل
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
