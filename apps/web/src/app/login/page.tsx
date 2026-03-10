'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, LogIn, Shield } from 'lucide-react';
import { FormEvent, useState } from 'react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [show2FA, setShow2FA] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { setTokens } = useAuthStore();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await authApi.login(username, password, totp || undefined);
            setTokens(res.accessToken, res.refreshToken);
            window.location.href = '/dashboard';
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'فشل تسجيل الدخول';
            if (msg.includes('2FA') || msg.includes('totp')) {
                setShow2FA(true);
                setError('يرجى إدخال رمز المصادقة الثنائية');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold glow-text text-[var(--accent-primary)]">
                        SaifControl
                    </h1>
                    <p className="text-[var(--text-muted)] mt-1">تسجيل الدخول للوحة التحكم</p>
                </div>

                <Card className="glass glow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LogIn className="h-5 w-5 text-[var(--accent-primary)]" />
                            تسجيل الدخول
                        </CardTitle>
                        <CardDescription>أدخل بيانات الحساب للمتابعة</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium mb-1 block">اسم المستخدم</label>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="admin"
                                    autoComplete="username"
                                    dir="ltr"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">كلمة المرور</label>
                                <div className="relative">
                                    <Input
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        dir="ltr"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    >
                                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {show2FA && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                >
                                    <label className="text-sm font-medium mb-1 flex items-center gap-1">
                                        <Shield className="h-4 w-4 text-[var(--accent-primary)]" />
                                        رمز المصادقة الثنائية
                                    </label>
                                    <Input
                                        value={totp}
                                        onChange={(e) => setTotp(e.target.value)}
                                        placeholder="000000"
                                        maxLength={6}
                                        dir="ltr"
                                        className="text-center tracking-widest text-lg"
                                    />
                                </motion.div>
                            )}

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> جارِ الدخول...</>
                                ) : (
                                    <><LogIn className="h-4 w-4" /> دخول</>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
