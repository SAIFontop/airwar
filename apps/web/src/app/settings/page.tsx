'use client';

import { cn } from '@/lib/utils';
import {
    Bell,
    Database,
    Save,
    Settings,
    Shield
} from 'lucide-react';
import { useState } from 'react';

type SettingsTab = 'general' | 'security' | 'notifications' | 'advanced';

const settingsTabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'advanced', label: 'Advanced', icon: Database },
];

function InputField({ label, value, type = 'text', placeholder }: { label: string; value: string; type?: string; placeholder?: string }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">{label}</label>
            <input
                type={type}
                defaultValue={value}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
        </div>
    );
}

function Toggle({ label, description, defaultChecked = false }: { label: string; description: string; defaultChecked?: boolean }) {
    const [checked, setChecked] = useState(defaultChecked);
    return (
        <div className="flex items-start justify-between gap-4 py-3">
            <div>
                <div className="text-sm font-medium text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
            </div>
            <button
                onClick={() => setChecked(!checked)}
                className={cn(
                    'w-9 h-5 rounded-full transition-colors shrink-0',
                    checked ? 'bg-primary' : 'bg-border',
                )}
            >
                <div className={cn('w-4 h-4 rounded-full bg-white transition-transform mx-0.5', checked && 'translate-x-4')} />
            </button>
        </div>
    );
}

function GeneralSettings() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-medium text-foreground mb-4">Panel Settings</h3>
                <div className="space-y-4">
                    <InputField label="Panel Name" value="Saif Control" />
                    <InputField label="Panel URL" value="https://control.example.com" />
                    <InputField label="Default Server Data Path" value="/home/fivem/server-data" />
                </div>
            </div>
            <div className="border-t border-border pt-6">
                <h3 className="text-sm font-medium text-foreground mb-4">User Profile</h3>
                <div className="space-y-4">
                    <InputField label="Display Name" value="Admin" />
                    <InputField label="Email" value="admin@example.com" type="email" />
                </div>
            </div>
            <div className="border-t border-border pt-6">
                <h3 className="text-sm font-medium text-foreground mb-4">Appearance</h3>
                <Toggle label="Dark Mode" description="Use dark theme across the panel" defaultChecked={true} />
                <Toggle label="Compact Sidebar" description="Start with a collapsed sidebar by default" defaultChecked={false} />
                <Toggle label="Animations" description="Enable smooth transitions and animations" defaultChecked={true} />
            </div>
        </div>
    );
}

function SecuritySettings() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-medium text-foreground mb-4">Authentication</h3>
                <div className="space-y-4">
                    <InputField label="Session Timeout (minutes)" value="60" type="number" />
                </div>
                <div className="mt-4">
                    <Toggle label="Two-Factor Authentication" description="Require 2FA for all admin accounts" defaultChecked={false} />
                    <Toggle label="IP Whitelist" description="Restrict panel access to specific IP addresses" defaultChecked={false} />
                </div>
            </div>
            <div className="border-t border-border pt-6">
                <h3 className="text-sm font-medium text-foreground mb-4">API Keys</h3>
                <div className="glass-panel p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-foreground">Production API Key</div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">sk-••••••••••••••••</div>
                        </div>
                        <button className="text-xs text-primary hover:underline">Regenerate</button>
                    </div>
                </div>
            </div>
            <div className="border-t border-border pt-6">
                <h3 className="text-sm font-medium text-foreground mb-4">Change Password</h3>
                <div className="space-y-4">
                    <InputField label="Current Password" value="" type="password" placeholder="Enter current password" />
                    <InputField label="New Password" value="" type="password" placeholder="Enter new password" />
                    <InputField label="Confirm Password" value="" type="password" placeholder="Confirm new password" />
                </div>
            </div>
        </div>
    );
}

function NotificationSettings() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-medium text-foreground mb-4">Alert Notifications</h3>
                <Toggle label="Critical Alerts" description="Receive notifications for critical severity alerts" defaultChecked={true} />
                <Toggle label="Warning Alerts" description="Receive notifications for warning severity alerts" defaultChecked={true} />
                <Toggle label="Info Alerts" description="Receive notifications for informational alerts" defaultChecked={false} />
            </div>
            <div className="border-t border-border pt-6">
                <h3 className="text-sm font-medium text-foreground mb-4">Channels</h3>
                <Toggle label="In-App Notifications" description="Show notification badge and toast messages" defaultChecked={true} />
                <Toggle label="Discord Webhook" description="Send alerts to a Discord channel" defaultChecked={false} />
                <Toggle label="Email Notifications" description="Send alert emails to your registered address" defaultChecked={false} />
            </div>
            <div className="border-t border-border pt-6">
                <h3 className="text-sm font-medium text-foreground mb-4">Discord Webhook</h3>
                <InputField label="Webhook URL" value="" placeholder="https://discord.com/api/webhooks/..." />
            </div>
        </div>
    );
}

function AdvancedSettings() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-medium text-foreground mb-4">Database</h3>
                <InputField label="Database URL" value="postgresql://localhost:5432/saifcontrol" />
                <div className="mt-3">
                    <InputField label="Redis URL" value="redis://localhost:6379" />
                </div>
            </div>
            <div className="border-t border-border pt-6">
                <h3 className="text-sm font-medium text-foreground mb-4">Performance</h3>
                <Toggle label="Metrics Retention" description="Keep metrics data for 30 days (else 7 days)" defaultChecked={true} />
                <Toggle label="Log Retention" description="Keep log entries for 30 days (else 7 days)" defaultChecked={true} />
                <Toggle label="Debug Mode" description="Enable verbose logging for troubleshooting" defaultChecked={false} />
            </div>
            <div className="border-t border-border pt-6">
                <h3 className="text-sm font-medium text-foreground mb-4">Danger Zone</h3>
                <div className="glass-panel border-red-500/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-foreground">Reset All Settings</div>
                            <div className="text-xs text-muted-foreground">Reset all panel settings to their defaults</div>
                        </div>
                        <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                            Reset
                        </button>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                        <div>
                            <div className="text-sm font-medium text-foreground">Delete All Data</div>
                            <div className="text-xs text-muted-foreground">Permanently delete all data including servers, players, and logs</div>
                        </div>
                        <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const tabContent: Record<SettingsTab, React.ComponentType> = {
    general: GeneralSettings,
    security: SecuritySettings,
    notifications: NotificationSettings,
    advanced: AdvancedSettings,
};

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const ActiveContent = tabContent[activeTab];

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
                    <p className="text-sm text-muted-foreground mt-1">Configure your Saif Control panel</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr] gap-6">
                {/* Tab nav */}
                <div className="flex xl:flex-col gap-1">
                    {settingsTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left',
                                activeTab === tab.id
                                    ? 'bg-accent/50 text-foreground font-medium'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/30',
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="glass-panel p-6">
                    <ActiveContent />
                </div>
            </div>
        </div>
    );
}
