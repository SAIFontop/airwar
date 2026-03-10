'use client';

import { Button, Input } from '@/components/ui';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Gamepad2, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const setTokens = useAuthStore((s) => s.setTokens);
    const setUser = useAuthStore((s) => s.setUser);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [showTotp, setShowTotp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await authApi.login(username, password, totp || undefined);
            setTokens(res.accessToken, res.refreshToken);
            const me = await authApi.me(res.accessToken);
            setUser(me);
            router.push('/dashboard');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Login failed';
            if (msg.toLowerCase().includes('totp') || msg.toLowerCase().includes('2fa')) {
                setShowTotp(true);
                setError('Two-factor authentication required');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
            {/* Background accent glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-md"
            >
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted mb-4">
                        <Gamepad2 className="h-7 w-7 text-accent" />
                    </div>
                    <h1 className="text-xl font-bold text-text-primary">Welcome back</h1>
                    <p className="text-sm text-text-secondary mt-1">Sign in to SaifControl</p>
                </div>

                {/* Form */}
                <div className="rounded-[var(--radius-xl)] border border-border-primary bg-bg-card p-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">Username</label>
                            <Input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="admin"
                                icon={<User className="h-4 w-4" />}
                                autoFocus
                                autoComplete="username"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                icon={<Lock className="h-4 w-4" />}
                                autoComplete="current-password"
                            />
                        </div>
                        {showTotp && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">2FA Code</label>
                                <Input
                                    value={totp}
                                    onChange={(e) => setTotp(e.target.value)}
                                    placeholder="000000"
                                    maxLength={6}
                                    className="font-mono text-center tracking-[0.5em]"
                                />
                            </motion.div>
                        )}
                        {error && (
                            <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-danger-muted p-3 text-sm text-danger">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}
                        <Button type="submit" loading={loading} size="lg" className="w-full gap-2">
                            Sign In <ArrowRight className="h-4 w-4" />
                        </Button>
                    </form>
                </div>

                <p className="text-center text-xs text-text-muted mt-6">
                    SaifControl &middot; FiveM Server Management
                </p>
            </motion.div>
        </div>
    );
}
