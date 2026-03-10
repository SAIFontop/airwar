// ─── Server Types ──────────────────────────────────────────────
export enum ServerStatus {
    ONLINE = 'online',
    OFFLINE = 'offline',
    STARTING = 'starting',
    STOPPING = 'stopping',
    CRASHED = 'crashed',
    RESTARTING = 'restarting',
    UPDATING = 'updating',
}

export interface ServerConfig {
    id: string;
    name: string;
    hostname: string;
    port: number;
    maxPlayers: number;
    gameBuild: string;
    txDataPath: string;
    serverDataPath: string;
    cfgPath: string;
    autoRestart: boolean;
    scheduledRestarts: string[];
    tags: string[];
    clusterId?: string;
}

export interface ServerInstance {
    id: string;
    config: ServerConfig;
    status: ServerStatus;
    pid?: number;
    uptime: number;
    playersOnline: number;
    maxPlayers: number;
    resources: ResourceInfo[];
    lastHealthCheck: number;
    version: string;
}

export interface ServerMetrics {
    serverId: string;
    timestamp: number;
    cpu: number;
    memory: number;
    memoryTotal: number;
    networkIn: number;
    networkOut: number;
    diskRead: number;
    diskWrite: number;
    tickRate: number;
    playerCount: number;
    resourceCount: number;
    scriptExecutionTime: number;
    threadCount: number;
}

export interface ServerHealthCheck {
    serverId: string;
    timestamp: number;
    healthy: boolean;
    latency: number;
    checks: {
        process: boolean;
        network: boolean;
        tickrate: boolean;
        memory: boolean;
    };
}

// ─── Resource Types ────────────────────────────────────────────
export enum ResourceState {
    STARTED = 'started',
    STOPPED = 'stopped',
    STARTING = 'starting',
    STOPPING = 'stopping',
    ERROR = 'error',
    UNLOADED = 'unloaded',
}

export interface ResourceInfo {
    name: string;
    state: ResourceState;
    version?: string;
    author?: string;
    description?: string;
    path: string;
    dependencies: string[];
    dependents: string[];
    cpuUsage: number;
    memoryUsage: number;
    tickTime: number;
    errorCount: number;
    lastError?: string;
    lastRestart?: number;
}

export interface ResourceProfileData {
    name: string;
    cpuHistory: TimeSeriesPoint[];
    memoryHistory: TimeSeriesPoint[];
    tickTimeHistory: TimeSeriesPoint[];
    errorHistory: TimeSeriesPoint[];
}

// ─── Player Types ──────────────────────────────────────────────
export interface PlayerIdentifiers {
    steam?: string;
    license?: string;
    license2?: string;
    discord?: string;
    fivem?: string;
    xbl?: string;
    live?: string;
    ip?: string;
}

export interface Player {
    id: number;
    serverId: string;
    name: string;
    identifiers: PlayerIdentifiers;
    ping: number;
    position: { x: number; y: number; z: number };
    heading: number;
    health: number;
    armor: number;
    sessionStart: number;
    totalPlaytime: number;
    joinCount: number;
    lastSeen: number;
    notes: string[];
    flags: string[];
    isBanned: boolean;
    banExpiry?: number;
    banReason?: string;
}

export interface PlayerAction {
    id: string;
    playerId: number;
    adminId: string;
    type: 'kick' | 'ban' | 'warn' | 'mute' | 'freeze' | 'teleport' | 'spectate' | 'unban';
    reason: string;
    timestamp: number;
    duration?: number;
    metadata?: Record<string, unknown>;
}

// ─── Log Types ─────────────────────────────────────────────────
export enum LogLevel {
    TRACE = 'trace',
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal',
}

export interface LogEntry {
    id: string;
    serverId: string;
    timestamp: number;
    level: LogLevel;
    source: string;
    message: string;
    resource?: string;
    stackTrace?: string;
    metadata?: Record<string, unknown>;
}

export interface LogFilter {
    serverId?: string;
    level?: LogLevel[];
    source?: string;
    resource?: string;
    search?: string;
    regex?: string;
    from?: number;
    to?: number;
    limit?: number;
    offset?: number;
}

// ─── Automation Types ──────────────────────────────────────────
export enum AutomationTrigger {
    CPU_SPIKE = 'cpu_spike',
    MEMORY_LEAK = 'memory_leak',
    TICKRATE_DROP = 'tickrate_drop',
    SCRIPT_CRASH = 'script_crash',
    PLAYER_THRESHOLD = 'player_threshold',
    SCHEDULE = 'schedule',
    SERVER_CRASH = 'server_crash',
    CUSTOM_EVENT = 'custom_event',
}

export enum AutomationAction {
    RESTART_RESOURCE = 'restart_resource',
    RESTART_SERVER = 'restart_server',
    STOP_RESOURCE = 'stop_resource',
    NOTIFY_ADMIN = 'notify_admin',
    ROLLBACK = 'rollback',
    EXECUTE_COMMAND = 'execute_command',
    WEBHOOK = 'webhook',
}

