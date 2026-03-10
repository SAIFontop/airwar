'use client';

import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Gamepad2, Loader2, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, checkAuth } = useAuthStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [show2FA, setShow2FA] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkAuth().then((ok) => {
            if (ok) router.replace('/dashboard');
        });
    }, [checkAuth, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password, totpCode || undefined);
        setLoading(false);

        if (result.success) {
            router.replace('/dashboard');
        } else {
            if (result.error?.includes('2FA') || result.error?.includes('totp')) {
                setShow2FA(true);
            }
            setError(result.error || 'Login failed');
        }
    };

    if (isAuthenticated) return null;

    return (
        <div className="min-h-screen flex items-center justify-center mesh-bg relative overflow-hidden">
            {/* Background dots */}
            <div className="absolute inset-0 dot-grid opacity-30" />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div className="glass-card p-8 space-y-8">
                    {/* Logo */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                        className="flex flex-col items-center gap-3"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                            <Gamepad2 className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-text">SaifControl</h1>
                        <p className="text-muted text-sm">Sign in to manage your server</p>
                    </motion.div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm text-danger"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                                placeholder="Enter username"
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 pr-12 text-text placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                                    placeholder="Enter password"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text transition"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {show2FA && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2"
                            >
                                <label className="text-sm font-medium text-muted flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-primary" />
                                    2FA Code
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-center text-lg tracking-[0.5em] placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-mono"
                                    placeholder="000000"
                                />
                            </motion.div>
                        )}

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Sign In'
                            )}
                        </motion.button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
