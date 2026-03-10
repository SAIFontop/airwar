import { z } from 'zod';

// ─── State Schema ───
export const StateSchema = z.object({
    schemaVersion: z.number().int().positive(),
    setupCompleted: z.boolean(),
    setupStep: z.number().int().min(0).optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

// ─── Server Profile ───
export const ServerProfileSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    fxServerBinariesPath: z.string().min(1),
    serverDataPath: z.string().min(1),
    managementMode: z.enum(['systemd', 'process']),
    systemdUnit: z.string().optional(),
    port: z.number().int().min(1).max(65535),
    txAdminDetected: z.boolean(),
    txAdminPort: z.number().int().optional(),
    txDataPath: z.string().optional(),
    panelBridgeInstalled: z.boolean(),
    panelBridgeToken: z.string().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export const ProfilesSchema = z.object({
    schemaVersion: z.number().int().positive(),
    activeProfileId: z.string().uuid().nullable(),
    profiles: z.array(ServerProfileSchema),
    updatedAt: z.string().datetime(),
});

// ─── User Schema ───
export const UserSchema = z.object({
    id: z.string().uuid(),
    username: z.string().min(3).max(50),
    passwordHash: z.string(),
    role: z.enum(['owner', 'admin', 'viewer']),
    twoFactorEnabled: z.boolean(),
    twoFactorSecret: z.string().optional(), // encrypted
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export const UsersSchema = z.object({
    schemaVersion: z.number().int().positive(),
    users: z.array(UserSchema),
    updatedAt: z.string().datetime(),
});

// ─── Session Schema ───
export const SessionSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    refreshToken: z.string(),
    ip: z.string(),
    userAgent: z.string(),
    expiresAt: z.string().datetime(),
    createdAt: z.string().datetime(),
});

export const SessionsSchema = z.object({
    schemaVersion: z.number().int().positive(),
    sessions: z.array(SessionSchema),
    updatedAt: z.string().datetime(),
});

// ─── Audit Log Entry ───
export const AuditEntrySchema = z.object({
    timestamp: z.string().datetime(),
    userId: z.string().uuid().nullable(),
    action: z.string(),
    details: z.record(z.unknown()).optional(),
    ip: z.string().optional(),
    correlationId: z.string().uuid().optional(),
});

// ─── Automation Rules ───
export const AutomationTriggerSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('cron'), cron: z.string() }),
    z.object({ type: z.literal('cpuHigh'), threshold: z.number().min(0).max(100) }),
    z.object({ type: z.literal('memoryHigh'), threshold: z.number().min(0).max(100) }),
    z.object({ type: z.literal('logMatch'), pattern: z.string() }),
    z.object({ type: z.literal('playerCountLow'), threshold: z.number().int().min(0) }),
    z.object({ type: z.literal('crashDetected') }),
]);

export const AutomationActionSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('server.start') }),
    z.object({ type: z.literal('server.stop') }),
    z.object({ type: z.literal('server.restart'), reason: z.string().optional() }),
    z.object({ type: z.literal('command.exec'), command: z.string() }),
    z.object({ type: z.literal('backup.create') }),
    z.object({ type: z.literal('notify.local'), message: z.string() }),
    z.object({ type: z.literal('announce'), message: z.string() }),
    z.object({ type: z.literal('delay'), ms: z.number().int().positive() }),
]);

export const AutomationConditionSchema = z.object({
    type: z.string(),
    equals: z.unknown().optional(),
    gt: z.number().optional(),
    lt: z.number().optional(),
});

export const AutomationRuleSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(200),
    enabled: z.boolean(),
    trigger: AutomationTriggerSchema,
    conditions: z.array(AutomationConditionSchema),
    actions: z.array(AutomationActionSchema).min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export const AutomationRulesSchema = z.object({
    schemaVersion: z.number().int().positive(),
    rules: z.array(AutomationRuleSchema),
    updatedAt: z.string().datetime(),
});

// ─── Backup Metadata ───
export const BackupEntrySchema = z.object({
    id: z.string().uuid(),
    profileId: z.string().uuid(),
    filename: z.string(),
    size: z.number().int(),
    type: z.enum(['manual', 'scheduled', 'pre-update']),
    createdAt: z.string().datetime(),
});

export const BackupsSchema = z.object({
    schemaVersion: z.number().int().positive(),
    backups: z.array(BackupEntrySchema),
    updatedAt: z.string().datetime(),
});

// ─── Secrets (encrypted at rest) ───
export const SecretsSchema = z.object({
    schemaVersion: z.number().int().positive(),
    jwtSecret: z.string(), // encrypted
    masterKeySalt: z.string(), // hex
    panelBridgeTokens: z.record(z.string()).default({}), // profileId -> encrypted token
    cloudflareToken: z.string().optional(), // encrypted
    updatedAt: z.string().datetime(),
});

// ─── Setup Wizard ───
export const SetupCheckStatus = z.enum(['pass', 'warn', 'fail', 'skip', 'pending']);

export const SetupCheckResultSchema = z.object({
    id: z.string(),
    label: z.string(),
    status: SetupCheckStatus,
    message: z.string(),
    details: z.string().optional(),
    autoFixAvailable: z.boolean(),
});

export const SetupWizardStateSchema = z.object({
    currentStep: z.number().int().min(0),
    totalSteps: z.number().int().positive(),
    checks: z.array(SetupCheckResultSchema),
    profile: ServerProfileSchema.partial().optional(),
});

// ─── server.cfg parsed ───
export const ServerCfgParsedSchema = z.object({
    endpointTcp: z.string().optional(),
    endpointUdp: z.string().optional(),
    port: z.number().int().optional(),
    svLicenseKey: z.string().optional(),
    svLicenseKeyValid: z.boolean(),
    onesync: z.string().optional(),
    svRequestParanoia: z.number().int().optional(),
    ensuredResources: z.array(z.string()),
    rconlogEnsured: z.boolean(),
    rawLines: z.array(z.string()),
});

// ─── WebSocket Events ───
export const WsMessageSchema = z.object({
    event: z.string(),
    data: z.unknown(),
    correlationId: z.string().uuid().optional(),
});
