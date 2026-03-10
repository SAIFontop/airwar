'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { metricsApi, playersApi, serverApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    Clock,
    Cpu,
    HardDrive,
    Loader2,
    MemoryStick,
    Network,
    Play,
    RotateCcw,
    Server,
    Square,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Metrics {
    cpu: { usage: number; cores: number };
    memory: { total: number; used: number; percent: number };
    disk: { total: number; used: number; percent: number };
    network: { rx: number; tx: number };
    uptime: number;
}

interface ServerStatus {
    status: string;
    info?: { players?: number; maxPlayers?: number; hostname?: string };
}

export default function DashboardOverview() {
    const { accessToken } = useAuthStore();
    const [status, setStatus] = useState<ServerStatus | null>(null);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [playerCount, setPlayerCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const token = accessToken || '';

    const fetchAll = useCallback(async () => {
        if (!token) return;
        try {
            const [s, m, p] = await Promise.all([
                serverApi.status(token).catch(() => null),
                metricsApi.get(token).catch(() => null),
                playersApi.list(token).catch(() => []),
            ]);
            if (s) setStatus(s as ServerStatus);
            if (m) setMetrics(m as Metrics);
            setPlayerCount(Array.isArray(p) ? p.length : 0);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAll();
        const iv = setInterval(fetchAll, 5000);
        return () => clearInterval(iv);
    }, [fetchAll]);

    const doAction = async (action: 'start' | 'stop' | 'restart') => {
        setActionLoading(action);
        try {
            if (action === 'start') await serverApi.start(token);
            else if (action === 'stop') await serverApi.stop(token);
            else await serverApi.restart(token);
            setTimeout(fetchAll, 2000);
        } catch { }
        setActionLoading(null);
    };

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        return (bytes / 1073741824).toFixed(1) + ' GB';
    };

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (d > 0) return `${d}ي ${h}س`;
        if (h > 0) return `${h}س ${m}د`;
        return `${m}د`;
    };

    const isOnline = status?.status === 'running';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Server status header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={`glass ${isOnline ? 'border-[var(--success)]/30' : 'border-[var(--danger)]/30'}`}>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOnline ? 'bg-[var(--success)]/10' : 'bg-[var(--danger)]/10'
                                    }`}>
                                    <Server className={`h-6 w-6 ${isOnline ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold">
                                            {status?.info?.hostname || 'السيرفر'}
                                        </h2>
                                        <Badge variant={isOnline ? 'success' : 'danger'}>
                                            {isOnline ? 'يعمل' : 'متوقف'}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-[var(--text-muted)] flex items-center gap-3 mt-0.5">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3.5 w-3.5" />
                                            {playerCount} لاعب
                                        </span>
                                        {metrics?.uptime && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {formatUptime(metrics.uptime)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => doAction('start')}
                                    disabled={!!actionLoading || isOnline}
                                >
                                    {actionLoading === 'start' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                    تشغيل
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => doAction('stop')}
                                    disabled={!!actionLoading || !isOnline}
                                >
                                    {actionLoading === 'stop' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                                    إيقاف
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => doAction('restart')}
                                    disabled={!!actionLoading || !isOnline}
                                >
                                    {actionLoading === 'restart' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                    إعادة تشغيل
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CPU */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="glass hover:border-[var(--border-hover)] transition-all">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                                <Cpu className="h-4 w-4 text-[var(--info)]" />
                                المعالج
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics?.cpu.usage.toFixed(1) || '0'}%</div>
                            <Progress value={metrics?.cpu.usage || 0} className="mt-2" />
                            <div className="text-xs text-[var(--text-muted)] mt-1">{metrics?.cpu.cores || 0} أنوية</div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Memory */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Card className="glass hover:border-[var(--border-hover)] transition-all">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                                <MemoryStick className="h-4 w-4 text-[var(--accent-primary)]" />
                                الذاكرة
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics?.memory.percent.toFixed(1) || '0'}%</div>
                            <Progress value={metrics?.memory.percent || 0} className="mt-2" />
                            <div className="text-xs text-[var(--text-muted)] mt-1">
                                {formatBytes((metrics?.memory.used || 0) * 1024)} / {formatBytes((metrics?.memory.total || 0) * 1024)}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Disk */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="glass hover:border-[var(--border-hover)] transition-all">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                                <HardDrive className="h-4 w-4 text-[var(--warning)]" />
                                القرص
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics?.disk.percent.toFixed(1) || '0'}%</div>
                            <Progress value={metrics?.disk.percent || 0} className="mt-2" />
                            <div className="text-xs text-[var(--text-muted)] mt-1">
                                {formatBytes((metrics?.disk.used || 0) * 1024)} / {formatBytes((metrics?.disk.total || 0) * 1024)}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Network */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <Card className="glass hover:border-[var(--border-hover)] transition-all">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                                <Network className="h-4 w-4 text-[var(--success)]" />
                                الشبكة
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div>
                                    <div className="text-xs text-[var(--text-muted)]">↓ استقبال</div>
                                    <div className="text-lg font-bold">{formatBytes(metrics?.network.rx || 0)}/s</div>
                                </div>
                                <div>
                                    <div className="text-xs text-[var(--text-muted)]">↑ إرسال</div>
                                    <div className="text-lg font-bold">{formatBytes(metrics?.network.tx || 0)}/s</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Quick info cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="h-4 w-4 text-[var(--accent-primary)]" />
                            اللاعبين المتصلين
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{playerCount}</div>
                        <div className="text-xs text-[var(--text-muted)]">
                            الحد الأقصى: {status?.info?.maxPlayers || 32}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Activity className="h-4 w-4 text-[var(--success)]" />
                            حالة النظام
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--text-muted)]">API</span>
                                <Badge variant="success">يعمل</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--text-muted)]">FXServer</span>
                                <Badge variant={isOnline ? 'success' : 'danger'}>{isOnline ? 'يعمل' : 'متوقف'}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--text-muted)]">panel_bridge</span>
                                <Badge variant={isOnline ? 'success' : 'outline'}>{isOnline ? 'متصل' : 'غير متصل'}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
                            تنبيهات
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-[var(--text-muted)]">
                            {(metrics?.cpu.usage || 0) > 80 ? (
                                <div className="text-[var(--warning)]">⚠ استخدام المعالج مرتفع</div>
                            ) : (metrics?.memory.percent || 0) > 85 ? (
                                <div className="text-[var(--warning)]">⚠ الذاكرة ممتلئة تقريباً</div>
                            ) : (
                                <div className="text-[var(--success)]">✓ لا توجد تنبيهات</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
