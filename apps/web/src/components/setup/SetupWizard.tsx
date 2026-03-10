'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { setupApi } from '@/lib/api';
import { useSetupStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft, ChevronRight,
    FileText,
    FolderCheck,
    Loader2,
    PlugZap,
    Save,
    Search,
    Shield,
    Wifi,
    Wrench,
    XCircle,
    Zap
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// ─── Types ───

interface CheckResult {
    id: string;
    label: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
    autoFix?: string;
}

interface ScanResult {
    binariesPath: string;
    serverDataPath: string;
    confidence: number;
}

// ─── Step definitions ───

const STEPS = [
    { id: 'welcome', title: 'مرحباً بك', icon: Zap, desc: 'مرحباً بك في SaifControl' },
    { id: 'scan', title: 'فحص المسارات', icon: Search, desc: 'البحث عن FXServer تلقائياً' },
    { id: 'validate', title: 'التحقق من المسارات', icon: FolderCheck, desc: 'التأكد من صحة المسارات' },
    { id: 'config', title: 'تحليل الإعدادات', icon: FileText, desc: 'فحص server.cfg' },
    { id: 'ports', title: 'فحص المنافذ', icon: Wifi, desc: 'التأكد من البورتات' },
    { id: 'txadmin', title: 'كشف txAdmin', icon: Shield, desc: 'الكشف عن txAdmin' },
    { id: 'bridge', title: 'تثبيت البريدج', icon: PlugZap, desc: 'تثبيت panel_bridge' },
    { id: 'fixes', title: 'إصلاح تلقائي', icon: Wrench, desc: 'إصلاح المشاكل المكتشفة' },
    { id: 'profile', title: 'حفظ البروفايل', icon: Save, desc: 'حفظ إعدادات السيرفر' },
    { id: 'complete', title: 'اكتمل!', icon: CheckCircle2, desc: 'الإعداد مكتمل' },
];

// ─── Status icon helper ───

function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'pass':
            return <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />;
        case 'warn':
            return <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />;
        case 'fail':
            return <XCircle className="h-5 w-5 text-[var(--danger)]" />;
        default:
            return null;
    }
}

// ─── Main Setup Wizard ───

