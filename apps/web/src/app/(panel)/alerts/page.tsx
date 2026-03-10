'use client';

import { useWsStore } from '@/lib/store';
import { cn, formatTimeAgo } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AlertTriangle, Bell, CheckCircle2, Clock, XCircle } from 'lucide-react';

/**
 * Alerts page — shows real-time alerts from WebSocket (server crash, high CPU, etc.).
 * These are transient alerts stored in WS memory, not persisted in the API.
 */
export default function AlertsPage() {
    const serverStatus = useWsStore((s) => s.serverStatus);
    const latestMetrics = useWsStore((s) => s.latestMetrics);

    // Build alerts from current state
    const alerts: { id: string; level: 'info' | 'warning' | 'danger'; title: string; message: string; time: string }[] = [];

    if (serverStatus === 'crashed' || serverStatus === 'offline') {
        alerts.push({
            id: 'server-offline',
            level: 'danger',
            title: 'Server Offline',
            message: `Server status: ${serverStatus}`,
            time: new Date().toISOString(),
        });
    }

    if (latestMetrics?.cpuPercent && Number(latestMetrics.cpuPercent) > 90) {
        alerts.push({
            id: 'high-cpu',
            level: 'warning',
            title: 'High CPU Usage',
            message: `CPU at ${Math.round(Number(latestMetrics.cpuPercent))}%`,
            time: new Date().toISOString(),
        });
    }

    if (latestMetrics?.memoryTotalMb && latestMetrics?.memoryUsedMb) {
        const memPercent = (Number(latestMetrics.memoryUsedMb) / Number(latestMetrics.memoryTotalMb)) * 100;
        if (memPercent > 90) {
            alerts.push({
                id: 'high-memory',
                level: 'warning',
                title: 'High Memory Usage',
                message: `Memory at ${Math.round(memPercent)}%`,
                time: new Date().toISOString(),
            });
        }
    }

    if (latestMetrics?.diskTotalGb && latestMetrics?.diskUsedGb) {
        const diskPercent = (Number(latestMetrics.diskUsedGb) / Number(latestMetrics.diskTotalGb)) * 100;
        if (diskPercent > 90) {
            alerts.push({
                id: 'high-disk',
                level: 'danger',
                title: 'Disk Almost Full',
                message: `Disk at ${Math.round(diskPercent)}%`,
                time: new Date().toISOString(),
            });
        }
    }

    const levelIcon = (level: string) => {
        if (level === 'danger') return <XCircle className="w-5 h-5 text-danger" />;
        if (level === 'warning') return <AlertTriangle className="w-5 h-5 text-warning" />;
        return <CheckCircle2 className="w-5 h-5 text-success" />;
    };

    const levelClass = (level: string) => {
        if (level === 'danger') return 'border-danger/30 bg-danger/5';
        if (level === 'warning') return 'border-warning/30 bg-warning/5';
        return 'border-success/30 bg-success/5';
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-text">Alerts</h2>
                {alerts.length > 0 && (
                    <span className="bg-danger/15 text-danger text-xs font-medium px-2.5 py-1 rounded-full">
                        {alerts.length} active
                    </span>
                )}
            </div>

            {alerts.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success/30" />
                    <h3 className="text-lg font-semibold text-text mb-2">All Clear</h3>
                    <p className="text-muted text-sm">No active alerts. Your server is running smoothly.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {alerts.map((alert, i) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn('glass-card p-5 border', levelClass(alert.level))}
                        >
                            <div className="flex items-start gap-3">
                                {levelIcon(alert.level)}
                                <div className="flex-1">
                                    <p className="font-semibold text-text">{alert.title}</p>
                                    <p className="text-sm text-muted mt-0.5">{alert.message}</p>
                                    <p className="text-xs text-muted mt-2 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {formatTimeAgo(alert.time)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
