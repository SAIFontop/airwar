import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(username: string, email: string, password: string) {
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await this.prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });
        return this.generateTokens(user.id, user.role);
    }

    async login(username: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { username } });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        return {
            ...this.generateTokens(user.id, user.role),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
        };
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException();
        return user;
    }

    private generateTokens(userId: string, role: string) {
        const payload = { sub: userId, role };
        return {
            accessToken: this.jwtService.sign(payload),
            refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
        };
    }

    async getProfile(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                avatar: true,
                mfaEnabled: true,
                permissions: true,
                lastLogin: true,
                createdAt: true,
            },
        });
    }
}
