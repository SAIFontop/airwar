'use client';

import { api } from '@/lib/api';
import { useUsers } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { CheckCircle2, Key, Loader2, Settings, Shield, User } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
    const user = useAuthStore((s) => s.user);
    const { data: users } = useUsers();
    const [tab, setTab] = useState<'general' | 'security' | 'users'>('general');

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-text">Settings</h2>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl bg-white/5 border border-border p-0.5 w-fit">
                {([
                    { id: 'general', label: 'General', icon: User },
                    { id: 'security', label: 'Security', icon: Shield },
                    { id: 'users', label: 'Users', icon: Key },
                ] as const).map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.id ? 'bg-primary/20 text-primary' : 'text-muted hover:text-text'
                            }`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* General */}
            {tab === 'general' && (
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
            )}

            {/* Security */}
            {tab === 'security' && <SecuritySection />}

            {/* Users */}
            {tab === 'users' && (
                <div className="glass-card p-6 space-y-4">
                    <h3 className="font-semibold text-text">Registered Users</h3>
                    <div className="space-y-2">
                        {(users || []).map((u: Record<string, unknown>) => (
                            <div key={String(u.id)} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                                        {String(u.username || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-text">{String(u.username)}</p>
                                        <p className="text-xs text-muted capitalize">{String(u.role)}</p>
                                    </div>
                                </div>
                                {u.has2FA ? (
                                    <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full">2FA</span>
                                ) : null}
                            </div>
                        ))}
                        {(!users || users.length === 0) && (
                            <p className="text-sm text-muted">No users found</p>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

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
        const res = await api.confirm2FA(code);
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
                <div className={`rounded-xl px-4 py-3 text-sm ${message.includes('success') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
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
                            {/* The backend returns an otpauth:// URI — show the secret for manual entry */}
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
