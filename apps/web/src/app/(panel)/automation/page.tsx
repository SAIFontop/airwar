'use client';

import { useAutomationRules, useDeleteRule, useUpsertRule } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Clock, Plus, Save, ToggleLeft, ToggleRight, Trash2, X, Zap } from 'lucide-react';
import { useState } from 'react';

const TRIGGER_TYPES = ['cron', 'server_start', 'server_stop', 'server_crash', 'player_join', 'player_leave', 'high_cpu', 'high_memory'];
const ACTION_TYPES = ['server_start', 'server_stop', 'server_restart', 'execute_command', 'create_backup', 'announce', 'delay', 'notify'];

interface RuleForm {
    id?: string;
    name: string;
    enabled: boolean;
    trigger: { type: string; value?: string };
    actions: { type: string; value?: string }[];
    conditions: { field: string; operator: string; value: string }[];
}

const emptyRule: RuleForm = {
    name: '',
    enabled: true,
    trigger: { type: 'cron', value: '' },
    actions: [{ type: 'server_restart' }],
    conditions: [],
};

export default function AutomationPage() {
    const { data: rules, isLoading } = useAutomationRules();
    const upsert = useUpsertRule();
    const deleteRule = useDeleteRule();
    const [editing, setEditing] = useState<RuleForm | null>(null);

    const handleSave = () => {
        if (!editing) return;
        upsert.mutate(editing as unknown as Record<string, unknown>, {
            onSuccess: () => setEditing(null),
        });
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-text">Automation Rules</h2>
                    <span className="bg-primary/15 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                        {(rules || []).length} rules
                    </span>
                </div>
                <button
                    onClick={() => setEditing({ ...emptyRule })}
                    className="btn-primary text-sm"
                >
                    <Plus className="w-4 h-4" /> New Rule
                </button>
            </div>

            {/* Rules List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="glass-card p-5 animate-pulse">
                            <div className="h-5 bg-white/10 rounded w-48 mb-3" />
                            <div className="h-3 bg-white/5 rounded w-32" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {(rules || []).map((rule: Record<string, unknown>) => (
                        <motion.div
                            key={String(rule.id)}
                            layout
                            className="glass-card p-5 group hover:border-primary/30 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn('w-2 h-2 rounded-full', rule.enabled ? 'bg-success status-online' : 'bg-muted')} />
                                    <div>
                                        <p className="font-medium text-text">{String(rule.name || 'Unnamed Rule')}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {String((rule.trigger as Record<string, unknown>)?.type || 'unknown')}
                                                {(rule.trigger as Record<string, unknown>)?.value ? `: ${String((rule.trigger as Record<string, unknown>).value)}` : null}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Activity className="w-3 h-3" />
                                                {Array.isArray(rule.actions) ? rule.actions.length : 0} actions
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        onClick={() => setEditing({
                                            id: String(rule.id),
                                            name: String(rule.name || ''),
                                            enabled: Boolean(rule.enabled),
                                            trigger: (rule.trigger as RuleForm['trigger']) || { type: 'cron' },
                                            actions: (rule.actions as RuleForm['actions']) || [],
                                            conditions: (rule.conditions as RuleForm['conditions']) || [],
                                        })}
                                        className="p-2 rounded-lg text-muted hover:text-text hover:bg-white/10 transition"
                                    >
                                        <Zap className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteRule.mutate(String(rule.id))}
                                        className="p-2 rounded-lg text-danger/60 hover:text-danger hover:bg-danger/10 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {(rules || []).length === 0 && (
                        <div className="text-center py-12 text-muted">
                            <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No automation rules configured</p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8" onClick={() => setEditing(null)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-card p-6 w-full max-w-lg mx-4 space-y-5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-text">{editing.id ? 'Edit' : 'New'} Rule</h3>
                                <button onClick={() => setEditing(null)} className="text-muted hover:text-text">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="text-sm font-medium text-muted block mb-2">Name</label>
                                <input
                                    value={editing.name}
                                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                    className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm"
                                    placeholder="Auto restart on crash"
                                />
                            </div>

                            {/* Enabled */}
                            <div className="flex items-center gap-3">
                                <button onClick={() => setEditing({ ...editing, enabled: !editing.enabled })}>
                                    {editing.enabled ? <ToggleRight className="w-6 h-6 text-success" /> : <ToggleLeft className="w-6 h-6 text-muted" />}
                                </button>
                                <span className="text-sm text-text">{editing.enabled ? 'Enabled' : 'Disabled'}</span>
                            </div>

                            {/* Trigger */}
                            <div>
                                <label className="text-sm font-medium text-muted block mb-2">Trigger</label>
                                <select
                                    value={editing.trigger.type}
                                    onChange={(e) => setEditing({ ...editing, trigger: { ...editing.trigger, type: e.target.value } })}
                                    className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm"
                                >
                                    {TRIGGER_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                                </select>
                                {editing.trigger.type === 'cron' && (
                                    <input
                                        value={editing.trigger.value || ''}
                                        onChange={(e) => setEditing({ ...editing, trigger: { ...editing.trigger, value: e.target.value } })}
                                        className="w-full mt-2 rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm font-mono"
                                        placeholder="*/30 * * * * (every 30 min)"
                                    />
                                )}
                            </div>

                            {/* Actions */}
                            <div>
                                <label className="text-sm font-medium text-muted block mb-2">Actions</label>
                                <div className="space-y-2">
                                    {editing.actions.map((a, i) => (
                                        <div key={i} className="flex gap-2">
                                            <select
                                                value={a.type}
                                                onChange={(e) => {
                                                    const actions = [...editing.actions];
                                                    actions[i] = { ...actions[i], type: e.target.value };
                                                    setEditing({ ...editing, actions });
                                                }}
                                                className="flex-1 rounded-xl bg-white/5 border border-border px-3 py-2 text-text text-sm"
                                            >
                                                {ACTION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                                            </select>
                                            {['execute_command', 'announce', 'delay', 'notify'].includes(a.type) && (
                                                <input
                                                    value={a.value || ''}
                                                    onChange={(e) => {
                                                        const actions = [...editing.actions];
                                                        actions[i] = { ...actions[i], value: e.target.value };
                                                        setEditing({ ...editing, actions });
                                                    }}
                                                    className="flex-1 rounded-xl bg-white/5 border border-border px-3 py-2 text-text text-sm"
                                                    placeholder="value"
                                                />
                                            )}
                                            <button
                                                onClick={() => setEditing({ ...editing, actions: editing.actions.filter((_, j) => j !== i) })}
                                                className="p-2 text-danger/60 hover:text-danger"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setEditing({ ...editing, actions: [...editing.actions, { type: 'server_restart' }] })}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        + Add action
                                    </button>
                                </div>
                            </div>

                            {/* Save */}
                            <div className="flex gap-3 justify-end pt-2">
                                <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl bg-white/5 text-muted hover:text-text text-sm transition">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={upsert.isPending || !editing.name}
                                    className="btn-primary text-sm"
                                >
                                    <Save className="w-4 h-4" /> Save
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
