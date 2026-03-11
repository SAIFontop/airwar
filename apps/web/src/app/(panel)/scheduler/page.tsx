'use client';

import {
    useCreateSchedulerTask,
    useDeleteSchedulerTask,
    useSchedulerTasks,
    useToggleSchedulerTask,
} from '@/lib/hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, Plus, Power, PowerOff, Trash2, X, Zap } from 'lucide-react';
import { useCallback, useState } from 'react';

const TASK_TYPES = [
    { value: 'restart', label: 'Server Restart', icon: Power, color: 'text-amber-400' },
    { value: 'backup', label: 'Backup', icon: Clock, color: 'text-cyan-400' },
    { value: 'command', label: 'RCON Command', icon: Zap, color: 'text-primary' },
    { value: 'message', label: 'Server Message', icon: Calendar, color: 'text-emerald-400' },
];

const SCHEDULE_PRESETS = [
    { label: 'Every Hour', value: '0 * * * *' },
    { label: 'Every 6 Hours', value: '0 */6 * * *' },
    { label: 'Every 12 Hours', value: '0 */12 * * *' },
    { label: 'Daily (Midnight)', value: '0 0 * * *' },
    { label: 'Daily (6 AM)', value: '0 6 * * *' },
    { label: 'Weekly (Sunday)', value: '0 0 * * 0' },
    { label: 'Custom', value: '' },
];

export default function SchedulerPage() {
    const { data: tasks = [], isLoading } = useSchedulerTasks();
    const createTask = useCreateSchedulerTask();
    const deleteTask = useDeleteSchedulerTask();
    const toggleTask = useToggleSchedulerTask();

    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        name: '',
        type: 'restart',
        schedule: '0 0 * * *',
        command: '',
        enabled: true,
    });

    const handleCreate = useCallback(async () => {
        if (!form.name.trim() || !form.schedule.trim()) return;
        await createTask.mutateAsync({
            name: form.name,
            type: form.type,
            schedule: form.schedule,
            command: form.command || undefined,
            enabled: form.enabled,
        });
        setShowCreate(false);
        setForm({ name: '', type: 'restart', schedule: '0 0 * * *', command: '', enabled: true });
    }, [form, createTask]);

    const getTaskType = (type: string) => TASK_TYPES.find((t) => t.value === type) || TASK_TYPES[0];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-text">Scheduled Tasks</h2>
                    <span className="text-xs text-muted ml-2">{tasks.length} tasks</span>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition text-xs font-medium"
                >
                    <Plus className="w-3.5 h-3.5" /> New Task
                </button>
            </div>

            {/* Task List */}
            {isLoading ? (
                <div className="glass-card p-8 text-center text-muted text-sm">Loading tasks...</div>
            ) : tasks.length === 0 ? (
                <div className="glass-card p-12 flex flex-col items-center text-muted">
                    <Calendar className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-sm mb-4">No scheduled tasks</p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition text-sm"
                    >
                        Create First Task
                    </button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {tasks.map((task) => {
                        const tt = getTaskType(task.type);
                        const Icon = tt.icon;
                        return (
                            <motion.div
                                key={task.id}
                                layout
                                className="glass-card p-4 flex items-center gap-4"
                            >
                                <div className={`p-2.5 rounded-xl bg-white/5 ${tt.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-text text-sm truncate">{task.name}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${task.enabled
                                                ? 'bg-emerald-400/10 text-emerald-400'
                                                : 'bg-red-400/10 text-red-400'
                                            }`}>
                                            {task.enabled ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                                        <span>{tt.label}</span>
                                        <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">{task.schedule}</span>
                                        {task.command && (
                                            <span className="font-mono truncate max-w-[200px]">{task.command}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleTask.mutate({ id: task.id, enabled: !task.enabled })}
                                        className={`p-2 rounded-lg transition ${task.enabled
                                                ? 'text-emerald-400 hover:bg-emerald-400/10'
                                                : 'text-muted hover:bg-white/5'
                                            }`}
                                        title={task.enabled ? 'Disable' : 'Enable'}
                                    >
                                        {task.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => deleteTask.mutate(task.id)}
                                        className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Task Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowCreate(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="glass-card p-6 max-w-md w-full mx-4 space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-text">New Scheduled Task</h3>
                                <button onClick={() => setShowCreate(false)} className="text-muted hover:text-text">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="text-xs text-muted mb-1 block">Task Name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Nightly Restart"
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-sm text-text outline-none focus:border-primary transition"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="text-xs text-muted mb-1 block">Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {TASK_TYPES.map((tt) => (
                                        <button
                                            key={tt.value}
                                            onClick={() => setForm({ ...form, type: tt.value })}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${form.type === tt.value
                                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                                    : 'bg-white/5 text-muted hover:text-text border border-transparent'
                                                }`}
                                        >
                                            <tt.icon className="w-4 h-4" />
                                            {tt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Schedule */}
                            <div>
                                <label className="text-xs text-muted mb-1 block">Schedule (Cron)</label>
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {SCHEDULE_PRESETS.map((p) => (
                                        <button
                                            key={p.label}
                                            onClick={() => p.value && setForm({ ...form, schedule: p.value })}
                                            className={`px-2 py-1 rounded text-[10px] transition ${form.schedule === p.value
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'bg-white/5 text-muted hover:text-text'
                                                }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    value={form.schedule}
                                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                                    placeholder="0 0 * * *"
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border font-mono text-sm text-text outline-none focus:border-primary transition"
                                />
                            </div>

                            {/* Command (for command/message types) */}
                            {(form.type === 'command' || form.type === 'message') && (
                                <div>
                                    <label className="text-xs text-muted mb-1 block">
                                        {form.type === 'command' ? 'RCON Command' : 'Message'}
                                    </label>
                                    <input
                                        value={form.command}
                                        onChange={(e) => setForm({ ...form, command: e.target.value })}
                                        placeholder={form.type === 'command' ? 'e.g. restart myresource' : 'e.g. Server restarting in 5 mins...'}
                                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-sm text-text outline-none focus:border-primary transition"
                                    />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="px-4 py-2 rounded-lg bg-white/5 text-muted hover:text-text transition text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!form.name.trim() || !form.schedule.trim() || createTask.isPending}
                                    className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition text-sm font-medium disabled:opacity-40"
                                >
                                    {createTask.isPending ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
