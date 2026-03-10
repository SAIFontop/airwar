'use client';

import { Button, Card, Input, Progress } from '@/components/ui';
import { setupApi } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowRight,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    FileCode,
    FolderOpen,
    Gamepad2,
    Globe,
    Network,
    Plug,
    Rocket,
    Search,
    UserPlus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

interface StepProps {
    data: Record<string, unknown>;
    setData: (key: string, value: unknown) => void;
    onNext: () => void;
    onBack: () => void;
}

/* ─── Step Definitions ─── */

const steps = [
    { id: 'welcome', label: 'Welcome', icon: Gamepad2 },
    { id: 'scan', label: 'System Scan', icon: Search },
    { id: 'paths', label: 'Server Paths', icon: FolderOpen },
    { id: 'config', label: 'Configuration', icon: FileCode },
    { id: 'ports', label: 'Ports', icon: Network },
    { id: 'connection', label: 'Connection', icon: Globe },
    { id: 'bridge', label: 'Bridge', icon: Plug },
    { id: 'admin', label: 'Admin Account', icon: UserPlus },
    { id: 'summary', label: 'Summary', icon: CheckCircle2 },
    { id: 'complete', label: 'Complete', icon: Rocket },
];

/* ─── Welcome Step ─── */
function WelcomeStep({ onNext }: StepProps) {
    return (
        <div className="flex flex-col items-center text-center max-w-lg mx-auto">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-muted mb-6">
                <Gamepad2 className="h-10 w-10 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">Welcome to SaifControl</h2>
            <p className="text-text-secondary mb-2">
                Enterprise-grade FiveM server management at your fingertips.
            </p>
            <p className="text-sm text-text-muted mb-8">
                This wizard will guide you through the initial setup, scanning your system,
                configuring paths, validating ports, and creating your admin account.
            </p>
            <Button size="xl" onClick={onNext} className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
            </Button>
        </div>
    );
}

