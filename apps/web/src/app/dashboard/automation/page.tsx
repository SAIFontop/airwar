'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { automationApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import {
    Clock,
    Loader2,
    Plus,
    RefreshCw,
    Trash2,
    Zap
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface AutomationRule {
    id: string;
    name: string;
    enabled: boolean;
    trigger: { type: string;[key: string]: unknown };
    conditions: unknown[];
    actions: { type: string;[key: string]: unknown }[];
}

export default function AutomationPage() {
    const { accessToken } = useAuthStore();
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const token = accessToken || '';

    const fetchRules = useCallback(async () => {
        if (!token) return;
        try {
            const res = await automationApi.list(token);
            setRules(res as AutomationRule[]);
        } catch { }
        setLoading(false);
    }, [token]);

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    const toggleRule = async (rule: AutomationRule) => {
        try {
            await automationApi.update(token, rule.id, { ...rule, enabled: !rule.enabled });
            setRules((prev) =>
                prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)),
            );
        } catch { }
    };

    const deleteRule = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه القاعدة؟')) return;
        try {
            await automationApi.remove(token, id);
            setRules((prev) => prev.filter((r) => r.id !== id));
        } catch { }
    };

    const triggerLabel = (type: string) => {
        const map: Record<string, string> = {
            cron: 'جدول زمني',
            cpuHigh: 'معالج مرتفع',
            memoryHigh: 'ذاكرة ممتلئة',
            crashDetected: 'اكتشاف كراش',
            logMatch: 'نمط في السجل',
            playerCountAbove: 'لاعبين فوق',
            playerCountBelow: 'لاعبين تحت',
        };
        return map[type] || type;
    };

    const actionLabel = (type: string) => {
        const map: Record<string, string> = {
            startServer: 'تشغيل',
            stopServer: 'إيقاف',
            restartServer: 'إعادة تشغيل',
            executeCommand: 'تنفيذ أمر',
            createBackup: 'نسخة احتياطية',
            sendAnnouncement: 'إعلان',
            delay: 'تأخير',
        };
        return map[type] || type;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[var(--accent-primary)]" />
                    قواعد الأتمتة
                    <Badge variant="outline">{rules.length}</Badge>
                </h2>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={fetchRules}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
                        <Plus className="h-4 w-4" />
                        قاعدة جديدة
                    </Button>
                </div>
            </div>

            {/* Quick create */}
            {showCreate && <QuickCreateRule token={token} onCreated={() => { setShowCreate(false); fetchRules(); }} />}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
                </div>
            ) : rules.length === 0 ? (
                <Card className="glass">
                    <CardContent className="text-center py-12 text-[var(--text-muted)]">
                        لا توجد قواعد أتمتة. أنشئ واحدة للبدء.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {rules.map((rule, i) => (
                        <motion.div
                            key={rule.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card className={`glass transition-all ${rule.enabled ? 'hover:border-[var(--border-hover)]' : 'opacity-60'
                                }`}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <button
                                                onClick={() => toggleRule(rule)}
                                                className={`w-10 h-6 rounded-full transition-all relative ${rule.enabled ? 'bg-[var(--success)]' : 'bg-[var(--bg-surface)]'
                                                    }`}
                                            >
                                                <div
                                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${rule.enabled ? 'left-1' : 'right-1'
                                                        }`}
                                                />
                                            </button>
                                            <div>
                                                <div className="font-medium">{rule.name}</div>
                                                <div className="flex gap-2 mt-1 flex-wrap">
                                                    <Badge variant="info">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {triggerLabel(rule.trigger.type)}
                                                    </Badge>
                                                    {rule.actions.map((a, j) => (
                                                        <Badge key={j} variant="outline">
                                                            {actionLabel(a.type)}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-[var(--danger)]"
                                            onClick={() => deleteRule(rule.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
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

// Quick create form
function QuickCreateRule({ token, onCreated }: { token: string; onCreated: () => void }) {
    const [name, setName] = useState('');
    const [triggerType, setTriggerType] = useState('cron');
    const [cron, setCron] = useState('0 */6 * * *');
    const [actionType, setActionType] = useState('restartServer');
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!name) return;
        setCreating(true);
        try {
            await automationApi.create(token, {
                name,
                enabled: true,
                trigger: triggerType === 'cron' ? { type: 'cron', expression: cron } : { type: triggerType },
                conditions: [],
                actions: [{ type: actionType }],
            });
            onCreated();
        } catch { }
        setCreating(false);
    };

    return (
        <Card className="glass border-[var(--accent-primary)]/30">
            <CardContent className="p-4 space-y-3">
                <Input placeholder="اسم القاعدة" value={name} onChange={(e) => setName(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-[var(--text-muted)] mb-1 block">نوع المحفز</label>
                        <select
                            value={triggerType}
                            onChange={(e) => setTriggerType(e.target.value)}
                            className="w-full h-10 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] px-3 text-sm"
                        >
                            <option value="cron">جدول زمني (Cron)</option>
                            <option value="cpuHigh">معالج مرتفع</option>
                            <option value="memoryHigh">ذاكرة ممتلئة</option>
                            <option value="crashDetected">اكتشاف كراش</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-muted)] mb-1 block">الإجراء</label>
                        <select
                            value={actionType}
                            onChange={(e) => setActionType(e.target.value)}
                            className="w-full h-10 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] px-3 text-sm"
                        >
                            <option value="restartServer">إعادة تشغيل</option>
                            <option value="startServer">تشغيل</option>
                            <option value="stopServer">إيقاف</option>
                            <option value="createBackup">نسخة احتياطية</option>
                        </select>
                    </div>
                </div>
                {triggerType === 'cron' && (
                    <Input
                        placeholder="0 */6 * * *"
                        value={cron}
                        onChange={(e) => setCron(e.target.value)}
                        dir="ltr"
                        className="font-mono"
                    />
                )}
                <Button onClick={handleCreate} disabled={creating || !name} className="w-full">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    إنشاء القاعدة
                </Button>
            </CardContent>
        </Card>
    );
}
