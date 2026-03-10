import { z } from 'zod';
import {
    AlertEntrySchema,
    AlertsSchema,
    AuditEntrySchema,
    AutomationActionSchema,
    AutomationRuleSchema,
    AutomationRulesSchema,
    AutomationTriggerSchema,
    BackupEntrySchema,
    BackupsSchema,
    BanEntrySchema,
    BansSchema,
    ProfilesSchema,
    SecretsSchema,
    ServerCfgParsedSchema,
    ServerProfileSchema,
    SessionSchema,
    SessionsSchema,
    SetupCheckResultSchema,
    SetupWizardStateSchema,
    StateSchema,
    UserSchema,
    UsersSchema,
    WebhookConfigSchema,
    WsMessageSchema,
} from '../schemas/index.js';

// ─── Inferred types from Zod schemas ───
export type State = z.infer<typeof StateSchema>;
export type Profiles = z.infer<typeof ProfilesSchema>;
export type ServerProfile = z.infer<typeof ServerProfileSchema>;
export type Users = z.infer<typeof UsersSchema>;
export type User = z.infer<typeof UserSchema>;
export type Sessions = z.infer<typeof SessionsSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type AutomationRules = z.infer<typeof AutomationRulesSchema>;
export type AutomationRule = z.infer<typeof AutomationRuleSchema>;
export type AutomationTrigger = z.infer<typeof AutomationTriggerSchema>;
export type AutomationAction = z.infer<typeof AutomationActionSchema>;
export type Backups = z.infer<typeof BackupsSchema>;
export type BackupEntry = z.infer<typeof BackupEntrySchema>;
export type Secrets = z.infer<typeof SecretsSchema>;
export type SetupCheckResult = z.infer<typeof SetupCheckResultSchema>;
export type SetupWizardState = z.infer<typeof SetupWizardStateSchema>;
export type ServerCfgParsed = z.infer<typeof ServerCfgParsedSchema>;
export type WsMessage = z.infer<typeof WsMessageSchema>;
export type BanEntry = z.infer<typeof BanEntrySchema>;
export type Bans = z.infer<typeof BansSchema>;
export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;
export type AlertEntry = z.infer<typeof AlertEntrySchema>;
export type Alerts = z.infer<typeof AlertsSchema>;

// ─── Additional types ───
export type RbacRole = 'owner' | 'admin' | 'viewer';

export type ServerStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'crashed' | 'unknown';

export type ManagementMode = 'systemd' | 'process';

export interface SystemMetrics {
    cpuPercent: number;
    memoryUsedMb: number;
    memoryTotalMb: number;
    diskUsedGb: number;
    diskTotalGb: number;
    networkRxBytes: number;
    networkTxBytes: number;
    uptime: number;
}

export interface FxServerInfo {
    hostname?: string;
    clients?: number;
    maxClients?: number;
    mapname?: string;
    gametype?: string;
    resources?: string[];
    vars?: Record<string, string>;
}

export interface PlayerInfo {
    id: number;
    name: string;
    identifiers: string[];
    ping: number;
}

export interface ResourceInfo {
    name: string;
    status: 'started' | 'stopped' | 'unknown';
    description?: string;
    version?: string;
    author?: string;
}

// ─── API types ───
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    total: number;
    page: number;
    limit: number;
}

export interface LoginRequest {
    username: string;
    password: string;
    totpCode?: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: Omit<User, 'passwordHash' | 'twoFactorSecret'>;
}

// ─── WebSocket event types ───
export type WsEventType =
    | 'console:line'
    | 'console:clear'
    | 'server:status'
    | 'server:metrics'
    | 'players:update'
    | 'resources:update'
    | 'notification'
    | 'setup:progress'
    | 'setup:check'
    | 'command:execute'
    | 'command:result';

export interface WsConsoleLineEvent {
    event: 'console:line';
    data: { line: string; timestamp: string };
}

export interface WsServerStatusEvent {
    event: 'server:status';
    data: { status: ServerStatus; info?: FxServerInfo };
}

export interface WsMetricsEvent {
    event: 'server:metrics';
    data: SystemMetrics;
}
