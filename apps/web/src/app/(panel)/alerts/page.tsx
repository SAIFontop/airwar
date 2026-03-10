'use client';

import { useAcknowledgeAlert, useAcknowledgeAllAlerts, useAlerts, useClearAlerts } from '@/lib/hooks';
import { useWsStore } from '@/lib/store';
import { cn, formatTimeAgo } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bell, Check, CheckCheck, CheckCircle2, Clock, Trash2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

type TabId = 'all' | 'active' | 'acknowledged';

export default function AlertsPage() {
    const { data: persistentAlerts, isLoading } = useAlerts();
    const acknowledgeAlert = useAcknowledgeAlert();
    const acknowledgeAll = useAcknowledgeAllAlerts();
    const clearAlerts = useClearAlerts();

    const serverStatus = useWsStore((s) => s.serverStatus);
    const latestMetrics = useWsStore((s) => s.latestMetrics);

    const [tab, setTab] = useState<TabId>('all');
    const [confirmClear, setConfirmClear] = useState(false);

    // Build live alerts from current state
    const liveAlerts = useMemo(() => {
        const alerts: { id: string; type: string; severity: string; title: string; message: string; acknowledged: boolean; createdAt: string }[] = [];

        if (serverStatus === 'crashed' || serverStatus === 'offline') {
            alerts.push({ id: 'live-server-offline', type: 'server', severity: 'critical', title: 'Server Offline', message: `Server status: ${serverStatus}`, acknowledged: false, createdAt: new Date().toISOString() });
        }
        if (latestMetrics?.cpuPercent && Number(latestMetrics.cpuPercent) > 90) {
            alerts.push({ id: 'live-high-cpu', type: 'metrics', severity: 'warning', title: 'High CPU Usage', message: `CPU at ${Math.round(Number(latestMetrics.cpuPercent))}%`, acknowledged: false, createdAt: new Date().toISOString() });
        }
        if (latestMetrics?.memoryTotalMb && latestMetrics?.memoryUsedMb) {
            const memPercent = (Number(latestMetrics.memoryUsedMb) / Number(latestMetrics.memoryTotalMb)) * 100;
            if (memPercent > 90) {
                alerts.push({ id: 'live-high-mem', type: 'metrics', severity: 'warning', title: 'High Memory Usage', message: `Memory at ${Math.round(memPercent)}%`, acknowledged: false, createdAt: new Date().toISOString() });
            }
        }
        if (latestMetrics?.diskTotalGb && latestMetrics?.diskUsedGb) {
            const diskPercent = (Number(latestMetrics.diskUsedGb) / Number(latestMetrics.diskTotalGb)) * 100;
            if (diskPercent > 90) {
                alerts.push({ id: 'live-high-disk', type: 'metrics', severity: 'critical', title: 'Disk Almost Full', message: `Disk at ${Math.round(diskPercent)}%`, acknowledged: false, createdAt: new Date().toISOString() });
            }
        }
        return alerts;
    }, [serverStatus, latestMetrics]);

    // Merge live + persistent (live alerts at top)
    const allAlerts = [...liveAlerts, ...(persistentAlerts || [])];
    const activeAlerts = allAlerts.filter(a => !a.acknowledged);
    const acknowledgedAlerts = allAlerts.filter(a => a.acknowledged);

    const displayedAlerts = tab === 'active' ? activeAlerts : tab === 'acknowledged' ? acknowledgedAlerts : allAlerts;

    const levelIcon = (severity: string) => {
        if (severity === 'critical') return <XCircle className="w-5 h-5 text-danger" />;
        if (severity === 'warning') return <AlertTriangle className="w-5 h-5 text-warning" />;
        return <CheckCircle2 className="w-5 h-5 text-success" />;
    };

    const levelClass = (severity: string, acknowledged: boolean) => {
        if (acknowledged) return 'border-border opacity-60';
        if (severity === 'critical') return 'border-danger/30 bg-danger/5';
        if (severity === 'warning') return 'border-warning/30 bg-warning/5';
        return 'border-success/30 bg-success/5';
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-text">Alerts</h2>
                    {activeAlerts.length > 0 && (
                        <span className="bg-danger/15 text-danger text-xs font-medium px-2.5 py-1 rounded-full animate-pulse">
                            {activeAlerts.length} active
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {activeAlerts.length > 0 && (
                        <button
                            onClick={() => acknowledgeAll.mutate()}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success/15 text-success hover:bg-success/25 text-sm font-medium transition"
                        >
                            <CheckCheck className="w-4 h-4" /> Acknowledge All
                        </button>
                    )}
                    {allAlerts.length > 0 && (
                        <button
                            onClick={() => setConfirmClear(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-muted hover:text-danger text-sm transition"
                        >
                            <Trash2 className="w-4 h-4" /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl bg-white/5 border border-border p-0.5 w-fit">
                {([
                    { id: 'all' as TabId, label: 'All', count: allAlerts.length },
                    { id: 'active' as TabId, label: 'Active', count: activeAlerts.length },
                    { id: 'acknowledged' as TabId, label: 'Acknowledged', count: acknowledgedAlerts.length },
                ]).map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
                            tab === t.id ? 'bg-primary/20 text-primary' : 'text-muted hover:text-text'
                        )}
                    >
                        {t.label}
                        <span className={cn('text-xs px-1.5 py-0.5 rounded-full', tab === t.id ? 'bg-primary/20' : 'bg-white/5')}>{t.count}</span>
                    </button>
                ))}
            </div>

            {/* Alert List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="glass-card p-5 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-white/10" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-white/10 rounded w-1/3" />
                                    <div className="h-3 bg-white/5 rounded w-2/3" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : displayedAlerts.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success/30" />
                    <h3 className="text-lg font-semibold text-text mb-2">All Clear</h3>
                    <p className="text-muted text-sm">
                        {tab === 'active' ? 'No active alerts.' : tab === 'acknowledged' ? 'No acknowledged alerts.' : 'No alerts. Your server is running smoothly.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {displayedAlerts.map((alert, i) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: i * 0.03 }}
                                className={cn('glass-card p-5 border group', levelClass(alert.severity, alert.acknowledged))}
                            >
                                <div className="flex items-start gap-3">
                                    {levelIcon(alert.severity)}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-text">{alert.title}</p>
                                            {alert.acknowledged && (
                                                <span className="text-xs bg-white/5 text-muted px-2 py-0.5 rounded-full">Acknowledged</span>
                                            )}
                                            {alert.id.startsWith('live-') && (
                                                <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full animate-pulse">Live</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted mt-0.5">{alert.message}</p>
                                        <p className="text-xs text-muted mt-2 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {formatTimeAgo(alert.createdAt)}
                                        </p>
                                    </div>
                                    {!alert.acknowledged && !alert.id.startsWith('live-') && (
                                        <button
                                            onClick={() => acknowledgeAlert.mutate(alert.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-muted hover:text-success hover:bg-success/10 transition"
                                            title="Acknowledge"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Clear Confirm Dialog */}
            {confirmClear && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmClear(false)}>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="glass-card p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-text">Clear All Alerts</h3>
                        <p className="text-sm text-muted">This will permanently delete all persistent alerts. Live alerts will remain.</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmClear(false)} className="px-4 py-2 rounded-xl bg-white/5 text-muted text-sm">Cancel</button>
                            <button onClick={() => { clearAlerts.mutate(); setConfirmClear(false); }} className="px-4 py-2 rounded-xl bg-danger text-white text-sm hover:bg-danger/80 transition">
                                Clear All
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