/* ─── Scan Step ─── */
function ScanStep({ data, setData, onNext }: StepProps) {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');
    const results = data.scanResults as { results?: unknown[] } | undefined;

    const runScan = async () => {
        setScanning(true);
        setError('');
        try {
            const res = await setupApi.scan();
            setData('scanResults', res);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Scan failed');
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-text-primary mb-2">System Scan</h2>
            <p className="text-sm text-text-secondary mb-6">
                We&apos;ll scan your system to detect existing FiveM server installations.
            </p>
            {!results && (
                <Button onClick={runScan} loading={scanning} size="lg" className="w-full">
                    {scanning ? 'Scanning system...' : 'Start Scan'}
                </Button>
            )}
            {error && (
                <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-danger-muted p-3 text-sm text-danger">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}
            {results && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-success text-sm">
                        <Check className="h-4 w-4" /> Scan complete
                    </div>
                    <pre className="rounded-[var(--radius-md)] bg-bg-input border border-border-primary p-3 text-xs text-text-secondary font-mono overflow-x-auto max-h-48">
                        {JSON.stringify(results, null, 2)}
                    </pre>
                    <Button onClick={onNext} size="lg" className="w-full gap-2">
                        Continue <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

/* ─── Paths Step ─── */
function PathsStep({ data, setData, onNext, onBack }: StepProps) {
    const [binPath, setBinPath] = useState((data.binPath as string) ?? '');
    const [dataPath, setDataPath] = useState((data.dataPath as string) ?? '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [validated, setValidated] = useState(false);

    const validate = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await setupApi.validatePaths(binPath, dataPath);
            setData('binPath', binPath);
            setData('dataPath', dataPath);
            setData('pathValidation', res);
            setValidated(true);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Validation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-text-primary mb-2">Server Paths</h2>
            <p className="text-sm text-text-secondary mb-6">
                Enter the paths to your FiveM server binaries and data directory.
            </p>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Binaries Path</label>
                    <Input
                        value={binPath}
                        onChange={(e) => { setBinPath(e.target.value); setValidated(false); }}
                        placeholder="/home/fivem/fx-server"
                        icon={<FolderOpen className="h-4 w-4" />}
                        className="font-mono text-xs"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Server Data Path</label>
                    <Input
                        value={dataPath}
                        onChange={(e) => { setDataPath(e.target.value); setValidated(false); }}
                        placeholder="/home/fivem/server-data"
                        icon={<FolderOpen className="h-4 w-4" />}
                        className="font-mono text-xs"
                    />
                </div>
                {error && (
                    <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-danger-muted p-3 text-sm text-danger">
                        <AlertTriangle className="h-4 w-4 shrink-0" />{error}
                    </div>
                )}
                {validated && (
                    <div className="flex items-center gap-2 text-success text-sm">
                        <Check className="h-4 w-4" /> Paths validated successfully
                    </div>
                )}
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onBack} className="gap-1">
                        <ChevronLeft className="h-4 w-4" /> Back
                    </Button>
                    {!validated ? (
                        <Button onClick={validate} loading={loading} className="flex-1">
                            Validate Paths
                        </Button>
                    ) : (
                        <Button onClick={onNext} className="flex-1 gap-2">
                            Continue <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Config Step ─── */
function ConfigStep({ data, setData, onNext, onBack }: StepProps) {
    const [cfgPath, setCfgPath] = useState((data.cfgPath as string) ?? '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<unknown>(data.cfgAnalysis ?? null);

    const analyze = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await setupApi.analyzeCfg(cfgPath);
            setData('cfgPath', cfgPath);
            setData('cfgAnalysis', res);
            setResult(res);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-text-primary mb-2">Server Configuration</h2>
            <p className="text-sm text-text-secondary mb-6">
                Point us to your server.cfg file so we can analyze it.
            </p>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Config File Path</label>
                    <Input
                        value={cfgPath}
                        onChange={(e) => { setCfgPath(e.target.value); setResult(null); }}
                        placeholder="/home/fivem/server-data/server.cfg"
                        icon={<FileCode className="h-4 w-4" />}
                        className="font-mono text-xs"
                    />
                </div>
                {error && (
                    <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-danger-muted p-3 text-sm text-danger">
                        <AlertTriangle className="h-4 w-4 shrink-0" />{error}
                    </div>
                )}
                {result !== null && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-success text-sm">
                            <Check className="h-4 w-4" /> Configuration analyzed
                        </div>
                        <pre className="rounded-[var(--radius-md)] bg-bg-input border border-border-primary p-3 text-xs text-text-secondary font-mono overflow-x-auto max-h-32">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onBack} className="gap-1">
                        <ChevronLeft className="h-4 w-4" /> Back
                    </Button>
                    {result === null ? (
                        <Button onClick={analyze} loading={loading} className="flex-1">
                            Analyze Config
                        </Button>
                    ) : (
                        <Button onClick={onNext} className="flex-1 gap-2">
                            Continue <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Ports Step ─── */
function PortsStep({ data, setData, onNext, onBack }: StepProps) {
    const [tcp, setTcp] = useState(String(data.tcpPort ?? '30120'));
    const [udp, setUdp] = useState(String(data.udpPort ?? '30120'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checked, setChecked] = useState(false);

    const check = async () => {
        setLoading(true);
        setError('');
        try {
            await setupApi.checkPorts({ tcp: Number(tcp), udp: Number(udp) });
            setData('tcpPort', Number(tcp));
            setData('udpPort', Number(udp));
            setChecked(true);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Port check failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-text-primary mb-2">Port Configuration</h2>
            <p className="text-sm text-text-secondary mb-6">
                Verify your FiveM server ports are available and not blocked.
            </p>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">TCP Port</label>
                        <Input value={tcp} onChange={(e) => { setTcp(e.target.value); setChecked(false); }} className="font-mono" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">UDP Port</label>
                        <Input value={udp} onChange={(e) => { setUdp(e.target.value); setChecked(false); }} className="font-mono" />
                    </div>
                </div>
                {error && (
                    <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-danger-muted p-3 text-sm text-danger">
                        <AlertTriangle className="h-4 w-4 shrink-0" />{error}
                    </div>
                )}
                {checked && (
                    <div className="flex items-center gap-2 text-success text-sm">
                        <Check className="h-4 w-4" /> Ports are available
                    </div>
                )}
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onBack} className="gap-1">
                        <ChevronLeft className="h-4 w-4" /> Back
                    </Button>
                    {!checked ? (
                        <Button onClick={check} loading={loading} className="flex-1">Check Ports</Button>
                    ) : (
                        <Button onClick={onNext} className="flex-1 gap-2">
                            Continue <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Connection Test Step ─── */
function ConnectionStep({ data, setData, onNext, onBack }: StepProps) {
    const [host, setHost] = useState((data.host as string) ?? 'localhost');
    const [port, setPort] = useState(String(data.infoPort ?? '30120'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<unknown>(null);

    const test = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await setupApi.testInfoJson(host, Number(port));
            setData('host', host);
            setData('infoPort', Number(port));
            setData('connectionResult', res);
            setResult(res);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Connection test failed — make sure your server is running');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-text-primary mb-2">Connection Test</h2>
            <p className="text-sm text-text-secondary mb-6">
                Test connectivity to your FiveM server&apos;s info endpoint.
            </p>
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Host</label>
                        <Input value={host} onChange={(e) => { setHost(e.target.value); setResult(null); }} className="font-mono" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Port</label>
                        <Input value={port} onChange={(e) => { setPort(e.target.value); setResult(null); }} className="font-mono" />
                    </div>
                </div>
                {error && (
                    <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-warning-muted p-3 text-sm text-warning">
                        <AlertTriangle className="h-4 w-4 shrink-0" />{error}
                    </div>
                )}
                {result !== null && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-success text-sm">
                            <Check className="h-4 w-4" /> Connection successful
                        </div>
                    </div>
                )}
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onBack} className="gap-1">
                        <ChevronLeft className="h-4 w-4" /> Back
                    </Button>
                    {result === null ? (
                        <Button onClick={test} loading={loading} className="flex-1">Test Connection</Button>
                    ) : (
                        <Button onClick={onNext} className="flex-1 gap-2">
                            Continue <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Bridge Step ─── */
function BridgeStep({ data, setData, onNext, onBack }: StepProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [installed, setInstalled] = useState(false);

    const install = async () => {
        setLoading(true);
        setError('');
        try {
            await setupApi.installBridge(data.dataPath as string);
            setData('bridgeInstalled', true);
            setInstalled(true);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Bridge installation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-text-primary mb-2">Install Panel Bridge</h2>
            <p className="text-sm text-text-secondary mb-6">
                The panel bridge resource enables real-time communication between the panel and your server.
            </p>
            <Card className="mb-6">
                <div className="flex items-start gap-3">
                    <Plug className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-text-primary">panel_bridge resource</p>
                        <p className="text-xs text-text-muted mt-1">
                            Will be installed to <code className="font-mono text-accent">{String(data.dataPath)}/resources/panel_bridge</code>
                        </p>
                    </div>
                </div>
            </Card>
            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-danger-muted p-3 text-sm text-danger">
                    <AlertTriangle className="h-4 w-4 shrink-0" />{error}
                </div>
            )}
            {installed && (
                <div className="mb-4 flex items-center gap-2 text-success text-sm">
                    <Check className="h-4 w-4" /> Bridge installed successfully
                </div>
            )}
            <div className="flex gap-3">
                <Button variant="secondary" onClick={onBack} className="gap-1">
                    <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                {!installed ? (
                    <Button onClick={install} loading={loading} className="flex-1">Install Bridge</Button>
                ) : (
                    <Button onClick={onNext} className="flex-1 gap-2">
                        Continue <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

/* ─── Admin Account Step ─── */
function AdminStep({ data, setData, onNext, onBack }: StepProps) {
    const [username, setUsername] = useState((data.adminUser as string) ?? '');
    const [password, setPassword] = useState((data.adminPass as string) ?? '');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

    const proceed = () => {
        if (username.length < 3) { setError('Username must be at least 3 characters'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (password !== confirm) { setError('Passwords do not match'); return; }
        setData('adminUser', username);
        setData('adminPass', password);
        onNext();
    };

    return (
        <div className="max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-text-primary mb-2">Create Admin Account</h2>
            <p className="text-sm text-text-secondary mb-6">
                Set up the primary administrator credentials for the panel.
            </p>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Username</label>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" icon={<UserPlus className="h-4 w-4" />} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirm Password</label>
                    <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
                </div>
                {error && (
                    <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-danger-muted p-3 text-sm text-danger">
                        <AlertTriangle className="h-4 w-4 shrink-0" />{error}
                    </div>
                )}
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onBack} className="gap-1">
                        <ChevronLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button onClick={proceed} className="flex-1 gap-2">
                        Continue <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ─── Summary Step ─── */
function SummaryStep({ data, onNext, onBack }: StepProps) {
    const items = [
        { label: 'Binaries Path', value: data.binPath },
        { label: 'Data Path', value: data.dataPath },
        { label: 'Config Path', value: data.cfgPath },
        { label: 'TCP Port', value: data.tcpPort },
        { label: 'UDP Port', value: data.udpPort },
        { label: 'Admin User', value: data.adminUser },
        { label: 'Bridge', value: data.bridgeInstalled ? 'Installed' : 'Skipped' },
    ];

    return (
        <div className="max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-text-primary mb-2">Review & Confirm</h2>
            <p className="text-sm text-text-secondary mb-6">
                Review your configuration before completing the setup.
            </p>
            <div className="rounded-[var(--radius-lg)] border border-border-primary bg-bg-card divide-y divide-border-primary">
                {items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-text-secondary">{item.label}</span>
                        <span className="text-sm font-mono text-text-primary">{String(item.value ?? '—')}</span>
                    </div>
                ))}
            </div>
            <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={onBack} className="gap-1">
                    <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={onNext} className="flex-1 gap-2">
                    Complete Setup <Rocket className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

/* ─── Complete Step ─── */
function CompleteStep({ data }: StepProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const finalize = async () => {
        setSaving(true);
        setError('');
        try {
            await setupApi.saveProfile({
                name: 'default',
                binariesPath: data.binPath as string,
                serverDataPath: data.dataPath as string,
                cfgPath: data.cfgPath as string,
                managementMode: 'standalone',
            });
            await setupApi.complete();
            setDone(true);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Setup completion failed');
        } finally {
            setSaving(false);
        }
    };

    if (done) {
        return (
            <div className="flex flex-col items-center text-center max-w-md mx-auto">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-muted mb-6">
                    <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-3">Setup Complete!</h2>
                <p className="text-text-secondary mb-8">
                    SaifControl is ready. Log in with the admin credentials you just created.
                </p>
                <Button size="xl" onClick={() => router.push('/login')} className="gap-2">
                    Go to Login <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-muted mb-6">
                <Rocket className="h-10 w-10 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">Finalizing Setup</h2>
            <p className="text-text-secondary mb-8">
                Save your configuration and complete the installation.
            </p>
            {error && (
                <div className="mb-4 w-full flex items-center gap-2 rounded-[var(--radius-md)] bg-danger-muted p-3 text-sm text-danger">
                    <AlertTriangle className="h-4 w-4 shrink-0" />{error}
                </div>
            )}
            <Button size="xl" onClick={finalize} loading={saving} className="gap-2">
                {saving ? 'Saving...' : 'Finalize Setup'}
            </Button>
        </div>
    );
}

/* ─── Step Components Map ─── */
const stepComponents = [
    WelcomeStep, ScanStep, PathsStep, ConfigStep, PortsStep,
    ConnectionStep, BridgeStep, AdminStep, SummaryStep, CompleteStep,
];

/* ─── Main Setup Page ─── */
export default function SetupPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setDataState] = useState<Record<string, unknown>>({});

    const setData = useCallback((key: string, value: unknown) => {
        setDataState((prev) => ({ ...prev, [key]: value }));
    }, []);

    const onNext = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
    const onBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

    const StepComponent = stepComponents[currentStep];

    return (
        <div className="min-h-screen bg-bg-primary flex">
            {/* Left sidebar — step progress */}
            <div className="hidden lg:flex w-72 flex-col border-r border-border-primary bg-bg-secondary p-6">
                <div className="flex items-center gap-2 mb-8">
                    <Gamepad2 className="h-6 w-6 text-accent" />
                    <span className="text-sm font-bold text-text-primary">SaifControl Setup</span>
                </div>
                <div className="space-y-1">
                    {steps.map((step, i) => (
                        <div
                            key={step.id}
                            className={`flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors ${i === currentStep
                                    ? 'bg-accent-muted text-accent font-medium'
                                    : i < currentStep
                                        ? 'text-success'
                                        : 'text-text-muted'
                                }`}
                        >
                            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium shrink-0 ${i === currentStep
                                    ? 'bg-accent text-white'
                                    : i < currentStep
                                        ? 'bg-success text-white'
                                        : 'bg-bg-tertiary text-text-muted'
                                }`}>
                                {i < currentStep ? <Check className="h-3 w-3" /> : i + 1}
                            </div>
                            {step.label}
                        </div>
                    ))}
                </div>
                <div className="mt-auto">
                    <Progress value={currentStep} max={steps.length - 1} variant="accent" size="sm" />
                    <p className="text-xs text-text-muted mt-2">
                        Step {currentStep + 1} of {steps.length}
                    </p>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex items-center justify-center p-8">
                {/* Mobile progress */}
                <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-bg-secondary border-b border-border-primary p-3">
                    <Progress value={currentStep} max={steps.length - 1} variant="accent" size="sm" />
                    <p className="text-xs text-text-muted mt-1">Step {currentStep + 1}: {steps[currentStep].label}</p>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-2xl lg:mt-0 mt-16"
                    >
                        <StepComponent data={data} setData={setData} onNext={onNext} onBack={onBack} />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
