'use client';

import { api } from '@/lib/api';
import { useCreateUser, useDeleteUser, useProfiles, useSaveWebhooks, useSwitchProfile, useTestWebhook, useUsers, useWebhooks } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, Globe, Key, Loader2, Plus, Settings, Shield, Trash2, User, UserPlus, Webhook } from 'lucide-react';
import { useState } from 'react';

type TabId = 'general' | 'security' | 'users' | 'webhooks';

const WEBHOOK_EVENTS = [
    { id: 'server.start', label: 'Server Start' },
    { id: 'server.stop', label: 'Server Stop' },
    { id: 'server.crash', label: 'Server Crash' },
    { id: 'player.join', label: 'Player Join' },
    { id: 'player.leave', label: 'Player Leave' },
    { id: 'player.ban', label: 'Player Ban' },
    { id: 'backup.create', label: 'Backup Created' },
    { id: 'alert.critical', label: 'Critical Alerts' },
];

export default function SettingsPage() {
    const user = useAuthStore((s) => s.user);
    const { data: users } = useUsers();
    const [tab, setTab] = useState<TabId>('general');

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-text">Settings</h2>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl bg-white/5 border border-border p-0.5 w-fit flex-wrap">
                {([
                    { id: 'general' as TabId, label: 'General', icon: User },
                    { id: 'security' as TabId, label: 'Security', icon: Shield },
                    { id: 'users' as TabId, label: 'Users', icon: Key },
                    { id: 'webhooks' as TabId, label: 'Webhooks', icon: Webhook },
                ]).map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
                            tab === t.id ? 'bg-primary/20 text-primary' : 'text-muted hover:text-text'
                        )}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* General */}
                {tab === 'general' && (
                    <motion.div key="general" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="glass-card p-6 space-y-5">
                            <h3 className="font-semibold text-text">Profile</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                                    {user?.username?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-text">{user?.username}</p>
                                    <p className="text-sm text-muted capitalize">{user?.role}</p>
                                </div>
                            </div>
                        </div>
                        <ProfileSwitcher />
                    </motion.div>
                )}

                {/* Security */}
                {tab === 'security' && (
                    <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <SecuritySection />
                    </motion.div>
                )}

                {/* Users */}
                {tab === 'users' && (
                    <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <UsersSection users={users || []} currentRole={user?.role} />
                    </motion.div>
                )}

                {/* Webhooks */}
                {tab === 'webhooks' && (
                    <motion.div key="webhooks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <WebhooksSection />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ─────── Profile Switcher ─────── */
function ProfileSwitcher() {
    const { data: profilesData, isLoading } = useProfiles();
    const switchProfile = useSwitchProfile();

    if (isLoading || !profilesData) return null;

    const { activeProfileId, profiles } = profilesData;
    if (!profiles || profiles.length <= 1) return null;

    return (
        <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-text flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Server Profile</h3>
            <div className="grid gap-3">
                {profiles.map((p: Record<string, unknown>) => (
                    <button
                        key={String(p.id)}
                        onClick={() => switchProfile.mutate(String(p.id))}
                        disabled={String(p.id) === activeProfileId}
                        className={cn(
                            'flex items-center justify-between p-4 rounded-xl border transition text-left',
                            String(p.id) === activeProfileId
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : 'bg-white/5 border-border text-text hover:border-primary/20'
                        )}
                    >
                        <div>
                            <p className="font-medium text-sm">{String(p.name || p.id)}</p>
                            <p className="text-xs text-muted mt-0.5">{String(p.serverDataPath || '')}</p>
                        </div>
                        {String(p.id) === activeProfileId && (
                            <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">Active</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ─────── Users Section ─────── */
function UsersSection({ users, currentRole }: { users: Record<string, unknown>[]; currentRole?: string }) {
    const createUser = useCreateUser();
    const deleteUser = useDeleteUser();
    const [showCreate, setShowCreate] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'viewer' });
    const [error, setError] = useState('');

    const handleCreate = async () => {
        setError('');
        if (!newUser.username || !newUser.password) { setError('Username and password required'); return; }
        if (newUser.password.length < 8) { setError('Password must be at least 8 characters'); return; }
        const res = await createUser.mutateAsync(newUser);
        if (res.success) {
            setShowCreate(false);
            setNewUser({ username: '', password: '', role: 'viewer' });
        } else {
            setError(res.error || 'Failed to create user');
        }
    };

    return (
        <>
            <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-text">Registered Users</h3>
                    {currentRole === 'owner' && (
                        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 text-sm font-medium transition">
                            <UserPlus className="w-4 h-4" /> Add User
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {users.map((u) => (
                        <div key={String(u.id)} className="flex items-center justify-between p-3 rounded-xl bg-white/5 group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                                    {String(u.username || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-text">{String(u.username)}</p>
                                    <p className="text-xs text-muted capitalize">{String(u.role)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {u.twoFactorEnabled ? (
                                    <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full">2FA</span>
                                ) : null}
                                {currentRole === 'owner' && String(u.role) !== 'owner' && (
                                    <button
                                        onClick={() => deleteUser.mutate(String(u.id))}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-danger/60 hover:text-danger hover:bg-danger/10 transition"
                                        title="Delete user"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {users.length === 0 && <p className="text-sm text-muted">No users found</p>}
                </div>
            </div>

            {/* Create User Dialog */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="glass-card p-6 w-full max-w-md mx-4 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-text flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> Create User</h3>

                        {error && <div className="rounded-xl px-4 py-3 text-sm bg-danger/10 text-danger">{error}</div>}

                        <div>
                            <label className="text-xs text-muted block mb-1">Username</label>
                            <input
                                value={newUser.username}
                                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm"
                                placeholder="username"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted block mb-1">Password</label>
                            <input
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm"
                                placeholder="Min 8 characters"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted block mb-1">Role</label>
                            <div className="flex gap-2">
                                {['admin', 'viewer'].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setNewUser({ ...newUser, role: r })}
                                        className={cn(
                                            'px-4 py-2 rounded-xl text-sm font-medium transition flex-1 capitalize',
                                            newUser.role === r ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-muted border border-border hover:text-text'
                                        )}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl bg-white/5 text-muted text-sm transition">Cancel</button>
                            <button onClick={handleCreate} disabled={createUser.isPending} className="btn-primary text-sm">
                                {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Create
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}

/* ─────── Webhooks Section ─────── */
function WebhooksSection() {
    const { data: webhookData, isLoading } = useWebhooks();
    const saveWebhooks = useSaveWebhooks();
    const testWebhook = useTestWebhook();
    const [url, setUrl] = useState('');
    const [enabled, setEnabled] = useState(false);
    const [events, setEvents] = useState<string[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [message, setMessage] = useState('');

    // Sync from server data on first load
    if (webhookData && !loaded) {
        setUrl(webhookData.discord?.url || '');
        setEnabled(webhookData.discord?.enabled || false);
        setEvents(webhookData.discord?.events || []);
        setLoaded(true);
    }

    const toggleEvent = (id: string) => {
        setEvents(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
    };

    const handleSave = async () => {
        setMessage('');
        const res = await saveWebhooks.mutateAsync({ enabled, url, events });
        setMessage(res.success ? 'Saved!' : (res.error || 'Failed'));
    };

    const handleTest = async () => {
        setMessage('');
        const res = await testWebhook.mutateAsync();
        setMessage(res.success ? 'Test sent!' : (res.error || 'Failed'));
    };

    if (isLoading) return <div className="glass-card p-6 animate-pulse"><div className="h-6 bg-white/10 rounded w-1/3" /></div>;

    return (
        <div className="glass-card p-6 space-y-6">
            <h3 className="font-semibold text-text flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Discord Webhooks</h3>

            {message && (
                <div className={cn('rounded-xl px-4 py-3 text-sm', message.includes('Saved') || message.includes('sent') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
                    {message}
                </div>
            )}

            {/* Enable Toggle */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-text">Enable Discord Notifications</p>
                    <p className="text-xs text-muted">Send server events to a Discord channel</p>
                </div>
                <button
                    onClick={() => setEnabled(!enabled)}
                    className={cn(
                        'w-12 h-6 rounded-full transition-colors relative',
                        enabled ? 'bg-primary' : 'bg-white/10'
                    )}
                >
                    <div className={cn('w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all', enabled ? 'left-6' : 'left-0.5')} />
                </button>
            </div>

            {/* Webhook URL */}
            <div>
                <label className="text-xs text-muted block mb-1">Webhook URL</label>
                <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm font-mono placeholder:text-muted/50"
                    placeholder="https://discord.com/api/webhooks/..."
                />
            </div>

            {/* Events */}
            <div>
                <label className="text-xs text-muted block mb-2">Events to notify</label>
                <div className="grid grid-cols-2 gap-2">
                    {WEBHOOK_EVENTS.map((evt) => (
                        <button
                            key={evt.id}
                            onClick={() => toggleEvent(evt.id)}
                            className={cn(
                                'px-3 py-2 rounded-xl text-sm font-medium transition text-left',
                                events.includes(evt.id)
                                    ? 'bg-primary/15 text-primary border border-primary/30'
                                    : 'bg-white/5 text-muted border border-border hover:text-text'
                            )}
                        >
                            {evt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-3">
                <button onClick={handleSave} disabled={saveWebhooks.isPending} className="btn-primary text-sm">
                    {saveWebhooks.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Save
                </button>
                <button
                    onClick={handleTest}
                    disabled={testWebhook.isPending || !enabled || !url}
                    className="px-4 py-2 rounded-xl bg-white/5 text-muted hover:text-text text-sm transition disabled:opacity-50"
                >
                    {testWebhook.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Test'}
                </button>
            </div>
        </div>
    );
}

/* ─────── Security Section ─────── */
function SecuritySection() {
    const [step, setStep] = useState<'idle' | 'setup' | 'confirm'>('idle');
    const [secret, setSecret] = useState('');
    const [qr, setQr] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSetup2FA = async () => {
        setLoading(true);
        setMessage('');
        const res = await api.setup2FA();
        setLoading(false);
        if (res.success && res.data) {
            setSecret(res.data.secret || '');
            setQr(res.data.qrCode || res.data.otpauth || '');
            setStep('setup');
        } else {
            setMessage(res.error || 'Failed to setup 2FA');
        }
    };

    const handleConfirm2FA = async () => {
        if (code.length !== 6) return;
        setLoading(true);
        setMessage('');
        const res = await api.confirm2FA(secret, code);
        setLoading(false);
        if (res.success) {
            setMessage('2FA enabled successfully');
            setStep('idle');
        } else {
            setMessage(res.error || 'Invalid code');
        }
    };

    return (
        <div className="glass-card p-6 space-y-6">
            <h3 className="font-semibold text-text">Two-Factor Authentication</h3>

            {message && (
                <div className={cn('rounded-xl px-4 py-3 text-sm', message.includes('success') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
                    {message}
                </div>
            )}

            {step === 'idle' && (
                <button onClick={handleSetup2FA} disabled={loading} className="btn-primary text-sm">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    Setup 2FA
                </button>
            )}

            {step === 'setup' && (
                <div className="space-y-4">
                    <p className="text-sm text-muted">Scan this QR code with your authenticator app, or enter the secret manually:</p>
                    {qr && (
                        <div className="bg-white p-4 rounded-xl w-fit">
                            <p className="text-xs text-black font-mono break-all">{qr}</p>
                        </div>
                    )}
                    {secret && (
                        <div className="bg-white/5 rounded-xl px-4 py-3">
                            <p className="text-xs text-muted mb-1">Secret Key</p>
                            <p className="text-sm font-mono text-text select-all">{secret}</p>
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-muted block mb-2">Verification Code</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full max-w-xs rounded-xl bg-white/5 border border-border px-4 py-3 text-text font-mono text-lg tracking-[0.5em] text-center"
                            placeholder="000000"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setStep('idle')} className="px-4 py-2 rounded-xl bg-white/5 text-muted text-sm">Cancel</button>
                        <button onClick={handleConfirm2FA} disabled={loading || code.length !== 6} className="btn-primary text-sm">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Verify & Enable
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
