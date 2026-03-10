import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class PlayerService {
    private readonly logger = new Logger(PlayerService.name);

    constructor(
        private prisma: PrismaService,
        private redis: RedisService,
        private events: EventEmitter2,
    ) { }

    async getPlayers(serverId: string) {
        return this.prisma.player.findMany({
            where: { serverId },
            orderBy: { lastSeen: 'desc' },
        });
    }

    async getPlayer(id: string) {
        const player = await this.prisma.player.findUnique({
            where: { id },
            include: { actions: { orderBy: { createdAt: 'desc' }, take: 50 } },
        });
        if (!player) throw new NotFoundException('Player not found');
        return player;
    }

    async getOnlinePlayers(serverId: string) {
        const cached = await this.redis.get(`server:${serverId}:players`);
        if (cached) return JSON.parse(cached);
        return [];
    }

    async trackPlayerJoin(serverId: string, fivemId: number, name: string, identifiers: Record<string, string>) {
        const player = await this.prisma.player.upsert({
            where: { serverId_fivemId: { serverId, fivemId } },
            update: {
                name,
                lastSeen: new Date(),
                joinCount: { increment: 1 },
                steam: identifiers.steam,
                license: identifiers.license,
                discord: identifiers.discord,
            },
            create: {
                serverId,
                fivemId,
                name,
                steam: identifiers.steam,
                license: identifiers.license,
                license2: identifiers.license2,
                discord: identifiers.discord,
                fivem: identifiers.fivem,
                xbl: identifiers.xbl,
                live: identifiers.live,
            },
        });

        this.events.emit('player.joined', { serverId, player });
        return player;
    }

    async trackPlayerLeave(serverId: string, fivemId: number) {
        const player = await this.prisma.player.findUnique({
            where: { serverId_fivemId: { serverId, fivemId } },
        });
        if (player) {
            this.events.emit('player.left', { serverId, player });
        }
    }

    async kickPlayer(playerId: string, adminId: string, reason: string) {
        const action = await this.prisma.playerAction.create({
            data: { playerId, adminId, type: 'KICK', reason },
        });
        this.events.emit('player.kicked', { playerId, adminId, reason });
        return action;
    }

    async banPlayer(playerId: string, adminId: string, reason: string, duration?: number) {
        const banExpiry = duration ? new Date(Date.now() + duration * 1000) : undefined;

        await this.prisma.player.update({
            where: { id: playerId },
            data: { isBanned: true, banReason: reason, banExpiry },
        });

        const action = await this.prisma.playerAction.create({
            data: { playerId, adminId, type: 'BAN', reason, duration },
        });
        this.events.emit('player.banned', { playerId, adminId, reason, duration });
        return action;
    }

    async unbanPlayer(playerId: string, adminId: string) {
        await this.prisma.player.update({
            where: { id: playerId },
            data: { isBanned: false, banReason: null, banExpiry: null },
        });

        const action = await this.prisma.playerAction.create({
            data: { playerId, adminId, type: 'UNBAN', reason: 'Unbanned' },
        });
        this.events.emit('player.unbanned', { playerId, adminId });
        return action;
    }

    async warnPlayer(playerId: string, adminId: string, reason: string) {
        return this.prisma.playerAction.create({
            data: { playerId, adminId, type: 'WARN', reason },
        });
    }

    async searchPlayers(query: string) {
        return this.prisma.player.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { steam: { contains: query, mode: 'insensitive' } },
                    { discord: { contains: query, mode: 'insensitive' } },
                    { license: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: 50,
        });
    }
}
