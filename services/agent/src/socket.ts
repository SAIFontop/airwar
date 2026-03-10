import WebSocket from 'ws';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export class AgentSocket {
    private ws: WebSocket | null = null;
    private url: string;
    private token: string;
    private serverId: string;
    private reconnectMs = 5000;
    private maxReconnectMs = 60000;
    private currentReconnectMs: number;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private state: ConnectionState = 'disconnected';
    private onMessage: (data: any) => void;

    constructor(
        url: string,
        token: string,
        serverId: string,
        onMessage: (data: any) => void,
    ) {
        this.url = url;
        this.token = token;
        this.serverId = serverId;
        this.currentReconnectMs = this.reconnectMs;
        this.onMessage = onMessage;
    }

    connect(): void {
        if (this.state === 'connecting') return;
        this.state = 'connecting';

        console.log(`[agent] Connecting to ${this.url}...`);

        this.ws = new WebSocket(this.url, {
            headers: {
                authorization: `Bearer ${this.token}`,
                'x-server-id': this.serverId,
            },
        });

        this.ws.on('open', () => {
            this.state = 'connected';
            this.currentReconnectMs = this.reconnectMs;
            console.log('[agent] Connected to Saif Control API');

            this.send({ type: 'agent:hello', serverId: this.serverId, timestamp: Date.now() });
        });

        this.ws.on('message', (raw: WebSocket.Data) => {
            try {
                const msg = JSON.parse(raw.toString());
                this.onMessage(msg);
            } catch {
                // ignore malformed messages
            }
        });

        this.ws.on('close', (code: number) => {
            this.state = 'disconnected';
            console.log(`[agent] Disconnected (code: ${code}), reconnecting in ${this.currentReconnectMs}ms`);
            this.scheduleReconnect();
        });

        this.ws.on('error', (err: Error) => {
            console.error('[agent] WebSocket error:', err.message);
        });
    }

    send(data: Record<string, unknown>): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    getState(): ConnectionState {
        return this.state;
    }

    disconnect(): void {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        if (this.ws) {
            this.ws.close(1000);
            this.ws = null;
        }
        this.state = 'disconnected';
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, this.currentReconnectMs);

        // Exponential backoff, capped
        this.currentReconnectMs = Math.min(this.currentReconnectMs * 2, this.maxReconnectMs);
    }
}