export default function SetupWizard() {
    const { currentStep, setStep, setData, data } = useSetupStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const step = STEPS[currentStep];
    const progress = ((currentStep) / (STEPS.length - 1)) * 100;

    const nextStep = useCallback(() => {
        if (currentStep < STEPS.length - 1) setStep(currentStep + 1);
    }, [currentStep, setStep]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) setStep(currentStep - 1);
    }, [currentStep, setStep]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--bg-primary)]">
            {/* Logo area */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 text-center"
            >
                <h1 className="text-3xl font-bold glow-text text-[var(--accent-primary)]">
                    SaifControl
                </h1>
                <p className="text-[var(--text-muted)] mt-1">معالج الإعداد الأولي</p>
            </motion.div>

            {/* Progress bar */}
            <div className="w-full max-w-2xl mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[var(--text-muted)]">
                        الخطوة {currentStep + 1} من {STEPS.length}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                        {Math.round(progress)}%
                    </span>
                </div>
                <Progress value={progress} />
                {/* Step indicators */}
                <div className="flex justify-between mt-3">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const isActive = i === currentStep;
                        const isDone = i < currentStep;
                        return (
                            <div
                                key={s.id}
                                className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive
                                        ? 'text-[var(--accent-primary)]'
                                        : isDone
                                            ? 'text-[var(--success)]'
                                            : 'text-[var(--text-muted)]'
                                    }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${isActive
                                            ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)] animate-pulse-glow'
                                            : isDone
                                                ? 'border-[var(--success)] bg-[var(--success)]/10'
                                                : 'border-[var(--border-primary)] bg-[var(--bg-surface)]'
                                        }`}
                                >
                                    {isDone ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                        <Icon className="h-4 w-4" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    className="w-full max-w-2xl"
                >
                    <Card className="glass glow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <step.icon className="h-6 w-6 text-[var(--accent-primary)]" />
                                {step.title}
                            </CardTitle>
                            <CardDescription>{step.desc}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-sm">
                                    {error}
                                </div>
                            )}

                            <StepContent
                                stepId={step.id}
                                data={data}
                                setData={setData}
                                loading={loading}
                                setLoading={setLoading}
                                setError={setError}
                                nextStep={nextStep}
                            />
                        </CardContent>
                    </Card>
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 mt-6 w-full max-w-2xl justify-between">
                <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0 || loading}
                >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                </Button>
                <div className="text-xs text-[var(--text-muted)] self-center">
                    {step.title}
                </div>
                {currentStep < STEPS.length - 1 ? (
                    <Button
                        onClick={nextStep}
                        disabled={loading}
                    >
                        التالي
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                ) : (
                    <div />
                )}
            </div>
        </div>
    );
}

// ─── Step Content Renderer ───

interface StepContentProps {
    stepId: string;
    data: Record<string, unknown>;
    setData: (key: string, value: unknown) => void;
    loading: boolean;
    setLoading: (v: boolean) => void;
    setError: (v: string | null) => void;
    nextStep: () => void;
}

function StepContent({ stepId, data, setData, loading, setLoading, setError, nextStep }: StepContentProps) {
    switch (stepId) {
        case 'welcome':
            return <WelcomeStep />;
        case 'scan':
            return <ScanStep {...{ data, setData, loading, setLoading, setError, nextStep }} />;
        case 'validate':
            return <ValidateStep {...{ data, setData, loading, setLoading, setError }} />;
        case 'config':
            return <ConfigStep {...{ data, setData, loading, setLoading, setError }} />;
        case 'ports':
            return <PortsStep {...{ data, setData, loading, setLoading, setError }} />;
        case 'txadmin':
            return <TxAdminStep {...{ data, setData, loading, setLoading, setError }} />;
        case 'bridge':
            return <BridgeStep {...{ data, setData, loading, setLoading, setError }} />;
        case 'fixes':
            return <FixesStep {...{ data, setData, loading, setLoading, setError }} />;
        case 'profile':
            return <ProfileStep {...{ data, setData, loading, setLoading, setError, nextStep }} />;
        case 'complete':
            return <CompleteStep />;
        default:
            return null;
    }
}

// ─── Individual Steps ───

function WelcomeStep() {
    return (
        <div className="text-center space-y-4 py-4">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-xl font-bold">مرحباً بك في SaifControl</h2>
            <p className="text-[var(--text-secondary)]">
                لوحة تحكم احترافية لإدارة سيرفر FiveM الخاص بك.
            </p>
            <p className="text-[var(--text-muted)] text-sm">
                سيقوم معالج الإعداد بفحص النظام والتأكد من جاهزية السيرفر. اضغط &quot;التالي&quot; للبدء.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                    { icon: '🔍', label: 'فحص تلقائي' },
                    { icon: '🔒', label: 'حماية كاملة' },
                    { icon: '⚡', label: 'تحكم فوري' },
                ].map((f) => (
                    <div key={f.label} className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-primary)]">
                        <div className="text-2xl mb-1">{f.icon}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{f.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ScanStep({ data, setData, loading, setLoading, setError, nextStep }: Omit<StepContentProps, 'stepId'>) {
    const scanResults = data.scanResults as ScanResult[] | undefined;

    const doScan = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await setupApi.scan();
            setData('scanResults', res.results);
            if (Array.isArray(res.results) && res.results.length > 0) {
                const best = res.results[0] as ScanResult;
                setData('binariesPath', best.binariesPath);
                setData('serverDataPath', best.serverDataPath);
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'فشل الفحص');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
                سيتم البحث عن تثبيت FXServer في المسارات الشائعة تلقائياً.
            </p>
            <Button onClick={doScan} disabled={loading} className="w-full">
                {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> جارِ الفحص...</>
                ) : (
                    <><Search className="h-4 w-4" /> بدء الفحص التلقائي</>
                )}
            </Button>

            {scanResults && scanResults.length > 0 && (
                <div className="space-y-2 mt-4">
                    <p className="text-sm font-medium">النتائج المكتشفة:</p>
                    {scanResults.map((r, i) => (
                        <div
                            key={i}
                            onClick={() => {
                                setData('binariesPath', r.binariesPath);
                                setData('serverDataPath', r.serverDataPath);
                            }}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-[var(--accent-primary)] ${data.binariesPath === r.binariesPath
                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]'
                                    : 'border-[var(--border-primary)] bg-[var(--bg-surface)]'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-mono">{r.binariesPath}</span>
                                <Badge variant={r.confidence > 0.7 ? 'success' : 'warning'}>
                                    {Math.round(r.confidence * 100)}%
                                </Badge>
                            </div>
                            <div className="text-xs text-[var(--text-muted)] mt-1">{r.serverDataPath}</div>
                        </div>
                    ))}
                </div>
            )}

            {scanResults && scanResults.length === 0 && (
                <div className="p-4 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/30 text-sm">
                    <AlertTriangle className="h-4 w-4 inline ml-1 text-[var(--warning)]" />
                    لم يتم العثور على FXServer. أدخل المسارات يدوياً في الخطوة التالية.
                </div>
            )}
        </div>
    );
}

function ValidateStep({ data, setData, loading, setLoading, setError }: Omit<StepContentProps, 'stepId' | 'nextStep'>) {
    const [binPath, setBinPath] = useState((data.binariesPath as string) || '');
    const [dataPath, setDataPath] = useState((data.serverDataPath as string) || '');
    const validation = data.pathValidation as { binaries: CheckResult; serverData: CheckResult } | undefined;

    useEffect(() => {
        if (data.binariesPath) setBinPath(data.binariesPath as string);
        if (data.serverDataPath) setDataPath(data.serverDataPath as string);
    }, [data.binariesPath, data.serverDataPath]);

    const doValidate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await setupApi.validatePaths(binPath, dataPath);
            setData('pathValidation', res);
            setData('binariesPath', binPath);
            setData('serverDataPath', dataPath);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'فشل التحقق');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium mb-1 block">مسار ملفات FXServer (run.sh)</label>
                <Input
                    placeholder="/home/user/fx-server"
                    value={binPath}
                    onChange={(e) => setBinPath(e.target.value)}
                    dir="ltr"
                />
            </div>
            <div>
                <label className="text-sm font-medium mb-1 block">مسار server-data</label>
                <Input
                    placeholder="/home/user/server-data"
                    value={dataPath}
                    onChange={(e) => setDataPath(e.target.value)}
                    dir="ltr"
                />
            </div>
            <Button onClick={doValidate} disabled={loading || !binPath || !dataPath} className="w-full">
                {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> جارِ التحقق...</>
                ) : (
                    <><FolderCheck className="h-4 w-4" /> التحقق من المسارات</>
                )}
            </Button>

            {validation && (
                <div className="space-y-2">
                    {Object.values(validation).map((check: CheckResult) => (
                        <div key={check.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-surface)]">
                            <StatusIcon status={check.status} />
                            <div>
                                <div className="text-sm font-medium">{check.label}</div>
                                <div className="text-xs text-[var(--text-muted)]">{check.message}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ConfigStep({ data, setData, loading, setLoading, setError }: Omit<StepContentProps, 'stepId' | 'nextStep'>) {
    const cfgPath = ((data.serverDataPath as string) || '') + '/server.cfg';
    const checks = data.cfgChecks as CheckResult[] | undefined;

    const doAnalyze = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await setupApi.analyzeCfg(cfgPath) as { checks: CheckResult[] };
            setData('cfgChecks', res.checks);
            setData('cfgPath', cfgPath);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'فشل التحليل');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
                سيتم تحليل ملف <span className="font-mono text-[var(--accent-primary)]" dir="ltr">server.cfg</span> والتحقق من الإعدادات.
            </p>
            <div className="p-2 rounded bg-[var(--bg-surface)] font-mono text-xs" dir="ltr">{cfgPath}</div>
            <Button onClick={doAnalyze} disabled={loading} className="w-full">
                {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> جارِ التحليل...</>
                ) : (
                    <><FileText className="h-4 w-4" /> تحليل الإعدادات</>
                )}
            </Button>

            {checks && (
                <div className="space-y-2">
                    {checks.map((c) => (
                        <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-surface)]">
                            <StatusIcon status={c.status} />
                            <div className="flex-1">
                                <div className="text-sm font-medium">{c.label}</div>
                                <div className="text-xs text-[var(--text-muted)]">{c.message}</div>
                                {c.autoFix && (
                                    <Badge variant="info" className="mt-1">قابل للإصلاح التلقائي</Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PortsStep({ data, setData, loading, setLoading, setError }: Omit<StepContentProps, 'stepId' | 'nextStep'>) {
    const [tcpPort, setTcpPort] = useState(30120);
    const [udpPort, setUdpPort] = useState(30120);
    const portChecks = data.portChecks as CheckResult[] | undefined;

    const doCheck = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await setupApi.checkPorts({ tcp: tcpPort, udp: udpPort }) as { checks: CheckResult[] };
            setData('portChecks', res.checks);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'فشل الفحص');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium mb-1 block">TCP Port</label>
                    <Input
                        type="number"
                        value={tcpPort}
                        onChange={(e) => setTcpPort(Number(e.target.value))}
                        dir="ltr"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">UDP Port</label>
                    <Input
                        type="number"
                        value={udpPort}
                        onChange={(e) => setUdpPort(Number(e.target.value))}
                        dir="ltr"
                    />
                </div>
            </div>
            <Button onClick={doCheck} disabled={loading} className="w-full">
                {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> جارِ الفحص...</>
                ) : (
                    <><Wifi className="h-4 w-4" /> فحص المنافذ</>
                )}
            </Button>

            {portChecks && (
                <div className="space-y-2">
                    {portChecks.map((c) => (
                        <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-surface)]">
                            <StatusIcon status={c.status} />
                            <div>
                                <div className="text-sm font-medium">{c.label}</div>
                                <div className="text-xs text-[var(--text-muted)]">{c.message}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function TxAdminStep({ data, setData, loading, setLoading, setError }: Omit<StepContentProps, 'stepId' | 'nextStep'>) {
    const txResult = data.txAdminResult as { detected: boolean; path?: string; warning?: string } | undefined;

    const doDetect = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await setupApi.detectTxAdmin(data.binariesPath as string) as { detected: boolean; path?: string; warning?: string };
            setData('txAdminResult', res);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'فشل الكشف');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
                سيتم الكشف عن txAdmin عبر فحص الملفات فقط (بدون استخدام أي API غير موثق).
            </p>
            <Button onClick={doDetect} disabled={loading} className="w-full">
                {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> جارِ الكشف...</>
                ) : (
                    <><Shield className="h-4 w-4" /> كشف txAdmin</>
                )}
            </Button>

            {txResult && (
                <div className={`p-4 rounded-lg border ${txResult.detected
                        ? 'bg-[var(--warning)]/10 border-[var(--warning)]/30'
                        : 'bg-[var(--success)]/10 border-[var(--success)]/30'
                    }`}>
                    {txResult.detected ? (
                        <>
                            <div className="flex items-center gap-2 font-medium text-[var(--warning)]">
                                <AlertTriangle className="h-5 w-5" />
                                تم اكتشاف txAdmin
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] mt-2">
                                {txResult.warning || 'SaifControl سيعمل بجانب txAdmin. لن يتم استخدام أي API خاص بـ txAdmin.'}
                            </p>
                            {txResult.path && (
                                <div className="mt-2 p-2 rounded bg-[var(--bg-surface)] font-mono text-xs" dir="ltr">
                                    {txResult.path}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-2 font-medium text-[var(--success)]">
                            <CheckCircle2 className="h-5 w-5" />
                            لم يتم اكتشاف txAdmin — وضع التحكم المباشر
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function BridgeStep({ data, setData, loading, setLoading, setError }: Omit<StepContentProps, 'stepId' | 'nextStep'>) {
    const bridgeResult = data.bridgeResult as { success: boolean; token?: string } | undefined;

    const doInstall = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await setupApi.installBridge(data.serverDataPath as string) as { success: boolean; token?: string };
            setData('bridgeResult', res);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'فشل التثبيت');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
                سيتم تثبيت ريسورس <span className="font-mono text-[var(--accent-primary)]">panel_bridge</span> في مجلد resources الخاص بالسيرفر.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
                يستخدم فقط APIs موثقة: SetHttpHandler، ExecuteCommand، GetPlayers
            </p>
            <Button onClick={doInstall} disabled={loading} className="w-full">
                {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> جارِ التثبيت...</>
                ) : (
                    <><PlugZap className="h-4 w-4" /> تثبيت panel_bridge</>
                )}
            </Button>

            {bridgeResult?.success && (
                <div className="p-4 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30">
                    <div className="flex items-center gap-2 font-medium text-[var(--success)]">
                        <CheckCircle2 className="h-5 w-5" />
                        تم تثبيت panel_bridge بنجاح
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                        تم إضافة <span className="font-mono">ensure panel_bridge</span> إلى server.cfg
                    </p>
                </div>
            )}
        </div>
    );
}

function FixesStep({ data, setData, loading, setLoading, setError }: Omit<StepContentProps, 'stepId' | 'nextStep'>) {
    const allChecks = [
        ...((data.cfgChecks as CheckResult[]) || []),
        ...((data.portChecks as CheckResult[]) || []),
    ];
    const fixable = allChecks.filter((c) => c.autoFix && c.status !== 'pass');
    const fixResult = data.fixResult as { applied: string[] } | undefined;

    const doFix = async () => {
        setLoading(true);
        setError(null);
        try {
            const fixes = fixable.map((c) => c.autoFix!);
            const res = await setupApi.autoFix(fixes) as { applied: string[] };
            setData('fixResult', res);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'فشل الإصلاح');
        } finally {
            setLoading(false);
        }
    };

    if (fixable.length === 0) {
        return (
            <div className="text-center py-6">
                <CheckCircle2 className="h-12 w-12 text-[var(--success)] mx-auto mb-3" />
                <p className="text-lg font-medium">لا توجد مشاكل تحتاج إصلاح</p>
                <p className="text-sm text-[var(--text-muted)]">جميع الفحوصات ناجحة. اضغط &quot;التالي&quot; للمتابعة.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
                تم اكتشاف {fixable.length} مشكلة قابلة للإصلاح التلقائي:
            </p>
            <div className="space-y-2">
                {fixable.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-surface)]">
                        <StatusIcon status={c.status} />
                        <div className="flex-1">
                            <div className="text-sm font-medium">{c.label}</div>
                            <div className="text-xs text-[var(--text-muted)]">{c.message}</div>
                        </div>
                    </div>
                ))}
            </div>
            <Button onClick={doFix} disabled={loading} variant="success" className="w-full">
                {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> جارِ الإصلاح...</>
                ) : (
                    <><Wrench className="h-4 w-4" /> إصلاح الكل تلقائياً</>
                )}
            </Button>

            {fixResult && (
                <div className="p-4 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30">
                    <div className="flex items-center gap-2 font-medium text-[var(--success)]">
                        <CheckCircle2 className="h-5 w-5" />
                        تم إصلاح {fixResult.applied.length} مشكلة
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileStep({ data, setData, loading, setLoading, setError, nextStep }: Omit<StepContentProps, 'stepId'>) {
    const [name, setName] = useState('السيرفر الرئيسي');
    const [mode, setMode] = useState('process');

    const doSave = async () => {
        setLoading(true);
        setError(null);
        try {
            await setupApi.saveProfile({
                name,
                binariesPath: data.binariesPath as string,
                serverDataPath: data.serverDataPath as string,
                cfgPath: ((data.serverDataPath as string) || '') + '/server.cfg',
                managementMode: mode,
            });
            setData('profileSaved', true);

            // Complete setup
            await setupApi.complete();
            nextStep();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'فشل الحفظ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium mb-1 block">اسم البروفايل</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
                <label className="text-sm font-medium mb-1 block">وضع الإدارة</label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { value: 'process', label: 'Process مباشر', desc: 'تشغيل وإيقاف مباشر' },
                        { value: 'systemd', label: 'Systemd', desc: 'إدارة عبر systemd' },
                    ].map((opt) => (
                        <div
                            key={opt.value}
                            onClick={() => setMode(opt.value)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${mode === opt.value
                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]'
                                    : 'border-[var(--border-primary)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)]'
                                }`}
                        >
                            <div className="text-sm font-medium">{opt.label}</div>
                            <div className="text-xs text-[var(--text-muted)]">{opt.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--bg-surface)] space-y-1 text-sm">
                <div><span className="text-[var(--text-muted)]">الملفات:</span> <span className="font-mono text-xs" dir="ltr">{data.binariesPath as string}</span></div>
                <div><span className="text-[var(--text-muted)]">البيانات:</span> <span className="font-mono text-xs" dir="ltr">{data.serverDataPath as string}</span></div>
            </div>

            <Button onClick={doSave} disabled={loading || !name} variant="success" className="w-full">
                {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> جارِ الحفظ...</>
                ) : (
                    <><Save className="h-4 w-4" /> حفظ وإكمال الإعداد</>
                )}
            </Button>
        </div>
    );
}

function CompleteStep() {
    return (
        <div className="text-center space-y-4 py-6">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
                <CheckCircle2 className="h-16 w-16 text-[var(--success)] mx-auto" />
            </motion.div>
            <h2 className="text-xl font-bold">تم الإعداد بنجاح! 🎉</h2>
            <p className="text-[var(--text-secondary)]">
                SaifControl جاهز للعمل. سيتم تحويلك للوحة التحكم.
            </p>
            <Button
                variant="default"
                className="mt-4"
                onClick={() => window.location.href = '/login'}
            >
                الانتقال لتسجيل الدخول
            </Button>
        </div>
    );
}