export interface AutomationRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    trigger: {
        type: AutomationTrigger;
        conditions: Record<string, unknown>;
        cooldown: number;
    };
    actions: {
        type: AutomationAction;
        params: Record<string, unknown>;
        order: number;
    }[];
    serverId?: string;
    lastTriggered?: number;
    triggerCount: number;
    createdAt: number;
    updatedAt: number;
}

// ─── Alert Types ───────────────────────────────────────────────
export enum AlertSeverity {
    INFO = 'info',
    WARNING = 'warning',
    CRITICAL = 'critical',
}

export interface Alert {
    id: string;
    serverId: string;
    severity: AlertSeverity;
    title: string;
    message: string;
    timestamp: number;
    acknowledged: boolean;
    acknowledgedBy?: string;
    resolvedAt?: number;
    metadata?: Record<string, unknown>;
}

// ─── Auth Types ────────────────────────────────────────────────
export enum UserRole {
    OWNER = 'owner',
    ADMINISTRATOR = 'administrator',
    DEVELOPER = 'developer',
    MODERATOR = 'moderator',
    OBSERVER = 'observer',
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    avatar?: string;
    permissions: string[];
    mfaEnabled: boolean;
    lastLogin: number;
    createdAt: number;
}

export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: number;
    ipAddress: string;
    userAgent: string;
    createdAt: number;
}

// ─── Event Types ───────────────────────────────────────────────
export enum EventType {
    SERVER_START = 'server.start',
    SERVER_STOP = 'server.stop',
    SERVER_CRASH = 'server.crash',
    SERVER_RESTART = 'server.restart',
    PLAYER_JOIN = 'player.join',
    PLAYER_LEAVE = 'player.leave',
    PLAYER_KICK = 'player.kick',
    PLAYER_BAN = 'player.ban',
    RESOURCE_START = 'resource.start',
    RESOURCE_STOP = 'resource.stop',
    RESOURCE_ERROR = 'resource.error',
    AUTOMATION_TRIGGER = 'automation.trigger',
    ADMIN_ACTION = 'admin.action',
    ALERT_FIRED = 'alert.fired',
    METRIC_THRESHOLD = 'metric.threshold',
}

export interface SystemEvent {
    id: string;
    type: EventType;
    serverId?: string;
    timestamp: number;
    data: Record<string, unknown>;
    source: string;
}

// ─── Common Types ──────────────────────────────────────────────
export interface TimeSeriesPoint {
    timestamp: number;
    value: number;
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}

// ─── WebSocket Message Types ───────────────────────────────────
export enum WsMessageType {
    SUBSCRIBE = 'subscribe',
    UNSUBSCRIBE = 'unsubscribe',
    SERVER_METRICS = 'server.metrics',
    SERVER_STATUS = 'server.status',
    CONSOLE_OUTPUT = 'console.output',
    CONSOLE_INPUT = 'console.input',
    PLAYER_UPDATE = 'player.update',
    RESOURCE_UPDATE = 'resource.update',
    ALERT = 'alert',
    EVENT = 'event',
    HEARTBEAT = 'heartbeat',
}

export interface WsMessage<T = unknown> {
    type: WsMessageType;
    channel?: string;
    payload: T;
    timestamp: number;
}

// ─── File System Types ─────────────────────────────────────────
export interface FileEntry {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size: number;
    modified: number;
    permissions: string;
}

export interface FileContent {
    path: string;
    content: string;
    encoding: string;
    size: number;
    modified: number;
}

// ─── Plugin Types ──────────────────────────────────────────────
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    author: string;
    description: string;
    permissions: string[];
    hooks: string[];
    dependencies: Record<string, string>;
    entrypoint: string;
}

export interface PluginInstance {
    manifest: PluginManifest;
    enabled: boolean;
    loaded: boolean;
    error?: string;
    installedAt: number;
}

// ─── Dashboard Widget Types ────────────────────────────────────
export enum WidgetType {
    SERVER_HEALTH = 'server_health',
    PLAYERS_ONLINE = 'players_online',
    CPU_GAUGE = 'cpu_gauge',
    MEMORY_GAUGE = 'memory_gauge',
    TICKRATE = 'tickrate',
    NETWORK_IO = 'network_io',
    RECENT_INCIDENTS = 'recent_incidents',
    ACTIVE_ALERTS = 'active_alerts',
    CONSOLE_PREVIEW = 'console_preview',
    PLAYER_MAP = 'player_map',
    RESOURCE_PROFILER = 'resource_profiler',
    TIMELINE = 'timeline',
}

export interface DashboardLayout {
    id: string;
    name: string;
    widgets: {
        id: string;
        type: WidgetType;
        position: { x: number; y: number; w: number; h: number };
        config: Record<string, unknown>;
    }[];
}
