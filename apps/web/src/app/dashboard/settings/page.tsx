'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Info, Server, Settings, Shield } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
                <Settings className="h-5 w-5 text-[var(--accent-primary)]" />
                الإعدادات
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Info className="h-4 w-4 text-[var(--info)]" />
                            معلومات النظام
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">الإصدار</span>
                            <Badge variant="default">0.1.0</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">واجهة API</span>
                            <span className="font-mono text-xs" dir="ltr">:4800</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">واجهة الويب</span>
                            <span className="font-mono text-xs" dir="ltr">:3000</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Database className="h-4 w-4 text-[var(--warning)]" />
                            التخزين
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">النوع</span>
                            <Badge variant="outline">JSON Files</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">المسار</span>
                            <span className="font-mono text-xs" dir="ltr">~/.saifcontrol/</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">التشفير</span>
                            <Badge variant="success">AES-256-GCM</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Server className="h-4 w-4 text-[var(--success)]" />
                            FiveM
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">panel_bridge</span>
                            <Badge variant="success">مثبت</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">APIs</span>
                            <Badge variant="outline">موثقة فقط</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Shield className="h-4 w-4 text-[var(--accent-primary)]" />
                            الحماية
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">JWT</span>
                            <Badge variant="success">مفعّل</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">RBAC</span>
                            <Badge variant="success">مفعّل</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">Rate Limiting</span>
                            <Badge variant="success">مفعّل</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">التجزئة</span>
                            <Badge variant="outline">argon2id</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
