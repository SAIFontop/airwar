import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';

interface ClientSubscription {
    channels: Set<string>;
}

@WebSocketGateway({
    cors: { origin: '*' },
    path: '/ws',
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(AppGateway.name);
    private clients = new Map<WebSocket, ClientSubscription>();

    handleConnection(client: WebSocket) {
        this.clients.set(client, { channels: new Set() });
        this.logger.log(`Client connected. Total: ${this.clients.size}`);
    }

    handleDisconnect(client: WebSocket) {
        this.clients.delete(client);
        this.logger.log(`Client disconnected. Total: ${this.clients.size}`);
    }

    @SubscribeMessage('subscribe')
    handleSubscribe(
        @ConnectedSocket() client: WebSocket,
        @MessageBody() data: { channel: string },
    ) {
        const sub = this.clients.get(client);
        if (sub) {
            sub.channels.add(data.channel);
            this.logger.debug(`Client subscribed to ${data.channel}`);
        }
    }

    @SubscribeMessage('unsubscribe')
    handleUnsubscribe(
        @ConnectedSocket() client: WebSocket,
        @MessageBody() data: { channel: string },
    ) {
        const sub = this.clients.get(client);
        if (sub) {
            sub.channels.delete(data.channel);
        }
    }

    @SubscribeMessage('console.input')
    handleConsoleInput(
        @MessageBody() data: { serverId: string; command: string },
    ) {
        // This will be handled by the server service through the event emitter
        return { event: 'console.input.ack', data: { success: true } };
    }

    // ─── Event Handlers ──────────────────────────────────────────
    @OnEvent('metrics.updated')
    broadcastMetrics(metrics: { serverId: string }) {
        this.broadcast(`metrics:${metrics.serverId}`, {
            type: 'server.metrics',
            payload: metrics,
            timestamp: Date.now(),
        });
    }

    @OnEvent('console.output')
    broadcastConsole(data: { serverId: string; data: string }) {
        this.broadcast(`console:${data.serverId}`, {
            type: 'console.output',
            payload: data,
            timestamp: Date.now(),
        });
    }

    @OnEvent('player.joined')
    broadcastPlayerJoin(data: { serverId: string }) {
        this.broadcast(`players:${data.serverId}`, {
            type: 'player.update',
            payload: { ...data, action: 'join' },
            timestamp: Date.now(),
        });
    }

    @OnEvent('player.left')
    broadcastPlayerLeave(data: { serverId: string }) {
        this.broadcast(`players:${data.serverId}`, {
            type: 'player.update',
            payload: { ...data, action: 'leave' },
            timestamp: Date.now(),
        });
    }

    @OnEvent('alert.created')
    broadcastAlert(alert: { serverId: string }) {
        this.broadcast(`alerts:${alert.serverId}`, {
            type: 'alert',
            payload: alert,
            timestamp: Date.now(),
        });
        // Also broadcast to global alerts channel
        this.broadcast('alerts:global', {
            type: 'alert',
            payload: alert,
            timestamp: Date.now(),
        });
    }

    @OnEvent('server.started')
    @OnEvent('server.stopped')
    @OnEvent('server.crashed')
    broadcastServerStatus(data: { serverId: string }) {
        this.broadcast(`status:${data.serverId}`, {
            type: 'server.status',
            payload: data,
            timestamp: Date.now(),
        });
        this.broadcast('servers:global', {
            type: 'server.status',
            payload: data,
            timestamp: Date.now(),
        });
    }

    @OnEvent('resource.updated')
    broadcastResourceUpdate(data: { serverId: string }) {
        this.broadcast(`resources:${data.serverId}`, {
            type: 'resource.update',
            payload: data,
            timestamp: Date.now(),
        });
    }

    private broadcast(channel: string, message: object) {
        const data = JSON.stringify(message);
        for (const [client, sub] of this.clients) {
            if (sub.channels.has(channel) && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        }
    }
}
