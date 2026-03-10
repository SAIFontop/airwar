'use client';

import { Badge, Button, Card, Input, Skeleton, Switch } from '@/components/ui';
import { automationApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Bot, Clock, Plus, RefreshCw, Trash2, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AutomationRule {
    id: string;
    name: string;
    type: string;
    enabled: boolean;
    schedule?: string;
    action?: string;
    createdAt: string;
}

export default function AutomationPage() {
    const token = useAuthStore((s) => s.accessToken)!;
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    // New rule form
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('restart');
    const [newSchedule, setNewSchedule] = useState('0 4 * * *');
    const [creating, setCreating] = useState(false);

    const fetchRules = async () => {
        try {
            const res = await automationApi.list(token);
            setRules(res as AutomationRule[]);
        } catch { }
        setLoading(false);
    };

    useEffect(() => {
        fetchRules();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const createRule = async () => {
        setCreating(true);
        try {
            await automationApi.create(token, {
                name: newName,
                type: newType,
                schedule: newSchedule,
                enabled: true,
            });
            setNewName('');
            setShowForm(false);
            await fetchRules();
        } catch { }
        setCreating(false);
    };

    const toggleRule = async (rule: AutomationRule) => {
        try {
            await automationApi.update(token, rule.id, { ...rule, enabled: !rule.enabled });
            await fetchRules();
        } catch { }
    };

    const deleteRule = async (id: string) => {
        setDeleting(id);
        try {
            await automationApi.remove(token, id);
            await fetchRules();
        } catch { }
        setDeleting(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-text-primary">Automation</h1>
                    <p className="text-sm text-text-secondary mt-0.5">Scheduled tasks and automatic actions</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setLoading(true); fetchRules(); }}>
                        <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" onClick={() => setShowForm(!showForm)}>
                        <Plus className="h-3.5 w-3.5" /> New Rule
                    </Button>
                </div>
            </div>

            {showForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <Card>
                        <h3 className="text-sm font-semibold text-text-primary mb-4">Create Automation Rule</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">Name</label>
                                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Daily restart" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">Type</label>
                                <select
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value)}
                                    className="flex h-10 w-full rounded-[var(--radius-md)] border border-border-primary bg-bg-input px-3 py-2 text-sm text-text-primary"
                                >
                                    <option value="restart">Server Restart</option>
                                    <option value="backup">Backup</option>
                                    <option value="command">Run Command</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">Cron Schedule</label>
                                <Input value={newSchedule} onChange={(e) => setNewSchedule(e.target.value)} placeholder="0 4 * * *" className="font-mono" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button size="sm" onClick={createRule} loading={creating} disabled={!newName.trim()}>Create</Button>
                        </div>
                    </Card>
                </motion.div>
            )}

            {loading ? (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
            ) : rules.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12">
                    <Bot className="h-10 w-10 text-text-muted mb-3" />
                    <p className="text-sm text-text-secondary">No automation rules configured</p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {rules.map((rule, i) => (
                        <motion.div
                            key={rule.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card className="flex items-center justify-between hover:border-border-hover transition-colors">
                                <div className="flex items-center gap-4">
                                    <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule)} />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-text-primary">{rule.name}</p>
                                            <Badge variant={rule.enabled ? 'success' : 'default'} size="sm">
                                                {rule.enabled ? 'Active' : 'Disabled'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1 text-xs text-text-muted">
                                                <Zap className="h-3 w-3" /> {rule.type}
                                            </span>
                                            {rule.schedule && (
                                                <span className="flex items-center gap-1 text-xs text-text-muted font-mono">
                                                    <Clock className="h-3 w-3" /> {rule.schedule}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteRule(rule.id)}
                                    loading={deleting === rule.id}
                                    className="text-danger hover:text-danger hover:bg-danger-muted"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
