// ─── مسارات التخزين الافتراضية ───
export const DEFAULT_DATA_DIR = '~/.saifcontrol';
export const DEFAULT_FXSERVER_PORT = 30120;
export const DEFAULT_TXADMIN_PORT = 40120;
export const DEFAULT_API_PORT = 4800;
export const DEFAULT_WEB_PORT = 3000;

// ─── أسماء ملفات التخزين ───
export const STORAGE_FILES = {
    STATE: 'state.json',
    PROFILES: 'profiles.json',
    USERS: 'users.json',
    SESSIONS: 'sessions.json',
    AUDIT: 'audit.log.jsonl',
    AUTOMATION: 'automation.rules.json',
    BACKUPS: 'backups.json',
    SECRETS: 'secrets.enc.json',
    BANS: 'bans.json',
    WEBHOOKS: 'webhooks.json',
    ALERTS: 'alerts.json',
} as const;

// ─── إصدارات المخططات ───
export const SCHEMA_VERSIONS = {
    STATE: 1,
    PROFILES: 1,
    USERS: 1,
    SESSIONS: 1,
    AUTOMATION: 1,
    BACKUPS: 1,
    SECRETS: 1,
} as const;

// ─── أوامر FXServer الموثقة رسمياً ───
export const FXSERVER_COMMANDS = [
    'start',
    'stop',
    'ensure',
    'restart',
    'refresh',
    'status',
    'clientkick',
    'say',
    'exec',
    'quit',
] as const;

// ─── أدوار RBAC ───
export const RBAC_ROLES = ['owner', 'admin', 'viewer'] as const;

// ─── JWT ───
export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '7d';

// ─── Automation Triggers ───
export const AUTOMATION_TRIGGERS = [
    'cron',
    'cpuHigh',
    'memoryHigh',
    'logMatch',
    'playerCountLow',
    'crashDetected',
] as const;

export const AUTOMATION_ACTIONS = [
    'server.start',
    'server.stop',
    'server.restart',
    'command.exec',
    'backup.create',
    'notify.local',
    'announce',
    'delay',
] as const;
