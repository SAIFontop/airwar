'use client';

import { api } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Download,
    FolderOpen,
    Gamepad2,
    Loader2,
    Network,
    Search,
    Settings,
    Shield,
    Wrench,
    XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const steps = [
    { id: 'scan', label: 'Scan Server', icon: Search },
    { id: 'paths', label: 'Validate Paths', icon: FolderOpen },
    { id: 'config', label: 'Parse Config', icon: Settings },
    { id: 'ports', label: 'Check Ports', icon: Network },
    { id: 'bridge', label: 'Install Bridge', icon: Download },
    { id: 'account', label: 'Create Account', icon: Shield },
];

export default function SetupPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [scanResults, setScanResults] = useState<Record<string, unknown>[] | null>(null);
    const [selectedPath, setSelectedPath] = useState('');
    const [binariesPath, setBinariesPath] = useState('');
    const [cfgParsed, setCfgParsed] = useState<Record<string, unknown> | null>(null);
    const [portResults, setPortResults] = useState<Record<string, unknown> | null>(null);
    const [bridgeResult, setBridgeResult] = useState<Record<string, unknown> | null>(null);
    const [autoFixResults, setAutoFixResults] = useState<Record<string, unknown>[] | null>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profileName, setProfileName] = useState('Default Server');

    const run = async (fn: () => Promise<void>) => {
        setLoading(true);
        setError('');
        try {
            await fn();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'An error occurred');
        }
        setLoading(false);
    };

    const handleScan = () => run(async () => {
        const res = await api.scanForServer();
        if (res.success && res.data) {
            setScanResults(res.data.candidates || []);
            if (res.data.candidates?.length === 1) {
                setSelectedPath(res.data.candidates[0].serverDataPath || '');
                setBinariesPath(res.data.candidates[0].binariesPath || '');
            }
        } else throw new Error(res.error || 'Scan failed');
    });

    const handleValidate = () => run(async () => {
        if (!selectedPath) throw new Error('Select a server path');
        const res = await api.validatePaths('', selectedPath);
        if (res.success) {
            if (res.data) {
                const cfgRes = await api.analyzeCfg(selectedPath);
                if (cfgRes.success) setCfgParsed(cfgRes.data?.parsed || null);
            }
            setCurrentStep(2);
        } else throw new Error(res.error || 'Validation failed');
    });

    const handlePorts = () => run(async () => {
        const port = cfgParsed?.endpoint ? Number(String(cfgParsed.endpoint).split(':').pop()) : 30120;
        const res = await api.checkPorts(port);
        if (res.success) {
            setPortResults(res.data || null);
            setCurrentStep(3);
        } else throw new Error(res.error || 'Port check failed');
    });

    const handleBridge = () => run(async () => {
        const res = await api.installBridge(selectedPath);
        if (res.success) {
            setBridgeResult(res.data || null);
            setCurrentStep(4);
        } else throw new Error(res.error || 'Bridge install failed');
    });

    const handleAutoFix = () => run(async () => {
        const res = await api.autoFix('all', selectedPath);
        if (res.success) {
            setAutoFixResults(res.data?.results as Record<string, unknown>[] || []);
        } else throw new Error(res.error || 'Auto-fix failed');
    });

    const handleComplete = () => run(async () => {
        if (!username || !password) throw new Error('Fill in username and password');
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (password.length < 8) throw new Error('Password must be at least 8 characters');

        const saveRes = await api.saveProfile({
            name: profileName,
            binariesPath: binariesPath || selectedPath,
            serverDataPath: selectedPath,
            mode: 'process',
        });
        if (!saveRes.success) throw new Error(saveRes.error || 'Failed to save profile');

        const completeRes = await api.completeSetup(username, password);
        if (!completeRes.success) throw new Error(completeRes.error || 'Setup failed');

        router.replace('/login');
    });

    const canNext = () => {
        switch (currentStep) {
            case 0: return !!selectedPath;
            case 1: return cfgParsed;
            case 2: return portResults;
            case 3: return bridgeResult;
            case 4: return true;
            case 5: return username && password && password === confirmPassword;
            default: return false;
        }
    };

    return (
        <div className="min-h-screen mesh-bg relative overflow-hidden">
            <div className="absolute inset-0 dot-grid opacity-20" />
            <div className="relative z-10 max-w-3xl mx-auto py-12 px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
                        <Gamepad2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-text">Setup Wizard</h1>
                    <p className="text-muted mt-2">Configure your FiveM server management</p>
                </motion.div>

                {/* Step Indicators */}
                <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
                    {steps.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${i === currentStep ? 'bg-primary/20 text-primary border border-primary/30' :
                                i < currentStep ? 'bg-success/15 text-success' :
                                    'bg-white/5 text-muted'
                                }`}>
                                {i < currentStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">{s.label}</span>
                            </div>
                            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-muted/30" />}
                        </div>
                    ))}
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm text-danger flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Step Content */}
                <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 space-y-6">
                    {/* Step 0: Scan */}
                    {currentStep === 0 && (
                        <>
                            <h2 className="text-lg font-bold text-text">Scan for FiveM Servers</h2>
                            <p className="text-sm text-muted">We&apos;ll scan your system for existing FXServer installations.</p>
                            <button onClick={handleScan} disabled={loading} className="btn-primary">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                {scanResults ? 'Re-scan' : 'Start Scan'}
                            </button>
                            {scanResults && (
                                <div className="space-y-3 mt-4">
                                    {scanResults.length === 0 ? (
                                        <p className="text-sm text-warning flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> No installations found. Enter the path manually below.
                                        </p>
                                    ) : (
                                        scanResults.map((inst, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { setSelectedPath(String(inst.serverDataPath || inst.path || '')); setBinariesPath(String(inst.binariesPath || '')); }}
                                                className={`w-full text-left p-4 rounded-xl border transition ${selectedPath === String(inst.serverDataPath || inst.path || '')
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border hover:border-primary/50 bg-white/5'
                                                    }`}
                                            >
                                                <p className="text-sm font-medium text-text">{String(inst.path || inst.serverDataPath || 'Unknown')}</p>
                                                {inst.serverDataPath ? <p className="text-xs text-muted mt-1">Data: {String(inst.serverDataPath)}</p> : null}
                                            </button>
                                        ))
                                    )}
                                    <div>
                                        <label className="text-sm font-medium text-muted block mb-2">Or enter path manually</label>
                                        <input
                                            value={selectedPath}
                                            onChange={(e) => setSelectedPath(e.target.value)}
                                            className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm"
                                            placeholder="/home/user/FXServer/server-data"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Step 1: Validate */}
                    {currentStep === 1 && (
                        <>
                            <h2 className="text-lg font-bold text-text">Validate Configuration</h2>
                            <p className="text-sm text-muted">Analyzing server config at: <code className="text-primary">{selectedPath}</code></p>
                            <button onClick={handleValidate} disabled={loading} className="btn-primary">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
                                Validate & Parse Config
                            </button>
                            {cfgParsed && (
                                <div className="bg-white/5 rounded-xl p-4 text-sm space-y-2">
                                    {Object.entries(cfgParsed).map(([k, v]) => (
                                        <div key={k} className="flex justify-between">
                                            <span className="text-muted">{k}</span>
                                            <span className="text-text font-mono text-xs">{String(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Step 2: Ports */}
                    {currentStep === 2 && (
                        <>
                            <h2 className="text-lg font-bold text-text">Port Check</h2>
                            <p className="text-sm text-muted">Verifying required ports are available.</p>
                            <button onClick={handlePorts} disabled={loading} className="btn-primary">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
                                Check Ports
                            </button>
                            {portResults && (
                                <div className="bg-white/5 rounded-xl p-4 text-sm space-y-2">
                                    {Object.entries(portResults).map(([k, v]) => (
                                        <div key={k} className="flex items-center justify-between">
                                            <span className="text-muted">{k}</span>
                                            <span className={typeof v === 'boolean' ? (v ? 'text-success' : 'text-danger') : 'text-text'}>
                                                {typeof v === 'boolean' ? (v ? 'OK' : 'Fail') : String(v)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Step 3: Bridge */}
                    {currentStep === 3 && (
                        <>
                            <h2 className="text-lg font-bold text-text">Install Panel Bridge</h2>
                            <p className="text-sm text-muted">Install the panel_bridge resource to enable player/resource management.</p>
                            <button onClick={handleBridge} disabled={loading} className="btn-primary">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Install Bridge
                            </button>
                            {bridgeResult && (
                                <div className="bg-success/10 border border-success/30 rounded-xl px-4 py-3 text-sm text-success flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Bridge installed successfully
                                </div>
                            )}
                            <div className="pt-4 border-t border-border">
                                <button onClick={handleAutoFix} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning/15 text-warning hover:bg-warning/25 transition text-sm font-medium">
                                    <Wrench className="w-4 h-4" /> Run Auto-Fix
                                </button>
                                {autoFixResults && autoFixResults.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {autoFixResults.map((fix, i) => (
                                            <div key={i} className="bg-white/5 rounded-lg p-3 text-xs">
                                                <span className={fix.success ? 'text-success' : 'text-danger'}>{fix.success ? '✓' : '✗'}</span>{' '}
                                                <span className="text-text">{String(fix.message || fix.action || '')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Step 4: Profile save (intermediate) */}
                    {currentStep === 4 && (
                        <>
                            <h2 className="text-lg font-bold text-text">Profile Name</h2>
                            <p className="text-sm text-muted">Name this server profile.</p>
                            <input
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm"
                                placeholder="My FiveM Server"
                            />
                        </>
                    )}

                    {/* Step 5: Account */}
                    {currentStep === 5 && (
                        <>
                            <h2 className="text-lg font-bold text-text">Create Admin Account</h2>
                            <p className="text-sm text-muted">Create the owner account for your panel.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted block mb-2">Username</label>
                                    <input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm"
                                        placeholder="admin"
                                        autoComplete="username"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted block mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm"
                                        placeholder="Minimum 8 characters"
                                        autoComplete="new-password"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted block mb-2">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full rounded-xl bg-white/5 border border-border px-4 py-3 text-text text-sm"
                                        placeholder="Repeat password"
                                        autoComplete="new-password"
                                    />
                                    {confirmPassword && password !== confirmPassword && (
                                        <p className="text-xs text-danger mt-1">Passwords do not match</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-border text-muted hover:text-text transition text-sm disabled:opacity-30"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>

                    {currentStep < steps.length - 1 ? (
                        <button
                            onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
                            disabled={!canNext()}
                            className="btn-primary"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button onClick={handleComplete} disabled={loading || !canNext()} className="btn-primary">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Complete Setup
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
